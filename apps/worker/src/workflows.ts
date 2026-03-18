import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const {
  loadMeetingInput,
  updateMeetingStatus,
  extractAudioFromVideo,
  transcribeAudio,
  generateExtractionResult,
  saveProcessingResults,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  retry: {
    maximumAttempts: 3,
    initialInterval: "5 seconds",
    backoffCoefficient: 2,
  },
});

export async function processMeeting(meetingId: string): Promise<void> {
  await updateMeetingStatus(meetingId, "processing", "queued", null);
  const input = await loadMeetingInput(meetingId);

  let transcript = input.transcriptText || "";
  let transcriptionProvider: string | undefined;

  try {
    // --- Transcription phase ---
    if (input.sourceType === "video" && input.storageKey) {
      await updateMeetingStatus(
        meetingId,
        "processing",
        "extracting_audio",
        null,
      );
      input.storageKey = await extractAudioFromVideo(input.storageKey);
    }

    if (
      (input.sourceType === "audio" || input.sourceType === "video") &&
      input.storageKey
    ) {
      await updateMeetingStatus(meetingId, "processing", "transcribing", null);
      const result = await transcribeAudio(input.storageKey);
      transcript = result.text;
      transcriptionProvider = result.provider;
    }

    if (!transcript) {
      await updateMeetingStatus(
        meetingId,
        "failed",
        "failed",
        "No transcript available. Provide a transcript or upload a media file.",
      );
      return;
    }

    // --- Extraction phase ---
    await updateMeetingStatus(meetingId, "processing", "summarizing", null);
    const extraction = await generateExtractionResult(transcript);

    await updateMeetingStatus(
      meetingId,
      "processing",
      "extracting_actions",
      null,
    );

    // --- Save ---
    await saveProcessingResults(meetingId, input.userId, {
      transcript,
      summary: extraction.summary,
      decisions: extraction.decisions,
      blockers: extraction.blockers,
      followups: extraction.followups,
      actionItems: extraction.actionItems,
      transcriptionProvider,
      extractionProvider: extraction.provider,
      extractionModel: extraction.model,
    });

    await updateMeetingStatus(meetingId, "completed", "completed", null);
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "An unexpected error occurred";
    await updateMeetingStatus(meetingId, "failed", "failed", reason);
    throw err;
  }
}
