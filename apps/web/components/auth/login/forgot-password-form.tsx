"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@repo/env";
import { authClient } from "@repo/server/lib/auth-client";
import { LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordValues>({
    defaultValues: { email: "" },
    mode: "onChange",
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function handleSubmit({ email }: ForgotPasswordValues) {
    const normalizedEmail = email.trim().toLowerCase();
    const redirectTo = new URL(
      "/reset-password",
      env.NEXT_PUBLIC_APP_BASE_URL,
    ).toString();

    const { error } = await authClient.requestPasswordReset({
      email: normalizedEmail,
      redirectTo,
    });

    if (error) {
      toast.error(`Failed to send reset email. ${error.message}`);
      return;
    }

    toast.success("Reset email sent. Check your inbox.");
    form.reset({ email: "" });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup className="gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Forgot password?</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Enter your email and we&apos;ll send you a secure reset link.
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
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Field>
          <Button
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Send reset link"
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
