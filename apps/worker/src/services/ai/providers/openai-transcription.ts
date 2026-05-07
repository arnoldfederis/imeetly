import OpenAI from "openai";
import { ProviderError, type TranscriptionProviderImpl } from "../types";

export function createOpenAITranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    async transcribe(fileBytes, fileName, mimeType, language) {
      console.log(
        `[openai] Transcribing ${fileName} (${mimeType}, ${fileBytes.length} bytes)${language ? ` lang=${language}` : ""}`,
      );

      const file = new File([new Uint8Array(fileBytes)], fileName, {
        type: mimeType,
      });

      // response_format "text" returns the transcript as a plain string
      const result = await client.audio.transcriptions.create({
        model: "whisper-1",
        file,
        response_format: "text",
        ...(language ? { language } : {}),
      });

      const transcript = (result as unknown as string).trim();
      console.log(`[openai] Received ${transcript.length} chars`);

      if (!transcript) {
        throw new ProviderError(
          "EMPTY_TRANSCRIPT",
          "OpenAI returned empty transcript",
          "openai",
        );
      }

      return transcript;
    },
  };
}
