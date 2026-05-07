import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "../types";

// ── Hoisted mocks (must be available when vi.mock factories execute) ──────────

const {
  mockDeepgram,
  mockOpenAI,
  mockGroq,
  mockS3Send,
  mockTransformToByteArray,
} = vi.hoisted(() => {
  const mockTransformToByteArray = vi
    .fn()
    .mockResolvedValue(new Uint8Array([0x00, 0x01, 0x02]));
  const mockS3Send = vi.fn().mockResolvedValue({
    Body: { transformToByteArray: mockTransformToByteArray },
    ContentType: "audio/mpeg",
  });
  return {
    mockDeepgram: { name: "deepgram" as const, transcribe: vi.fn() },
    mockOpenAI: { name: "openai" as const, transcribe: vi.fn() },
    mockGroq: { name: "groq" as const, transcribe: vi.fn() },
    mockS3Send,
    mockTransformToByteArray,
  };
});

vi.mock("../providers/deepgram-transcription", () => ({
  createDeepgramTranscription: () => mockDeepgram,
}));
vi.mock("../providers/openai-transcription", () => ({
  createOpenAITranscription: () => mockOpenAI,
}));
vi.mock("../providers/groq-transcription", () => ({
  createGroqTranscription: () => mockGroq,
}));
vi.mock("../providers/mock-transcription", () => ({
  createMockTranscription: () => ({
    name: "mock" as const,
    transcribe: vi.fn(),
  }),
}));

// Env: production, deepgram primary + openai fallback, groq key absent
vi.mock("../../../env", () => ({
  env: {
    APP_ENV: "production",
    AI_TRANSCRIPTION_PROVIDER: "deepgram",
    AI_TRANSCRIPTION_FALLBACK: "openai",
    DEEPGRAM_API_KEY: "test-deepgram-key",
    OPENAI_API_KEY: "test-openai-key",
    GROQ_API_KEY: undefined,
    S3_ENDPOINT: "https://s3.example.com",
    S3_REGION: "auto",
    S3_ACCESS_KEY_ID: "access-key",
    S3_SECRET_ACCESS_KEY: "secret-key",
    S3_BUCKET: "test-bucket",
  },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockS3Send;
  },
  GetObjectCommand: class {
    Bucket: string;
    Key: string;
    constructor(args: { Bucket: string; Key: string }) {
      this.Bucket = args.Bucket;
      this.Key = args.Key;
    }
  },
}));

// Import after mocks are in place
import { transcribeMeeting } from "../transcription";

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUDIO_KEY = "meetings/abc123/audio.mp3";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("transcribeMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockS3Send.mockResolvedValue({
      Body: { transformToByteArray: mockTransformToByteArray },
      ContentType: "audio/mpeg",
    });
    mockTransformToByteArray.mockResolvedValue(
      new Uint8Array([0x00, 0x01, 0x02]),
    );
  });

  it("returns Deepgram transcript when Deepgram succeeds", async () => {
    mockDeepgram.transcribe.mockResolvedValue("Hello from Deepgram");

    const result = await transcribeMeeting(AUDIO_KEY);

    expect(result.text).toBe("Hello from Deepgram");
    expect(result.provider).toBe("deepgram");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(mockOpenAI.transcribe).not.toHaveBeenCalled();
  });

  it("trims whitespace from returned transcript", async () => {
    mockDeepgram.transcribe.mockResolvedValue("  Hello world  \n");

    const result = await transcribeMeeting(AUDIO_KEY);

    expect(result.text).toBe("Hello world");
    expect(result.provider).toBe("deepgram");
  });

  it("falls back to OpenAI when Deepgram throws EMPTY_TRANSCRIPT", async () => {
    mockDeepgram.transcribe.mockRejectedValue(
      new ProviderError(
        "EMPTY_TRANSCRIPT",
        "Deepgram returned empty transcript",
        "deepgram",
      ),
    );
    mockOpenAI.transcribe.mockResolvedValue("Hello from OpenAI");

    const result = await transcribeMeeting(AUDIO_KEY);

    expect(result.text).toBe("Hello from OpenAI");
    expect(result.provider).toBe("openai");
    expect(mockDeepgram.transcribe).toHaveBeenCalledOnce();
    expect(mockOpenAI.transcribe).toHaveBeenCalledOnce();
  });

  it("falls back to OpenAI when Deepgram returns whitespace-only transcript", async () => {
    mockDeepgram.transcribe.mockResolvedValue("   ");
    mockOpenAI.transcribe.mockResolvedValue("OpenAI caught it");

    const result = await transcribeMeeting(AUDIO_KEY);

    expect(result.text).toBe("OpenAI caught it");
    expect(result.provider).toBe("openai");
  });

  it("throws EMPTY_TRANSCRIPT (non-retryable) when all providers return empty", async () => {
    mockDeepgram.transcribe.mockRejectedValue(
      new ProviderError(
        "EMPTY_TRANSCRIPT",
        "Deepgram returned empty transcript",
        "deepgram",
      ),
    );
    mockOpenAI.transcribe.mockRejectedValue(
      new ProviderError(
        "EMPTY_TRANSCRIPT",
        "OpenAI returned empty transcript",
        "openai",
      ),
    );

    await expect(transcribeMeeting(AUDIO_KEY)).rejects.toMatchObject({
      name: "ProviderError",
      code: "EMPTY_TRANSCRIPT",
    });
  });

  it("skips provider with missing API key and logs clearly", async () => {
    // groq key is undefined in mocked env — skipped without attempting transcription
    mockDeepgram.transcribe.mockResolvedValue("Deepgram result");

    const result = await transcribeMeeting(AUDIO_KEY);

    expect(result.text).toBe("Deepgram result");
    expect(mockGroq.transcribe).not.toHaveBeenCalled();
  });

  it("throws ALL_PROVIDERS_EXHAUSTED (retryable) for transient infrastructure errors", async () => {
    mockDeepgram.transcribe.mockRejectedValue(new Error("Connection timeout"));
    mockOpenAI.transcribe.mockRejectedValue(new Error("Rate limit exceeded"));

    await expect(transcribeMeeting(AUDIO_KEY)).rejects.toMatchObject({
      name: "ProviderError",
      code: "ALL_PROVIDERS_EXHAUSTED",
    });
  });

  it("tries OpenAI after Deepgram infra error", async () => {
    mockDeepgram.transcribe.mockRejectedValue(new Error("Network error"));
    mockOpenAI.transcribe.mockResolvedValue("OpenAI fallback result");

    const result = await transcribeMeeting(AUDIO_KEY);

    expect(result.text).toBe("OpenAI fallback result");
    expect(result.provider).toBe("openai");
  });

  it("throws ALL_PROVIDERS_EXHAUSTED when mix of empty and infra errors", async () => {
    mockDeepgram.transcribe.mockRejectedValue(
      new ProviderError(
        "EMPTY_TRANSCRIPT",
        "Deepgram returned empty transcript",
        "deepgram",
      ),
    );
    mockOpenAI.transcribe.mockRejectedValue(new Error("OpenAI API error"));

    await expect(transcribeMeeting(AUDIO_KEY)).rejects.toMatchObject({
      name: "ProviderError",
      code: "ALL_PROVIDERS_EXHAUSTED",
    });
  });

  it("passes language hint to provider", async () => {
    mockDeepgram.transcribe.mockResolvedValue("Hola mundo");

    const result = await transcribeMeeting(AUDIO_KEY, "es");

    expect(result.text).toBe("Hola mundo");
    expect(mockDeepgram.transcribe).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      "audio.mp3",
      "audio/mpeg",
      "es",
    );
  });
});
