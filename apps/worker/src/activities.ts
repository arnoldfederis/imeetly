import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { render } from "@react-email/components";
import {
  actionItems,
  meetingFiles,
  meetingSummaries,
  meetings,
} from "@repo/db/schemas/app";
import { users } from "@repo/db/schemas/auth";
import { ApplicationFailure } from "@temporalio/activity";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "./db";
import { MeetingReadyEmail } from "./emails/meeting-ready";
import { env } from "./env";
import { extractMeetingData } from "./services/ai/extraction";
import { transcribeMeeting } from "./services/ai/transcription";
import {
  type ExtractionResult,
  ProviderError,
  type TranscriptionResult,
} from "./services/ai/types";

// --- Types ---

export interface MeetingInput {
  meetingId: string;
  userId: string;
  sourceType: "text" | "audio" | "video";
  transcriptText?: string | null;
  storageKey?: string | null;
  bucketName?: string | null;
  language?: string | null;
}

export interface ProcessingResult {
  transcript: string;
  summary: string;
  decisions: string;
  blockers: string;
  followups: string;
  actionItems: Array<{ title: string; ownerName?: string }>;
  transcriptionProvider?: string;
  extractionProvider?: string;
  extractionModel?: string;
}

// --- DB activities ---

export async function updateMeetingStatus(
  meetingId: string,
  status: string,
  processingStatus: string,
  failureReason: string | null,
): Promise<void> {
  await db
    .update(meetings)
    .set({ status, processingStatus, failureReason })
    .where(eq(meetings.id, meetingId));

  console.log(
    `[${meetingId}] Status: ${status}, Processing: ${processingStatus}${failureReason ? `, Reason: ${failureReason}` : ""}`,
  );
}

export async function loadMeetingInput(
  meetingId: string,
): Promise<MeetingInput> {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: { files: true },
  });

  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }

  const file = meeting.files?.[0];

  return {
    meetingId: meeting.id,
    userId: meeting.userId,
    sourceType: meeting.sourceType as "text" | "audio" | "video",
    transcriptText: meeting.transcriptText,
    storageKey: file?.storageKey ?? null,
    bucketName: file?.bucketName ?? null,
    language: meeting.language ?? null,
  };
}

// --- AI activities (thin wrappers around provider layer) ---

export async function extractAudioFromVideo(
  storageKey: string,
): Promise<string> {
  // For MVP, pass video directly - Whisper handles common video formats
  console.log(
    `[extractAudio] Passing video through for transcription: ${storageKey}`,
  );
  return storageKey;
}

export async function transcribeAudio(
  audioKey: string,
  language?: string | null,
): Promise<TranscriptionResult> {
  try {
    return await transcribeMeeting(audioKey, language ?? undefined);
  } catch (err) {
    if (err instanceof ProviderError) {
      // Deterministic failures: same audio will produce the same result on retry.
      // Mark non-retryable so Temporal does not waste attempts.
      if (err.code === "EMPTY_TRANSCRIPT" || err.code === "MISSING_API_KEY") {
        throw ApplicationFailure.nonRetryable(err.message, err.code);
      }
    }
    // Infra/network errors stay retryable (default Temporal behaviour).
    throw err;
  }
}

export async function generateExtractionResult(
  transcript: string,
): Promise<ExtractionResult> {
  return extractMeetingData(transcript);
}

// Cloudflare R2 - worker downloads raw files for processing, then deletes them.
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

// --- Persistence ---

export async function saveProcessingResults(
  meetingId: string,
  userId: string,
  results: ProcessingResult,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(meetings)
      .set({ transcriptText: results.transcript })
      .where(eq(meetings.id, meetingId));

    const existing = await tx.query.meetingSummaries.findFirst({
      where: eq(meetingSummaries.meetingId, meetingId),
    });

    const summaryData = {
      summaryMd: results.summary,
      decisionsMd: results.decisions,
      blockersMd: results.blockers,
      followupsMd: results.followups,
      modelName: results.extractionModel ?? "unknown",
    };

    if (existing) {
      await tx
        .update(meetingSummaries)
        .set(summaryData)
        .where(eq(meetingSummaries.meetingId, meetingId));
    } else {
      await tx.insert(meetingSummaries).values({ meetingId, ...summaryData });
    }

    if (results.actionItems.length > 0) {
      await tx.insert(actionItems).values(
        results.actionItems.map((item) => ({
          meetingId,
          userId,
          title: item.title,
          ownerName: item.ownerName ?? null,
        })),
      );
    }
  });

  console.log(
    `[${meetingId}] Saved results (${results.actionItems.length} action items, extraction: ${results.extractionProvider ?? "unknown"}, transcription: ${results.transcriptionProvider ?? "n/a"})`,
  );
}

// --- Notifications ---

export async function notifyMeetingReady(meetingId: string): Promise<void> {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    columns: { id: true, title: true, userId: true },
    with: {
      actionItems: { columns: { status: true } },
    },
  });
  if (!meeting) return;

  const user = await db.query.users.findFirst({
    where: eq(users.id, meeting.userId),
    columns: { email: true, name: true },
  });
  if (!user?.email) return;

  const appUrl = env.APP_URL ?? "https://app.imeetly.app";
  const meetingUrl = `${appUrl}/meetings/${meeting.id}`;
  const subject = `Your meeting notes are ready: ${meeting.title}`;
  const openItemCount =
    meeting.actionItems?.filter((i) => i.status !== "done").length ?? 0;
  const html = await render(
    MeetingReadyEmail({
      userName: user.name ?? null,
      meetingTitle: meeting.title,
      meetingUrl,
      openItemCount,
    }),
  );

  try {
    if (env.APP_ENV !== "production") {
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST ?? "localhost",
        port: Number(env.SMTP_PORT ?? 1025),
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
        tls: { rejectUnauthorized: false },
      });
      await transport.sendMail({
        from: "imeetly <notifications@imeetly.app>",
        to: user.email,
        subject,
        html,
      });
    } else {
      if (!env.RESEND_API_KEY) return;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "imeetly <notifications@imeetly.app>",
          to: [user.email],
          subject,
          html,
        }),
      });
    }
    console.log(`[${meetingId}] Meeting ready email sent to ${user.email}`);
  } catch (err) {
    console.warn(
      `[${meetingId}] Failed to send meeting ready email:`,
      err instanceof Error ? err.message : err,
    );
  }
}

// --- Cleanup ---

export async function deleteSourceFile(meetingId: string): Promise<void> {
  const files = await db.query.meetingFiles.findMany({
    where: eq(meetingFiles.meetingId, meetingId),
  });

  for (const file of files) {
    if (file.retentionStatus === "deleted") continue;

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: file.bucketName,
          Key: file.storageKey,
        }),
      );

      await db
        .update(meetingFiles)
        .set({
          retentionStatus: "deleted",
          deletedAt: new Date(),
        })
        .where(eq(meetingFiles.id, file.id));

      console.log(`[${meetingId}] Deleted source file: ${file.storageKey}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[${meetingId}] Failed to delete source file ${file.storageKey}: ${msg}`,
      );
      // Mark as pending_deletion so a cleanup job can retry later
      await db
        .update(meetingFiles)
        .set({ retentionStatus: "pending_deletion" })
        .where(eq(meetingFiles.id, file.id));
    }
  }
}
