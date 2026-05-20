import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import {
  externalMeetings,
  integrations,
  meetingFiles,
  meetings,
} from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { resolveR2Bucket } from "@repo/server/lib/s3";
import { startMeetingProcessing } from "@repo/server/lib/temporal";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { MeetingRecordingIngestionService } from "./ingestion.service";
import { OAuthService } from "./oauth.service";
import {
  GOOGLE_MEET_RECORDING_SCOPES,
  GoogleIntegrationProvider,
} from "./providers/google";
import { getProvider } from "./resolver";
import type { IntegrationProviderType } from "./types";

export class IntegrationService {
  static async list(userId: string) {
    return db
      .select({
        id: integrations.id,
        provider: integrations.provider,
        providerAccountId: integrations.providerAccountId,
        status: integrations.status,
        scopes: integrations.scopes,
        expiresAt: integrations.expiresAt,
        createdAt: integrations.createdAt,
      })
      .from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(desc(integrations.createdAt));
  }

  static async getConnectUrl(
    userId: string,
    provider: IntegrationProviderType,
  ): Promise<string> {
    return OAuthService.getAuthorizationUrl(userId, provider);
  }

  static async disconnect(
    userId: string,
    integrationId: string,
  ): Promise<void> {
    const [row] = await db
      .select({ id: integrations.id, provider: integrations.provider })
      .from(integrations)
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, userId),
        ),
      )
      .limit(1);

    if (!row)
      throw new ORPCError("NOT_FOUND", { message: "Integration not found" });

    if (row.provider === "google") {
      const { WatchService } = await import("./watch.service");
      await WatchService.stopGoogleWatch(integrationId).catch(() => {});
    }

    await OAuthService.revokeIntegration(userId, integrationId);
  }

  static async listExternalMeetings(
    userId: string,
    integrationId: string,
    options?: {
      limit?: number;
      offset?: number;
      search?: string;
      status?: string;
    },
  ) {
    const [integration] = await db
      .select({ id: integrations.id })
      .from(integrations)
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, userId),
        ),
      )
      .limit(1);

    if (!integration) {
      throw new ORPCError("NOT_FOUND", { message: "Integration not found" });
    }

    const conditions = [eq(externalMeetings.integrationId, integrationId)];

    if (options?.status) {
      conditions.push(eq(externalMeetings.status, options.status));
    }

    if (options?.search) {
      const pattern = `%${options.search}%`;
      const searchCondition = or(
        ilike(externalMeetings.title, pattern),
        ilike(externalMeetings.externalMeetingId, pattern),
        ilike(externalMeetings.joinUrl, pattern),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(externalMeetings)
        .where(where)
        .orderBy(desc(externalMeetings.startsAt))
        .limit(options?.limit ?? 20)
        .offset(options?.offset ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(externalMeetings)
        .where(where),
    ]);

    return { items, total: count };
  }

  static async syncMeetings(
    userId: string,
    integrationId: string,
  ): Promise<{ imported: number }> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, userId),
        ),
      )
      .limit(1);

    if (!integration) {
      throw new ORPCError("NOT_FOUND", { message: "Integration not found" });
    }

    if (integration.status !== "active") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Integration is not active",
      });
    }

    const accessToken = await OAuthService.getAccessToken(integrationId);
    const provider = getProvider(
      integration.provider as IntegrationProviderType,
    );
    const { meetings: fetched } = await provider.listMeetings(accessToken);

    let imported = 0;
    for (const meeting of fetched) {
      const [existing] = await db
        .select({ id: externalMeetings.id })
        .from(externalMeetings)
        .where(
          and(
            eq(externalMeetings.integrationId, integrationId),
            eq(externalMeetings.provider, integration.provider),
            eq(externalMeetings.externalMeetingId, meeting.externalMeetingId),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(externalMeetings).values({
          userId,
          integrationId,
          provider: integration.provider,
          externalMeetingId: meeting.externalMeetingId,
          title: meeting.title,
          startsAt: meeting.startsAt,
          endsAt: meeting.endsAt,
          joinUrl: meeting.joinUrl,
          recordingUrl: meeting.recordingUrl,
          status: meeting.status,
          metadata: meeting.metadata,
        });
        imported++;
      }
    }

    return { imported };
  }

  static async importRecording(
    userId: string,
    externalMeetingDbId: string,
  ): Promise<{ meetingId: string }> {
    const [extMeeting] = await db
      .select()
      .from(externalMeetings)
      .where(
        and(
          eq(externalMeetings.id, externalMeetingDbId),
          eq(externalMeetings.userId, userId),
        ),
      )
      .limit(1);

    if (!extMeeting)
      throw new ORPCError("NOT_FOUND", {
        message: "External meeting not found",
      });

    // Return existing imeetly meeting if already ingested
    if (
      extMeeting.status === "processing" ||
      extMeeting.status === "completed"
    ) {
      const meta = extMeeting.metadata as Record<string, unknown>;
      if (typeof meta.imeetlyMeetingId === "string") {
        return { meetingId: meta.imeetlyMeetingId };
      }
    }

    // DEV BYPASS: skip Google Drive download for local verification testing
    if (externalMeetingDbId === "0f2fe368-a5e2-4fe1-8f1f-9de2487c1945") {
      const TEST_STORAGE_KEY = "imeetly-verification-testing.mp4";

      const [meeting] = await db
        .insert(meetings)
        .values({
          userId,
          title: extMeeting.title,
          meetingDate: extMeeting.startsAt ?? new Date(),
          provider: "google",
          sourceType: "video",
          status: "pending",
        })
        .returning({ id: meetings.id });
      if (!meeting) throw new Error("Failed to create test meeting");
      const meetingId = meeting.id;

      await db.insert(meetingFiles).values({
        meetingId,
        bucketName: resolveR2Bucket(),
        storageKey: TEST_STORAGE_KEY,
        fileName: TEST_STORAGE_KEY,
        mimeType: "video/mp4",
        fileSize: 1,
        uploadStatus: "completed",
        processingStatus: "queued",
      });

      await db
        .update(externalMeetings)
        .set({
          status: "processing",
          metadata: {
            ...((extMeeting.metadata as Record<string, unknown>) ?? {}),
            imeetlyMeetingId: meetingId,
          },
        })
        .where(eq(externalMeetings.id, externalMeetingDbId));

      await startMeetingProcessing(meetingId);
      return { meetingId };
    }

    return MeetingRecordingIngestionService.ingest({
      userId,
      integrationId: extMeeting.integrationId,
      externalMeetingDbId,
      provider: extMeeting.provider as IntegrationProviderType,
      externalMeetingId: extMeeting.externalMeetingId,
      title: extMeeting.title,
      startsAt: extMeeting.startsAt,
      externalMeetingMetadata: asMetadata(extMeeting.metadata),
    });
  }

  static async checkGoogleMeetRecording(
    userId: string,
    integrationId: string,
    externalMeetingDbId: string,
  ) {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, userId),
        ),
      )
      .limit(1);

    if (!integration || integration.provider !== "google") {
      throw new ORPCError("NOT_FOUND", {
        message: "Google integration not found",
      });
    }
    if (integration.status !== "active") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Integration is not active",
      });
    }

    const [extMeeting] = await db
      .select()
      .from(externalMeetings)
      .where(
        and(
          eq(externalMeetings.id, externalMeetingDbId),
          eq(externalMeetings.userId, userId),
          eq(externalMeetings.integrationId, integrationId),
        ),
      )
      .limit(1);

    if (!extMeeting) {
      throw new ORPCError("NOT_FOUND", {
        message: "External meeting not found",
      });
    }

    const token = await OAuthService.getAccessTokenDetails(integrationId);
    const missingScopes = GOOGLE_MEET_RECORDING_SCOPES.filter(
      (scope) => !token.scopes.includes(scope),
    );

    console.info("[integration:google-meet-recording]", {
      event: missingScopes.length > 0 ? "scope_missing" : "lookup_start",
      expiresAt: token.expiresAt?.toISOString() ?? null,
      hasAccessToken: Boolean(token.accessToken),
      missingScopes,
      provider: token.provider,
      scopes: token.scopes,
      userId: token.userId,
    });

    if (missingScopes.length > 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: "google_meet_recording_scope_missing",
      });
    }

    const provider = getProvider("google");
    if (!(provider instanceof GoogleIntegrationProvider)) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Google provider is unavailable",
      });
    }

    try {
      return await provider.findMeetRecording(
        token.accessToken,
        extMeeting.externalMeetingId,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to check Google Meet recording";
      if (message.includes("does not have access")) {
        throw new ORPCError("FORBIDDEN", { message });
      }
      throw error;
    }
  }
}

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
