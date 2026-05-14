import { render } from "@react-email/render";
import { env } from "@repo/env";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { PasswordResetSuccessEmail } from "./emails/password-reset-success";
import { ResetPasswordEmail } from "./emails/reset-password";
import { VerificationCodeEmail } from "./emails/verification-code";
import { WelcomeEmail } from "./emails/welcome";

const mailerClient = nodemailer.createTransport({
  host: env.SMTP_HOST || "localhost",
  port: Number(env.SMTP_PORT) || 1025,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  tls: {
    // Only skip cert validation for local dev SMTP (e.g. mailpit); always validate in production
    rejectUnauthorized: env.APP_ENV !== "development",
  },
});

let resendClient: Resend | null = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  if (!env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is required to send production email via Resend.",
    );
  }

  resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

interface EmailPayload {
  from: string;
  email: string;
  html: string;
  subject: string;
}

type AuthCodeType =
  | "change-email"
  | "email-verification"
  | "forget-password"
  | "sign-in";

function getAuthCodeCopy(type: AuthCodeType) {
  switch (type) {
    case "forget-password":
      return {
        description: "Use this code to reset your imeetly password.",
        preview: "Your imeetly password reset code",
        subject: "Your imeetly password reset code",
        title: "Reset your password",
      };
    case "sign-in":
      return {
        description: "Use this code to finish signing in to imeetly.",
        preview: "Your imeetly sign-in code",
        subject: "Your imeetly sign-in code",
        title: "Sign in to imeetly",
      };
    case "change-email":
      return {
        description: "Use this code to confirm your new email address.",
        preview: "Your imeetly email change code",
        subject: "Your imeetly email change code",
        title: "Confirm your email change",
      };
    default:
      return {
        description: "Use this code to verify your imeetly email address.",
        preview: "Your imeetly verification code",
        subject: "Your imeetly verification code",
        title: "Verify your email",
      };
  }
}

async function sendMail(payload: EmailPayload) {
  const from = `imeetly <${payload.from}@imeetly.app>`;

  console.log(
    `[mailer] Sending email to=${payload.email} subject="${payload.subject}"`,
  );

  try {
    if (env.APP_ENV === "production") {
      await getResendClient().emails.send({
        from,
        to: payload.email,
        subject: payload.subject,
        html: payload.html,
      });
    } else {
      await mailerClient.sendMail({
        from,
        to: payload.email,
        subject: payload.subject,
        html: payload.html,
      });
    }

    console.log(`[mailer] Email sent successfully to=${payload.email}`);
  } catch (err) {
    console.error(
      `[mailer] Email send failed to=${payload.email}:`,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

// ── Email Service ──

const emailService = {
  sendMail,

  async sendWelcomeEmail(email: string, name: string) {
    const appUrl = env.APP_BASE_URL;
    const url = new URL(appUrl);
    const parts = url.hostname.split(".");
    url.hostname = parts.slice(-2).join(".");
    const siteUrl = url.origin;
    const html = await render(
      WelcomeEmail({ name: name || "there", appUrl, siteUrl }),
    );

    await sendMail({
      from: "hello",
      subject: "Welcome to imeetly",
      email,
      html,
    });
  },

  async sendVerificationCode(
    email: string,
    code: string,
    type: AuthCodeType = "email-verification",
  ) {
    // Derive site URL from APP_BASE_URL by stripping the app subdomain
    // e.g. https://app.imeetly.app → https://imeetly.app
    //       https://staging-app.imeetly.app → https://imeetly.app
    const url = new URL(env.APP_BASE_URL);
    const parts = url.hostname.split(".");
    // Keep only the last two parts (domain + tld)
    url.hostname = parts.slice(-2).join(".");
    const siteUrl = url.origin;
    const copy = getAuthCodeCopy(type);
    const html = await render(
      VerificationCodeEmail({
        code,
        description: copy.description,
        preview: copy.preview,
        siteUrl,
        title: copy.title,
      }),
    );

    await sendMail({
      from: "verify",
      subject: copy.subject,
      email,
      html,
    });
  },

  async sendResetPasswordEmail(email: string, token: string) {
    const url = new URL(env.APP_BASE_URL);
    const parts = url.hostname.split(".");
    url.hostname = parts.slice(-2).join(".");
    const siteUrl = url.origin;

    const html = await render(
      ResetPasswordEmail({
        preview: "Reset your imeetly password",
        resetUrl: `${env.APP_BASE_URL}/reset-password?token=${token}`,
        siteUrl,
      }),
    );

    await sendMail({
      from: "security",
      subject: "Reset your imeetly password",
      email,
      html,
    });
  },

  async sendPasswordResetSuccessEmail(email: string) {
    const appUrl = env.APP_BASE_URL;
    const url = new URL(appUrl);
    const parts = url.hostname.split(".");
    url.hostname = parts.slice(-2).join(".");
    const siteUrl = url.origin;
    const html = await render(
      PasswordResetSuccessEmail({
        appUrl,
        preview: "Your imeetly password was changed",
        siteUrl,
      }),
    );

    await sendMail({
      from: "security",
      subject: "Your imeetly password was changed",
      email,
      html,
    });
  },
};

export { emailService };
export const mailer = emailService;
