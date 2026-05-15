import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@repo/env";
import type { LanguageModel } from "ai";

function resolveChatProvider(): "ollama" | "openai" {
  if (env.CHAT_PROVIDER === "ollama" || env.CHAT_PROVIDER === "openai") {
    return env.CHAT_PROVIDER;
  }
  return env.APP_ENV === "local" ? "ollama" : "openai";
}

function ollamaBaseUrl(): string {
  const raw = env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  return raw.replace(/\/api\/?$/, "");
}

export function getChatModel(): LanguageModel {
  const provider = resolveChatProvider();

  if (provider === "ollama") {
    const ollama = createOpenAI({
      baseURL: `${ollamaBaseUrl()}/v1`,
      apiKey: "ollama",
    });
    return ollama(env.AI_CHAT_MODEL ?? "llama3.1:8b");
  }

  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? "" });
  return openai(env.AI_CHAT_MODEL ?? "gpt-4o-mini");
}

export function getEmbeddingModel() {
  const provider = resolveChatProvider();

  if (provider === "ollama") {
    const ollama = createOpenAI({
      baseURL: `${ollamaBaseUrl()}/v1`,
      apiKey: "ollama",
    });
    return ollama.embedding(env.AI_EMBEDDING_MODEL ?? "embeddinggemma:latest");
  }

  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? "" });
  return openai.embedding(env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small");
}

export function getEmbeddingDimensions(): number {
  if (env.AI_EMBEDDING_DIMENSIONS) {
    return Number(env.AI_EMBEDDING_DIMENSIONS);
  }
  return resolveChatProvider() === "ollama" ? 768 : 1536;
}
