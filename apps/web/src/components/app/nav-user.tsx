import { authClient } from "@repo/server/lib/auth-client";
import { Link } from "@tanstack/react-router";
import { LoaderCircleIcon, LogOut } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  user: typeof authClient.$Infer.Session.user;
}

export function NavUser({ user }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleLogout(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

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
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger>
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
                className="flex items-start gap-2 px-2 py-2 text-left text-popover-foreground text-sm hover:rounded-md hover:bg-secondary hover:bg-opacity-10"
                onClick={() => setIsOpen(false)}
                to={"/settings/profile"}
              >
                <UserAvatar user={user} />
                <div className="w-full space-y-1">
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
        <DropdownMenuItem onClick={handleLogout}>
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
    <Avatar className="h-9 w-9 cursor-pointer rounded-full">
      <AvatarImage
        alt={user.name}
        className="select-none rounded-full"
        src={user.image ?? ""}
      />
      <AvatarFallback className="select-none rounded-full bg-sidebar-primary text-sidebar-primary-foreground uppercase">
        {fallbackImage}
      </AvatarFallback>
    </Avatar>
  );
}
