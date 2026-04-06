export interface Chunk {
  index: number;
  text: string;
  estimatedTokens: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

/**
 * Split transcript into chunks of roughly `maxTokens` each.
 * Splits on sentence boundaries to avoid cutting mid-thought.
 */
export function chunkTranscript(
  transcript: string,
  maxTokens = 1500,
): Chunk[] {
  const sentences = transcript.match(/[^.!?]*[.!?]+[\s]*/g) ?? [transcript];

  const chunks: Chunk[] = [];
  let buffer = "";
  let bufferTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (bufferTokens + sentenceTokens > maxTokens && buffer.length > 0) {
      chunks.push({
        index: chunks.length,
        text: buffer.trim(),
        estimatedTokens: bufferTokens,
      });
      buffer = "";
      bufferTokens = 0;
    }

    buffer += sentence;
    bufferTokens += sentenceTokens;
  }

  if (buffer.trim().length > 0) {
    chunks.push({
      index: chunks.length,
      text: buffer.trim(),
      estimatedTokens: bufferTokens,
    });
  }

  return chunks;
}
