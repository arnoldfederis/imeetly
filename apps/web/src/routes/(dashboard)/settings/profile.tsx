import { authClient } from "@repo/server/lib/auth-client";
import { createFileRoute, getRouteApi, useRouter } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { CameraIcon, LoaderCircleIcon } from "lucide-react";
import { useRef, useState } from "react";
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

export const Route = createFileRoute("/(dashboard)/settings/profile")({
  component: ProfilePage,
});

const dashboardRoute = getRouteApi("/(dashboard)");

function ProfilePage() {
  const session = dashboardRoute.useLoaderData();
  const router = useRouter();

  if (!session) return null;

  const { user } = session;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information
        </p>
      </div>

      <AvatarCard router={router} user={user} />
      <ProfileForm router={router} user={user} />
    </div>
  );
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

function AvatarCard({
  user,
  router,
}: {
  user: User;
  router: ReturnType<typeof useRouter>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await authClient.updateUser({ image: dataUrl });
      toast.success("Profile image updated.");
      router.invalidate();
    } catch {
      toast.error("Failed to update image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const fallback = user.name
    ? `${user.name[0]}${user.name[1]}`
    : `${user.email[0]}${user.email[1]}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>
          Click on the avatar to upload a new image
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <button
            className="group relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-full"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {user.image ? (
              <Image
                alt={user.name}
                className="size-full rounded-full object-cover"
                height={80}
                src={user.image}
                width={80}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-secondary text-xl font-medium uppercase">
                {fallback}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <LoaderCircleIcon className="size-6 animate-spin text-white" />
              ) : (
                <CameraIcon className="size-6 text-white" />
              )}
            </div>
          </button>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <div className="text-sm">
            <p className="font-medium">{user.name || "No name set"}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileForm({
  user,
  router,
}: {
  user: User;
  router: ReturnType<typeof useRouter>;
}) {
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
      router.invalidate();
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
