import type { Metadata } from "next";
export const metadata: Metadata = { title: "Action Items" };
export const dynamic = "force-dynamic";

import { ActionItemsContainer } from "@/components/action-items/container";

export default function Page() {
  return <ActionItemsContainer />;
}
