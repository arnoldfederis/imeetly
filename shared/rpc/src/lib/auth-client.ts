import { passkeyClient } from "@better-auth/passkey/client";
import { polarClient } from "@polar-sh/better-auth";
import { env } from "@shared/rpc/env";
import {
  adminClient,
  magicLinkClient,
  organizationClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_BASE_URL,
  plugins: [
    adminClient(),
    magicLinkClient(),
    organizationClient(),
    passkeyClient(),
    polarClient(),
    twoFactorClient(),
    usernameClient(),
  ],
});
