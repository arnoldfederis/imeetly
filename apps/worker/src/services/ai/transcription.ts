import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../../env";
import { createDeepgramTranscription } from "./providers/deepgram-transcription";
import { createGroqTranscription } from "./providers/groq-transcription";
import { createMockTranscription } from "./providers/mock-transcription";
import { createOpenAITranscription } from "./providers/openai-transcription";
import {
  ProviderError,
  type TranscriptionProvider,
  type TranscriptionProviderImpl,
  type TranscriptionResult,
} from "./types";

// Cloudflare R2 - downloads media files for transcription.
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

// --- Provider key map ---

const PROVIDER_KEYS: Record<TranscriptionProvider, string | undefined> = {
  deepgram: env.DEEPGRAM_API_KEY,
  openai: env.OPENAI_API_KEY,
  groq: env.GROQ_API_KEY,
  mock: "mock",
};

function hasKey(provider: TranscriptionProvider): boolean {
  return !!PROVIDER_KEYS[provider];
}

function buildProvider(
  name: TranscriptionProvider,
): TranscriptionProviderImpl | null {
  const key = PROVIDER_KEYS[name];
  if (!key) return null;

  switch (name) {
    case "deepgram":
      return createDeepgramTranscription(key);
    case "openai":
      return createOpenAITranscription(key);
    case "groq":
      return createGroqTranscription(key);
    case "mock":
      return createMockTranscription();
  }
}

// --- Auto strategy ---

const AUTO_DEV: TranscriptionProvider[] = ["deepgram", "openai", "mock"];
const AUTO_PROD: TranscriptionProvider[] = [
  "deepgram",
  "openai",
  "groq",
  "mock",
];

function resolveChain(): TranscriptionProvider[] {
  const isProd = env.APP_ENV === "production";
  const isDev = env.APP_ENV === "development";
  const configured = (env.AI_TRANSCRIPTION_PROVIDER ?? "auto") as string;
  const fallback = env.AI_TRANSCRIPTION_FALLBACK as
    | TranscriptionProvider
    | undefined;

  // In production, mock fallback is always disabled
  if (isProd && fallback === "mock") {
    console.warn("[transcribe] Mock fallback disabled in production");
  }
  const effectiveFallback =
    isProd && fallback === "mock" ? undefined : fallback;

  if (configured === "auto") {
    const chain = isDev ? AUTO_DEV : AUTO_PROD;
    return isProd ? chain.filter((p) => p !== "mock") : chain;
  }

  const primary = configured as TranscriptionProvider;
  const chain: TranscriptionProvider[] = [primary];
  if (effectiveFallback && effectiveFallback !== primary) {
    chain.push(effectiveFallback);
  }
  return chain;
}

// --- Public API ---

export async function transcribeMeeting(
  storageKey: string,
  language?: string,
): Promise<TranscriptionResult> {
  // Download from S3
  console.log(`[transcribe] Downloading from S3: ${storageKey}`);
  const response = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }),
  );

  if (!response.Body) {
    throw new Error(`Empty file body for key: ${storageKey}`);
  }

  const bytes = await response.Body.transformToByteArray();
  const fileName = storageKey.split("/").pop() ?? "audio.mp3";
  const mimeType = response.ContentType ?? "audio/mpeg";
  console.log(
    `[transcribe] Downloaded ${fileName} — ${bytes.length} bytes, ${mimeType}`,
  );

  const chain = resolveChain();
  const triedProviders: string[] = [];
  const emptyTranscriptProviders: string[] = [];
  const infraErrors: Array<{ provider: string; error: unknown }> = [];

  for (const name of chain) {
    if (!hasKey(name)) {
      console.log(`[transcribe] Skipping ${name}: no API key`);
      continue;
    }

    const provider = buildProvider(name);
    if (!provider) continue;

    triedProviders.push(name);
    const start = Date.now();

    try {
      console.log(
        `[transcribe] Trying ${name}${language ? ` (lang: ${language})` : ""}`,
      );
      const text = await provider.transcribe(
        bytes,
        fileName,
        mimeType,
        language,
      );
      const trimmed = text.trim();
      const durationMs = Date.now() - start;

      if (!trimmed) {
        console.warn(
          `[transcribe] ${name} returned empty transcript after ${durationMs}ms — trying next provider`,
        );
        emptyTranscriptProviders.push(name);
        continue;
      }

      console.log(
        `[transcribe] ${name} succeeded (${durationMs}ms, ${trimmed.length} chars)`,
      );
      return { text: trimmed, provider: name, durationMs };
    } catch (err) {
      const durationMs = Date.now() - start;
      const isEmptyTranscript =
        err instanceof ProviderError && err.code === "EMPTY_TRANSCRIPT";

      if (isEmptyTranscript) {
        console.warn(
          `[transcribe] ${name}: empty transcript after ${durationMs}ms — trying next provider`,
        );
        emptyTranscriptProviders.push(name);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[transcribe] ${name} failed after ${durationMs}ms: ${msg}`,
        );
        infraErrors.push({ provider: name, error: err });
      }
    }
  }

  if (triedProviders.length === 0) {
    throw new ProviderError(
      "MISSING_API_KEY",
      "No transcription providers available. Configure at least one API key (DEEPGRAM_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY).",
    );
  }

  // All tried providers returned empty — audio has no speech. Retrying the same
  // audio will not produce a transcript, so this is a non-retryable condition.
  if (emptyTranscriptProviders.length > 0 && infraErrors.length === 0) {
    throw new ProviderError(
      "EMPTY_TRANSCRIPT",
      `No speech detected in audio. Tried: ${emptyTranscriptProviders.join(", ")}`,
    );
  }

  const allErrors = [
    ...infraErrors.map(
      (e) =>
        `${e.provider}: ${e.error instanceof Error ? e.error.message : String(e.error)}`,
    ),
    ...emptyTranscriptProviders.map((p) => `${p}: empty transcript`),
  ];

  throw new ProviderError(
    "ALL_PROVIDERS_EXHAUSTED",
    `All transcription providers failed. Tried: ${triedProviders.join(", ")}. Errors: ${allErrors.join("; ")}`,
  );
}
