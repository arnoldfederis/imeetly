import { render } from "@react-email/render";
import { env } from "@repo/env";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { VerificationCodeEmail } from "./emails/verification-code";

const mailerClient = nodemailer.createTransport({
  host: env.SMTP_HOST || "localhost",
  port: Number(env.SMTP_PORT) || 1025,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  tls: {
    rejectUnauthorized: false,
  },
});

const resendClient = new Resend(env.RESEND_API_KEY);

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
      await resendClient.emails.send({
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
