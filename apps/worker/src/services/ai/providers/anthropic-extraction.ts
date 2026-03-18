import Anthropic from "@anthropic-ai/sdk";
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

export function createAnthropicExtraction(
  apiKey: string,
): ExtractionProviderImpl {
  const client = new Anthropic({ apiKey });
  const model = "claude-sonnet-4-20250514";

  return {
    name: "anthropic",
    async extract(transcript) {
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is the meeting transcript:\n\n${transcript}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const raw = textBlock?.text ?? "";

      const parsed = parseExtractionResult(raw);
      if (!parsed) {
        throw new ProviderError(
          "PARSE_FAILED",
          "Failed to parse Anthropic response",
          "anthropic",
        );
      }

      return { ...parsed, model };
    },
  };
}
