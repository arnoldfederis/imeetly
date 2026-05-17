// --- Provider identifiers ---

export type TranscriptionProvider = "openai" | "groq" | "deepgram" | "mock";
export type ExtractionProvider =
  | "anthropic"
  | "openai"
  | "groq"
  | "groq-chunked"
  | "mock";
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
  assigneeEmail?: string | null;
  dueDate?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  status?: "open" | "in_progress" | "blocked" | "done" | "canceled";
  confidence?: number | null;
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
    language?: string,
  ): Promise<string>;
  /** If present, provider can transcribe from a stream (no full download into RAM needed). */
  transcribeFromStream?(
    stream: import("stream").Readable,
    fileName: string,
    mimeType: string,
    contentLength: number | null,
    language?: string,
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
      | "ALL_PROVIDERS_EXHAUSTED"
      | "EMPTY_TRANSCRIPT",
    message: string,
    public readonly provider?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
