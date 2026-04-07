import type { ActionItem } from "./types";

/**
 * Safely extract JSON from model output that may contain markdown fences,
 * extra whitespace, or other wrapping.
 */
export function safeParseJSON<T>(raw: string, label: string): T | null {
  const cleaned = raw
    .replace(/```json?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.warn(
      `[parse:${label}] Failed to parse JSON. Raw (first 300 chars): ${raw.slice(0, 300)}`,
    );
    return null;
  }
}

/**
 * Parse action items from raw model output with safe fallback.
 */
export function parseActionItems(raw: string): ActionItem[] {
  const parsed = safeParseJSON<unknown[]>(raw, "actionItems");
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    return {
      title: String(obj.title ?? obj.task ?? "Untitled action item"),
      ownerName:
        obj.ownerName != null || obj.owner != null
          ? String(obj.ownerName ?? obj.owner)
          : undefined,
      dueDate:
        obj.dueDate != null || obj.due_date != null
          ? String(obj.dueDate ?? obj.due_date)
          : undefined,
    };
  });
}

/**
 * Parse a structured extraction result from raw JSON model output.
 */
export function parseExtractionResult(raw: string): {
  summary: string;
  decisions: string;
  blockers: string;
  followups: string;
  actionItems: ActionItem[];
} | null {
  const parsed = safeParseJSON<Record<string, unknown>>(raw, "extraction");
  if (!parsed || typeof parsed !== "object") return null;

  return {
    summary: String(parsed.summary ?? ""),
    decisions: String(parsed.decisions ?? ""),
    blockers: String(parsed.blockers ?? ""),
    followups: String(parsed.followups ?? parsed.follow_ups ?? ""),
    actionItems: Array.isArray(parsed.actionItems ?? parsed.action_items)
      ? parseActionItems(
          JSON.stringify(parsed.actionItems ?? parsed.action_items),
        )
      : [],
  };
}
