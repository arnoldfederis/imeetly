"use client";

import { useAtomValue } from "jotai";
import { loginAtom } from "@/components/auth/login/atom";
import { OtpForm } from "@/components/auth/login/otp-form";
import { RegisterForm } from "@/components/auth/register/register-form";

export function RegisterContainer() {
  const { isVerify, verificationContext } = useAtomValue(loginAtom);

  return isVerify && verificationContext === "register" ? (
    <OtpForm context="register" />
  ) : (
    <RegisterForm />
  );
}
