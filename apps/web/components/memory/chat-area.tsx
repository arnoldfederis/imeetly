"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BotIcon, CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  useConversationStickToBottom,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse, } from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";

interface Source {
  chunkId?: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string | null;
  sourceType: string;
  snippet: string;
  score: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface PendingExchange {
  assistant: ChatMessage | null;
  requestId: string;
  threadId: string | null;
  user: ChatMessage;
}

const EXAMPLE_PROMPTS = [
  "What decisions did we make about the product roadmap?",
  "Show me action items from this week",
  "What did we discuss about hiring?",
  "Summarize blockers from the last sprint",
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  transcript: "Transcript",
  summary: "Summary",
  decisions: "Decision",
  blockers: "Blocker",
  followups: "Follow-up",
  action_item: "Action Item",
};

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SourceCards({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Sources
      </p>
      <div className="flex flex-col gap-2">
        {sources.slice(0, 6).map((s) => (
          <a
            className="group flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            href={`/meetings/${s.meetingId}`}
            key={s.chunkId ?? `${s.meetingId}-${s.sourceType}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-xs" variant="secondary">
                {SOURCE_TYPE_LABELS[s.sourceType] ?? s.sourceType}
              </Badge>
              <span className="font-medium group-hover:underline">
                {s.meetingTitle}
              </span>
              {s.meetingDate && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <CalendarIcon className="size-3" />
                  {formatDate(s.meetingDate)}
                </span>
              )}
              <ExternalLinkIcon className="ml-auto size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </div>
            <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
              {s.snippet}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  isFree,
  onPromptClick,
}: {
  isFree: boolean;
  onPromptClick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border bg-primary/5">
        <BotIcon className="size-7 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-semibold text-lg">Ask Meetly anything</h2>
        <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
          Search across your meeting history with natural language and keep the
          thread going without losing context.
          {isFree && " Upgrade to Pro for full AI-generated answers."}
        </p>
      </div>

      <Suggestions className="w-full flex-col items-center">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <Suggestion
            key={prompt}
            onClick={(suggestion) => onPromptClick(suggestion)}
            suggestion={prompt}
          />
        ))}
      </Suggestions>
    </div>
  );
}

function ConversationStateSync({
  historyOpen,
  scrollRequest,
  threadId,
}: {
  historyOpen: boolean;
  scrollRequest: number;
  threadId: string | null;
}) {
  const { scrollToBottom } = useConversationStickToBottom();

  useEffect(() => {
    if (!threadId && !historyOpen) {
      return;
    }

    void scrollToBottom();
  }, [historyOpen, scrollToBottom, threadId]);

  useEffect(() => {
    if (scrollRequest === 0) {
      return;
    }

    void scrollToBottom();
  }, [scrollRequest, scrollToBottom]);

  return null;
}

export function ChatArea({
  historyOpen = false,
  threadId,
}: {
  historyOpen?: boolean;
  threadId: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [pendingExchange, setPendingExchange] =
    useState<PendingExchange | null>(null);
  const promptInputRef = useRef<HTMLDivElement | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);

  const { data: usageData } = useQuery(
    client.memory.getMemoryUsage.queryOptions(),
  );

  const { data: threadData, isLoading: isThreadLoading } = useQuery({
    ...client.memory.getThread.queryOptions({
      input: { threadId: threadId ?? "" },
    }),
    enabled: !!threadId,
  });

  const persistedMessages: ChatMessage[] = (threadData?.messages ?? []).map(
    (message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      sources: (message.sources ?? []) as Source[],
    }),
  );

  const visibleMessages = useMemo(() => {
    if (!pendingExchange) {
      return persistedMessages;
    }

    if (threadId && threadId !== pendingExchange.threadId) {
      return persistedMessages;
    }

    return [
      ...persistedMessages,
      pendingExchange.user,
      ...(pendingExchange.assistant ? [pendingExchange.assistant] : []),
    ];
  }, [pendingExchange, persistedMessages, threadId]);

  const focusTextarea = () => {
    const textarea = promptInputRef.current?.querySelector("textarea");

    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    textarea.focus();
  };

  const createThread = useMutation({
    mutationFn: () => client.memory.createThread.call({}),
  });

  const askMutation = useMutation({
    mutationFn: ({ question, tid }: { question: string; tid: string | null }) =>
      client.memory.askMeetingMemory.call({
        question,
        threadId: tid ?? undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: client.memory.getMemoryUsage.queryOptions().queryKey,
      });

      if (data.threadId) {
        queryClient.invalidateQueries({
          queryKey: client.memory.getThread.queryOptions({
            input: { threadId: data.threadId },
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: client.memory.listThreads.queryOptions().queryKey,
        });
      }
    },
  });

  const isSubmitting = askMutation.isPending || createThread.isPending;
  const isFree = usageData?.answerMode === "snippets_only";

  useEffect(() => {
    if (!pendingExchange?.assistant || !pendingExchange.threadId) {
      return;
    }

    if (threadId !== pendingExchange.threadId) {
      return;
    }

    const hasUserMessage = persistedMessages.some(
      (message) =>
        message.role === "user" &&
        message.content === pendingExchange.user.content,
    );
    const hasAssistantMessage = persistedMessages.some(
      (message) =>
        message.role === "assistant" &&
        message.content === pendingExchange.assistant?.content,
    );

    if (hasUserMessage && hasAssistantMessage) {
      setPendingExchange(null);
    }
  }, [pendingExchange, persistedMessages, threadId]);

  useEffect(() => {
    if (isSubmitting) {
      return;
    }

    requestAnimationFrame(focusTextarea);
  }, [isSubmitting]);

  async function handleSubmit(message: PromptInputMessage) {
    const question = message.text.trim();

    if (!question) {
      return;
    }

    const requestId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: `${requestId}-user`,
      role: "user",
      content: question,
    };

    setInput("");
    setPendingExchange({
      assistant: null,
      requestId,
      threadId,
      user: userMessage,
    });
    requestAnimationFrame(() => {
      focusTextarea();
    });
    setScrollRequest((current) => current + 1);

    let targetThreadId = threadId;

    if (!targetThreadId) {
      const thread = await createThread.mutateAsync();
      targetThreadId = thread.id;
      setPendingExchange((current) =>
        current?.requestId === requestId
          ? {
              ...current,
              threadId: thread.id,
            }
          : current,
      );
      router.push(`/memory?thread=${thread.id}`);
    }

    const result = await askMutation.mutateAsync({
      question,
      tid: targetThreadId,
    });

    const assistantMessage: ChatMessage = {
      id: `${requestId}-assistant`,
      role: "assistant",
      content:
        result.answer ??
        result.sources
          .map((source) => `${source.meetingTitle}: ${source.snippet}`)
          .join("\n"),
      sources: result.sources as Source[],
    };

    setPendingExchange((current) =>
      current?.requestId === requestId
        ? {
            ...current,
            assistant: assistantMessage,
            threadId: result.threadId ?? targetThreadId,
          }
        : current,
    );
    requestAnimationFrame(() => {
      focusTextarea();
    });
    setScrollRequest((current) => current + 1);
  }

  const isEmpty =
    visibleMessages.length === 0 && !isSubmitting && !isThreadLoading;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="relative flex flex-1 overflow-hidden">
        <Conversation className="size-full" key={threadId ?? "memory-new"}>
          <ConversationStateSync
            historyOpen={historyOpen}
            scrollRequest={scrollRequest}
            threadId={threadId}
          />
          <ConversationContent className="mx-auto h-25 min-h-full w-full max-w-3xl">
            {isThreadLoading &&
              persistedMessages.length === 0 &&
              !pendingExchange && (
                <div className="flex flex-col gap-8 py-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div className="flex flex-col gap-4" key={index}>
                      <div className="flex justify-end">
                        <Skeleton className="h-10 w-48 rounded-lg" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {isEmpty && (
              <EmptyState
                isFree={!!isFree}
                onPromptClick={(prompt) =>
                  handleSubmit({ files: [], text: prompt })
                }
              />
            )}

            {visibleMessages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  <MessageResponse>{message.content}</MessageResponse>
                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <SourceCards sources={message.sources} />
                    )}
                </MessageContent>
              </Message>
            ))}

            {pendingExchange && !pendingExchange.assistant && (
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce [animation-delay:-0.3s]">
                        ·
                      </span>
                      <span className="animate-bounce [animation-delay:-0.15s]">
                        ·
                      </span>
                      <span className="animate-bounce">·</span>
                    </span>
                    Searching your meetings…
                  </div>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {isFree && visibleMessages.length > 0 && (
        <div className="border-t px-4 py-2 pt-6 text-center text-xs">
          <span className="text-muted-foreground">Showing snippets only. </span>
          <a className="text-primary hover:underline" href="/settings/billing">
            Upgrade to Pro
          </a>{" "}
          <span className="text-muted-foreground">for full AI answers.</span>
        </div>
      )}

      <div className="p-4" ref={promptInputRef}>
        <PromptInput
          autoFocus
          className="mx-auto w-full max-w-3xl"
          onSubmit={handleSubmit}
        >
          <PromptInputTextarea
            className="pr-12"
            disabled={isSubmitting}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Ask Meetly anything about your meetings…"
            value={input}
          />
          <PromptInputSubmit
            className="absolute right-1.5 bottom-1.5"
            disabled={!input.trim() || isSubmitting}
            status={isSubmitting ? "streaming" : "ready"}
          />
        </PromptInput>
        <p className="mt-2 text-center text-muted-foreground text-xs">
          Meetly searches your processed meeting history · Results may vary
        </p>
      </div>
    </div>
  );
}
