"use client";

import { authClient } from "@repo/server/lib/auth-client";
import { LoaderCircleIcon, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  } & {
    isAnonymous?: boolean;
  };
}

export function NavUser({ user }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleLogout(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (user.isAnonymous) {
      await authClient.deleteAnonymousUser();
    }

    await authClient.signOut({
      fetchOptions: {
        credentials: "include",
        mode: "cors",
        onRequest: () => setIsPending(true),
        onSuccess: () => window.location.reload(),
        onError: () => {
          setIsPending(false);
          toast.error("Failed to log out. Please try again.");
        },
      },
    });
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => !isPending && setIsOpen(open)}
      open={isOpen}
    >
      <DropdownMenuTrigger className="border-0">
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="mb-1">
              <Link
                className="group flex items-start gap-2 px-2 py-2 text-left text-black text-sm hover:rounded-md hover:bg-accent hover:text-popover-foreground dark:text-popover-foreground"
                href={"/settings/profile"}
                onClick={() => setIsOpen(false)}
              >
                <UserAvatar user={user} />
                <div className="w-full space-y-1 group-hover:text-black dark:group-hover:text-white">
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user.name || "--"}
                    </span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </Link>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="hover:rounded-md hover:bg-secondary"
          closeOnClick={false}
          onClick={handleLogout}
          onSelect={(e) => e.preventDefault()}
        >
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <LogOut />
          )}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatar({ user }: Props) {
  const fallbackImage = user.name
    ? `${user.name[0]}${user.name[1]}`
    : `${user.email[0]}${user.email[1]}`;

  return (
    <div className="size-9 cursor-pointer">
      {user.image ? (
        <Image
          alt={user.name}
          className="size-8.75 rounded-full hover:opacity-80"
          height={35}
          loading={"eager"}
          src={user.image ?? ""}
          width={35}
        />
      ) : (
        <div className="flex size-8.75 items-center justify-center rounded-full bg-primary text-white uppercase hover:bg-primary/80">
          {fallbackImage}
        </div>
      )}
    </div>
  );
}
