import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";

function getKey(): Buffer {
  const secret =
    process.env.INTEGRATION_ENCRYPTION_KEY ??
    `${
      process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "imeetly-dev"
    }:integration-tokens`;
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plaintext: string): string {
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

export function decrypt(ciphertext: string): string {
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

export function signState(payload: Record<string, unknown>): string {
  const key = getKey();
  const data = JSON.stringify(payload);
  const sig = createHmac("sha256", key).update(data).digest("hex");
  return `${Buffer.from(data).toString("base64url")}.${sig}`;
}

export function verifyState(state: string): Record<string, unknown> {
  const key = getKey();
  const dotIdx = state.lastIndexOf(".");
  if (dotIdx === -1) throw new Error("Invalid state format");
  const dataB64 = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);
  const data = Buffer.from(dataB64, "base64url").toString("utf8");
  const expected = createHmac("sha256", key).update(data).digest("hex");
  if (sig.length !== expected.length)
    throw new Error("Invalid state signature");
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) throw new Error("Invalid state signature");
  return JSON.parse(data) as Record<string, unknown>;
}
