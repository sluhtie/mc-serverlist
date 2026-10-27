import "server-only";
import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { buildMail, type MailTemplate } from "./templates";

let transporter: Transporter | undefined;

function getTransport() {
  const host = env.smtpHost;
  if (!host) return null;
  transporter ??= nodemailer.createTransport({
    host,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword ?? "" } : undefined,
  });
  return transporter;
}

/** Absolute link into the site, in the recipient's language. */
export function mailLink(path: string, locale: Locale) {
  return `${env.appUrl}${localizePath(path, locale)}`;
}

type Params<K extends MailTemplate> = Parameters<typeof buildMail<K>>[1];

/** Sends one of the templates. Errors are logged, never thrown, so a mail outage cannot break a form. */
export async function sendMail<K extends MailTemplate>(to: string, template: K, params: Params<K>, locale: Locale) {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[mail] SMTP_HOST is not set, "${template}" mail was not sent`);
    return false;
  }
  const mail = buildMail(template, params, { locale, siteName: env.siteName, appUrl: env.appUrl });
  try {
    await transport.sendMail({ from: env.mailFrom, to, ...mail });
    return true;
  } catch (error) {
    console.error(`[mail] sending "${template}" failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Sends after the response is out. Keeps forms fast and makes "forgot password" take the same
 * time whether or not the address has an account.
 */
export function queueMail<K extends MailTemplate>(to: string, template: K, params: Params<K>, locale: Locale) {
  after(() => sendMail(to, template, params, locale));
}
