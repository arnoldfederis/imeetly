import type { Metadata } from "next";
export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

import { AccountOverview } from "@/components/settings/account/account-overview";
import { DeleteAccountSection } from "@/components/settings/account/delete-account-section";
import { Separator } from "@/components/ui/separator";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export default async function Page() {
  const [user, planData, impact] = await requireAuth(() =>
    Promise.all([
      server.user.me(),
      server.billing.getPlan(),
      server.account.getDeletionImpact(),
    ]),
  );

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Account</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account and data
          </p>
        </div>
      </div>

      <AccountOverview plan={planData.plan} user={user} />
      <Separator />
      <DeleteAccountSection impact={impact} user={user} />
    </div>
  );
}
