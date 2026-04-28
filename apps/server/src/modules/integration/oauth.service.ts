import { db } from "@repo/db";
import { integrations } from "@repo/db/schemas/app";
import { env } from "@repo/env";
import { and, eq } from "drizzle-orm";
import { decrypt, encrypt, verifyState } from "./encrypt";
import { getProvider } from "./resolver";
import type { IntegrationProviderType, OAuthTokens } from "./types";

export class OAuthService {
  static getRedirectUri(provider: IntegrationProviderType): string {
    if (provider === "zoom") {
      return `${env.APP_BASE_URL}/integrations/${provider}/callback`;
    }

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
    return { userId, integrationId };
  }

  static async getAccessToken(integrationId: string): Promise<string> {
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

    if (!row) throw new Error("Integration not found or disconnected");

    // Refresh if within 5 minutes of expiry
    if (row.expiresAt && row.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      return OAuthService._refreshAccessToken(
        integrationId,
        row.refreshTokenEncrypted,
      );
    }

    return decrypt(row.accessTokenEncrypted);
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
    integrationId: string,
    refreshTokenEncrypted: string | null,
  ): Promise<string> {
    const [row] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    if (!row) throw new Error("Integration not found");
    if (!refreshTokenEncrypted) throw new Error("No refresh token stored");

    const provider = getProvider(row.provider as IntegrationProviderType);
    const refreshToken = decrypt(refreshTokenEncrypted);
    const tokens = await provider.refreshToken(refreshToken);

    await db
      .update(integrations)
      .set({
        accessTokenEncrypted: encrypt(tokens.accessToken),
        ...(tokens.refreshToken
          ? { refreshTokenEncrypted: encrypt(tokens.refreshToken) }
          : {}),
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        status: "active",
      })
      .where(eq(integrations.id, integrationId));

    return tokens.accessToken;
  }

  private static async _upsertIntegration(
    userId: string,
    provider: IntegrationProviderType,
    accountId: string,
    tokens: OAuthTokens,
  ): Promise<string> {
    const [existing] = await db
      .select({ id: integrations.id })
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
      await db
        .update(integrations)
        .set({
          accessTokenEncrypted: encrypt(tokens.accessToken),
          ...(tokens.refreshToken
            ? { refreshTokenEncrypted: encrypt(tokens.refreshToken) }
            : {}),
          expiresAt: tokens.expiresAt,
          scopes: tokens.scopes,
          status: "active",
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
}
