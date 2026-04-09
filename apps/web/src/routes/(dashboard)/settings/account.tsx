import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { AlertTriangleIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { client, server } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/settings/account")({
  component: AccountPage,
  head: () => ({
    meta: [{ title: "Account — imeetly" }],
  }),
});

const dashboardRoute = getRouteApi("/(dashboard)");

function AccountPage() {
  const session = dashboardRoute.useLoaderData();
  const { isLoading: impactLoading } = useQuery(
    client.account.getDeletionImpact.queryOptions(),
  );
  const { data: planData, isLoading: planLoading } = useQuery(
    client.billing.getPlan.queryOptions(),
  );

  if (!session) return null;

  if (impactLoading || planLoading) {
    return <AccountSkeleton />;
  }

  const { user } = session;

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

      <AccountOverview plan={planData?.plan} user={user} />
      <Separator />
      <DeleteAccountSection user={user} />
    </div>
  );
}

function AccountSkeleton() {
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
      <Skeleton className="h-48 rounded-4xl" />
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-72 rounded-4xl" />
    </div>
  );
}

function AccountOverview({
  user,
  plan,
}: {
  user: { id: string; name: string; email: string };
  plan?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
        <CardDescription>Your account details and current plan</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span>{user.name}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span>{user.email}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Plan</span>
          <Badge variant="secondary">{plan ?? "free"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteAccountSection({
  user,
}: {
  user: { id: string; name: string; email: string };
}) {
  const { data: impact, isLoading: loadingImpact } = useQuery(
    client.account.getDeletionImpact.queryOptions(),
  );

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangleIcon className="size-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loadingImpact ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : (
          impact && (
            <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium">Deleting your account will remove:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>
                  {impact.meetingCount} meeting
                  {impact.meetingCount !== 1 && "s"} and all associated
                  summaries, decisions, and action items
                </li>
                {impact.activeFileCount > 0 && (
                  <li>
                    {impact.activeFileCount} uploaded file
                    {impact.activeFileCount !== 1 && "s"} still in storage
                  </li>
                )}
                {impact.hasActiveSubscription && (
                  <li>
                    Your active{" "}
                    <span className="font-medium text-foreground">
                      {impact.plan}
                    </span>{" "}
                    subscription will be canceled
                  </li>
                )}
                <li>Your account profile, sessions, and login credentials</li>
                <li>All usage history and billing records</li>
              </ul>
            </div>
          )
        )}

        <DeleteAccountDialog email={user.email} />
      </CardContent>
    </Card>
  );
}

function DeleteAccountDialog({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmText === email;

  async function handleDelete() {
    if (!isConfirmed) return;

    setDeleting(true);
    try {
      await server.account.deleteAccount({
        confirmationText: confirmText,
      });

      toast.success("Your account has been deleted.");

      // Redirect to login — session is already invalidated
      window.location.href = "/login";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete account";
      toast.error(message);
      setDeleting(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setConfirmText("");
          setDeleting(false);
        }
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button variant="destructive">
            <TrashIcon className="size-4" />
            Delete Account
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. Your account, all
            meetings, summaries, action items, and uploaded files will be
            permanently deleted. Any active subscription will be canceled.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="confirm-email">
            Type{" "}
            <span className="font-mono font-semibold text-destructive">
              {email}
            </span>{" "}
            to confirm
          </Label>
          <Input
            autoComplete="off"
            disabled={deleting}
            id="confirm-email"
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={email}
            value={confirmText}
          />
        </div>

        <DialogFooter>
          <Button
            disabled={deleting}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!isConfirmed || deleting}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleting ? (
              <>
                <LoaderCircleIcon className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Permanently Delete Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
