"use client";

import { authClient } from "@repo/server/lib/auth-client";
import type { RouterOutputs } from "@repo/server/types";
import { CameraIcon, LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  user: RouterOutputs["user"]["me"];
}

export function AvatarCard({ user }: Props) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
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
      router.refresh();
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
              <div className="flex size-full items-center justify-center bg-secondary font-medium text-xl uppercase">
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
