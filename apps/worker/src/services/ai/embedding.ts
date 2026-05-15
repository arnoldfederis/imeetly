import { env } from "../../env";

export interface EmbeddingProvider {
  embedText(input: string): Promise<number[]>;
  embedTexts(inputs: string[]): Promise<number[][]>;
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(
    apiKey: string,
    model = "text-embedding-3-small",
    dimensions = 1536,
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = dimensions;
  }

  async embedText(input: string): Promise<number[]> {
    const [embedding] = await this.embedTexts([input]);
    if (!embedding) {
      throw new Error("No embedding returned");
    }
    return embedding;
  }

  async embedTexts(inputs: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: inputs,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embeddings error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as {
      data: Array<{ index: number; embedding: number[] }>;
    };

    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}

class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string, model = "embeddinggemma:latest") {
    this.baseUrl = baseUrl.replace(/\/api\/?$/, "");
    this.model = model;
  }

  async embedText(input: string): Promise<number[]> {
    const [embedding] = await this.embedTexts([input]);
    if (!embedding) {
      throw new Error("No embedding returned");
    }
    return embedding;
  }

  async embedTexts(inputs: string[]): Promise<number[][]> {
    // Ollama /api/embed supports batch input
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: inputs }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama embeddings error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as { embeddings: number[][] };
    return data.embeddings;
  }
}

function resolveEmbeddingProvider(): "ollama" | "openai" {
  if (env.CHAT_PROVIDER === "ollama" || env.CHAT_PROVIDER === "openai") {
    return env.CHAT_PROVIDER;
  }
  return env.APP_ENV === "local" ? "ollama" : "openai";
}

let _provider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider | null {
  if (_provider) return _provider;

  const provider = resolveEmbeddingProvider();

  if (provider === "ollama") {
    const baseUrl = env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const model = env.AI_EMBEDDING_MODEL ?? "embeddinggemma";
    _provider = new OllamaEmbeddingProvider(baseUrl, model);
    return _provider;
  }

  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const model = env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  const dimensions = Number(env.AI_EMBEDDING_DIMENSIONS ?? "1536");
  _provider = new OpenAIEmbeddingProvider(
    env.OPENAI_API_KEY,
    model,
    dimensions,
  );
  return _provider;
}
