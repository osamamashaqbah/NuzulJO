import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

export async function sendMail(to: string, subject: string, html: string) {
  if (!env.smtp.user) {
    console.log(`[mailer] SMTP not configured, skipping email to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
}
