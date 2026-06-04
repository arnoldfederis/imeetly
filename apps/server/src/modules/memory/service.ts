import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import {
  aiMemoryMessages,
  aiMemoryThreads,
  meetingMemoryChunks,
  meetings,
} from "@repo/db/schemas/app";
import { embed, generateText, streamText } from "ai";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { MemoryAnswerMode } from "../billing/plans";
import { getPlanLimits } from "../billing/plans";
import { BillingService } from "../billing/service";
import {
  getChatModel,
  getEmbeddingDimensions,
  getEmbeddingModel,
} from "./provider";

const ALLOWED_SOURCE_TYPES = new Set([
  "transcript",
  "summary",
  "decisions",
  "blockers",
  "followups",
  "action_item",
]);

export interface MemoryChunkResult {
  id: string;
  meetingId: string;
  sourceType: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface RelatedMeeting {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string | null;
  chunkCount: number;
}

export interface MemoryUsage {
  searchesToday: number;
  dailyLimit: number;
  resetsAt: string;
}

// ── Daily period helpers (UTC) ──

function getDailyPeriod() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

// ── Embedding ──

async function embedQuestion(question: string): Promise<number[] | null> {
  try {
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: question,
      providerOptions: {
        openai: { dimensions: getEmbeddingDimensions() },
      },
    });
    return embedding;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/quota|rate.?limit|insufficient|no api key/i.test(msg)) {
      console.warn(
        "[memory] Embedding unavailable — returning no results.",
        msg,
      );
      return null;
    }
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Embedding failed: ${msg}`,
    });
  }
}

// ── Light query routing ──

function inferSourceTypes(question: string): string[] | null {
  const q = question.toLowerCase();
  if (/\bdecision\b/.test(q)) return ["decisions"];
  if (/\bblocker\b/.test(q)) return ["blockers"];
  if (/\bfollow.?up\b/.test(q)) return ["followups"];
  if (/\b(action item|todo|to-do|task|owner|due date?)\b/.test(q))
    return ["action_item"];
  return null;
}

function inferDateFilters(question: string): {
  fromDate?: string;
  toDate?: string;
} {
  const now = new Date();
  const q = question.toLowerCase();

  if (/this week/.test(q)) {
    const dayOfWeek = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(
      now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1),
    );
    return {
      fromDate: monday.toISOString().slice(0, 10),
      toDate: new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10),
    };
  }

  if (/last week/.test(q)) {
    const dayOfWeek = now.getUTCDay();
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(
      now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1),
    );
    const lastMonday = new Date(thisMonday.getTime() - 7 * 86_400_000);
    const lastSunday = new Date(thisMonday.getTime() - 86_400_000);
    return {
      fromDate: lastMonday.toISOString().slice(0, 10),
      toDate: lastSunday.toISOString().slice(0, 10),
    };
  }

  return {};
}

// ── Retrieval ──

export interface RetrievalFilters {
  fromDate?: string;
  toDate?: string;
  sourceTypes?: string[];
  meetingId?: string;
}

export async function retrieveChunks(
  userId: string,
  question: string,
  filters: RetrievalFilters = {},
  topK = 15,
): Promise<MemoryChunkResult[]> {
  const embedding = await embedQuestion(question);
  if (!embedding) return [];

  const inferred = inferSourceTypes(question);
  const dateInferred = inferDateFilters(question);

  const resolvedSourceTypes =
    filters.sourceTypes?.filter((t) => ALLOWED_SOURCE_TYPES.has(t)) ??
    inferred ??
    null;

  const fromDate = filters.fromDate ?? dateInferred.fromDate;
  const toDate = filters.toDate ?? dateInferred.toDate;
  const meetingId = filters.meetingId;

  // embedding vector must come from trusted source (OpenAI), not user input
  const embeddingLiteral = `[${embedding.map(String).join(",")}]`;

  const sourceFilter = resolvedSourceTypes
    ? sql` AND mc.source_type = ANY(ARRAY[${sql.join(
        resolvedSourceTypes.map((t) => sql`${t}`),
        sql`, `,
      )}])`
    : sql``;

  const meetingFilter = meetingId
    ? sql` AND mc.meeting_id = ${meetingId}`
    : sql``;

  const fromFilter = fromDate
    ? sql` AND m.meeting_date >= ${new Date(fromDate)}`
    : sql``;

  const toFilter = toDate
    ? sql` AND m.meeting_date <= ${new Date(toDate)}`
    : sql``;

  const result = await db.execute(sql`
    SELECT
      mc.id,
      mc.meeting_id AS "meetingId",
      mc.source_type AS "sourceType",
      mc.content,
      mc.metadata,
      (mc.embedding <=> ${sql.raw(`'${embeddingLiteral}'::vector`)}) AS score
    FROM app.meeting_memory_chunks mc
    INNER JOIN app.meetings m ON m.id = mc.meeting_id
    WHERE
      mc.user_id = ${userId}
      AND m.user_id = ${userId}
      ${sourceFilter}
      ${meetingFilter}
      ${fromFilter}
      ${toFilter}
    ORDER BY score ASC
    LIMIT ${topK}
  `);

  const rows = (Array.isArray(result) ? result : result.rows) as Array<{
    id: string;
    meetingId: string;
    sourceType: string;
    content: string;
    metadata: Record<string, unknown>;
    score: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    meetingId: row.meetingId,
    sourceType: row.sourceType,
    content: row.content,
    metadata: row.metadata ?? {},
    score: Number(row.score),
  }));
}

// ── Shared answer generation helpers ──

const MEMORY_SYSTEM_PROMPT = `You are an assistant that answers questions strictly based on meeting notes provided as context.
Do not invent decisions, quotes, owners, or due dates that are not in the context.
If the context does not contain enough information to answer, say exactly: "I couldn't find enough meeting context to answer that."
Always cite the source meeting title and date when referencing specific information.`;

// ── No-context response constants ──

export type NoContextReason =
  | "no_meetings"
  | "processing"
  | "no_relevant_context"
  | "unknown";

export const NO_MEETINGS_RESPONSE = `I don't have any meeting memory yet.

Process your first meeting, and I'll be able to answer questions about decisions, action items, blockers, follow-ups, and what people discussed.`;

export const MEETINGS_PROCESSING_RESPONSE = `Your meeting memory is still being prepared.

Once processing finishes, I'll be able to answer questions from the transcript, summary, decisions, blockers, follow-ups, and action items.`;

export const NO_RELEVANT_CONTEXT_RESPONSE = `I couldn't find anything relevant in your meeting memory for that question.

Try asking about a specific meeting, person, customer, project, or date range.`;

export const GENERIC_NO_CONTEXT_RESPONSE = `I don't have enough meeting memory to answer that yet.

Once your meetings are processed, I can help you find decisions, action items, blockers, follow-ups, and important discussion points across your meeting history.`;

// ── Memory state ──

export interface MeetingMemoryState {
  processedMeetingCount: number;
  processingMeetingCount: number;
  memoryChunkCount: number;
  hasProcessedMeetings: boolean;
  hasProcessingMeetings: boolean;
  hasMemoryChunks: boolean;
}

export async function getMeetingMemoryState(
  userId: string,
): Promise<MeetingMemoryState> {
  const [meetingCounts, [chunkRow]] = await Promise.all([
    db
      .select({
        status: meetings.status,
        cnt: sql<number>`count(*)::int`,
      })
      .from(meetings)
      .where(eq(meetings.userId, userId))
      .groupBy(meetings.status),
    db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(meetingMemoryChunks)
      .where(eq(meetingMemoryChunks.userId, userId)),
  ]);

  const processedMeetingCount = meetingCounts
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.cnt, 0);

  const processingMeetingCount = meetingCounts
    .filter((r) => r.status === "processing" || r.status === "pending")
    .reduce((sum, r) => sum + r.cnt, 0);

  const memoryChunkCount = chunkRow?.cnt ?? 0;

  return {
    processedMeetingCount,
    processingMeetingCount,
    memoryChunkCount,
    hasProcessedMeetings: processedMeetingCount > 0,
    hasProcessingMeetings: processingMeetingCount > 0,
    hasMemoryChunks: memoryChunkCount > 0,
  };
}

export function getMeetlyNoContextResponse(params: {
  memoryState: MeetingMemoryState;
  retrievedChunkCount: number;
}): { text: string; reason: NoContextReason } {
  const { memoryState, retrievedChunkCount } = params;

  if (!memoryState.hasMemoryChunks) {
    if (memoryState.hasProcessingMeetings) {
      return { text: MEETINGS_PROCESSING_RESPONSE, reason: "processing" };
    }
    return { text: NO_MEETINGS_RESPONSE, reason: "no_meetings" };
  }

  if (retrievedChunkCount === 0) {
    return {
      text: NO_RELEVANT_CONTEXT_RESPONSE,
      reason: "no_relevant_context",
    };
  }

  return { text: GENERIC_NO_CONTEXT_RESPONSE, reason: "unknown" };
}

function buildContextBlocks(chunks: MemoryChunkResult[]): string {
  return chunks
    .slice(0, 12)
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.metadata.meetingTitle ?? "Meeting"} (${c.metadata.meetingDate ?? "unknown date"}) — ${c.sourceType}]\n${c.content}`,
    )
    .join("\n\n---\n\n");
}

// ── Answer generation (Pro/Team only) ──

export async function generateAnswer(
  question: string,
  chunks: MemoryChunkResult[],
): Promise<string> {
  if (chunks.length === 0) {
    return "I couldn't find enough meeting context to answer that.";
  }

  try {
    const { text } = await generateText({
      model: getChatModel(),
      system: MEMORY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Context from meeting history:\n\n${buildContextBlocks(chunks)}\n\n---\n\nQuestion: ${question}`,
        },
      ],
      maxOutputTokens: 800,
      temperature: 0.2,
    });
    return text || "I couldn't find enough meeting context to answer that.";
  } catch (err) {
    console.error("[memory] Answer generation failed:", err);
    return "I couldn't find enough meeting context to answer that.";
  }
}

export function streamAnswer(question: string, chunks: MemoryChunkResult[]) {
  return streamText({
    model: getChatModel(),
    system: MEMORY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Context from meeting history:\n\n${buildContextBlocks(chunks)}\n\n---\n\nQuestion: ${question}`,
      },
    ],
    maxOutputTokens: 800,
    temperature: 0.2,
  });
}

// ── Usage tracking ──

export async function checkAndIncrementMemoryUsage(userId: string): Promise<{
  allowed: boolean;
  plan: string;
  answerMode: MemoryAnswerMode;
  usage: MemoryUsage;
  upgradeRequired: boolean;
}> {
  const { plan } = await BillingService.resolveUserPlan(userId);
  const limits = getPlanLimits(plan);
  const daily = getDailyPeriod();

  const current = await BillingService.getUserUsage(
    userId,
    "ai_memory_searches",
    daily,
  );

  const dailyLimit = limits.aiMemorySearchesPerDay;
  const searchesToday = current.count;
  const resetsAt = new Date(daily.end).toISOString();

  if (dailyLimit !== -1 && searchesToday >= dailyLimit) {
    return {
      allowed: false,
      plan,
      answerMode: limits.aiMemoryAnswerMode,
      usage: { searchesToday, dailyLimit, resetsAt },
      upgradeRequired: plan === "free",
    };
  }

  await BillingService.incrementUsage(userId, "ai_memory_searches");

  return {
    allowed: true,
    plan,
    answerMode: limits.aiMemoryAnswerMode,
    usage: { searchesToday: searchesToday + 1, dailyLimit, resetsAt },
    upgradeRequired: false,
  };
}

export async function getMemoryUsageInfo(userId: string): Promise<{
  plan: string;
  answerMode: MemoryAnswerMode;
  usage: MemoryUsage;
  memoryState: MeetingMemoryState;
}> {
  const { plan } = await BillingService.resolveUserPlan(userId);
  const limits = getPlanLimits(plan);
  const daily = getDailyPeriod();

  const [current, memoryState] = await Promise.all([
    BillingService.getUserUsage(userId, "ai_memory_searches", daily),
    getMeetingMemoryState(userId),
  ]);

  return {
    plan,
    answerMode: limits.aiMemoryAnswerMode,
    usage: {
      searchesToday: current.count,
      dailyLimit: limits.aiMemorySearchesPerDay,
      resetsAt: new Date(daily.end).toISOString(),
    },
    memoryState,
  };
}

// ── Group related meetings ──

export function groupRelatedMeetings(
  chunks: MemoryChunkResult[],
): RelatedMeeting[] {
  const map = new Map<string, RelatedMeeting>();
  for (const chunk of chunks) {
    const meetingId = chunk.meetingId;
    const existing = map.get(meetingId);
    if (existing) {
      existing.chunkCount++;
    } else {
      map.set(meetingId, {
        meetingId,
        meetingTitle: String(chunk.metadata.meetingTitle ?? meetingId),
        meetingDate: chunk.metadata.meetingDate
          ? String(chunk.metadata.meetingDate)
          : null,
        chunkCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.chunkCount - a.chunkCount);
}

// ── Thread management ──

export async function createThread(
  userId: string,
  title?: string,
): Promise<typeof aiMemoryThreads.$inferSelect> {
  const [thread] = await db
    .insert(aiMemoryThreads)
    .values({
      userId,
      title: title ?? "New conversation",
    })
    .returning();
  if (!thread) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to create thread.",
    });
  }
  return thread;
}

async function listThreadPage(
  userId: string,
  query: {
    limit: number;
    offset: number;
  },
  archived: boolean,
) {
  const where = and(
    eq(aiMemoryThreads.userId, userId),
    archived
      ? sql`${aiMemoryThreads.archivedAt} IS NOT NULL`
      : isNull(aiMemoryThreads.archivedAt),
  );

  const [items, [{ count }]] = await Promise.all([
    db
      .select()
      .from(aiMemoryThreads)
      .where(where)
      .orderBy(desc(aiMemoryThreads.updatedAt))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiMemoryThreads)
      .where(where),
  ]);

  return { items, total: count };
}

export async function listThreads(
  userId: string,
  query: {
    limit: number;
    offset: number;
  },
) {
  return listThreadPage(userId, query, false);
}

export async function listArchivedThreads(
  userId: string,
  query: {
    limit: number;
    offset: number;
  },
) {
  return listThreadPage(userId, query, true);
}

export async function getThread(userId: string, threadId: string) {
  const [thread] = await db
    .select()
    .from(aiMemoryThreads)
    .where(
      and(eq(aiMemoryThreads.id, threadId), eq(aiMemoryThreads.userId, userId)),
    )
    .limit(1);
  return thread ?? null;
}

export async function getThreadMessages(userId: string, threadId: string) {
  return db
    .select()
    .from(aiMemoryMessages)
    .where(
      and(
        eq(aiMemoryMessages.threadId, threadId),
        eq(aiMemoryMessages.userId, userId),
      ),
    )
    .orderBy(aiMemoryMessages.createdAt);
}

export async function updateThreadTitle(
  userId: string,
  threadId: string,
  title: string,
) {
  const [updated] = await db
    .update(aiMemoryThreads)
    .set({ title })
    .where(
      and(eq(aiMemoryThreads.id, threadId), eq(aiMemoryThreads.userId, userId)),
    )
    .returning();
  return updated ?? null;
}

export async function archiveThread(userId: string, threadId: string) {
  const [updated] = await db
    .update(aiMemoryThreads)
    .set({ archivedAt: new Date() })
    .where(
      and(eq(aiMemoryThreads.id, threadId), eq(aiMemoryThreads.userId, userId)),
    )
    .returning();
  return updated ?? null;
}

export async function unarchiveThread(userId: string, threadId: string) {
  const [updated] = await db
    .update(aiMemoryThreads)
    .set({ archivedAt: null })
    .where(
      and(eq(aiMemoryThreads.id, threadId), eq(aiMemoryThreads.userId, userId)),
    )
    .returning();
  return updated ?? null;
}

export async function deleteThread(userId: string, threadId: string) {
  const [deleted] = await db
    .delete(aiMemoryThreads)
    .where(
      and(eq(aiMemoryThreads.id, threadId), eq(aiMemoryThreads.userId, userId)),
    )
    .returning();

  return deleted ?? null;
}

export async function saveMessages(
  userId: string,
  threadId: string,
  messages: Array<{
    role: string;
    content: string;
    sources?: (typeof aiMemoryMessages.$inferInsert)["sources"];
    metadata?: Record<string, unknown>;
  }>,
) {
  if (messages.length === 0) {
    return;
  }
  await db.insert(aiMemoryMessages).values(
    messages.map((m) => ({
      threadId,
      userId,
      role: m.role,
      content: m.content,
      sources: m.sources ?? [],
      metadata: m.metadata ?? {},
    })),
  );
}

export async function autoTitleThread(
  userId: string,
  threadId: string,
  question: string,
) {
  const trimmed = question.slice(0, 80);
  const title = trimmed.length < question.length ? `${trimmed}…` : trimmed;
  await updateThreadTitle(userId, threadId, title);
}
