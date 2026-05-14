"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/server/lib/auth-client";
import { type AuthModel, authModel } from "@repo/server/modules/auth/model";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useAtomValue, useSetAtom } from "jotai";
import { LoaderCircleIcon } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/auth/login/atom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

export function OtpForm({ context }: { context: "login" | "register" }) {
  const {
    email,
    isVerifying,
    shouldPromptPasskeyAfterVerification,
    verificationContext,
    verificationMode,
  } = useAtomValue(loginAtom);
  const setLoginAtom = useSetAtom(loginAtom);
  const [isResending, setIsResending] = useState(false);
  const [isPasskeyPromptOpen, setIsPasskeyPromptOpen] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

  useEffect(() => {
    const prev = document.title;
    document.title = isVerifying
      ? "Verifying... - imeetly"
      : "Verify - imeetly";
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

  async function redirectAfterVerification() {
    const { server } = await import("@/lib/orpc");
    const data = await server.meeting.dashboard();

    const isNewUser =
      (data.stats?.meetingsThisMonth ?? 0) === 0 &&
      (data.stats?.completedMeetings ?? 0) === 0 &&
      (data.recent?.length ?? 0) === 0;

    posthog.identify(email, { email });
    posthog.capture("email_verified", {
      email,
      is_new_user: isNewUser,
      source: context,
    });

    window.location.href = isNewUser ? "/onboarding" : "/";
  }

  function resetVerificationState() {
    setLoginAtom((prevState) => ({
      ...prevState,
      isVerify: false,
      isVerifying: false,
      shouldPromptPasskeyAfterVerification: false,
      verificationContext: null,
      verificationMode: null,
    }));
  }

  async function handleVerificationSuccess() {
    if (shouldPromptPasskeyAfterVerification) {
      setLoginAtom((prevState) => ({
        ...prevState,
        isVerifying: false,
      }));
      setPasskeyName(`imeetly - ${email}`);
      setIsPasskeyPromptOpen(true);
      return;
    }

    await redirectAfterVerification();
  }

  async function handleSubmit({ otp }: AuthModel["verifyEmailRequest"]) {
    setLoginAtom((prevState) => ({
      ...prevState,
      isVerifying: true,
    }));

    const result =
      verificationMode === "sign-in"
        ? await authClient.signIn.emailOtp({
            email,
            otp,
          })
        : await authClient.emailOtp.verifyEmail({
            email,
            otp,
          });

    if (result.error) {
      posthog.capture("verify_otp_failed", {
        error_code: result.error.code,
        error_message: result.error.message,
        source: context,
        verification_mode: verificationMode ?? "email-verification",
      });
      setLoginAtom((prevState) => ({
        ...prevState,
        isVerifying: false,
      }));

      toast.error(`Failed to verify code. ${result.error.message}`);
      return;
    }

    await handleVerificationSuccess();
  }

  async function handleResend() {
    setIsResending(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: verificationMode === "sign-in" ? "sign-in" : "email-verification",
      });

      if (error) {
        toast.error(`Failed to resend code. ${error.message}`);
        return;
      }

      toast.success("Verification code sent.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleAddPasskey() {
    if (!passkeyName.trim()) {
      toast.error("Please enter a name for your passkey.");
      return;
    }

    setIsRegisteringPasskey(true);

    try {
      const res = await authClient.passkey.addPasskey({
        name: passkeyName.trim(),
      });

      if (res?.error) {
        toast.error(String(res.error.message));
        return;
      }

      toast.success("Passkey added successfully.");
      await redirectAfterVerification();
    } finally {
      setIsRegisteringPasskey(false);
    }
  }

  async function handleSkipPasskey() {
    setIsPasskeyPromptOpen(false);
    await redirectAfterVerification();
  }

  const isSignInVerification = verificationMode === "sign-in";

  return (
    <>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-bold text-2xl">
              {isSignInVerification ? "Check your email" : "Verify your email"}
            </h1>
            <p className="text-balance text-muted-foreground text-sm">
              {isSignInVerification ? (
                <>
                  We&apos;ve sent a sign-in code to <b>{email}</b>. Enter it to
                  continue and finish setting up your passkey.
                </>
              ) : (
                <>
                  Enter the code we sent to <b>{email}</b> to{" "}
                  {context === "register"
                    ? "finish creating your account."
                    : "complete sign in."}
                </>
              )}
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
              disabled={isResending || isVerifying}
              onClick={handleResend}
              type="button"
              variant="secondary"
            >
              {isResending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                "Resend code"
              )}
            </Button>
            {verificationContext === "login" && (
              <Button
                className="p-0"
                disabled={isVerifying}
                onClick={resetVerificationState}
                type="button"
                variant="link"
              >
                Back
              </Button>
            )}
          </Field>
        </FieldGroup>
      </form>

      <Dialog
        onOpenChange={(open) => {
          if (!isRegisteringPasskey) {
            setIsPasskeyPromptOpen(open);
          }

          if (!open) {
            window.location.href = "/";
          }
        }}
        open={isPasskeyPromptOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a passkey</DialogTitle>
            <DialogDescription>
              Your account is verified. Add a passkey now so you can sign in
              faster next time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-passkey-name">Passkey name</Label>
              <Input
                autoFocus
                id="login-passkey-name"
                onChange={(event) => setPasskeyName(event.target.value)}
                placeholder='e.g. "MacBook Pro", "iPhone"'
                value={passkeyName}
              />
            </div>
            <DialogFooter>
              <DialogClose
                onClick={handleSkipPasskey}
                render={<Button variant="secondary" />}
              >
                Skip for now
              </DialogClose>
              <Button
                disabled={isRegisteringPasskey || !passkeyName.trim()}
                onClick={handleAddPasskey}
                type="button"
              >
                {isRegisteringPasskey ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  "Register passkey"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
