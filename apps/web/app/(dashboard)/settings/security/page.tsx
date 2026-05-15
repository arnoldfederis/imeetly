import type { Metadata } from "next";
export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

import { ConnectedAccountsCard } from "@/components/settings/security/connected-account-card";
import { SecurityContainer } from "@/components/settings/security/container";
import { PasskeysCard } from "@/components/settings/security/passkey-card";
import { PasswordCard } from "@/components/settings/security/password-card";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export default async function Page() {
  const [accounts, passkeys, user] = await Promise.all([
    requireAuth(() => server.user.listUserAccounts()),
    requireAuth(() => server.user.listPasskeys()),
    requireAuth(() => server.user.me()),
  ]);
  const hasCredential = accounts.some(
    (account) => account.providerId === "credential",
  );

  return (
    <SecurityContainer email={user.email}>
      <div className="flex flex-col gap-6">
        <div className="flex h-14 items-center gap-3">
          <div className="flex min-w-0 flex-col justify-between gap-1">
            <h1 className="font-semibold text-2xl tracking-tight">Security</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account security and authentication methods
            </p>
          </div>
        </div>

        <ConnectedAccountsCard accounts={accounts} />
        <PasswordCard email={user.email} hasCredential={hasCredential} />
        <PasskeysCard passkeys={passkeys} />
      </div>
    </SecurityContainer>
  );
}
