import { createClient } from "@deepgram/sdk";
import type { TranscriptionProviderImpl } from "../types";

export function createDeepgramTranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = createClient(apiKey);

  return {
    name: "deepgram",
    async transcribe(fileBytes, fileName, mimeType) {
      const { result } = await client.listen.prerecorded.transcribeFile(
        Buffer.from(fileBytes),
        {
          model: "nova-3",
          smart_format: true,
          mime_type: mimeType,
        },
      );

      const transcript =
        result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

      if (!transcript) {
        throw new Error("Deepgram returned empty transcript");
      }

      return transcript;
    },
  };
}
