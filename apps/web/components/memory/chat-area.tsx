"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BotIcon, CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  useConversationStickToBottom,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  type MemoryChatMessage,
  type MemorySource,
  memoryChatRuntime,
  type PendingExchange,
  useMemoryChatExchange,
} from "@/components/memory/chat-runtime";
import { getMemoryHref } from "@/components/memory/paths";
import {
  getArchivedMemoryThreadListInfiniteOptions,
  getMemoryThreadListInfiniteOptions,
  insertThreadIntoMemoryThreadPages,
  type MemoryThreadListItem,
} from "@/components/memory/thread-list-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";

// ── Source type config ──

const SOURCE_TYPE_BADGE_VARIANT: Record<
  string,
  | "transcript"
  | "summary"
  | "decisions"
  | "blockers"
  | "followups"
  | "action_item"
  | "secondary"
> = {
  transcript: "transcript",
  summary: "summary",
  decisions: "decisions",
  blockers: "blockers",
  followups: "followups",
  action_item: "action_item",
};

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

// ── Subcomponents ──

function SourceCards({
  sources,
  threadId,
}: {
  sources: MemorySource[];
  threadId?: string;
}) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <motion.p
        animate={{ opacity: 1 }}
        className="font-medium text-muted-foreground text-xs uppercase tracking-wide"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        Sources
      </motion.p>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {sources.slice(0, 6).map((s, i) => (
            <motion.a
              animate={{ opacity: 1, y: 0 }}
              className="group/card flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              href={`/meetings/${s.meetingId}${threadId ? `?sourceLink=memory/${threadId}` : ""}`}
              initial={{ opacity: 0, y: 6 }}
              key={s.chunkId ?? `${s.meetingId}-${s.sourceType}-${i}`}
              transition={{ delay: i * 0.06, duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className="text-xs"
                  variant={
                    SOURCE_TYPE_BADGE_VARIANT[s.sourceType] ?? "secondary"
                  }
                >
                  {SOURCE_TYPE_LABELS[s.sourceType] ?? s.sourceType}
                </Badge>
                <span className="font-medium group-hover/card:underline">
                  {s.meetingTitle}
                </span>
                {s.meetingDate && (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <CalendarIcon className="size-3" />
                    {formatDate(s.meetingDate)}
                  </span>
                )}
                <ExternalLinkIcon className="ml-auto size-3 text-muted-foreground opacity-0 group-hover/card:opacity-100" />
              </div>
              <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                {s.snippet}
              </p>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const EXAMPLE_PROMPTS = [
  "What decisions came out of my meetings?",
  "Show me my open action items",
  "What blockers were mentioned recently?",
  "Summarize my latest processed meeting",
];

function EmptyState({
  isFree,
  hasNoMeetings,
  onPromptClick,
}: {
  isFree: boolean;
  hasNoMeetings: boolean;
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
            variant="secondary"
          />
        ))}
      </Suggestions>
      {hasNoMeetings && (
        <p className="text-muted-foreground text-xs">
          Process a meeting first, then Meetly can answer questions like these.
        </p>
      )}
    </div>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <span className="inline-flex gap-1">
        <span className="animate-bounce [animation-delay:-0.3s]">·</span>
        <span className="animate-bounce [animation-delay:-0.15s]">·</span>
        <span className="animate-bounce">·</span>
      </span>
      Searching your meetings…
    </div>
  );
}

function NoContextCTA({ reason }: { reason: string }) {
  if (reason === "no_meetings") {
    return (
      <div className="mt-3">
        <a
          className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
          href="/meetings"
        >
          Process your first meeting →
        </a>
      </div>
    );
  }
  if (reason === "no_relevant_context") {
    return (
      <p className="mt-3 text-muted-foreground text-xs">
        Try a more specific question — for example, mention a person, project,
        or date.
      </p>
    );
  }
  return null;
}

function CreatingThreadDots() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <span className="inline-flex gap-1">
        <span className="animate-bounce [animation-delay:-0.3s]">·</span>
        <span className="animate-bounce [animation-delay:-0.15s]">·</span>
        <span className="animate-bounce">·</span>
      </span>
      Setting up conversation…
    </div>
  );
}

// Scroll to bottom when threadId or historyOpen changes
function ScrollSync({ threadId }: { threadId?: string }) {
  const { scrollToBottom } = useConversationStickToBottom();
  useEffect(() => {
    if (!threadId) return;
    void scrollToBottom();
  }, [scrollToBottom, threadId]);
  return null;
}

// ── Visible messages builder ──

function buildVisibleMessages(
  persisted: MemoryChatMessage[],
  exchange: PendingExchange | null,
): MemoryChatMessage[] {
  if (!exchange) return persisted;

  const messages: MemoryChatMessage[] = [...persisted, exchange.user];

  if (exchange.assistant.content) {
    messages.push(exchange.assistant);
  }

  return messages;
}

// ── Main component ──

interface Props {
  threadId?: string;
}

export function ChatArea({ threadId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const promptInputRef = useRef<HTMLDivElement | null>(null);

  // Feature 2: runtime singleton preserves state across navigation
  const exchange = useMemoryChatExchange(threadId ?? null);

  const { data: usageData } = useQuery(
    client.memory.getMemoryUsage.queryOptions(),
  );

  // Persisted messages from DB — only on thread pages
  const { data: threadData, isLoading: isThreadLoading } = useQuery({
    ...client.memory.getThread.queryOptions({
      input: { threadId: threadId ?? "" },
    }),
    enabled: !!threadId,
  });

  const persistedMessages: MemoryChatMessage[] = (
    threadData?.messages ?? []
  ).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: (m.sources ?? []) as MemorySource[],
    metadata: (m.metadata ?? {}) as Record<string, unknown>,
  }));

  const visibleMessages = buildVisibleMessages(persistedMessages, exchange);

  const isFree = usageData?.answerMode === "snippets_only";
  const hasNoMeetings =
    !usageData?.memoryState.hasProcessedMeetings &&
    !usageData?.memoryState.hasMemoryChunks;
  const isSubmitting =
    exchange?.status === "creating-thread" || exchange?.status === "streaming";

  // Completion: refetch DB → clear exchange from runtime
  const completionHandledRef = useRef(new Set<string>());

  useEffect(() => {
    if (exchange?.status !== "complete" || !threadId) return;
    if (completionHandledRef.current.has(exchange.requestId)) return;
    completionHandledRef.current.add(exchange.requestId);

    async function handleComplete() {
      if (!threadId) return;
      // Await DB refetch before clearing so messages don't flash out
      await queryClient.invalidateQueries({
        queryKey: client.memory.getThread.queryOptions({ input: { threadId } })
          .queryKey,
      });
      memoryChatRuntime.clearThreadExchange(threadId);
      // Also clear rootExchange if it was started from /memory for this thread
      memoryChatRuntime.clearRootExchange(threadId);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getMemoryThreadListInfiniteOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getArchivedMemoryThreadListInfiniteOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: client.memory.getMemoryUsage.queryOptions().queryKey,
        }),
      ]);
    }

    void handleComplete();
  }, [exchange?.status, exchange?.requestId, threadId, queryClient]);

  const focusTextarea = () => {
    const textarea = promptInputRef.current?.querySelector("textarea");
    if (textarea instanceof HTMLTextAreaElement) textarea.focus();
  };

  useEffect(() => {
    if (isSubmitting) return;
    requestAnimationFrame(focusTextarea);
  }, [isSubmitting]);

  async function handleSubmit(message: PromptInputMessage) {
    const question = message.text.trim();
    if (!question || isSubmitting) return;

    const result = await memoryChatRuntime.submit({
      question,
      threadId: threadId ?? null,
    });

    // Feature 1: navigate to thread page after creation, streaming continues in background
    if (result.startedFromRoot && result.thread) {
      // Optimistically insert thread into sidebar cache
      queryClient.setQueryData(
        getMemoryThreadListInfiniteOptions().queryKey,
        (old: Parameters<typeof insertThreadIntoMemoryThreadPages>[0]) =>
          insertThreadIntoMemoryThreadPages(
            old,
            result.thread as MemoryThreadListItem,
          ),
      );
      router.push(getMemoryHref(result.threadId));
    }
  }

  const isLoadingThread =
    isThreadLoading && persistedMessages.length === 0 && !exchange;
  const isEmpty =
    visibleMessages.length === 0 && !isSubmitting && !isLoadingThread;

  // Fade in on mount, but skip entirely when exchange is already streaming
  // (navigating from /memory to /memory/[threadId] while stream is active).
  const skipFade = !!exchange;
  const showDelay = threadId && !exchange ? 0.12 : 0;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: skipFade ? 1 : 0 }}
      transition={
        skipFade ? { duration: 0 } : { duration: 0.18, delay: showDelay }
      }
    >
      <div className="relative flex flex-1 overflow-hidden">
        <Conversation className="size-full" key={threadId ?? "memory-new"}>
          <ScrollSync threadId={threadId} />
          <ConversationContent className="mx-auto min-h-full w-full max-w-3xl">
            {/* Skeleton while loading thread */}
            {isLoadingThread && (
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
                hasNoMeetings={!!hasNoMeetings}
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
                      <SourceCards
                        sources={message.sources}
                        threadId={threadId}
                      />
                    )}
                  {message.role === "assistant" &&
                    message.metadata?.responseType === "no_context" &&
                    typeof message.metadata.noContextReason === "string" && (
                      <NoContextCTA reason={message.metadata.noContextReason} />
                    )}
                </MessageContent>
              </Message>
            ))}

            {/* Creating thread indicator */}
            {exchange?.status === "creating-thread" && (
              <Message from="assistant">
                <MessageContent>
                  <CreatingThreadDots />
                </MessageContent>
              </Message>
            )}

            {/* Streaming loading indicator (before first text) */}
            {exchange?.status === "streaming" &&
              !exchange.assistant.content && (
                <Message from="assistant">
                  <MessageContent>
                    <StreamingDots />
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
            placeholder="Ask Meetly anything about your meetings…"
          />
          <PromptInputSubmit
            className="absolute right-1.5 bottom-1.5"
            disabled={isSubmitting}
            status={isSubmitting ? "streaming" : "ready"}
          />
        </PromptInput>
        <p className="mt-2 text-center text-muted-foreground text-xs">
          Meetly searches your processed meeting history · Results may vary
        </p>
      </div>
    </motion.div>
  );
}
