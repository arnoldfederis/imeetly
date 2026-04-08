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

// Cloudflare R2 — downloads media files for transcription.
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
    // Strip mock from production auto chains
    return isProd ? chain.filter((p) => p !== "mock") : chain;
  }

  const chain: TranscriptionProvider[] = [configured as TranscriptionProvider];
  if (effectiveFallback && effectiveFallback !== configured) {
    chain.push(effectiveFallback);
  }
  return chain;
}

// --- Public API ---

export async function transcribeMeeting(
  storageKey: string,
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
  console.log(`[transcribe] Downloaded ${bytes.length} bytes`);

  // Try providers in order
  const chain = resolveChain();
  const errors: Array<{ provider: string; error: unknown }> = [];

  for (const name of chain) {
    if (!hasKey(name)) {
      console.log(`[transcribe] Skipping ${name}: no API key`);
      continue;
    }

    const provider = buildProvider(name);
    if (!provider) continue;

    const start = Date.now();
    try {
      console.log(`[transcribe] Trying provider: ${name}`);
      const text = await provider.transcribe(bytes, fileName, mimeType);
      const durationMs = Date.now() - start;
      console.log(
        `[transcribe] Success with ${name} (${durationMs}ms, ${text.length} chars)`,
      );
      return { text, provider: name, durationMs };
    } catch (err) {
      const durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[transcribe] ${name} failed after ${durationMs}ms: ${msg}`);
      errors.push({ provider: name, error: err });
    }
  }

  throw new ProviderError(
    "ALL_PROVIDERS_EXHAUSTED",
    `All transcription providers failed. Tried: ${chain.filter(hasKey).join(", ")}. Errors: ${errors.map((e) => `${e.provider}: ${e.error instanceof Error ? e.error.message : String(e.error)}`).join("; ")}`,
  );
}
