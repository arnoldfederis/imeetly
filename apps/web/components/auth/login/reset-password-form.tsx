"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/server/lib/auth-client";
import {
  getViolations,
  isPasswordValid,
  PASSWORD_CRITERIA,
} from "@repo/server/modules/auth/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const resetSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your password."),
    password: z.string().min(1, "Password is required."),
  })
  .superRefine((value, ctx) => {
    for (const violation of getViolations(value.password)) {
      ctx.addIssue({
        code: "custom",
        message: violation.message,
        path: ["password"],
      });
    }

    if (value.confirmPassword !== value.password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const form = useForm<ResetValues>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(resetSchema),
  });

  const password = form.watch("password") ?? "";
  const passwordValid = getViolations(password).length === 0;
  const passwordInvalid = password.length > 0 && !passwordValid;
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const hasValidToken = useMemo(
    () => Boolean(token) && error !== "INVALID_TOKEN",
    [error, token],
  );

  async function handleSubmit(values: ResetValues) {
    if (!token) {
      toast.error("Reset link is missing or invalid.");
      return;
    }

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      toast.error(`Failed to reset password. ${error.message}`);
      return;
    }

    toast.success("Password reset. You can now sign in.");
    router.replace("/login");
  }

  if (!hasValidToken) {
    return (
      <div className="flex flex-col gap-6">
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-bold text-2xl">Reset link invalid</h1>
            <p className="text-balance text-muted-foreground text-sm">
              This reset link is missing, expired, or already used. Request a
              new one to continue.
            </p>
          </div>

          <Field>
            <Button
              nativeButton={false}
              render={<Link href="/forgot-password" />}
              type="button"
            >
              Request another link
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              type="button"
              variant="link"
            >
              Back to login
            </Button>
          </Field>
        </FieldGroup>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup className="gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Set a new password</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Choose a new password for your imeetly account.
          </p>
        </div>

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>New password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Create a new password"
                  type={isVisible ? "text" : "password"}
                />
                <Button
                  className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent focus-visible:ring-ring/50"
                  onClick={() => setIsVisible((prevState) => !prevState)}
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
              <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Confirm your new password"
                  type={isVisible ? "text" : "password"}
                />
                <Button
                  className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent focus-visible:ring-ring/50"
                  onClick={() => setIsVisible((prevState) => !prevState)}
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
              form.formState.isSubmitting
            }
            type="submit"
          >
            {form.formState.isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Reset password"
            )}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/login" />}
            type="button"
            variant="link"
          >
            Back to login
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
