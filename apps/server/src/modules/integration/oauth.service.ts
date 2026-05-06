import { db } from "@repo/db";
import { integrations } from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { and, eq } from "drizzle-orm";
import { decrypt, encrypt, verifyState } from "./encrypt";
import { getProvider } from "./resolver";
import type { IntegrationProviderType, OAuthTokens } from "./types";

type IntegrationRow = typeof integrations.$inferSelect;

type AccessTokenDetails = {
  accessToken: string;
  expiresAt: Date | null;
  integrationId: string;
  provider: string;
  scopes: string[];
  userId: string;
};

export class OAuthService {
  static getRedirectUri(provider: IntegrationProviderType): string {
    return `${env.SERVER_URL}/integrations/${provider}/callback`;
  }

  static async getAuthorizationUrl(
    userId: string,
    provider: IntegrationProviderType,
  ): Promise<string> {
    const p = getProvider(provider);
    const { url } = await p.getAuthorizationUrl(
      userId,
      OAuthService.getRedirectUri(provider),
    );
    return url;
  }

  static async handleCallback(
    provider: IntegrationProviderType,
    code: string,
    state: string,
  ): Promise<{ userId: string; integrationId: string }> {
    const stateData = verifyState(state);
    const userId = stateData.userId as string;
    const iat = stateData.iat as number;

    if (stateData.provider !== provider)
      throw new Error("State provider mismatch");
    if (Date.now() - iat > 10 * 60 * 1000)
      throw new Error("OAuth state expired");

    const p = getProvider(provider);
    const { tokens, accountId } = await p.exchangeCodeForTokens(
      code,
      OAuthService.getRedirectUri(provider),
    );

    const integrationId = await OAuthService._upsertIntegration(
      userId,
      provider,
      accountId,
      tokens,
    );

    if (provider === "google") {
      const { WatchService } = await import("./watch.service");
      WatchService.registerGoogleWatch(integrationId).catch((err) =>
        console.error(
          "[integration] Failed to register Google calendar watch:",
          err,
        ),
      );
    }

    return { userId, integrationId };
  }

  static async getAccessToken(integrationId: string): Promise<string> {
    try {
      const details = await OAuthService.getAccessTokenDetails(integrationId);
      return details.accessToken;
    } catch (error) {
      console.error("[integration:token] Failed to get access token", {
        integrationId,
        error: error instanceof Error ? error.message : String(error),
      });
      return "";
    }
  }

  static async getAccessTokenDetails(
    integrationId: string,
  ): Promise<AccessTokenDetails> {
    const [row] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.status, "active"),
        ),
      )
      .limit(1);

    if (!row)
      throw new Error("Integration not found, disconnected, or expired");

    OAuthService._logTokenState("loaded", row, {
      accessTokenExists: Boolean(row.accessTokenEncrypted),
      refreshTokenExists: Boolean(row.refreshTokenEncrypted),
    });

    // Refresh if within 5 minutes of expiry or already expired
    if (row.expiresAt && row.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      return await OAuthService._refreshAccessToken(row);
    }

    const accessToken = decrypt(row.accessTokenEncrypted);
    if (!accessToken.trim()) {
      OAuthService._logTokenState("empty_access_token", row, {
        accessTokenExists: false,
        refreshTokenExists: Boolean(row.refreshTokenEncrypted),
      });
      throw new Error("Provider access token is missing");
    }

    return {
      accessToken,
      expiresAt: row.expiresAt,
      integrationId: row.id,
      provider: row.provider,
      scopes: row.scopes,
      userId: row.userId,
    };
  }

  static async revokeIntegration(
    userId: string,
    integrationId: string,
  ): Promise<void> {
    await db
      .update(integrations)
      .set({ status: "disconnected" })
      .where(
        and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, userId),
        ),
      );
  }

  private static async _refreshAccessToken(
    row: IntegrationRow,
  ): Promise<AccessTokenDetails> {
    if (!row.refreshTokenEncrypted) {
      OAuthService._logTokenState("refresh_missing_token", row, {
        accessTokenExists: Boolean(row.accessTokenEncrypted),
        refreshTokenExists: false,
      });
      await db
        .update(integrations)
        .set({ status: "expired" })
        .where(eq(integrations.id, row.id));
      throw new Error("No refresh token stored");
    }

    const provider = getProvider(row.provider as IntegrationProviderType);
    const refreshToken = decrypt(row.refreshTokenEncrypted);

    OAuthService._logTokenState("refresh_start", row, {
      accessTokenExists: Boolean(row.accessTokenEncrypted),
      refreshTokenExists: true,
    });

    let tokens: OAuthTokens;
    try {
      tokens = await provider.refreshToken(refreshToken, {
        previousScopes: row.scopes,
      });
    } catch (error) {
      OAuthService._logTokenState("refresh_failed", row, {
        accessTokenExists: Boolean(row.accessTokenEncrypted),
        refreshTokenExists: true,
        error: error instanceof Error ? error.message : String(error),
      });
      await db
        .update(integrations)
        .set({ status: "expired" })
        .where(eq(integrations.id, row.id));
      throw error;
    }

    if (!tokens.accessToken.trim()) {
      OAuthService._logTokenState("refresh_empty_access_token", row, {
        accessTokenExists: false,
        refreshTokenExists: true,
      });
      throw new Error("Provider refresh returned an empty access token");
    }

    const scopes = tokens.scopes.length > 0 ? tokens.scopes : row.scopes;

    await db
      .update(integrations)
      .set({
        accessTokenEncrypted: encrypt(tokens.accessToken),
        ...(tokens.refreshToken
          ? { refreshTokenEncrypted: encrypt(tokens.refreshToken) }
          : {}),
        expiresAt: tokens.expiresAt,
        scopes,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, row.id));

    OAuthService._logTokenState("refresh_succeeded", row, {
      accessTokenExists: true,
      refreshTokenExists: Boolean(tokens.refreshToken),
      refreshedExpiresAt: tokens.expiresAt?.toISOString() ?? null,
      refreshedScopes: scopes,
    });

    return {
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      integrationId: row.id,
      provider: row.provider,
      scopes,
      userId: row.userId,
    };
  }

  private static async _upsertIntegration(
    userId: string,
    provider: IntegrationProviderType,
    accountId: string,
    tokens: OAuthTokens,
  ): Promise<string> {
    const [existing] = await db
      .select({ id: integrations.id, scopes: integrations.scopes })
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.provider, provider),
          eq(integrations.providerAccountId, accountId),
        ),
      )
      .limit(1);

    if (existing) {
      const scopes = tokens.scopes.length > 0 ? tokens.scopes : existing.scopes;
      await db
        .update(integrations)
        .set({
          accessTokenEncrypted: encrypt(tokens.accessToken),
          ...(tokens.refreshToken
            ? { refreshTokenEncrypted: encrypt(tokens.refreshToken) }
            : {}),
          expiresAt: tokens.expiresAt,
          scopes,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existing.id));
      return existing.id;
    }

    const [inserted] = await db
      .insert(integrations)
      .values({
        userId,
        provider,
        providerAccountId: accountId,
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        status: "active",
        metadata: {},
      })
      .returning({ id: integrations.id });

    if (!inserted) throw new Error("Failed to create integration record");
    return inserted.id;
  }

  private static _logTokenState(
    event: string,
    row: Pick<
      IntegrationRow,
      "expiresAt" | "id" | "provider" | "scopes" | "userId"
    >,
    extra: Record<string, unknown> = {},
  ) {
    console.info("[integration:token]", {
      event,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      integrationId: row.id,
      provider: row.provider,
      scopes: row.scopes,
      userId: row.userId,
      ...extra,
    });
  }
}
