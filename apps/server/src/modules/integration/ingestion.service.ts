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

  static async ingestFromDriveFile(input: {
    userId: string;
    integrationId: string;
    externalMeetingDbId: string;
    driveFileId: string;
    title: string;
    startsAt: Date | null;
    externalMeetingMetadata?: Record<string, unknown>;
  }): Promise<{ meetingId: string }> {
    const {
      userId,
      integrationId,
      externalMeetingDbId,
      driveFileId,
      title,
      startsAt,
      externalMeetingMetadata,
    } = input;

    const accessToken = await OAuthService.getAccessToken(integrationId);
    const encodedDriveFileId = encodeURIComponent(driveFileId);

    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodedDriveFileId}?fields=id,name,size,mimeType,videoMediaMetadata`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!metaRes.ok) {
      throw new Error(`Drive metadata fetch failed: ${metaRes.status}`);
    }
    const fileMeta = (await metaRes.json()) as {
      id: string;
      name: string;
      size?: string;
      mimeType?: string;
      videoMediaMetadata?: { durationMillis?: string };
    };

    const mimeType = fileMeta.mimeType ?? "application/octet-stream";
    if (!(mimeType.startsWith("audio/") || mimeType.startsWith("video/"))) {
      throw new Error("Selected Drive file must be an audio or video file");
    }

    const parsedSize = fileMeta.size ? Number(fileMeta.size) : Number.NaN;
    const sizeBytes = Number.isFinite(parsedSize) ? parsedSize : null;
    const parsedDurationMillis = fileMeta.videoMediaMetadata?.durationMillis
      ? Number(fileMeta.videoMediaMetadata.durationMillis)
      : Number.NaN;
    const durationSeconds = Number.isFinite(parsedDurationMillis)
      ? Math.round(parsedDurationMillis / 1000)
      : null;

    await db
      .update(externalMeetings)
      .set({ status: "processing" })
      .where(eq(externalMeetings.id, externalMeetingDbId));

    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodedDriveFileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!downloadRes.ok) {
      throw new Error(`Drive download failed: ${downloadRes.status}`);
    }
    const fileBuffer = Buffer.from(await downloadRes.arrayBuffer());

    const [meeting] = await db
      .insert(meetings)
      .values({
        userId,
        title,
        meetingDate: startsAt ?? new Date(),
        provider: "google",
        sourceType: mimeType.startsWith("audio") ? "audio" : "video",
        status: "pending",
      })
      .returning({ id: meetings.id });

    if (!meeting) {
      throw new Error("Failed to create meeting record");
    }

    const meetingId = meeting.id;
    const ext =
      mimeType === "audio/mp4" || mimeType === "audio/x-m4a"
        ? ".m4a"
        : mimeType === "audio/mpeg"
          ? ".mp3"
          : mimeType === "video/webm"
            ? ".webm"
            : ".mp4";
    const storageKey = `${meetingId}/recording${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: mimeType,
      }),
    );

    const [, fileName = storageKey] = storageKey.split("/");

    await db.insert(meetingFiles).values({
      meetingId,
      bucketName: env.S3_BUCKET,
      storageKey,
      fileName,
      mimeType,
      fileSize: sizeBytes ?? fileBuffer.byteLength,
      durationSeconds,
      uploadStatus: "completed",
      processingStatus: "queued",
    });

    await startMeetingProcessing(meetingId);

    await db
      .update(externalMeetings)
      .set({
        status: "processing",
        metadata: {
          ...externalMeetingMetadata,
          imeetlyMeetingId: meetingId,
          selectedDriveFile: {
            id: fileMeta.id,
            name: fileMeta.name,
            mimeType,
          },
        },
      })
      .where(eq(externalMeetings.id, externalMeetingDbId));

    return { meetingId };
  }
}
