import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@repo/db";
import { externalMeetings, meetingFiles, meetings } from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { s3 } from "@repo/server/lib/s3";
import { startMeetingProcessing } from "@repo/server/lib/temporal";
import { eq } from "drizzle-orm";
import { OAuthService } from "./oauth.service";
import { getProvider } from "./resolver";
import type { IntegrationProviderType } from "./types";

interface IngestionInput {
  userId: string;
  integrationId: string;
  externalMeetingDbId: string;
  provider: IntegrationProviderType;
  externalMeetingId: string;
  title: string;
  startsAt: Date | null;
  externalMeetingMetadata?: Record<string, unknown>;
  // Zoom-specific: passed through to getRecording for UUID encoding + fallback
  zoomMeetingId?: string;
  endsAt?: Date | null;
}

export class MeetingRecordingIngestionService {
  static async ingest(input: IngestionInput): Promise<{ meetingId: string }> {
    const {
      userId,
      integrationId,
      externalMeetingDbId,
      provider,
      externalMeetingId,
      title,
      startsAt,
      externalMeetingMetadata,
    } = input;

    const accessToken = await OAuthService.getAccessToken(integrationId);
    const providerImpl = getProvider(provider);

    const recording = await providerImpl.getRecording(
      accessToken,
      externalMeetingId,
      provider === "zoom"
        ? {
            meetingId: input.zoomMeetingId,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? null,
          }
        : undefined,
    );
    if (!recording) {
      await db
        .update(externalMeetings)
        .set({ status: "no_recording" })
        .where(eq(externalMeetings.id, externalMeetingDbId));
      throw new Error("No recording available for this meeting");
    }

    await db
      .update(externalMeetings)
      .set({ status: "processing", recordingUrl: recording.downloadUrl })
      .where(eq(externalMeetings.id, externalMeetingDbId));

    // Download recording server-to-server
    const downloadRes = await fetch(recording.downloadUrl, {
      headers: recording.downloadHeaders,
    });
    if (!downloadRes.ok) {
      throw new Error(`Failed to download recording: ${downloadRes.status}`);
    }
    // TODO: Use streaming multipart upload for recordings larger than ~500MB
    const fileBuffer = Buffer.from(await downloadRes.arrayBuffer());

    // Create imeetly meeting record
    const [meeting] = await db
      .insert(meetings)
      .values({
        userId,
        title,
        meetingDate: startsAt ?? new Date(),
        provider,
        sourceType: recording.mimeType.startsWith("audio") ? "audio" : "video",
        status: "pending",
      })
      .returning({ id: meetings.id });

    if (!meeting) {
      throw new Error("Failed to create meeting record");
    }

    const meetingId = meeting.id;

    // Upload to R2
    const storageKey = `${meetingId}/recording${recording.mimeType === "audio/mp4" ? ".m4a" : ".mp4"}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: recording.mimeType,
      }),
    );

    const [, fileName = storageKey] = storageKey.split("/");

    // Track file
    await db.insert(meetingFiles).values({
      meetingId,
      bucketName: env.S3_BUCKET,
      storageKey,
      fileName,
      mimeType: recording.mimeType,
      fileSize: recording.sizeBytes ?? fileBuffer.byteLength,
      durationSeconds: recording.durationSeconds,
      uploadStatus: "completed",
      processingStatus: "queued",
    });

    // Reuse existing Temporal pipeline
    await startMeetingProcessing(meetingId);

    // Link back to the external meeting
    await db
      .update(externalMeetings)
      .set({
        status: "processing",
        metadata: {
          ...externalMeetingMetadata,
          imeetlyMeetingId: meetingId,
        },
      })
      .where(eq(externalMeetings.id, externalMeetingDbId));

    return { meetingId };
  }
}
