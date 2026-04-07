import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/server/lib/auth-client";
import { type AuthModel, authModel } from "@repo/server/modules/auth/model";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useAtomValue, useSetAtom } from "jotai";
import { LoaderCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/login/atom";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function OtpForm() {
  const { email, isVerifying } = useAtomValue(loginAtom);
  const setLoginAtom = useSetAtom(loginAtom);

  useEffect(() => {
    const prev = document.title;
    document.title = isVerifying
      ? "Verifying... — imeetly"
      : "Verify — imeetly";
    return () => {
      document.title = prev;
    };
  }, [isVerifying]);

  const form = useForm({
    defaultValues: {
      email,
      otp: "",
    },
    resolver: zodResolver(authModel.verifyEmailRequest),
  });

  async function handleSubmit({ otp }: AuthModel["verifyEmailRequest"]) {
    setLoginAtom((prevState) => ({
      ...prevState,
      isVerifying: true,
    }));

    const { error } = await authClient.signIn.emailOtp({
      email,
      otp,
    });

    if (error) {
      setLoginAtom((prevState) => ({
        ...prevState,
        isVerifying: false,
        isVerify: error.code !== "TOO_MANY_ATTEMPTS",
      }));

      toast.error(`Failed to verify otp. ${error.message}`);
      return;
    }

    window.location.href = "/";
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Check your email</h1>
          <p className="text-balance text-muted-foreground text-sm">
            We've sent you an email to verify your account. Please check your
            inbox at <b>{email}</b>.
          </p>
        </div>
        <Controller
          control={form.control}
          name="otp"
          render={({ field }) => (
            <Field>
              <FieldLabel className="sr-only" htmlFor="otp">
                Verification code
              </FieldLabel>
              <InputOTP
                id="token"
                maxLength={6}
                {...field}
                containerClassName="justify-center gap-2"
                onComplete={form.handleSubmit(handleSubmit)}
                pattern={REGEXP_ONLY_DIGITS}
              >
                <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </Field>
          )}
        />

        <Field>
          <Button
            disabled={!form.formState.isValid || isVerifying}
            type="submit"
          >
            {isVerifying ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
          <Button
            className="p-0"
            disabled={isVerifying}
            onClick={() =>
              setLoginAtom((prevState) => ({
                ...prevState,
                email: "",
                isVerify: false,
              }))
            }
            type="button"
            variant="link"
          >
            Back to Login
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
