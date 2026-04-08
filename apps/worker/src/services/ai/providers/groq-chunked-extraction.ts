import Groq from "groq-sdk";
import type { Chunk } from "../chunker";
import { chunkTranscript } from "../chunker";
import { parseExtractionResult } from "../parse";
import { type ExtractionProviderImpl, ProviderError } from "../types";

const CHUNK_SYSTEM_PROMPT = `You are a meeting notes assistant. Analyze this PARTIAL meeting transcript chunk and extract:
- Key points discussed
- Any decisions made
- Any blockers or risks mentioned
- Any follow-ups or action items mentioned

Return a JSON object:
{
  "keyPoints": ["..."],
  "decisions": ["..."],
  "blockers": ["..."],
  "followups": ["..."],
  "actionItems": [{"title": "...", "ownerName": null}]
}

Return ONLY valid JSON. No markdown fences.`;

const MERGE_SYSTEM_PROMPT = `You are a meeting notes assistant. You will receive partial summaries from different chunks of the same meeting transcript. Merge and deduplicate them into a single coherent result.

Return a JSON object with these fields:
- "summary": A concise markdown summary (bullet points, under 500 words)
- "decisions": Markdown bullet list of key decisions. "No decisions recorded." if none.
- "blockers": Markdown bullet list of blockers/risks. "No blockers or risks identified." if none.
- "followups": Markdown bullet list of follow-ups/next steps. "No follow-ups identified." if none.
- "actionItems": JSON array of objects with "title" (string) and "ownerName" (string or null)

Deduplicate items that appear in multiple chunks. Preserve all unique information.
Return ONLY valid JSON. No markdown fences.`;

const SINGLE_SYSTEM_PROMPT = `You are a meeting notes assistant. Analyze the meeting transcript and return a JSON object with these fields:

- "summary": A concise markdown summary (bullet points, under 500 words)
- "decisions": Markdown bullet list of key decisions. "No decisions recorded." if none.
- "blockers": Markdown bullet list of blockers/risks. "No blockers or risks identified." if none.
- "followups": Markdown bullet list of follow-ups/next steps. "No follow-ups identified." if none.
- "actionItems": JSON array of objects with "title" (string) and "ownerName" (string or null)

Return ONLY valid JSON. No markdown fences.`;

const MODEL = "llama-3.3-70b-versatile";
const MAX_CONCURRENT = 5;

interface ChunkResult {
  index: number;
  keyPoints: string[];
  decisions: string[];
  blockers: string[];
  followups: string[];
  actionItems: Array<{ title: string; ownerName: string | null }>;
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
    followups: asStringArray(parsed.followups ?? parsed.follow_ups),
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
