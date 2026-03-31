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
  from: string;
  email: string;
  html: string;
  subject: string;
}

async function sendMail(payload: EmailPayload) {
  const from = `${payload.from}@imeetly.app`;

  if (env.APP_ENV === "production") {
    await resendClient.emails.send({
      from,
      to: payload.email,
      subject: payload.subject,
      html: payload.html,
    });
  }

  await mailerClient.sendMail({
    from,
    to: payload.email,
    subject: payload.subject,
    html: payload.html,
  });
}

export const mailer = { sendMail };
