"use client";

import {
  SettingsMobileNav,
  SettingsSidebar,
} from "@/components/settings/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <SettingsMobileNav />
      <SettingsSidebar />
      <div className="w-full">{children}</div>
    </div>
  );
}
