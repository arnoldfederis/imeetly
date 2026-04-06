import { env } from "../../env";
import { createAnthropicExtraction } from "./providers/anthropic-extraction";
import { createGroqChunkedExtraction } from "./providers/groq-chunked-extraction";
import { createGroqExtraction } from "./providers/groq-extraction";
import { createMockExtraction } from "./providers/mock-extraction";
import { createOpenAIExtraction } from "./providers/openai-extraction";
import {
  type ExtractionProvider,
  type ExtractionProviderImpl,
  type ExtractionResult,
  ProviderError,
} from "./types";

// --- Provider key map ---

const PROVIDER_KEYS: Record<ExtractionProvider, string | undefined> = {
  anthropic: env.ANTHROPIC_API_KEY,
  openai: env.OPENAI_API_KEY,
  groq: env.GROQ_API_KEY,
  "groq-chunked": env.GROQ_API_KEY,
  mock: "mock",
};

function hasKey(provider: ExtractionProvider): boolean {
  return !!PROVIDER_KEYS[provider];
}

function buildProvider(
  name: ExtractionProvider,
): ExtractionProviderImpl | null {
  const key = PROVIDER_KEYS[name];
  if (!key) return null;

  switch (name) {
    case "anthropic":
      return createAnthropicExtraction(key);
    case "openai":
      return createOpenAIExtraction(key);
    case "groq":
      return createGroqExtraction(key);
    case "groq-chunked":
      return createGroqChunkedExtraction(key);
    case "mock":
      return createMockExtraction();
  }
}

// --- Auto strategy ---
// Development: skip Anthropic unless explicitly forced
const AUTO_DEV: ExtractionProvider[] = ["groq-chunked", "openai", "groq", "mock"];
const AUTO_PROD: ExtractionProvider[] = ["groq-chunked", "anthropic", "openai", "groq", "mock"];

function resolveChain(): ExtractionProvider[] {
  const isDev = env.APP_ENV === "development";
  const configured = (env.AI_EXTRACTION_PROVIDER ?? "auto") as string;
  const fallback = env.AI_EXTRACTION_FALLBACK as ExtractionProvider | undefined;

  if (configured === "auto") {
    return isDev ? AUTO_DEV : AUTO_PROD;
  }

  // In development, skip Anthropic unless explicitly set as the provider
  if (isDev && configured === "anthropic") {
    console.log(
      "[extraction] Anthropic explicitly configured in development mode",
    );
  }

  const chain: ExtractionProvider[] = [configured as ExtractionProvider];
  if (fallback && fallback !== configured) {
    chain.push(fallback);
  }
  return chain;
}

// --- Public API ---

export async function extractMeetingData(
  transcript: string,
): Promise<ExtractionResult> {
  const chain = resolveChain();
  const errors: Array<{ provider: string; error: unknown }> = [];

  for (const name of chain) {
    if (!hasKey(name)) {
      console.log(`[extraction] Skipping ${name}: no API key`);
      continue;
    }

    const provider = buildProvider(name);
    if (!provider) continue;

    const start = Date.now();
    try {
      console.log(`[extraction] Trying provider: ${name}`);
      const result = await provider.extract(transcript);
      const durationMs = Date.now() - start;
      console.log(`[extraction] Success with ${name} (${durationMs}ms)`);
      return { ...result, provider: name, durationMs };
    } catch (err) {
      const durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[extraction] ${name} failed after ${durationMs}ms: ${msg}`);
      errors.push({ provider: name, error: err });
    }
  }

  throw new ProviderError(
    "ALL_PROVIDERS_EXHAUSTED",
    `All extraction providers failed. Tried: ${chain.filter(hasKey).join(", ")}. Errors: ${errors.map((e) => `${e.provider}: ${e.error instanceof Error ? e.error.message : String(e.error)}`).join("; ")}`,
  );
}
