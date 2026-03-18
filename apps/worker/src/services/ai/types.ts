// --- Provider identifiers ---

export type TranscriptionProvider = "openai" | "groq" | "mock";
export type ExtractionProvider = "anthropic" | "openai" | "groq" | "mock";
export type ProviderSelector =
  | "auto"
  | TranscriptionProvider
  | ExtractionProvider;

// --- Result types ---

export interface TranscriptionResult {
  text: string;
  provider: TranscriptionProvider;
  durationMs: number;
}

export interface ActionItem {
  title: string;
  ownerName?: string;
  dueDate?: string | null;
}

export interface ExtractionResult {
  summary: string;
  decisions: string;
  blockers: string;
  followups: string;
  actionItems: ActionItem[];
  provider: ExtractionProvider;
  model: string;
  durationMs: number;
}

// --- Provider interfaces ---

export interface TranscriptionProviderImpl {
  name: TranscriptionProvider;
  transcribe(
    fileBytes: Uint8Array,
    fileName: string,
    mimeType: string,
  ): Promise<string>;
}

export interface ExtractionProviderImpl {
  name: ExtractionProvider;
  extract(
    transcript: string,
  ): Promise<Omit<ExtractionResult, "provider" | "durationMs">>;
}

// --- Provider errors ---

export class ProviderError extends Error {
  constructor(
    public readonly code:
      | "PROVIDER_UNAVAILABLE"
      | "MISSING_API_KEY"
      | "PROVIDER_REQUEST_FAILED"
      | "PARSE_FAILED"
      | "ALL_PROVIDERS_EXHAUSTED",
    message: string,
    public readonly provider?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
