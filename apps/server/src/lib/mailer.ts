import { env } from "@repo/env";
import nodemailer from "nodemailer";
import { Resend } from "resend";

const mailerClient = nodemailer.createTransport({
  host: "localhost",
  port: 1025,
  auth: {
    user: "user",
    pass: "password",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const resendClient = new Resend(env.RESEND_API_KEY);

interface EmailPayload {
  email: string;
  html: string;
  subject: string;
}

async function sendMail(payload: EmailPayload) {
  const from = "noreply@imeetly.io";

  if (env.APP_ENV === "development") {
    await mailerClient.sendMail({
      from,
      to: payload.email,
      subject: payload.subject,
      html: payload.html,
    });
  }

  await resendClient.emails.send({
    from,
    to: payload.email,
    subject: payload.subject,
    html: payload.html,
  });
}

export const mailer = { sendMail };
