import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { integrations } from "@repo/db/schemas/app";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { env } from "../env";

function getKey(): Buffer {
  const secret =
    env.INTEGRATION_ENCRYPTION_KEY ?? "imeetly-dev:integration-tokens";
  return createHash("sha256").update(secret).digest();
}

function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");
  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

async function refreshGoogle(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Google token refresh failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

async function refreshZoom(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date; newRefreshToken?: string }> {
  const creds = Buffer.from(
    `${env.ZOOM_CLIENT_ID ?? ""}:${env.ZOOM_CLIENT_SECRET ?? ""}`,
  ).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    { method: "POST", headers: { Authorization: `Basic ${creds}` } },
  );
  if (!res.ok) {
    throw new Error(
      `Zoom token refresh failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    newRefreshToken: data.refresh_token,
  };
}

async function refreshMicrosoft(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date; newRefreshToken?: string }> {
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: env.MICROSOFT_CLIENT_ID ?? "",
        client_secret: env.MICROSOFT_CLIENT_SECRET ?? "",
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Microsoft token refresh failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    newRefreshToken: data.refresh_token,
  };
}

export async function getWorkerAccessToken(
  integrationId: string,
): Promise<string> {
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
    throw new Error(`Integration not found or inactive: ${integrationId}`);

  if (row.expiresAt && row.expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return decrypt(row.accessTokenEncrypted);
  }

  if (!row.refreshTokenEncrypted)
    throw new Error(`No refresh token for integration: ${integrationId}`);

  const refreshToken = decrypt(row.refreshTokenEncrypted);
  let result: {
    accessToken: string;
    expiresAt: Date;
    newRefreshToken?: string;
  };

  switch (row.provider) {
    case "google":
      result = await refreshGoogle(refreshToken);
      break;
    case "zoom":
      result = await refreshZoom(refreshToken);
      break;
    case "microsoft":
      result = await refreshMicrosoft(refreshToken);
      break;
    default:
      throw new Error(`Unknown provider: ${row.provider}`);
  }

  await db
    .update(integrations)
    .set({
      accessTokenEncrypted: encrypt(result.accessToken),
      expiresAt: result.expiresAt,
      ...(result.newRefreshToken
        ? { refreshTokenEncrypted: encrypt(result.newRefreshToken) }
        : {}),
    })
    .where(eq(integrations.id, integrationId));

  return result.accessToken;
}
