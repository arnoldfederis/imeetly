import { DeepgramClient } from "@deepgram/sdk";
import { ProviderError, type TranscriptionProviderImpl } from "../types";

export function createDeepgramTranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new DeepgramClient({ apiKey });

  return {
    name: "deepgram",
    async transcribe(fileBytes, fileName, mimeType, language) {
      console.log(
        `[deepgram] Transcribing ${fileName} (${mimeType}, ${fileBytes.length} bytes)${language ? ` lang=${language}` : ""}`,
      );

      const response = await client.listen.v1.media.transcribeFile(
        Buffer.from(fileBytes),
        {
          model: "nova-3",
          smart_format: true,
          ...(language ? { language } : {}),
        },
      );

      if (!("results" in response)) {
        throw new ProviderError(
          "PROVIDER_REQUEST_FAILED",
          "Deepgram returned unexpected response format",
          "deepgram",
        );
      }

      const raw =
        response.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
      const transcript = raw.trim();

      const duration = (response.metadata as { duration?: number })?.duration;
      console.log(
        `[deepgram] Received ${transcript.length} chars${duration != null ? `, audio duration: ${duration}s` : ""}`,
      );

      if (!transcript) {
        throw new ProviderError(
          "EMPTY_TRANSCRIPT",
          "Deepgram returned empty transcript",
          "deepgram",
        );
      }

      return transcript;
    },
  };
}
