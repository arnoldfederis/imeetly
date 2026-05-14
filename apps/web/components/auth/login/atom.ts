import { atom } from "jotai";

export type VerificationContext = "login" | "register" | null;
export type VerificationMode = "email-verification" | "sign-in" | null;

export const loginAtom = atom({
  email: "",
  isPasskeySigningIn: false,
  isSocialSigningIn: false,
  isVerifying: false,
  isVerify: false,
  shouldPromptPasskeyAfterVerification: false,
  verificationContext: null as VerificationContext,
  verificationMode: null as VerificationMode,
});
