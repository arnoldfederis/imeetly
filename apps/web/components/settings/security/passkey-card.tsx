"use client";

import { authClient } from "@repo/server/lib/auth-client";
import type { RouterOutputs } from "@repo/server/types";
import {
  KeyIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

interface Props {
  passkeys: RouterOutputs["user"]["listPasskeys"];
}

export function PasskeysCard({ passkeys }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDeletePasskey(id: string) {
    setDeleting(id);
    try {
      await authClient.passkey.deletePasskey({ id });
      toast.success("Passkey removed.");
      router.refresh();
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
              className="shrink-0 self-start max-sm:w-full"
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
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          className="size-10"
                          disabled={deleting === passkey.id}
                          variant="secondary"
                        >
                          {deleting === passkey.id ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <Trash2Icon className="size-4" />
                          )}
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete passkey?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove &ldquo;
                          {passkey.name || "this passkey"}&rdquo; from your
                          account. Also delete this passkey from your device or
                          password manager to keep things consistent. Any saved
                          copy on your device will no longer work after removal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting === passkey.id}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleting === passkey.id}
                          onClick={() => handleDeletePasskey(passkey.id)}
                        >
                          {deleting === passkey.id ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPasskeyDialog onOpenChange={setDialogOpen} open={dialogOpen} />
    </>
  );
}

function AddPasskeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
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
        toast.error(String(res.error.message));
        return;
      }

      toast.success("Passkey added successfully.");
      router.refresh();
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
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button
              className="max-sm:w-full"
              disabled={saving || !name.trim()}
              type="submit"
            >
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
