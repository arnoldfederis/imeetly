import { randomUUID } from "node:crypto";
import { db } from "@repo/db";
import { integrations, integrationWatchChannels } from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { and, eq, lt } from "drizzle-orm";
import { OAuthService } from "./oauth.service";
import { GoogleIntegrationProvider } from "./providers/google";

export class WatchService {
  static async registerGoogleWatch(integrationId: string): Promise<void> {
    if (!env.GOOGLE_WEBHOOK_SECRET) {
      console.warn(
        "[watch] GOOGLE_WEBHOOK_SECRET not set — skipping calendar watch registration",
      );
      return;
    }

    const accessToken = await OAuthService.getAccessToken(integrationId);
    if (!accessToken) {
      throw new Error("No access token for integration");
    }

    // Stop any existing channel for this integration
    await WatchService._stopExistingGoogleChannel(integrationId, accessToken);

    const channelId = randomUUID();
    const webhookUrl = `${env.SERVER_URL}/webhooks/integrations/google`;
    const { resourceId, expiresAt } =
      await GoogleIntegrationProvider.registerCalendarWatch(
        accessToken,
        channelId,
        webhookUrl,
        env.GOOGLE_WEBHOOK_SECRET,
      );

    await db.insert(integrationWatchChannels).values({
      integrationId,
      provider: "google",
      channelId,
      resourceId,
      expiresAt,
    });

    console.log(
      `[watch] Registered Google calendar watch for integration=${integrationId} expires=${expiresAt.toISOString()}`,
    );
  }

  static async stopGoogleWatch(integrationId: string): Promise<void> {
    const [row] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    if (!row) return;

    try {
      const accessToken = await OAuthService.getAccessToken(integrationId);
      await WatchService._stopExistingGoogleChannel(integrationId, accessToken);
    } catch {
      // Best-effort — channel expires naturally after 7 days
      await db
        .delete(integrationWatchChannels)
        .where(
          and(
            eq(integrationWatchChannels.integrationId, integrationId),
            eq(integrationWatchChannels.provider, "google"),
          ),
        );
    }
  }

  static async renewExpiringGoogleChannels(): Promise<void> {
    const renewBefore = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now
    const expiring = await db
      .select()
      .from(integrationWatchChannels)
      .where(
        and(
          eq(integrationWatchChannels.provider, "google"),
          lt(integrationWatchChannels.expiresAt, renewBefore),
        ),
      );

    for (const channel of expiring) {
      try {
        await WatchService.registerGoogleWatch(channel.integrationId);
        console.log(
          `[watch] Renewed channel for integration=${channel.integrationId}`,
        );
      } catch (err) {
        console.error(
          `[watch] Failed to renew channel for integration=${channel.integrationId}:`,
          err,
        );
      }
    }
  }

  private static async _stopExistingGoogleChannel(
    integrationId: string,
    accessToken: string,
  ): Promise<void> {
    const [existing] = await db
      .select()
      .from(integrationWatchChannels)
      .where(
        and(
          eq(integrationWatchChannels.integrationId, integrationId),
          eq(integrationWatchChannels.provider, "google"),
        ),
      )
      .limit(1);

    if (!existing) return;

    try {
      await GoogleIntegrationProvider.stopCalendarWatch(
        accessToken,
        existing.channelId,
        existing.resourceId,
      );
    } catch {
      // Ignore — channel may already be expired
    }

    await db
      .delete(integrationWatchChannels)
      .where(eq(integrationWatchChannels.id, existing.id));
  }
}
