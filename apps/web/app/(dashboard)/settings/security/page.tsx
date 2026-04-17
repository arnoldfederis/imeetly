import type { Metadata } from "next";
export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

import { ConnectedAccountsCard } from "@/components/settings/security/connected-account-card";
import { SecurityContainer } from "@/components/settings/security/container";
import { PasskeysCard } from "@/components/settings/security/passkey-card";
import { server } from "@/lib/orpc";

export default async function Page() {
  const [accounts, passkeys] = await Promise.all([
    server.user.listUserAccounts(),
    server.user.listPasskeys(),
  ]);

  return (
    <SecurityContainer>
      <div className="flex flex-col gap-6">
        <div className="flex h-14 items-center gap-3">
          <div className="flex min-w-0 flex-col justify-between gap-1">
            <h1 className="font-semibold text-2xl tracking-tight">Security</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account security and authentication methods
            </p>
          </div>
        </div>

        {accounts.some((a) => a.providerId === "google") && (
          <ConnectedAccountsCard accounts={accounts} />
        )}
        <PasskeysCard passkeys={passkeys} />
      </div>
    </SecurityContainer>
  );
}
