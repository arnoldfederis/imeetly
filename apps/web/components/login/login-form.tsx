"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@repo/env/web";
import { authClient } from "@repo/server/lib/auth-client";
import { type AuthModel, authModel } from "@repo/server/modules/auth/model";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { KeyRoundIcon, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAtom } from "@/components/login/atom";
import { GoogleIcon } from "@/components/svgs/google-icon";
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
  const { isPasskeySigningIn, isSocialSigningIn } = useAtomValue(loginAtom);
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
      onSuccess: () => {
        setLoginAtom((prevState) => ({
          ...prevState,
          email: form.getValues("email"),
          isVerify: true,
        }));

        form.reset();
      },
      onError: (error) => toast.error(`Failed to login. ${error.message}`),
    }),
  );

  const isDisabled = login.isPending || isSocialSigningIn || isPasskeySigningIn;

  function handleSubmit(data: AuthModel["signInSimpleRequest"]) {
    login.mutate(data);
  }

  async function handleGoogleAuth() {
    setLoginAtom((prevState) => ({
      ...prevState,
      isSocialSigningIn: true,
    }));

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: env.NEXT_PUBLIC_APP_BASE_URL,
    });

    if (error) {
      setLoginAtom((prevState) => ({
        ...prevState,
        isSocialSigningIn: false,
      }));

      toast.error(`Failed to login using google. ${error.message}`);
      return;
    }

    router.replace("/");
  }

  async function handlePasskeyAuth() {
    setLoginAtom((prevState) => ({
      ...prevState,
      isPasskeySigningIn: true,
    }));

    const { error } = await authClient.signIn.passkey();

    if (error) {
      setLoginAtom((prevState) => ({
        ...prevState,
        isPasskeySigningIn: false,
      }));

      toast.error(`Failed to login using passkey. ${error.message}`);
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
          <h1 className="font-bold text-2xl">Login to imeetly</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Enter your email below to login to your account
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
                disabled={!form.formState.isValid || isDisabled}
                type="submit"
              >
                {login.isPending ? (
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
            onClick={handleGoogleAuth}
            type="button"
            variant="secondary"
          >
            {isSocialSigningIn ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                Google
              </>
            )}
          </Button>
          <Button
            disabled={isDisabled}
            onClick={handlePasskeyAuth}
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
