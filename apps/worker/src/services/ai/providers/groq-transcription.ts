import Groq from "groq-sdk";
import type { TranscriptionProviderImpl } from "../types";

export function createGroqTranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new Groq({ apiKey });

  return {
    name: "groq",
    async transcribe(fileBytes, fileName, mimeType) {
      const file = new File([new Uint8Array(fileBytes)], fileName, {
        type: mimeType,
      });
      const result = await client.audio.transcriptions.create({
        model: "whisper-large-v3-turbo",
        file,
        response_format: "text",
      });

      return result.text;
    },
  };
}
