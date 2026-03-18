import OpenAI from "openai";
import { parseExtractionResult } from "../parse";
import type { ExtractionProviderImpl } from "../types";
import { ProviderError } from "../types";

const SYSTEM_PROMPT = `You are a meeting notes assistant. Analyze the meeting transcript and return a JSON object with these fields:

- "summary": A concise markdown summary (bullet points, under 500 words)
- "decisions": Markdown bullet list of key decisions. "No decisions recorded." if none.
- "blockers": Markdown bullet list of blockers/risks. "No blockers or risks identified." if none.
- "followups": Markdown bullet list of follow-ups/next steps. "No follow-ups identified." if none.
- "actionItems": JSON array of objects with "title" (string) and "ownerName" (string or null)

Return ONLY valid JSON. No markdown fences.`;

export function createOpenAIExtraction(apiKey: string): ExtractionProviderImpl {
  const client = new OpenAI({ apiKey });
  const model = "gpt-4o";

  return {
    name: "openai",
    async extract(transcript) {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
          "Failed to parse OpenAI response",
          "openai",
        );
      }

      return { ...parsed, model };
    },
  };
}
