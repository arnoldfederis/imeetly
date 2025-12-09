import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@shared/rpc/lib/auth-client";
import {
  type VerifyEmailRequest,
  VerifyEmailRequestSchema,
} from "@shared/rpc/schemas/auth";
import { Button } from "@shared/web-ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shared/web-ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@shared/web-ui/components/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useAtomValue, useSetAtom } from "jotai";
import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/auth/login/atom";

export function OtpForm() {
  const { email, isVerifying } = useAtomValue(loginAtom);
  const router = useRouter();
  const setLoginAtom = useSetAtom(loginAtom);

  const form = useForm({
    defaultValues: {
      email,
      otp: "",
    },
    resolver: zodResolver(VerifyEmailRequestSchema),
  });

  async function handleSubmit({ otp }: VerifyEmailRequest) {
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
        isVerify: error.status !== 429,
      }));

      toast.error(`Failed to verify otp. ${error.message}`);
      return;
    }

    router.replace("/");
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
