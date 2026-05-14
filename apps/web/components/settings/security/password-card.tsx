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
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const changePasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your password."),
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(1, "New password is required."),
    revokeOtherSessions: z.boolean(),
  })
  .superRefine((value, ctx) => {
    for (const violation of getViolations(value.newPassword)) {
      ctx.addIssue({
        code: "custom",
        message: violation.message,
        path: ["newPassword"],
      });
    }

    if (value.currentPassword === value.newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "New password must be different from your current password.",
        path: ["newPassword"],
      });
    }

    if (value.confirmPassword !== value.newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

interface Props {
  email: string;
  hasCredential: boolean;
}

export function PasswordCard({ email, hasCredential }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const form = useForm<ChangePasswordValues>({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: "",
      revokeOtherSessions: true,
    },
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = form.watch("newPassword") ?? "";
  const revokeOtherSessions = form.watch("revokeOtherSessions");
  const passwordValid = getViolations(newPassword).length === 0;
  const passwordInvalid = newPassword.length > 0 && !passwordValid;

  function resetDialogState() {
    setDialogOpen(false);
    setIsVisible(false);
    form.reset();
  }

  async function handleSubmit(values: ChangePasswordValues) {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: values.revokeOtherSessions,
    });

    if (error) {
      toast.error(`Failed to change password. ${error.message}`);
      return;
    }

    toast.success(
      values.revokeOtherSessions
        ? "Password changed. Other devices have been signed out."
        : "Password changed. You stayed signed in on your other devices.",
    );
    resetDialogState();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                {hasCredential
                  ? "Change your password and choose whether other devices stay signed in"
                  : "Password changes are only available after you add an email and password sign-in method"}
              </CardDescription>
            </div>
            <Button
              className="shrink-0 self-start max-sm:w-full"
              disabled={!hasCredential}
              onClick={() => setDialogOpen(true)}
              size="sm"
            >
              Change Password
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {hasCredential ? (
              <>
                Your password is attached to <b>{email}</b>.
              </>
            ) : (
              "This account does not currently have password sign-in enabled."
            )}
          </p>
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            resetDialogState();
            return;
          }

          setDialogOpen(open);
        }}
        open={dialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one for{" "}
              <b>{email}</b>.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <Controller
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="current-password"
                      id={field.name}
                      name={field.name}
                      placeholder="Enter your current password"
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

            <Controller
              control={form.control}
              name="newPassword"
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
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Confirm new password
                  </FieldLabel>
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
                    const passed = criterion.passes(newPassword);

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

            <Controller
              control={form.control}
              name="revokeOtherSessions"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Log out other devices</p>
                    <p className="text-muted-foreground text-xs">
                      {revokeOtherSessions
                        ? "Other active sessions will be signed out after the password change."
                        : "Keep your other devices signed in with their current sessions."}
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <DialogFooter>
              <Button
                onClick={resetDialogState}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !form.formState.isValid ||
                  !isPasswordValid(newPassword) ||
                  form.formState.isSubmitting
                }
                type="submit"
              >
                {form.formState.isSubmitting ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  "Save password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
