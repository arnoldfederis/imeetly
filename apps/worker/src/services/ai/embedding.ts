import { env } from "../../env";

export interface EmbeddingProvider {
  embedText(input: string): Promise<number[]>;
  embedTexts(inputs: string[]): Promise<number[][]>;
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model = "text-embedding-3-small";
  private readonly dimensions = 1536;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

let _provider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider | null {
  if (_provider) return _provider;
  if (!env.OPENAI_API_KEY) {
    return null;
  }
  _provider = new OpenAIEmbeddingProvider(env.OPENAI_API_KEY);
  return _provider;
}
