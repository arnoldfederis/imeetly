import { createHmac } from "node:crypto";
import { db } from "@repo/db";
import {
  externalMeetings,
  integrationWatchChannels,
  integrationWebhookEvents,
} from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { and, eq, gt, lte } from "drizzle-orm";
import { MeetingRecordingIngestionService } from "./ingestion.service";
import { OAuthService } from "./oauth.service";
import { GoogleIntegrationProvider } from "./providers/google";
import { getProvider } from "./resolver";
import type { IntegrationProviderType } from "./types";

export async function handleWebhook(
  provider: IntegrationProviderType,
  rawBody: string,
  headers: Record<string, string>,
): Promise<{ ok: boolean; message?: string; responseBody?: unknown }> {
  const providerImpl = getProvider(provider);

  if (!providerImpl.verifyWebhook(rawBody, headers)) {
    return { ok: false, message: "Invalid webhook signature" };
  }

  let parsedBody: Record<string, unknown>;
  try {
    parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "Failed to parse webhook payload" };
  }

  if (provider === "zoom" && parsedBody.event === "endpoint.url_validation") {
    const secret = env.ZOOM_WEBHOOK_SECRET_TOKEN;
    if (!secret) {
      return { ok: false, message: "Zoom webhook secret is not configured" };
    }

    const plainToken =
      typeof parsedBody.payload === "object" &&
      parsedBody.payload !== null &&
      typeof (parsedBody.payload as Record<string, unknown>).plainToken ===
        "string"
        ? ((parsedBody.payload as Record<string, unknown>).plainToken as string)
        : null;

    if (!plainToken) {
      return { ok: false, message: "Missing Zoom plainToken" };
    }

    return {
      ok: true,
      responseBody: {
        plainToken,
        encryptedToken: createHmac("sha256", secret)
          .update(plainToken)
          .digest("hex"),
      },
    };
  }

  let parsed: {
    eventType: string;
    externalEventId: string | null;
    data: Record<string, unknown>;
  };
  try {
    parsed = await providerImpl.handleWebhook(parsedBody, headers);
  } catch {
    return { ok: false, message: "Failed to handle webhook payload" };
  }

  // Idempotency check
  if (parsed.externalEventId) {
    const [existing] = await db
      .select({ id: integrationWebhookEvents.id })
      .from(integrationWebhookEvents)
      .where(
        and(
          eq(integrationWebhookEvents.provider, provider),
          eq(integrationWebhookEvents.externalEventId, parsed.externalEventId),
        ),
      )
      .limit(1);

    if (existing) {
      return { ok: true, message: "Duplicate event ignored" };
    }
  }

  const [event] = await db
    .insert(integrationWebhookEvents)
    .values({
      provider,
      eventType: parsed.eventType,
      externalEventId: parsed.externalEventId,
      payload: parsed.data,
      status: "pending",
    })
    .returning();

  if (!event) {
    return { ok: false, message: "Failed to store event" };
  }

  try {
    await processEvent(provider, parsed.eventType, parsed.data);
    await db
      .update(integrationWebhookEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(integrationWebhookEvents.id, event.id));
  } catch (err) {
    await db
      .update(integrationWebhookEvents)
      .set({ status: "failed", errorMessage: String(err) })
      .where(eq(integrationWebhookEvents.id, event.id));
    console.error("[integration] Webhook processing error:", err);
  }

  return { ok: true };
}

async function processEvent(
  provider: IntegrationProviderType,
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (provider === "zoom" && eventType === "recording.completed") {
    await handleZoomRecordingCompleted(data);
  }
  if (provider === "google" && eventType === "calendar.push") {
    await handleGoogleCalendarPush(data);
  }
  // TODO: Microsoft Graph change notifications
}

async function handleZoomRecordingCompleted(
  data: Record<string, unknown>,
): Promise<void> {
  const obj = data.object as Record<string, unknown> | undefined;
  const uuid = obj?.uuid as string | undefined;
  const meetingId = obj?.id != null ? String(obj.id) : undefined;

  console.log("[zoom] recording.completed received", {
    uuid,
    meetingId,
    eventType: "recording.completed",
  });

  if (!uuid) return;

  // Look up by uuid first, then fallback to numeric meeting id
  let extMeeting = await db
    .select({
      id: externalMeetings.id,
      userId: externalMeetings.userId,
      integrationId: externalMeetings.integrationId,
      title: externalMeetings.title,
      startsAt: externalMeetings.startsAt,
      endsAt: externalMeetings.endsAt,
      status: externalMeetings.status,
      metadata: externalMeetings.metadata,
    })
    .from(externalMeetings)
    .where(
      and(
        eq(externalMeetings.provider, "zoom"),
        eq(externalMeetings.externalMeetingId, uuid),
      ),
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!extMeeting && meetingId) {
    extMeeting = await db
      .select({
        id: externalMeetings.id,
        userId: externalMeetings.userId,
        integrationId: externalMeetings.integrationId,
        title: externalMeetings.title,
        startsAt: externalMeetings.startsAt,
        endsAt: externalMeetings.endsAt,
        status: externalMeetings.status,
        metadata: externalMeetings.metadata,
      })
      .from(externalMeetings)
      .where(
        and(
          eq(externalMeetings.provider, "zoom"),
          eq(externalMeetings.externalMeetingId, meetingId),
        ),
      )
      .limit(1)
      .then((r) => r[0] ?? null);
  }

  if (!extMeeting) {
    console.log("[zoom] recording.completed for unknown meeting", {
      uuid,
      meetingId,
    });
    return;
  }

  if (extMeeting.status === "processing" || extMeeting.status === "completed") {
    return;
  }

  const storedMeetingId = (
    extMeeting.metadata as Record<string, unknown> | null
  )?.meetingId as string | undefined;

  await MeetingRecordingIngestionService.ingest({
    userId: extMeeting.userId,
    integrationId: extMeeting.integrationId,
    externalMeetingDbId: extMeeting.id,
    provider: "zoom",
    externalMeetingId: uuid,
    title: extMeeting.title,
    startsAt: extMeeting.startsAt,
    endsAt: extMeeting.endsAt,
    zoomMeetingId: storedMeetingId ?? meetingId,
    externalMeetingMetadata: {
      meetingId: storedMeetingId ?? meetingId,
      startsAt: extMeeting.startsAt?.toISOString() ?? null,
      endsAt: extMeeting.endsAt?.toISOString() ?? null,
    },
  });
}

async function handleGoogleCalendarPush(
  data: Record<string, unknown>,
): Promise<void> {
  const channelId = data.channelId as string | null;
  const resourceState = data.resourceState as string | null;

  if (!channelId || resourceState === "sync") return;

  const [channel] = await db
    .select({ integrationId: integrationWatchChannels.integrationId })
    .from(integrationWatchChannels)
    .where(eq(integrationWatchChannels.channelId, channelId))
    .limit(1);

  if (!channel) {
    console.log(`[integration] Google push for unknown channel=${channelId}`);
    return;
  }

  const { integrationId } = channel;

  // Check meetings that ended in last 24h and haven't been ingested
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pending = await db
    .select()
    .from(externalMeetings)
    .where(
      and(
        eq(externalMeetings.integrationId, integrationId),
        eq(externalMeetings.provider, "google"),
        gt(externalMeetings.endsAt, since),
        lte(externalMeetings.endsAt, new Date()),
      ),
    );

  const eligible = pending.filter(
    (m) => m.status !== "processing" && m.status !== "completed",
  );

  if (eligible.length === 0) return;

  const accessToken = await OAuthService.getAccessToken(integrationId);
  if (!accessToken) return;

  const googleProvider = new GoogleIntegrationProvider();

  for (const meeting of eligible) {
    try {
      const lookup = await googleProvider.getRecording(
        accessToken,
        meeting.externalMeetingId,
      );
      if (!lookup) continue;

      await MeetingRecordingIngestionService.ingest({
        userId: meeting.userId,
        integrationId,
        externalMeetingDbId: meeting.id,
        provider: "google",
        externalMeetingId: meeting.externalMeetingId,
        title: meeting.title,
        startsAt: meeting.startsAt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Recording not ready yet — mark for background retry
      const retryMeta = (meeting.metadata as Record<string, unknown>)
        .pushRetry as { attempts: number } | undefined;
      const attempts = (retryMeta?.attempts ?? 0) + 1;
      const nextCheckAt = new Date(
        Date.now() + Math.min(attempts * 5, 30) * 60 * 1000,
      ).toISOString();
      await db
        .update(externalMeetings)
        .set({
          status: "recording_available",
          metadata: {
            ...(meeting.metadata as Record<string, unknown>),
            pushRetry: { attempts, nextCheckAt, lastError: msg },
          },
        })
        .where(eq(externalMeetings.id, meeting.id));
    }
  }
}

export async function retryPendingGoogleRecordings(): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const pending = await db
    .select()
    .from(externalMeetings)
    .where(
      and(
        eq(externalMeetings.provider, "google"),
        eq(externalMeetings.status, "recording_available"),
        gt(externalMeetings.updatedAt, cutoff),
      ),
    );

  const googleProvider = new GoogleIntegrationProvider();

  for (const meeting of pending) {
    const retryMeta = (meeting.metadata as Record<string, unknown>).pushRetry as
      | { attempts: number; nextCheckAt: string }
      | undefined;

    if (!retryMeta) continue;
    if (new Date(retryMeta.nextCheckAt) > now) continue;
    if (retryMeta.attempts >= 12) continue; // give up after ~2h

    const accessToken = await OAuthService.getAccessToken(
      meeting.integrationId,
    );
    if (!accessToken) continue;

    try {
      const lookup = await googleProvider.getRecording(
        accessToken,
        meeting.externalMeetingId,
      );
      if (!lookup) throw new Error("Recording not ready");

      await MeetingRecordingIngestionService.ingest({
        userId: meeting.userId,
        integrationId: meeting.integrationId,
        externalMeetingDbId: meeting.id,
        provider: "google",
        externalMeetingId: meeting.externalMeetingId,
        title: meeting.title,
        startsAt: meeting.startsAt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const attempts = retryMeta.attempts + 1;
      const nextCheckAt = new Date(
        now.getTime() + Math.min(attempts * 5, 30) * 60 * 1000,
      ).toISOString();
      await db
        .update(externalMeetings)
        .set({
          metadata: {
            ...(meeting.metadata as Record<string, unknown>),
            pushRetry: { attempts, nextCheckAt, lastError: msg },
          },
        })
        .where(eq(externalMeetings.id, meeting.id));
    }
  }
}
