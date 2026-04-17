import type { Metadata } from "next";
export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

import { AvatarCard } from "@/components/settings/profile/avatar-card";
import { ProfileForm } from "@/components/settings/profile/form";
import { server } from "@/lib/orpc";

export default async function Page() {
  const user = await server.user.me();

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your personal information
          </p>
        </div>
      </div>

      <AvatarCard user={user} />
      <ProfileForm user={user} />
    </div>
  );
}
