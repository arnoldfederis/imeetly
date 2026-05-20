"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@repo/env";
import { authClient } from "@repo/server/lib/auth-client";
import { type AuthModel, authModel } from "@repo/server/modules/auth/model";
import { getViolations, isPasswordValid, PASSWORD_CRITERIA, } from "@repo/server/modules/auth/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useSetAtom } from "jotai";
import { CircleAlertIcon, CircleCheckIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon, } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/auth/login/atom";
import { PolicyTermsLinks } from "@/components/auth/policy-terms-links";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const setLoginAtom = useSetAtom(loginAtom);
  const form = useForm({
    defaultValues: {
      confirmPassword: "",
      email: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(authModel.signUpRequest),
  });

  const isSubmitting = form.formState.isSubmitting;
  const email = form.watch("email") ?? "";
  const password = form.watch("password") ?? "";
  const passwordValid = getViolations(password).length === 0;
  const passwordInvalid = password.length > 0 && !passwordValid;
  const normalizedEmail = email.trim().toLowerCase();
  const emailValidation =
    authModel.checkEmailStatusRequest.shape.email.safeParse(normalizedEmail);
  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  useEffect(() => {
    if (!normalizedEmail) {
      setEmailExists(false);
      setIsCheckingEmail(false);
      return;
    }

    if (!emailValidation.success) {
      setEmailExists(false);
      setIsCheckingEmail(false);
      return;
    }

    let cancelled = false;
    setIsCheckingEmail(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const { server } = await import("@/lib/orpc");
        const { exists } = await server.auth.checkEmailStatus({
          email: normalizedEmail,
        });

        if (cancelled) {
          return;
        }

        setEmailExists(exists);

        if (exists) {
          form.setError("email", {
            message: "Email already exists.",
          });
          return;
        }

        if (
          form.getFieldState("email").error?.message === "Email already exists."
        ) {
          form.clearErrors("email");
        }
      } catch {
        if (!cancelled) {
          setEmailExists(false);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingEmail(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [emailValidation.success, form, normalizedEmail]);

  async function handleSubmit(values: AuthModel["signUpRequest"]) {
    const email = values.email.trim().toLowerCase();

    const { server } = await import("@/lib/orpc");

    const { exists } = await server.auth.checkEmailStatus({ email });

    if (exists) {
      form.setError("email", {
        message: "Email already exists.",
      });
      return;
    }

    const { error } = await authClient.signUp.email({
      callbackURL: env.NEXT_PUBLIC_APP_BASE_URL,
      email,
      name: email.split("@")[0],
      password: values.password,
    });

    if (error) {
      toast.error(`Failed to sign up. ${error.message}`);
      return;
    }

    const { error: sendOtpError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

    if (sendOtpError) {
      toast.error(`Failed to send verification OTP. ${sendOtpError.message}`);
      return;
    }

    posthog.capture("signup_password_submitted", { email });
    setLoginAtom((prevState) => ({
      ...prevState,
      email,
      isVerify: true,
      shouldPromptPasskeyAfterVerification: false,
      verificationContext: "register",
      verificationMode: "email-verification",
    }));
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup className="gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Create your account</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Sign up with your email and a strong password.
          </p>
        </div>

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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
              {!fieldState.invalid && isCheckingEmail ? (
                <p className="text-muted-foreground text-sm">
                  Checking email availability...
                </p>
              ) : null}
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
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Create a password"
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
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Confirm your password"
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

              <PolicyTermsLinks type="signUp" />
            </Field>
          )}
        />

        <AnimatePresence>
          {passwordInvalid && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {PASSWORD_CRITERIA.map((criterion) => {
                const passed = criterion.passes(password);

                return (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors duration-200",
                      passed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                    initial={{ opacity: 0 }}
                    key={criterion.id}
                    transition={{ duration: 0.2 }}
                  >
                    {passed ? (
                      <motion.div
                        animate={{ scale: 1 }}
                        initial={{ scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CircleCheckIcon className="size-3.5" />
                      </motion.div>
                    ) : (
                      <CircleAlertIcon className="size-3.5" />
                    )}
                    <span>{criterion.message}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <Field>
          <Button
            disabled={
              !form.formState.isValid ||
              !isPasswordValid(password) ||
              isCheckingEmail ||
              emailExists ||
              isSubmitting
            }
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Sign up"
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            Have an account?{" "}
            <Button
              className="p-0"
              nativeButton={false}
              render={<Link href="/login" />}
              type="button"
              variant="link"
            >
              Back to login
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
