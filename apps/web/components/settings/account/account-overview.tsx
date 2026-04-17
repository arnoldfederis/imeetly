"use client";

import type { RouterOutputs } from "@repo/server/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
  user: RouterOutputs["user"]["me"];
  plan: string;
}

export function AccountOverview({ user, plan }: Props) {
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
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs capitalize">
            {plan ?? "free"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
