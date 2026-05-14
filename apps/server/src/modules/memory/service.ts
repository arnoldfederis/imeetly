import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import { aiMemoryMessages, aiMemoryThreads } from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { MemoryAnswerMode } from "../billing/plans";
import { getPlanLimits } from "../billing/plans";
import { BillingService } from "../billing/service";

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
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[memory] OPENAI_API_KEY not set — embedding unavailable.");
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: question,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: string };
    };
    const code = body?.error?.code;
    if (
      response.status === 429 ||
      code === "insufficient_quota" ||
      code === "rate_limit_exceeded"
    ) {
      console.warn(
        "[memory] OpenAI quota/rate limit hit — returning no results.",
      );
      return null;
    }
    const text = JSON.stringify(body);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Embedding failed: ${text}`,
    });
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  const embedding = data.data[0]?.embedding;
  if (!embedding) {
    console.warn("[memory] Empty embedding response.");
    return null;
  }
  return embedding;
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

  const rows = await db.execute(sql`
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

  return (
    rows.rows as Array<{
      id: string;
      meetingId: string;
      sourceType: string;
      content: string;
      metadata: Record<string, unknown>;
      score: number;
    }>
  ).map((row) => ({
    id: row.id,
    meetingId: row.meetingId,
    sourceType: row.sourceType,
    content: row.content,
    metadata: row.metadata ?? {},
    score: Number(row.score),
  }));
}

// ── Answer generation (Pro/Team only) ──

export async function generateAnswer(
  question: string,
  chunks: MemoryChunkResult[],
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey || chunks.length === 0) {
    return "I couldn't find enough meeting context to answer that.";
  }

  const contextBlocks = chunks
    .slice(0, 12)
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.metadata.meetingTitle ?? "Meeting"} (${c.metadata.meetingDate ?? "unknown date"}) — ${c.sourceType}]\n${c.content}`,
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are an assistant that answers questions strictly based on meeting notes provided as context.
Do not invent decisions, quotes, owners, or due dates that are not in the context.
If the context does not contain enough information to answer, say exactly: "I couldn't find enough meeting context to answer that."
Always cite the source meeting title and date when referencing specific information.`;

  const userPrompt = `Context from meeting history:\n\n${contextBlocks}\n\n---\n\nQuestion: ${question}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    console.error(`[memory] Answer generation failed: ${response.status}`);
    return "I couldn't find enough meeting context to answer that.";
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return (
    data.choices[0]?.message.content ??
    "I couldn't find enough meeting context to answer that."
  );
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
}> {
  const { plan } = await BillingService.resolveUserPlan(userId);
  const limits = getPlanLimits(plan);
  const daily = getDailyPeriod();
  const current = await BillingService.getUserUsage(
    userId,
    "ai_memory_searches",
    daily,
  );

  return {
    plan,
    answerMode: limits.aiMemoryAnswerMode,
    usage: {
      searchesToday: current.count,
      dailyLimit: limits.aiMemorySearchesPerDay,
      resetsAt: new Date(daily.end).toISOString(),
    },
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

export async function listThreads(userId: string) {
  return db
    .select()
    .from(aiMemoryThreads)
    .where(
      and(
        eq(aiMemoryThreads.userId, userId),
        isNull(aiMemoryThreads.archivedAt),
      ),
    )
    .orderBy(desc(aiMemoryThreads.updatedAt))
    .limit(100);
}

export async function listArchivedThreads(userId: string) {
  return db
    .select()
    .from(aiMemoryThreads)
    .where(
      and(
        eq(aiMemoryThreads.userId, userId),
        sql`${aiMemoryThreads.archivedAt} IS NOT NULL`,
      ),
    )
    .orderBy(desc(aiMemoryThreads.updatedAt))
    .limit(100);
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

export async function deleteThread(userId: string, threadId: string) {
  await db
    .delete(aiMemoryThreads)
    .where(
      and(eq(aiMemoryThreads.id, threadId), eq(aiMemoryThreads.userId, userId)),
    );
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
