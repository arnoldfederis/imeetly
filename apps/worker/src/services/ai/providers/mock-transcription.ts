import type { TranscriptionProviderImpl } from "../types";

export function createMockTranscription(): TranscriptionProviderImpl {
  return {
    name: "mock",
    async transcribe() {
      return [
        "Alice: Good morning everyone. Let's start the standup.",
        "Bob: I finished the API integration yesterday. Today I'll work on the dashboard UI.",
        "Alice: Great. Any blockers?",
        "Bob: I need access to the staging environment. Could you set that up?",
        "Charlie: I'm still working on the authentication flow. Should be done by end of day.",
        "Alice: Sounds good. I'll set up staging access for Bob today.",
        "Charlie: One concern - the OAuth provider has been flaky. We might need a fallback.",
        "Alice: Good point. Let's add that as an action item.",
        "Alice: OK, decisions: we'll proceed with the current OAuth provider but add error handling.",
        "Alice: Action items: Bob needs staging access, Charlie finishes auth by EOD, and we add OAuth fallback handling.",
        "Alice: Any other blockers? No? OK, let's wrap up. Next standup tomorrow same time.",
      ].join("\n");
    },
  };
}
