import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/login/auth-shell";
import { ResetPasswordForm } from "@/components/auth/login/reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
