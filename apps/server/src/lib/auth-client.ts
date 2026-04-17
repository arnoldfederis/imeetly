import { passkeyClient } from "@better-auth/passkey/client";
import { polarClient } from "@polar-sh/better-auth";
import { env } from "@repo/env";
import type { auth } from "@repo/server/lib/auth";
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
  magicLinkClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_SERVER_URL,
  plugins: [
    adminClient(),
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(),
    magicLinkClient(),
    organizationClient(),
    passkeyClient(),
    polarClient(),
    usernameClient(),
  ],
});
