import { render } from "@react-email/render";
import { env } from "@repo/env";
import nodemailer from "nodemailer";
import { Resend } from "resend";
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

  async sendVerificationCode(email: string, code: string) {
    // Derive site URL from APP_BASE_URL by stripping the app subdomain
    // e.g. https://app.imeetly.app → https://imeetly.app
    //       https://staging-app.imeetly.app → https://imeetly.app
    const url = new URL(env.APP_BASE_URL);
    const parts = url.hostname.split(".");
    // Keep only the last two parts (domain + tld)
    url.hostname = parts.slice(-2).join(".");
    const siteUrl = url.origin;
    const html = await render(VerificationCodeEmail({ code, siteUrl }));

    await sendMail({
      from: "verify",
      subject: "Your imeetly verification code",
      email,
      html,
    });
  },
};

export { emailService };
export const mailer = emailService;
