"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@repo/env";
import { authClient } from "@repo/server/lib/auth-client";
import { type AuthModel, authModel } from "@repo/server/modules/auth/model";
import { useAtomValue, useSetAtom } from "jotai";
import { EyeIcon, EyeOffIcon, KeyRoundIcon, LoaderCircleIcon, MailIcon, } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/auth/login/atom";
import { PolicyTermsLinks } from "@/components/auth/policy-terms-links";
import { GoogleIcon } from "@/components/svgs/google-icon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { server } from "@/lib/orpc";

export function LoginForm() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const {
    email: storedEmail,
    isPasskeySigningIn,
    isSocialSigningIn,
  } = useAtomValue(loginAtom);
  const setLoginAtom = useSetAtom(loginAtom);
  const form = useForm({
    defaultValues: {
      email: storedEmail,
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(authModel.signInRequest),
  });

  const isSubmitting = form.formState.isSubmitting;
  const toggleVisibility = () => setIsVisible((prevState) => !prevState);
  const isLoading = isSubmitting || isSocialSigningIn || isPasskeySigningIn;

  async function handleSubmit(values: AuthModel["signInRequest"]) {
    const email = values.email.trim().toLowerCase();
    posthog.capture("login_password_submitted", { email });

    const { error } = await authClient.signIn.email({
      callbackURL: env.NEXT_PUBLIC_APP_BASE_URL,
      email,
      password: values.password,
    });

    if (error) {
      if (error.status === 403) {
        setLoginAtom((prevState) => ({
          ...prevState,
          email,
          isVerify: true,
          shouldPromptPasskeyAfterVerification: false,
          verificationMode: "email-verification",
          verificationContext: "login",
        }));
        toast.error("Email not verified. Enter the verification code we sent.");
        return;
      }

      toast.error(`Failed to sign in. ${error.message}`);
      return;
    }

    router.replace("/");
  }

  async function handleGoogleAuth() {
    posthog.capture("login_google_clicked");
    setLoginAtom((prevState) => ({
      ...prevState,
      isSocialSigningIn: true,
    }));

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: env.NEXT_PUBLIC_APP_BASE_URL,
      });

      if (error) {
        toast.error(`Failed to sign in with Google. ${error.message}`);
      }
    } catch {
      toast.error("Failed to sign in with Google.");
    } finally {
      setLoginAtom((prevState) => ({
        ...prevState,
        isSocialSigningIn: false,
      }));
    }
  }

  async function handlePasskeyAuth() {
    const email = form.getValues("email").trim().toLowerCase();

    if (!authModel.signInRequest.shape.email.safeParse(email).success) {
      form.setError("email", {
        message: "Enter a valid email to use your passkey.",
      });
      return;
    }

    posthog.capture("login_passkey_clicked", { email });
    setLoginAtom((prevState) => ({
      ...prevState,
      email,
      isPasskeySigningIn: true,
    }));

    try {
      const { exists } = await server.auth.checkIfPasskeyExists({ email });

      if (!exists) {
        const response = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        });

        if (response.error) {
          toast.error("Failed to continue with passkey.");
          return;
        }

        setLoginAtom((prevState) => ({
          ...prevState,
          email,
          isPasskeySigningIn: false,
          isVerify: true,
          shouldPromptPasskeyAfterVerification: true,
          verificationContext: "login",
          verificationMode: "sign-in",
        }));
        return;
      }

      const { error } = await authClient.signIn.passkey();

      if (error) {
        toast.error(`Failed to sign in with passkey. ${error.message}`);
        return;
      }

      router.replace("/");
    } catch {
      toast.error("Failed to sign in with passkey.");
    } finally {
      setLoginAtom((prevState) => ({
        ...prevState,
        isPasskeySigningIn: false,
      }));
    }
  }

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup className="gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Sign in to imeetly</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Use your email and password to access your account.
          </p>
        </div>

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <div>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoCapitalize="none"
                  autoComplete="email"
                  id={field.name}
                  name={field.name}
                  placeholder="me@imeetly.app"
                  type="email"
                />
              </div>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Button
                  className="p-0"
                  nativeButton={false}
                  render={<Link href="/forgot-password" />}
                  size="xs"
                  type="button"
                  variant="link"
                >
                  Forgot Password?
                </Button>
              </div>

              <div className="relative">
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="current-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Enter your password"
                  type={isVisible ? "text" : "password"}
                />
                <Button
                  className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent focus-visible:ring-ring/50"
                  onClick={toggleVisibility}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                  <span className="sr-only">
                    {isVisible ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}

              <PolicyTermsLinks type="signIn" />
            </Field>
          )}
        />

        <Field>
          <Button disabled={!form.formState.isValid || isLoading} type="submit">
            {isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <FieldSeparator>or continue with</FieldSeparator>
        <Field>
          <Button
            disabled={isLoading}
            nativeButton={false}
            render={<Link href="/register" />}
            type="button"
            variant="secondary"
          >
            <MailIcon /> Sign up
          </Button>
          <Button
            disabled={isLoading}
            onClick={handleGoogleAuth}
            suppressHydrationWarning
            type="button"
            variant="secondary"
          >
            {isSocialSigningIn ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <>
                <GoogleIcon className="size-4" /> Google
              </>
            )}
          </Button>
          <Button
            disabled={isLoading}
            onClick={handlePasskeyAuth}
            type="button"
            variant="secondary"
          >
            {isPasskeySigningIn ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <>
                <KeyRoundIcon className="size-4" /> Passkey
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
