import Groq from "groq-sdk";
import { ProviderError, type TranscriptionProviderImpl } from "../types";

export function createGroqTranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new Groq({ apiKey });

  return {
    name: "groq",
    async transcribe(fileBytes, fileName, mimeType, language) {
      console.log(
        `[groq] Transcribing ${fileName} (${mimeType}, ${fileBytes.length} bytes)${language ? ` lang=${language}` : ""}`,
      );

      const file = new File([new Uint8Array(fileBytes)], fileName, {
        type: mimeType,
      });

      // response_format "text" returns the transcript as a plain string via result.text
      const result = await client.audio.transcriptions.create({
        model: "whisper-large-v3-turbo",
        file,
        response_format: "text",
        ...(language ? { language } : {}),
      });

      const transcript = (result.text ?? "").trim();
      console.log(`[groq] Received ${transcript.length} chars`);

      if (!transcript) {
        throw new ProviderError(
          "EMPTY_TRANSCRIPT",
          "Groq returned empty transcript",
          "groq",
        );
      }

      return transcript;
    },
  };
}
