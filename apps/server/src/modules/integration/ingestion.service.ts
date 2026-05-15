import { db } from "@repo/db";
import { externalMeetings, meetings } from "@repo/db/schemas/app";
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

    // Create meeting record immediately — no download here
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

    if (!meeting) throw new Error("Failed to create meeting record");
    const meetingId = meeting.id;

    // Store download info so the Temporal activity can fetch and upload
    await db
      .update(externalMeetings)
      .set({
        status: "processing",
        recordingUrl: recording.downloadUrl,
        metadata: {
          ...externalMeetingMetadata,
          imeetlyMeetingId: meetingId,
          pendingDownload: {
            integrationId,
            provider,
            downloadUrl: recording.downloadUrl,
            mimeType: recording.mimeType,
            sizeBytes: recording.sizeBytes ?? null,
            durationSeconds: recording.durationSeconds ?? null,
          },
        },
      })
      .where(eq(externalMeetings.id, externalMeetingDbId));

    await startMeetingProcessing(meetingId);

    return { meetingId };
  }
}
