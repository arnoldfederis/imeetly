import { ORPCError } from "@orpc/server";
import { base, privateProcedure } from "@repo/server/procedure";
import { memoryModel } from "./model";
import {
  archiveThread,
  autoTitleThread,
  checkAndIncrementMemoryUsage,
  createThread,
  deleteThread,
  generateAnswer,
  getMemoryUsageInfo,
  getThread,
  getThreadMessages,
  groupRelatedMeetings,
  listArchivedThreads,
  listThreads,
  retrieveChunks,
  saveMessages,
  unarchiveThread,
  updateThreadTitle,
} from "./service";

export const memoryController = base.router({
  // ── Thread management ──

  createThread: privateProcedure
    .input(memoryModel.createThread)
    .handler(async ({ input, context }) => {
      return createThread(context.user.id, input.title);
    }),

  listThreads: privateProcedure
    .input(memoryModel.listThreads)
    .handler(async ({ context, input }) => {
      return listThreads(context.user.id, input);
    }),

  listArchivedThreads: privateProcedure
    .input(memoryModel.listArchivedThreads)
    .handler(async ({ context, input }) => {
      return listArchivedThreads(context.user.id, input);
    }),

  getThread: privateProcedure
    .input(memoryModel.getThread)
    .handler(async ({ input, context }) => {
      const thread = await getThread(context.user.id, input.threadId);
      if (!thread) {
        throw new ORPCError("NOT_FOUND", { message: "Thread not found." });
      }
      const messages = await getThreadMessages(context.user.id, input.threadId);
      return { thread, messages };
    }),

  updateThread: privateProcedure
    .input(memoryModel.updateThread)
    .handler(async ({ input, context }) => {
      const updated = await updateThreadTitle(
        context.user.id,
        input.threadId,
        input.title,
      );
      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Thread not found." });
      }
      return updated;
    }),

  archiveThread: privateProcedure
    .input(memoryModel.archiveThread)
    .handler(async ({ input, context }) => {
      const updated = await archiveThread(context.user.id, input.threadId);
      return { success: true, updated };
    }),

  unArchiveThread: privateProcedure
    .input(memoryModel.unarchiveThread)
    .handler(async ({ input, context }) => {
      const updated = await unarchiveThread(context.user.id, input.threadId);
      return { success: true, updated };
    }),

  deleteThread: privateProcedure
    .input(memoryModel.deleteThread)
    .handler(async ({ input, context }) => {
      await deleteThread(context.user.id, input.threadId);
      return { success: true };
    }),

  // ── Memory ask (with optional thread persistence) ──

  askMeetingMemory: privateProcedure
    .input(memoryModel.askRequest)
    .handler(async ({ input, context }) => {
      const userId = context.user.id;
      const { question, filters, threadId } = input;

      const usageCheck = await checkAndIncrementMemoryUsage(userId);

      if (!usageCheck.allowed) {
        return {
          mode: usageCheck.answerMode,
          answer: undefined,
          snippets: [],
          sources: [],
          relatedMeetings: [],
          usage: usageCheck.usage,
          upgradeRequired: usageCheck.upgradeRequired,
          threadId,
        };
      }

      const chunks = await retrieveChunks(userId, question, filters ?? {});
      const relatedMeetings = groupRelatedMeetings(chunks);

      let answer: string | undefined;
      if (usageCheck.answerMode === "full_answer") {
        answer = await generateAnswer(question, chunks);
      }

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

      // Persist to thread if provided
      if (threadId) {
        const thread = await getThread(userId, threadId);
        if (thread) {
          const isFirstMessage =
            (await getThreadMessages(userId, threadId)).length === 0;

          await saveMessages(userId, threadId, [
            { role: "user", content: question },
            {
              role: "assistant",
              content:
                answer ??
                sources
                  .map((s) => `- ${s.meetingTitle}: ${s.snippet}`)
                  .join("\n"),
              sources: sources.map((s) => ({
                meetingId: s.meetingId,
                meetingTitle: s.meetingTitle,
                meetingDate: s.meetingDate ?? "",
                snippet: s.snippet,
                sourceType: s.sourceType,
                score: s.score,
              })),
            },
          ]);

          if (isFirstMessage) {
            await autoTitleThread(userId, threadId, question);
          }
        }
      }

      return {
        mode: usageCheck.answerMode,
        answer,
        snippets: sources,
        sources,
        relatedMeetings,
        usage: usageCheck.usage,
        upgradeRequired: false,
        threadId,
      };
    }),

  searchMeetingMemory: privateProcedure
    .input(memoryModel.searchRequest)
    .handler(async ({ input, context }) => {
      const userId = context.user.id;
      const chunks = await retrieveChunks(
        userId,
        input.query,
        input.filters ?? {},
      );
      return {
        results: chunks.slice(0, 20).map((c) => ({
          chunkId: c.id,
          meetingId: c.meetingId,
          meetingTitle: String(c.metadata.meetingTitle ?? c.meetingId),
          meetingDate: c.metadata.meetingDate
            ? String(c.metadata.meetingDate)
            : null,
          sourceType: c.sourceType,
          snippet: c.content.slice(0, 400),
          score: c.score,
        })),
      };
    }),

  getMemoryUsage: privateProcedure.handler(async ({ context }) => {
    return getMemoryUsageInfo(context.user.id);
  }),
});
