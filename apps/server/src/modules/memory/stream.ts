import { auth } from "@repo/server/lib/auth";
import Elysia from "elysia";
import { z } from "zod";
import {
  autoTitleThread,
  checkAndIncrementMemoryUsage,
  getMeetingMemoryState,
  getMeetlyNoContextResponse,
  getThread,
  getThreadMessages,
  groupRelatedMeetings,
  retrieveChunks,
  saveMessages,
  streamAnswer,
} from "./service";

const streamBodySchema = z.object({
  question: z.string().min(1).max(2000),
  threadId: z.string().optional(),
  filters: z
    .object({
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      sourceTypes: z.array(z.string()).optional(),
      meetingId: z.string().optional(),
    })
    .optional(),
});

export const memoryStreamRouter = new Elysia().post(
  "/api/memory/stream",
  async ({ request, body: rawBody }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = streamBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { question, threadId, filters } = parsed.data;
    const userId = session.user.id;
    const encoder = new TextEncoder();

    const body = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        }

        try {
          const usageCheck = await checkAndIncrementMemoryUsage(userId);

          if (!usageCheck.allowed) {
            send({
              type: "error",
              code: "usage_limit",
              usage: usageCheck.usage,
              upgradeRequired: usageCheck.upgradeRequired,
            });
            controller.close();
            return;
          }

          // Get memory state to determine appropriate no-context response
          const memoryState = await getMeetingMemoryState(userId);

          // If no memory chunks at all, short-circuit before retrieval
          if (!memoryState.hasMemoryChunks) {
            const noCtx = getMeetlyNoContextResponse({
              memoryState,
              retrievedChunkCount: 0,
            });

            send({ type: "text", text: noCtx.text });
            send({ type: "sources", sources: [], relatedMeetings: [] });
            send({ type: "usage", usage: usageCheck.usage });

            if (threadId) {
              const thread = await getThread(userId, threadId);
              if (thread) {
                const existingMessages = await getThreadMessages(
                  userId,
                  threadId,
                );
                const isFirstMessage = existingMessages.length === 0;

                await saveMessages(userId, threadId, [
                  { role: "user", content: question },
                ]);
                await saveMessages(userId, threadId, [
                  {
                    role: "assistant",
                    content: noCtx.text,
                    sources: [],
                    metadata: {
                      responseType: "no_context",
                      noContextReason: noCtx.reason,
                    },
                  },
                ]);

                if (isFirstMessage) {
                  await autoTitleThread(userId, threadId, question);
                }
              }
            }

            send({
              type: "done",
              threadId: threadId ?? null,
              noContextReason: noCtx.reason,
            });
            controller.close();
            return;
          }

          // Memory chunks exist — retrieve relevant ones
          const chunks = await retrieveChunks(userId, question, filters ?? {});
          const relatedMeetings = groupRelatedMeetings(chunks);

          const sources = chunks.slice(0, 12).map((c) => ({
            chunkId: c.id,
            meetingId: c.meetingId,
            meetingTitle: String(c.metadata.meetingTitle ?? c.meetingId),
            meetingDate: c.metadata.meetingDate
              ? String(c.metadata.meetingDate)
              : null,
            sourceType: c.sourceType,
            snippet: c.content.slice(0, 300),
            score: c.score,
          }));

          let fullText = "";
          let noContextReason: string | undefined;

          if (usageCheck.answerMode === "snippets_only") {
            if (chunks.length === 0) {
              const noCtx = getMeetlyNoContextResponse({
                memoryState,
                retrievedChunkCount: 0,
              });
              fullText = noCtx.text;
              noContextReason = noCtx.reason;
            } else {
              fullText = chunks
                .slice(0, 6)
                .map(
                  (c) =>
                    `**${String(c.metadata.meetingTitle ?? "Meeting")}**: ${c.content.slice(0, 250)}`,
                )
                .join("\n\n");
            }
            send({ type: "text", text: fullText });
          } else if (chunks.length === 0) {
            const noCtx = getMeetlyNoContextResponse({
              memoryState,
              retrievedChunkCount: 0,
            });
            fullText = noCtx.text;
            noContextReason = noCtx.reason;
            send({ type: "text", text: fullText });
          } else {
            const result = streamAnswer(question, chunks);
            for await (const textPart of result.textStream) {
              fullText += textPart;
              send({ type: "text", text: textPart });
            }
          }

          const isNoContext = !!noContextReason;
          const visibleSources = isNoContext ? [] : sources;
          const visibleRelated = isNoContext ? [] : relatedMeetings;

          send({
            type: "sources",
            sources: visibleSources,
            relatedMeetings: visibleRelated,
          });
          send({ type: "usage", usage: usageCheck.usage });

          if (threadId) {
            const thread = await getThread(userId, threadId);
            if (thread) {
              const existingMessages = await getThreadMessages(
                userId,
                threadId,
              );
              const isFirstMessage = existingMessages.length === 0;

              await saveMessages(userId, threadId, [
                { role: "user", content: question },
              ]);
              await saveMessages(userId, threadId, [
                {
                  role: "assistant",
                  content: fullText,
                  sources: visibleSources.map((s) => ({
                    meetingId: s.meetingId,
                    meetingTitle: s.meetingTitle,
                    meetingDate: s.meetingDate ?? "",
                    snippet: s.snippet,
                    sourceType: s.sourceType,
                    score: s.score,
                  })),
                  metadata: isNoContext
                    ? { responseType: "no_context", noContextReason }
                    : {},
                },
              ]);

              if (isFirstMessage) {
                await autoTitleThread(userId, threadId, question);
              }
            }
          }

          send({
            type: "done",
            threadId: threadId ?? null,
            ...(noContextReason ? { noContextReason } : {}),
          });
        } catch (err) {
          console.error("[memory/stream]", err);
          send({
            type: "error",
            code: "internal",
            message:
              err instanceof Error ? err.message : "Stream error occurred",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
);
