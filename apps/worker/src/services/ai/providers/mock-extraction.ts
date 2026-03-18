import type { ExtractionProviderImpl } from "../types";

export function createMockExtraction(): ExtractionProviderImpl {
  return {
    name: "mock",
    async extract() {
      return {
        summary: [
          "- Team standup covering API integration, dashboard UI, and authentication",
          "- Bob completed API integration, moving to dashboard work",
          "- Charlie working on authentication flow, expected EOD completion",
          "- OAuth provider reliability concern raised as potential risk",
          "- Decision to proceed with current provider but add error handling",
        ].join("\n"),
        decisions: [
          "- Proceed with current OAuth provider but add fallback error handling",
          "- Bob to receive staging access today",
        ].join("\n"),
        blockers: [
          "- Bob needs staging environment access (assigned to Alice)",
          "- OAuth provider has been flaky — may need fallback strategy",
        ].join("\n"),
        followups: [
          "- Alice to set up staging access for Bob",
          "- Team to add OAuth fallback handling",
          "- Next standup tomorrow at same time",
        ].join("\n"),
        actionItems: [
          { title: "Set up staging access for Bob", ownerName: "Alice" },
          { title: "Finish authentication flow", ownerName: "Charlie" },
          { title: "Add OAuth fallback error handling", ownerName: null },
        ].map((item) => ({
          title: item.title,
          ownerName: item.ownerName ?? undefined,
        })),
        model: "mock",
      };
    },
  };
}
