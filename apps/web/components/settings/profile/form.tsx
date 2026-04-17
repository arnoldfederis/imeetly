"use client";

import { authClient } from "@repo/server/lib/auth-client";
import type { RouterOutputs } from "@repo/server/types";
import { LoaderCircleIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  user: RouterOutputs["user"]["me"];
}

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      toast.success("Profile updated.");
      router.refresh();
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your name and email address</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              value={name}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input disabled id="email" value={user.email} />
            <p className="text-muted-foreground text-xs">
              Email cannot be changed here.
            </p>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button
              disabled={saving || name.trim() === user.name}
              type="submit"
            >
              {saving ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
