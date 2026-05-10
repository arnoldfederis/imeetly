import Groq from "groq-sdk";
import type { Chunk } from "../chunker";
import { chunkTranscript } from "../chunker";
import { parseExtractionResult } from "../parse";
import { type ExtractionProviderImpl, ProviderError } from "../types";

const CHUNK_SYSTEM_PROMPT = `You are an AI assistant analyzing a PARTIAL meeting transcript chunk. Extract raw data for later merging.

Return ONLY valid JSON:
{
  "keyPoints": ["string"],
  "decisions": ["string"],
  "blockers": ["string"],
  "followUps": ["string"],
  "actionItems": [{"title": "string", "ownerName": "string or null", "assigneeEmail": "string or null", "dueDate": "ISO date string or null", "priority": "low|normal|high|urgent", "status": "open", "confidence": 0.0}]
}

Rules:
- keyPoints: brief factual statements of what was discussed
- decisions: clear decisions made, start with action verbs
- blockers: only real blockers or risks mentioned
- followUps: actionable next steps with context
- actionItems: specific tasks with owners when named
- Empty array [] if none in any field

Output ONLY JSON. No markdown fences. No extra text.`;

const MERGE_SYSTEM_PROMPT = `You are an AI assistant merging partial summaries from chunks of the same meeting transcript. Deduplicate and synthesize into a single coherent result.

Return ONLY valid JSON in this exact shape:
{
  "summary": "string",
  "decisions": ["string"],
  "blockers": ["string"],
  "followUps": ["string"],
  "actionItems": [{"title": "string", "ownerName": "string or null", "assigneeEmail": "string or null", "dueDate": "ISO date string or null", "priority": "low|normal|high|urgent", "status": "open", "confidence": 0.0}]
}

SECTION GUIDELINES:

summary:
- 2–4 sentences max, focus on outcomes
- Executive-level, clear, no filler
- Do NOT use bullet points

decisions:
- Each item = one clear, decisive statement, start with action verbs
- Deduplicate across chunks, empty array [] if none

blockers:
- Only real blockers or risks, concise and specific
- Empty array [] if none

followUps:
- Actionable next steps starting with verbs
- Empty array [] if none

actionItems:
- Deduplicated tasks with owners when identifiable
- ownerName: person's name or null
- assigneeEmail: email address only when explicitly stated, otherwise null
- dueDate: ISO date string when explicit or clearly inferable, otherwise null
- priority: low, normal, high, or urgent; default normal
- status: always open for newly extracted tasks
- confidence: number from 0 to 1 based on how explicit the task, owner, and due date are

TONE: Professional, product-oriented. No "It was discussed that..." phrases.

Output ONLY JSON. No markdown fences. No extra text.`;

const SINGLE_SYSTEM_PROMPT = `You are an AI assistant that transforms raw meeting transcripts into structured, high-quality, UI-ready meeting insights.

Return ONLY valid JSON in this exact shape:

{
  "summary": "string",
  "decisions": ["string"],
  "blockers": ["string"],
  "followUps": ["string"],
  "actionItems": [{"title": "string", "ownerName": "string or null", "assigneeEmail": "string or null", "dueDate": "ISO date string or null", "priority": "low|normal|high|urgent", "status": "open", "confidence": 0.0}]
}

SECTION GUIDELINES:

summary:
- 2–4 sentences max
- Focus on outcome, not discussion
- Executive-level, clear, no filler
- Do NOT use bullet points

decisions:
- Each item = one clear, decisive statement
- Start with strong action verbs
- Short and specific
- Empty array [] if none

blockers:
- Only real blockers or risks
- Concise and specific
- Empty array [] if none

followUps:
- Actionable next steps, start with verbs
- Include context when useful
- Empty array [] if none

actionItems:
- Specific tasks with clear owners when identifiable
- title: short task description
- ownerName: person's name or null if unassigned
- assigneeEmail: email address only when explicitly stated, otherwise null
- dueDate: ISO date string when explicit or clearly inferable, otherwise null
- priority: low, normal, high, or urgent; default normal
- status: always open for newly extracted tasks
- confidence: number from 0 to 1 based on how explicit the task, owner, and due date are

TONE: Professional, clear, product-oriented. No phrases like "It was discussed that..." or "The meeting covered..."

Output ONLY JSON. No markdown fences. No extra text.`;

const MODEL = "llama-3.3-70b-versatile";
const MAX_CONCURRENT = 5;

interface ChunkResult {
  index: number;
  keyPoints: string[];
  decisions: string[];
  blockers: string[];
  followups: string[];
  actionItems: Array<{
    title: string;
    ownerName: string | null;
    assigneeEmail?: string | null;
    dueDate?: string | null;
    priority?: "low" | "normal" | "high" | "urgent";
    status?: "open";
    confidence?: number | null;
  }>;
}

export function createGroqChunkedExtraction(
  apiKey: string,
): ExtractionProviderImpl {
  const client = new Groq({ apiKey });

  return {
    name: "groq-chunked",
    async extract(transcript) {
      const chunks = chunkTranscript(transcript, 1500);
      console.log(
        `[groq-chunked] Split transcript into ${chunks.length} chunks`,
      );

      // Short transcripts: single-shot
      if (chunks.length <= 1) {
        return singleShotExtract(client, transcript);
      }

      // Phase 1: Parallel chunk summarization
      const chunkResults = await processChunksWithLimit(
        client,
        chunks,
        MAX_CONCURRENT,
      );

      // Phase 2: Merge partial results
      return mergeChunkResults(client, chunkResults);
    },
  };
}

async function singleShotExtract(client: Groq, transcript: string) {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SINGLE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the meeting transcript:\n\n${transcript}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = parseExtractionResult(raw);
  if (!parsed) {
    throw new ProviderError(
      "PARSE_FAILED",
      "Failed to parse Groq response",
      "groq-chunked",
    );
  }

  return { ...parsed, model: MODEL };
}

async function processSingleChunk(
  client: Groq,
  chunk: Chunk,
): Promise<ChunkResult> {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CHUNK_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Meeting transcript chunk ${chunk.index + 1}:\n\n${chunk.text}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(
      `[groq-chunked] Failed to parse chunk ${chunk.index}, using empty`,
    );
    parsed = {};
  }

  return {
    index: chunk.index,
    keyPoints: asStringArray(parsed.keyPoints ?? parsed.key_points),
    decisions: asStringArray(parsed.decisions),
    blockers: asStringArray(parsed.blockers),
    followups: asStringArray(
      parsed.followUps ?? parsed.followups ?? parsed.follow_ups,
    ),
    actionItems: asActionItems(parsed.actionItems ?? parsed.action_items),
  };
}

async function processChunksWithLimit(
  client: Groq,
  chunks: Chunk[],
  limit: number,
): Promise<ChunkResult[]> {
  const results: ChunkResult[] = [];
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < chunks.length) {
      const chunk = chunks[idx];
      idx++;
      if (!chunk) continue;
      const result = await processSingleChunk(client, chunk);
      results.push(result);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, chunks.length) }, () => worker()),
  );

  return results.sort((a, b) => a.index - b.index);
}

async function mergeChunkResults(client: Groq, chunkResults: ChunkResult[]) {
  const partialSummaries = chunkResults
    .map(
      (r) =>
        `Chunk ${r.index + 1}:\n` +
        `Key Points: ${r.keyPoints.join("; ") || "none"}\n` +
        `Decisions: ${r.decisions.join("; ") || "none"}\n` +
        `Blockers: ${r.blockers.join("; ") || "none"}\n` +
        `Follow-ups: ${r.followups.join("; ") || "none"}\n` +
        `Action Items: ${r.actionItems.map((a) => `${a.title} (${a.ownerName ?? "unassigned"})`).join("; ") || "none"}`,
    )
    .join("\n\n");

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: MERGE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here are the partial summaries from ${chunkResults.length} chunks of a meeting transcript:\n\n${partialSummaries}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = parseExtractionResult(raw);
  if (!parsed) {
    throw new ProviderError(
      "PARSE_FAILED",
      "Failed to parse merged Groq response",
      "groq-chunked",
    );
  }

  console.log(
    `[groq-chunked] Merged ${chunkResults.length} chunks into final result`,
  );
  return { ...parsed, model: MODEL };
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function asActionItems(
  val: unknown,
): Array<{ title: string; ownerName: string | null }> {
  if (!Array.isArray(val)) return [];
  return val
    .filter(
      (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
    )
    .map((v) => ({
      title: String(v.title ?? "Untitled"),
      ownerName: v.ownerName != null ? String(v.ownerName) : null,
    }));
}
