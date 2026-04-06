import { DeepgramClient } from "@deepgram/sdk";
import type { TranscriptionProviderImpl } from "../types";

export function createDeepgramTranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new DeepgramClient({ apiKey });

  return {
    name: "deepgram",
    async transcribe(fileBytes, _fileName, _mimeType) {
      const response = await client.listen.v1.media.transcribeFile(
        Buffer.from(fileBytes),
        {
          model: "nova-3",
          smart_format: true,
        },
      );

      if (!("results" in response)) {
        throw new Error("Deepgram returned unexpected response");
      }

      const transcript =
        response.results?.channels?.[0]?.alternatives?.[0]?.transcript;

      if (!transcript) {
        throw new Error("Deepgram returned empty transcript");
      }

      return transcript;
    },
  };
}
