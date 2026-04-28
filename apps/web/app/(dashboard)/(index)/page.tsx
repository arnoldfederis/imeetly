import type { Metadata } from "next";
import { DashboardContainer } from "@/components/dashboard/container";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Page() {
  return <DashboardContainer />;
}
