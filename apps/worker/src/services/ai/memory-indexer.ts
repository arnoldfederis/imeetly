import { createHash } from "node:crypto";
import {
  actionItems,
  meetingMemoryChunks,
  meetingSummaries,
  meetings,
} from "@repo/db/schemas/app";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { getEmbeddingProvider } from "./embedding";

type SourceType =
  | "transcript"
  | "summary"
  | "decisions"
  | "blockers"
  | "followups"
  | "action_item";

interface RawChunk {
  sourceType: SourceType;
  content: string;
  metadata: Record<string, unknown>;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

function chunkText(
  text: string,
  minChars = 1200,
  maxChars = 1800,
  overlap = 200,
): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (
      current.length + para.length + 2 > maxChars &&
      current.length >= minChars
    ) {
      chunks.push(current.trim());
      const overlapText = current.slice(-overlap);
      current = `${overlapText}\n\n${para}`;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

export async function indexMeetingMemory(
  meetingId: string,
  userId: string,
): Promise<void> {
  const provider = getEmbeddingProvider();
  if (!provider) {
    console.log(
      `[memory] Skipping indexing for ${meetingId}: no embedding provider configured`,
    );
    return;
  }

  const meeting = await db.query.meetings.findFirst({
    where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
  });

  if (!meeting) {
    console.log(`[memory] Meeting ${meetingId} not found or not owned by user`);
    return;
  }

  const summary = await db.query.meetingSummaries.findFirst({
    where: eq(meetingSummaries.meetingId, meetingId),
  });

  const items = await db.query.actionItems.findMany({
    where: eq(actionItems.meetingId, meetingId),
  });

  const baseMeta = {
    meetingTitle: meeting.title,
    meetingDate: meeting.meetingDate?.toISOString() ?? null,
    participantsText: meeting.participantsText ?? null,
  };

  const rawChunks: RawChunk[] = [];

  if (meeting.transcriptText?.trim()) {
    const transcriptChunks = chunkText(meeting.transcriptText);
    transcriptChunks.forEach((text, i) => {
      rawChunks.push({
        sourceType: "transcript",
        content: text,
        metadata: {
          ...baseMeta,
          sourceType: "transcript",
          chunkIndex: i,
          chunkCount: transcriptChunks.length,
        },
      });
    });
  }

  const summaryFields: Array<{
    sourceType: SourceType;
    text: string | null | undefined;
  }> = [
    { sourceType: "summary", text: summary?.summaryMd },
    { sourceType: "decisions", text: summary?.decisionsMd },
    { sourceType: "blockers", text: summary?.blockersMd },
    { sourceType: "followups", text: summary?.followupsMd },
  ];

  for (const { sourceType, text } of summaryFields) {
    if (!text?.trim()) continue;
    rawChunks.push({
      sourceType,
      content: text,
      metadata: { ...baseMeta, sourceType },
    });
  }

  for (const item of items) {
    if (!item.title?.trim()) continue;
    const content = [
      `Action item: ${item.title}`,
      item.ownerName ? `Owner: ${item.ownerName}` : null,
      item.dueDate ? `Due: ${item.dueDate.toISOString().slice(0, 10)}` : null,
      `Status: ${item.status}`,
      `Priority: ${item.priority}`,
    ]
      .filter(Boolean)
      .join("\n");

    rawChunks.push({
      sourceType: "action_item",
      content,
      metadata: {
        ...baseMeta,
        sourceType: "action_item",
        actionItemId: item.id,
        owner: item.ownerName ?? null,
        dueDate: item.dueDate?.toISOString().slice(0, 10) ?? null,
      },
    });
  }

  if (rawChunks.length === 0) {
    console.log(`[memory] No content to index for meeting ${meetingId}`);
    return;
  }

  let embeddings: number[][];
  try {
    embeddings = await provider.embedTexts(rawChunks.map((c) => c.content));
  } catch (err) {
    console.error(`[memory] Embedding failed for meeting ${meetingId}:`, err);
    return;
  }

  await db
    .delete(meetingMemoryChunks)
    .where(eq(meetingMemoryChunks.meetingId, meetingId));

  const rows = rawChunks.map((chunk, i) => ({
    userId,
    meetingId,
    sourceType: chunk.sourceType,
    content: chunk.content,
    contentHash: sha256(chunk.content),
    embedding: embeddings[i] as number[],
    tokenCount: estimateTokens(chunk.content),
    charCount: chunk.content.length,
    metadata: chunk.metadata,
  }));

  await db.insert(meetingMemoryChunks).values(rows);

  console.log(
    `[memory] Indexed ${rows.length} chunks for meeting ${meetingId}`,
  );
}
