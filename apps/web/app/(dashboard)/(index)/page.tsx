import type { Metadata } from "next";
import { DashboardContainer } from "@/components/dashboard/container";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <DashboardContainer />;
}
