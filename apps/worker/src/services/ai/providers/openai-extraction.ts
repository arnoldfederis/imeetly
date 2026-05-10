import OpenAI from "openai";
import { parseExtractionResult } from "../parse";
import type { ExtractionProviderImpl } from "../types";
import { ProviderError } from "../types";

const SYSTEM_PROMPT = `You are an AI assistant that transforms raw meeting transcripts into structured, high-quality, UI-ready meeting insights.

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

TONE: Professional, clear, product-oriented. No phrases like "It was discussed that..." or "The meeting covered..." or "Participants mentioned..."

Output ONLY JSON. No markdown fences. No extra text.`;

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
