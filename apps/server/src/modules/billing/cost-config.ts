/**
 * Central cost configuration for internal analytics.
 * All costs in USD. Adjust values here - they propagate everywhere.
 */
export const costConfig = {
  /** Cost per minute of transcription (e.g. Whisper / Groq) */
  transcriptionCostPerMinute: 0.01,
  /** Cost per meeting for AI extraction (summary, actions, etc.) */
  extractionCostPerMeeting: 0.02,
  /** Infrastructure cost per meeting (compute, queues, etc.) */
  infraCostPerMeeting: 0.01,
} as const;

/**
 * Subscription prices (what the user pays).
 * Used for profit calculation. Keep in sync with Polar.
 */
export const planPricing = {
  monthly: { free: 0, pro: 15, team: 39 } as Record<string, number>,
  yearly: { free: 0, pro: 150, team: 390 } as Record<string, number>,
};

/** Helper to get the monthly-equivalent price for profit calculations. */
export function getMonthlyPrice(plan: string, cycle: string = "monthly") {
  if (cycle === "yearly") {
    return (planPricing.yearly[plan] ?? 0) / 12;
  }
  return planPricing.monthly[plan] ?? 0;
}

/**
 * Payment processor fee formula.
 * Polar/Stripe: 4% + $0.40 per transaction.
 */
export function getProcessorFee(price: number): number {
  if (price <= 0) return 0;
  return price * 0.04 + 0.4;
}

/**
 * Net revenue after processor fees.
 */
export function getNetRevenue(price: number): number {
  return Math.max(0, price - getProcessorFee(price));
}

export interface MeetingCostBreakdown {
  transcriptionCost: number;
  extractionCost: number;
  infraCost: number;
  totalCost: number;
}

/**
 * Estimates the cost of processing a single meeting.
 */
export function getEstimatedMeetingCost(
  durationMinutes: number,
): MeetingCostBreakdown {
  const transcriptionCost =
    durationMinutes * costConfig.transcriptionCostPerMinute;
  const extractionCost = costConfig.extractionCostPerMeeting;
  const infraCost = costConfig.infraCostPerMeeting;
  const totalCost = transcriptionCost + extractionCost + infraCost;

  return {
    transcriptionCost: round(transcriptionCost),
    extractionCost: round(extractionCost),
    infraCost: round(infraCost),
    totalCost: round(totalCost),
  };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
