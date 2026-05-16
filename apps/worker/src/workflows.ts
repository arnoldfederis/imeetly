import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const { downloadIntegrationRecordingIfNeeded } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "3 hours",
  retry: {
    maximumAttempts: 2,
    initialInterval: "5 seconds",
    backoffCoefficient: 2,
  },
});

const {
  loadMeetingInput,
  updateMeetingStatus,
  extractAudioFromVideo,
  transcribeAudio,
  generateExtractionResult,
  saveProcessingResults,
  deleteSourceFile,
  notifyMeetingReady,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  retry: {
    maximumAttempts: 3,
    initialInterval: "5 seconds",
    backoffCoefficient: 2,
  },
});

const {
  sendActionItemReminders: sendActionItemRemindersJob,
  sendOverdueActionItemDigests: sendOverdueActionItemDigestsJob,
  sendWeeklyActionItemRecaps: sendWeeklyActionItemRecapsJob,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
  retry: {
    maximumAttempts: 3,
    initialInterval: "10 seconds",
    backoffCoefficient: 2,
  },
});

export async function processMeeting(meetingId: string): Promise<void> {
  try {
    await updateMeetingStatus(meetingId, "processing", "queued", null);

    // Download integration recording to S3 before processing (no-op for manual uploads)
    await updateMeetingStatus(
      meetingId,
      "processing",
      "downloading_recording",
      null,
    );
    await downloadIntegrationRecordingIfNeeded(meetingId);

    const input = await loadMeetingInput(meetingId);
    let transcript = input.transcriptText || "";
    let transcriptionProvider: string | undefined;

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
      const result = await transcribeAudio(input.storageKey, input.language);
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
    await notifyMeetingReady(meetingId);

    // Clean up raw source file after successful processing
    try {
      await deleteSourceFile(meetingId);
    } catch (cleanupErr) {
      // Do not fail the meeting if cleanup fails - log only
      console.warn(
        `[${meetingId}] Source file cleanup failed:`,
        cleanupErr instanceof Error ? cleanupErr.message : cleanupErr,
      );
    }
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "An unexpected error occurred";
    await updateMeetingStatus(meetingId, "failed", "failed", reason);
    throw err;
  }
}

export async function sendActionItemReminderBatch(): Promise<void> {
  await sendActionItemRemindersJob();
}

export async function sendOverdueActionItemDigestBatch(): Promise<void> {
  await sendOverdueActionItemDigestsJob();
}

export async function sendWeeklyActionItemRecapBatch(): Promise<void> {
  await sendWeeklyActionItemRecapsJob();
}
