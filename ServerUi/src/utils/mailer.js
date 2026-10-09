import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Only created when SMTP_HOST is set; without it, emails are logged to the console instead.
const transport = env.smtp.host
  ? nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  })
  : null;

export const mailConfigured = Boolean(transport);

/** Sends an email, or logs it when no SMTP server is configured (development). */
export const sendMail = async ({ to, subject, text }) => {
  if (!transport) {
    console.log(`\n✉  [email not sent: SMTP_HOST is not set]\n   To: ${to}\n   Subject: ${subject}\n   ${text.replace(/\n/g, '\n   ')}\n`);
    return;
  }
  await transport.sendMail({ from: env.smtp.from, to, subject, text });
};
