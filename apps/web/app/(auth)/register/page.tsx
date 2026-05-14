import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/login/auth-shell";
import { RegisterContainer } from "@/components/auth/register/container";

export const metadata: Metadata = { title: "Sign Up" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AuthShell>
      <RegisterContainer />
    </AuthShell>
  );
}
