import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/login/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/login/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
