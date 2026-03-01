import { useAtomValue } from "jotai";
import { loginAtom } from "@/components/login/atom";
import { LoginForm } from "@/components/login/login-form";
import { OtpForm } from "@/components/login/otp-form";

export function LoginContainer() {
  const { isVerify } = useAtomValue(loginAtom);

  return isVerify ? <OtpForm /> : <LoginForm />;
}
