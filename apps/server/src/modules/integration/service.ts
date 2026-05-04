import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import { externalMeetings, integrations } from "@repo/db/schemas/app";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { MeetingRecordingIngestionService } from "./ingestion.service";
import { OAuthService } from "./oauth.service";
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
      .select({ id: integrations.id })
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

  static async getGoogleAccessToken(
    userId: string,
    integrationId: string,
  ): Promise<{ accessToken: string }> {
    const [integration] = await db
      .select({
        id: integrations.id,
        provider: integrations.provider,
        status: integrations.status,
      })
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

    const accessToken = await OAuthService.getAccessToken(integrationId);
    return { accessToken };
  }

  static async importDriveFile(
    userId: string,
    externalMeetingDbId: string,
    driveFileId: string,
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

    if (!extMeeting) {
      throw new ORPCError("NOT_FOUND", {
        message: "External meeting not found",
      });
    }
    if (extMeeting.provider !== "google") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Drive import is only supported for Google Meet",
      });
    }

    if (
      extMeeting.status === "processing" ||
      extMeeting.status === "completed"
    ) {
      const meta = extMeeting.metadata as Record<string, unknown>;
      if (typeof meta.imeetlyMeetingId === "string") {
        return { meetingId: meta.imeetlyMeetingId };
      }
    }

    return MeetingRecordingIngestionService.ingestFromDriveFile({
      userId,
      integrationId: extMeeting.integrationId,
      externalMeetingDbId,
      driveFileId,
      title: extMeeting.title,
      startsAt: extMeeting.startsAt,
      externalMeetingMetadata: asMetadata(extMeeting.metadata),
    });
  }
}

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
