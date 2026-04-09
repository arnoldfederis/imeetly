import { clientEnv } from "@repo/env";
import { authClient } from "@repo/server/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  KeyIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
  UnlinkIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/(dashboard)/settings/security")({
  component: SecurityPage,
  head: () => ({
    meta: [{ title: "Security — imeetly" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    error: (search.error as string | undefined) ?? undefined,
  }),
});

function SecurityPage() {
  const { error } = Route.useSearch();
  const navigate = useNavigate();
  const shownRef = useRef(false);

  const {
    data: accounts,
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["auth", "accounts"],
    queryFn: async () => {
      const res = await authClient.listAccounts();
      return res.data ?? [];
    },
  });

  const {
    data: passkeys,
    isLoading: passkeysLoading,
    refetch: refetchPasskeys,
  } = useQuery({
    queryKey: ["auth", "passkeys"],
    queryFn: async () => {
      const res = await authClient.passkey.listUserPasskeys();
      return res.data ?? [];
    },
  });

  useEffect(() => {
    if (!error || shownRef.current) return;
    shownRef.current = true;

    if (error === "account_not_linked") {
      toast.error(
        "Email mismatch: the Google account email doesn't match your account email.",
      );
    } else {
      toast.error("Failed to connect Google account.");
    }

    navigate({
      to: "/settings/security",
      search: { error: undefined },
      replace: true,
    });
  }, [error, navigate]);

  if (accountsLoading || passkeysLoading) {
    return <SecuritySkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Security</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account security and authentication methods
          </p>
        </div>
      </div>

      {accounts?.some((a) => a.providerId === "google") && (
        <ConnectedAccountsCard
          accounts={accounts ?? []}
          refetch={refetchAccounts}
        />
      )}
      <PasskeysCard passkeys={passkeys ?? []} refetch={refetchPasskeys} />
    </div>
  );
}

function SecuritySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Security</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account security and authentication methods
          </p>
        </div>
      </div>
      <Skeleton className="h-36 rounded-4xl" />
      <Skeleton className="h-56 rounded-4xl" />
    </div>
  );
}

type Account = {
  scopes: string[];
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  providerId: string;
  accountId: string;
};

type Passkey = Awaited<
  ReturnType<typeof authClient.passkey.listUserPasskeys>
>["data"][number];

function ConnectedAccountsCard({
  accounts,
  refetch,
}: {
  accounts: Account[];
  refetch: () => void;
}) {
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function handleUnlink(providerId: string) {
    setUnlinking(providerId);
    try {
      await authClient.unlinkAccount({ providerId });
      toast.success("Account disconnected.");
      refetch();
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
        callbackURL: `${clientEnv.VITE_APP_BASE_URL}/settings/security`,
        errorCallbackURL: `${clientEnv.VITE_APP_BASE_URL}/settings/security?error=account_not_linked`,
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
              variant="outline"
            >
              {unlinking === "google" ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <UnlinkIcon data-icon="inline-start" />
              )}
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleLinkGoogle} size="sm" variant="outline">
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

function PasskeysCard({
  passkeys,
  refetch,
}: {
  passkeys: Passkey[];
  refetch: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDeletePasskey(id: string) {
    setDeleting(id);
    try {
      await authClient.passkey.deletePasskey({ id });
      toast.success("Passkey removed.");
      refetch();
    } catch {
      toast.error("Failed to remove passkey.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Use biometrics or security keys for passwordless sign-in
              </CardDescription>
            </div>
            <Button
              className="shrink-0 self-start"
              onClick={() => setDialogOpen(true)}
              size="sm"
            >
              <PlusIcon data-icon="inline-start" />
              Add Passkey
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {passkeys.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <KeyRoundIcon className="size-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No passkeys registered yet. Add one for passwordless sign-in.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {passkeys.map((passkey) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
                  key={passkey.id}
                >
                  <div className="flex items-center gap-3">
                    <KeyIcon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {passkey.name || "Passkey"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Added {new Date(passkey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    disabled={deleting === passkey.id}
                    onClick={() => handleDeletePasskey(passkey.id)}
                    size="sm"
                    variant="outline"
                  >
                    {deleting === passkey.id ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPasskeyDialog
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
        open={dialogOpen}
      />
    </>
  );
}

function AddPasskeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name for your passkey.");
      return;
    }

    setSaving(true);
    try {
      const res = await authClient.passkey.addPasskey({
        name: name.trim(),
      });

      if (res?.error) {
        throw new Error(String(res.error.message));
      }

      toast.success("Passkey added successfully.");
      onSuccess();
      onOpenChange(false);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!saving) {
          onOpenChange(isOpen);
          if (!isOpen) {
            setTimeout(() => setName(""), 200);
          }
        }
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Passkey</DialogTitle>
          <DialogDescription>
            Give your passkey a name so you can identify it later.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="passkey-name">Name</Label>
            <Input
              autoFocus
              id="passkey-name"
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "MacBook Pro", "iPhone"'
              value={name}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button disabled={saving || !name.trim()} type="submit">
              {saving ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                "Register Passkey"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
