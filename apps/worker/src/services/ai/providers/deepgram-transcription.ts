import { DeepgramClient } from "@deepgram/sdk";
import { ProviderError, type TranscriptionProviderImpl } from "../types";

const DEEPGRAM_OPTIONS = {
  model: "nova-3",
  smart_format: true,
  mip_opt_out: true,
} as const;

function parseDeepgramResponse(response: unknown, label: string): string {
  if (!response || typeof response !== "object" || !("results" in response)) {
    throw new ProviderError(
      "PROVIDER_REQUEST_FAILED",
      "Deepgram returned unexpected response format",
      "deepgram",
    );
  }

  const res = response as {
    results?: {
      channels?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
    };
    metadata?: { duration?: number };
  };

  const raw = res.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  const transcript = raw.trim();
  const duration = res.metadata?.duration;
  console.log(
    `[deepgram] ${label}: ${transcript.length} chars${duration != null ? `, audio duration: ${duration}s` : ""}`,
  );

  if (!transcript) {
    throw new ProviderError(
      "EMPTY_TRANSCRIPT",
      "Deepgram returned empty transcript",
      "deepgram",
    );
  }

  return transcript;
}

export function createDeepgramTranscription(
  apiKey: string,
): TranscriptionProviderImpl {
  const client = new DeepgramClient({ apiKey });

  return {
    name: "deepgram",
    async transcribeFromStream(
      stream,
      fileName,
      mimeType,
      contentLength,
      language,
    ) {
      console.log(
        `[deepgram] Stream mode — piping R2 stream directly to Deepgram${contentLength != null ? ` (${Math.round(contentLength / 1024 / 1024)} MB)` : ""}${language ? ` lang=${language}` : ""}`,
      );
      const t0 = Date.now();
      const uploadable = {
        data: stream,
        filename: fileName,
        contentType: mimeType,
        ...(contentLength != null ? { contentLength } : {}),
      };
      const response = await client.listen.v1.media.transcribeFile(
        uploadable,
        {
          ...DEEPGRAM_OPTIONS,
          ...(language ? { language } : {}),
        } as Parameters<typeof client.listen.v1.media.transcribeFile>[1],
        { timeoutInSeconds: 7200, maxRetries: 0 },
      );
      console.log(
        `[deepgram] Stream transcription API call took ${Date.now() - t0}ms`,
      );
      return parseDeepgramResponse(response, "Stream transcription done");
    },
    async transcribe(fileBytes, fileName, mimeType, language) {
      console.log(
        `[deepgram] Transcribing ${fileName} (${mimeType}, ${fileBytes.length} bytes)${language ? ` lang=${language}` : ""}`,
      );

      const response = await client.listen.v1.media.transcribeFile(
        Buffer.from(fileBytes),
        {
          ...DEEPGRAM_OPTIONS,
          ...(language ? { language } : {}),
        } as Parameters<typeof client.listen.v1.media.transcribeFile>[1],
      );
      return parseDeepgramResponse(response, "File transcription done");
    },
  };
}
