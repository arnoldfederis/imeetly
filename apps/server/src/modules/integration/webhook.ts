import { createHmac } from "node:crypto";
import { env } from "@repo/env";
import { db } from "@repo/db";
import { externalMeetings, integrationWebhookEvents, } from "@repo/db/schemas/app";
import { and, eq } from "drizzle-orm";
import { MeetingRecordingIngestionService } from "./ingestion.service";
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
    .returning({ id: integrationWebhookEvents.id });

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
  // TODO: Google calendar push notifications
  // TODO: Microsoft Graph change notifications
}

async function handleZoomRecordingCompleted(
  data: Record<string, unknown>,
): Promise<void> {
  const obj = data.object as Record<string, unknown> | undefined;
  const uuid = obj?.uuid as string | undefined;
  if (!uuid) return;

  const [extMeeting] = await db
    .select({
      id: externalMeetings.id,
      userId: externalMeetings.userId,
      integrationId: externalMeetings.integrationId,
      title: externalMeetings.title,
      startsAt: externalMeetings.startsAt,
      status: externalMeetings.status,
    })
    .from(externalMeetings)
    .where(
      and(
        eq(externalMeetings.provider, "zoom"),
        eq(externalMeetings.externalMeetingId, uuid),
      ),
    )
    .limit(1);

  if (!extMeeting) {
    console.log(
      `[integration] Zoom recording.completed for unknown uuid=${uuid}`,
    );
    return;
  }

  if (extMeeting.status === "processing" || extMeeting.status === "completed") {
    return;
  }

  await MeetingRecordingIngestionService.ingest({
    userId: extMeeting.userId,
    integrationId: extMeeting.integrationId,
    externalMeetingDbId: extMeeting.id,
    provider: "zoom",
    externalMeetingId: uuid,
    title: extMeeting.title,
    startsAt: extMeeting.startsAt,
  });
}
