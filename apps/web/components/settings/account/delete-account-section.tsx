"use client";

import type { RouterOutputs } from "@repo/server/types";
import { AlertTriangleIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";
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
import { server } from "@/lib/orpc";

interface Props {
  user: RouterOutputs["user"]["me"];
  impact: RouterOutputs["account"]["getDeletionImpact"];
}

export function DeleteAccountSection({ user, impact }: Props) {
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
        {impact && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium">Deleting your account will remove:</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                {impact.meetingCount} meeting
                {impact.meetingCount !== 1 && "s"} and all associated summaries,
                decisions, and action items
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
