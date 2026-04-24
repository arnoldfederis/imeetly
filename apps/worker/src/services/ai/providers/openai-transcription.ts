import OpenAI from "openai";
import type { TranscriptionProviderImpl } from "../types";

export function createOpenAITranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    async transcribe(fileBytes, fileName, mimeType, language) {
      const file = new File([new Uint8Array(fileBytes)], fileName, {
        type: mimeType,
      });
      return client.audio.transcriptions.create({
        model: "whisper-1",
        file,
        response_format: "text",
        ...(language ? { language } : {}),
      });
    },
  };
}
