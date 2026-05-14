"use client";

import { env } from "@repo/env";
import { authClient } from "@repo/server/lib/auth-client";
import type { RouterOutputs } from "@repo/server/types";
import { LoaderCircleIcon, PlusIcon, UnlinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  accounts: RouterOutputs["user"]["listUserAccounts"];
}

export function ConnectedAccountsCard({ accounts }: Props) {
  const router = useRouter();
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function handleUnlink(providerId: string) {
    setUnlinking(providerId);
    try {
      await authClient.unlinkAccount({ providerId });
      toast.success("Account disconnected.");
      router.refresh();
    } catch {
      toast.error("Failed to disconnect account.");
    } finally {
      setUnlinking(null);
    }
  }

  async function handleLinkGoogle() {
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: `${env.NEXT_PUBLIC_APP_BASE_URL}/settings/security`,
        errorCallbackURL: `${env.NEXT_PUBLIC_APP_BASE_URL}/settings/security?error=account_not_linked`,
      });
    } catch {
      toast.error("Failed to connect Google account.");
    }
  }

  const googleAccount = accounts.find((a) => a.providerId === "google");
  const hasCredential = accounts.some((a) => a.providerId === "credential");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Manage social accounts linked to your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border">
              <svg className="size-5" viewBox="0 0 24 24">
                <title>Google Icon</title>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Google</p>
              <p className="text-muted-foreground text-xs">
                {googleAccount ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {googleAccount ? (
            <Button
              disabled={
                unlinking === "google" ||
                (!hasCredential && accounts.length === 1)
              }
              onClick={() => handleUnlink("google")}
              size="sm"
              variant="secondary"
            >
              {unlinking === "google" ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <UnlinkIcon data-icon="inline-start" />
              )}
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleLinkGoogle} size="sm" variant="secondary">
              <PlusIcon data-icon="inline-start" />
              Connect
            </Button>
          )}
        </div>
        {googleAccount && !hasCredential && accounts.length === 1 && (
          <p className="text-muted-foreground text-xs">
            You can't disconnect your only sign-in method.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
