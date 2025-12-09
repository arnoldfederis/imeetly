import { atom } from "jotai";

export const loginAtom = atom({
  email: "",
  isPasskeySigningIn: false,
  isSocialSigningIn: false,
  isVerifying: false,
  isVerify: false,
});
