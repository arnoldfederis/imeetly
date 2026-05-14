import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/login/auth-shell";
import { LoginContainer } from "@/components/auth/login/container";

export const metadata: Metadata = { title: "Sign In" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AuthShell>
      <LoginContainer />
    </AuthShell>
  );
}
