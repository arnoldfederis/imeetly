"use client";

import { useAtomValue } from "jotai";
import { loginAtom } from "@/components/auth/login/atom";
import { LoginForm } from "@/components/auth/login/login-form";
import { OtpForm } from "@/components/auth/login/otp-form";

export function LoginContainer() {
  const { isVerify, verificationContext } = useAtomValue(loginAtom);

  return isVerify && verificationContext === "login" ? (
    <OtpForm context="login" />
  ) : (
    <LoginForm />
  );
}
