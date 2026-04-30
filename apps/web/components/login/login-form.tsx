"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/server/lib/auth-client";
import { type AuthModel, authModel } from "@repo/server/modules/auth/model";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { KeyRoundIcon, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/login/atom";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { client } from "@/lib/orpc";

export function LoginForm() {
  const router = useRouter();
  const { isPasskeySigningIn, isSigningIn } = useAtomValue(loginAtom);
  const setLoginAtom = useSetAtom(loginAtom);

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(authModel.signInSimpleRequest),
  });

  const login = useMutation(
    client.auth.signInSimple.mutationOptions({
      onSuccess: (res) => {
        setLoginAtom((prevState) => ({
          ...prevState,
          email: form.getValues("email"),
          isVerify: true,
          isPasskeyAdding: res.signInMethod === "passkey",
        }));

        form.reset();
      },
      onError: (error) => toast.error(`Failed to login. ${error.message}`),
    }),
  );

  const isDisabled = login.isPending || isPasskeySigningIn || isSigningIn;

  function handleSubmit(data: AuthModel["signInSimpleRequest"]) {
    posthog.capture("login_email_submitted", { email: data.email });
    setLoginAtom((prevState) => ({
      ...prevState,
      isSigningIn: true,
    }));

    login.mutate(data);
  }

  async function handlePasskeyAuth(data: AuthModel["signInSimpleRequest"]) {
    const email = data.email;

    posthog.capture("login_passkey_clicked");
    setLoginAtom((prevState) => ({
      ...prevState,
      isPasskeySigningIn: true,
    }));

    try {
      const { server } = await import("@/lib/orpc");
      const { exists } = await server.auth.checkIfPasskeyExists({ email });

      if (!exists) {
        login.mutate({ email, signInMethod: "passkey" });
      } else {
        const { error } = await authClient.signIn.passkey();

        if (error) {
          toast.error(`Failed to login using passkey. ${error.message}`);
          return;
        }

        router.replace("/");
      }
    } catch {
      toast.error("Failed to login using passkey.");
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Sign in to imeetly</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Enter your email below to sign in to your account
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
                id={field.name}
                name={field.name}
                placeholder="me@imeetly.app"
                type="email"
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}

              <Button
                disabled={isDisabled}
                suppressHydrationWarning
                type="submit"
              >
                {isSigningIn ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  "Continue"
                )}
              </Button>
            </Field>
          )}
        />

        <FieldSeparator>or continue with</FieldSeparator>
        <Field>
          <Button
            disabled={isDisabled}
            onClick={form.handleSubmit(handlePasskeyAuth)}
            suppressHydrationWarning
            type="button"
            variant="secondary"
          >
            {isPasskeySigningIn ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <>
                <KeyRoundIcon /> Passkey
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
