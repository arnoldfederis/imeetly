"use client";

import { env } from "@repo/env";
import { useSyncExternalStore } from "react";
import { client } from "@/lib/orpc";

export interface MemorySource {
  chunkId?: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string | null;
  sourceType: string;
  snippet: string;
  score: number;
}

export interface MemoryChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: MemorySource[];
  metadata?: Record<string, unknown>;
}

export interface PendingExchange {
  requestId: string;
  threadId: string | null;
  startedFromRoot: boolean;
  status: "creating-thread" | "streaming" | "complete" | "error";
  errorMessage?: string;
  user: MemoryChatMessage;
  assistant: MemoryChatMessage;
}

interface RuntimeState {
  rootExchange: PendingExchange | null;
  threadExchanges: Record<string, PendingExchange>;
}

function getErrorMessage(code?: string) {
  if (code === "usage_limit") {
    return "You have reached your current memory search limit. Upgrade your plan to keep searching.";
  }

  return "Meetly could not finish this answer. Please try again.";
}

class MemoryChatRuntime {
  private state: RuntimeState = {
    rootExchange: null,
    threadExchanges: {},
  };

  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  getExchangeForView(threadId: string | null) {
    if (threadId) {
      return this.state.threadExchanges[threadId] ?? null;
    }

    return this.state.rootExchange;
  }

  clearRootExchange(threadId?: string) {
    if (
      !this.state.rootExchange ||
      (threadId && this.state.rootExchange.threadId !== threadId)
    ) {
      return;
    }

    this.state = {
      ...this.state,
      rootExchange: null,
    };
    this.emit();
  }

  clearThreadExchange(threadId: string) {
    if (!(threadId in this.state.threadExchanges)) {
      return;
    }

    const nextThreadExchanges = { ...this.state.threadExchanges };
    delete nextThreadExchanges[threadId];

    this.state = {
      rootExchange: this.state.rootExchange,
      threadExchanges: nextThreadExchanges,
    };
    this.emit();
  }

  async submit({
    question,
    threadId,
  }: {
    question: string;
    threadId: string | null;
  }) {
    const activeExchange = threadId
      ? this.state.threadExchanges[threadId]
      : this.state.rootExchange;

    if (
      activeExchange &&
      (activeExchange.status === "creating-thread" ||
        activeExchange.status === "streaming")
    ) {
      throw new Error("Wait for the current answer to finish.");
    }

    const requestId = crypto.randomUUID();
    const startedFromRoot = threadId === null;
    const exchange: PendingExchange = {
      assistant: {
        id: `${requestId}-assistant`,
        role: "assistant",
        content: "",
        sources: [],
      },
      requestId,
      startedFromRoot,
      status: startedFromRoot ? "creating-thread" : "streaming",
      threadId,
      user: {
        id: `${requestId}-user`,
        role: "user",
        content: question,
      },
    };

    let resolvedThreadId = threadId;
    let createdThread:
      | Awaited<ReturnType<typeof client.memory.createThread.call>>
      | undefined;

    this.setExchange(exchange);

    try {
      if (!resolvedThreadId) {
        createdThread = await client.memory.createThread.call({});
        resolvedThreadId = createdThread.id;
        this.setExchange({
          ...exchange,
          status: "streaming",
          threadId: resolvedThreadId,
        });
      }

      void this.streamExchange({
        question,
        requestId,
        threadId: resolvedThreadId,
      });

      return {
        startedFromRoot,
        thread: createdThread,
        threadId: resolvedThreadId,
      };
    } catch (error) {
      this.patchExchange(requestId, (currentExchange) => ({
        ...currentExchange,
        assistant: {
          ...currentExchange.assistant,
          content: getErrorMessage(undefined),
        },
        errorMessage:
          error instanceof Error ? error.message : getErrorMessage(undefined),
        status: "error",
      }));
      throw error;
    }
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setExchange(exchange: PendingExchange) {
    const nextThreadExchanges = { ...this.state.threadExchanges };

    if (exchange.threadId) {
      nextThreadExchanges[exchange.threadId] = exchange;
    }

    this.state = {
      rootExchange: exchange.startedFromRoot
        ? exchange
        : this.state.rootExchange,
      threadExchanges: nextThreadExchanges,
    };

    this.emit();
  }

  private patchExchange(
    requestId: string,
    updater: (exchange: PendingExchange) => PendingExchange,
  ) {
    let changed = false;
    let nextRootExchange = this.state.rootExchange;
    const nextThreadExchanges = { ...this.state.threadExchanges };

    if (this.state.rootExchange?.requestId === requestId) {
      nextRootExchange = updater(this.state.rootExchange);
      changed = true;
    }

    for (const [key, value] of Object.entries(this.state.threadExchanges)) {
      if (value.requestId === requestId) {
        nextThreadExchanges[key] = updater(value);
        changed = true;
      }
    }

    if (!changed) {
      return;
    }

    this.state = {
      rootExchange: nextRootExchange,
      threadExchanges: nextThreadExchanges,
    };
    this.emit();
  }

  private async streamExchange({
    question,
    requestId,
    threadId,
  }: {
    question: string;
    requestId: string;
    threadId: string;
  }) {
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_APP_SERVER_URL}/api/memory/stream`,
        {
          body: JSON.stringify({
            question,
            threadId,
          }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("Memory stream failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const dataLine = eventChunk
            .split("\n")
            .find((line) => line.startsWith("data: "));

          if (!dataLine) {
            continue;
          }

          const payload = JSON.parse(dataLine.slice(6)) as
            | {
                type: "text";
                text: string;
              }
            | {
                type: "sources";
                sources: MemorySource[];
              }
            | {
                type: "done";
                threadId: string | null;
                noContextReason?: string;
              }
            | {
                type: "error";
                code?: string;
                message?: string;
              };

          if (payload.type === "text") {
            this.patchExchange(requestId, (exchange) => ({
              ...exchange,
              assistant: {
                ...exchange.assistant,
                content: exchange.assistant.content + payload.text,
              },
              status: "streaming",
            }));
            continue;
          }

          if (payload.type === "sources") {
            this.patchExchange(requestId, (exchange) => ({
              ...exchange,
              assistant: {
                ...exchange.assistant,
                sources: payload.sources,
              },
            }));
            continue;
          }

          if (payload.type === "done") {
            this.patchExchange(requestId, (exchange) => ({
              ...exchange,
              status: "complete",
              threadId: payload.threadId ?? exchange.threadId,
              ...(payload.noContextReason
                ? {
                    assistant: {
                      ...exchange.assistant,
                      metadata: {
                        responseType: "no_context",
                        noContextReason: payload.noContextReason,
                      },
                    },
                  }
                : {}),
            }));
            continue;
          }

          if (payload.type === "error") {
            throw new Error(payload.message ?? getErrorMessage(payload.code));
          }
        }
      }
    } catch (error) {
      this.patchExchange(requestId, (exchange) => ({
        ...exchange,
        assistant: {
          ...exchange.assistant,
          content: exchange.assistant.content || getErrorMessage(undefined),
        },
        errorMessage:
          error instanceof Error ? error.message : getErrorMessage(undefined),
        status: "error",
      }));
    }
  }
}

export const memoryChatRuntime = new MemoryChatRuntime();

export function useMemoryChatExchange(threadId: string | null) {
  const state = useSyncExternalStore(
    memoryChatRuntime.subscribe,
    memoryChatRuntime.getSnapshot,
    memoryChatRuntime.getSnapshot,
  );

  if (threadId) {
    return state.threadExchanges[threadId] ?? null;
  }

  return state.rootExchange;
}
