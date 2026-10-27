// Transactional e-mails in German and English. Pure functions, so they can be unit tested and
// previewed without SMTP. Layout uses tables and inline styles because mail clients ignore most CSS.
import type { Locale } from "@/lib/i18n/config";

export type MailContent = { subject: string; html: string; text: string };

type Block = {
  subject: string;
  /** Hidden preview line next to the subject in the inbox. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  /** Small print under the button, e.g. the expiry. */
  note?: string;
};

type Brand = { siteName: string; appUrl: string; locale: Locale };

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COLORS = {
  page: "#f3f1ea",
  surface: "#ffffff",
  line: "#e2dfd4",
  fg: "#1d1c19",
  muted: "#5f5c53",
  header: "#0a0c0f",
  brand: "#22c55e",
  brandDark: "#15803d",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const FOOTER: Record<Locale, (site: string) => string> = {
  de: (site) => `Du bekommst diese E-Mail, weil sie für deinen Account bei ${site} nötig ist.`,
  en: (site) => `You are receiving this e-mail because it is required for your ${site} account.`,
};

const BUTTON_FALLBACK: Record<Locale, string> = {
  de: "Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
  en: "If the button does not work, copy this link into your browser:",
};

export function renderMail(block: Block, brand: Brand): MailContent {
  const e = escapeHtml;
  const paragraphs = block.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${COLORS.fg}">${e(p)}</p>`)
    .join("");
  const button = block.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr>
<td style="border-radius:12px;background:${COLORS.brand}">
<a href="${e(block.button.url)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:#052e16;text-decoration:none;border-radius:12px">${e(block.button.label)}</a>
</td></tr></table>
<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:${COLORS.muted}">${e(BUTTON_FALLBACK[brand.locale])}</p>
<p style="margin:0 0 16px;font-size:12px;line-height:18px;word-break:break-all"><a href="${e(block.button.url)}" style="color:${COLORS.brandDark}">${e(block.button.url)}</a></p>`
    : "";
  const note = block.note
    ? `<p style="margin:0;font-size:13px;line-height:20px;color:${COLORS.muted}">${e(block.note)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="${brand.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(block.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(block.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="background:${COLORS.header};border-radius:16px 16px 0 0;padding:20px 28px">
<a href="${e(brand.appUrl)}" style="text-decoration:none">
<img src="${e(brand.appUrl)}/icons/icon-192.png" width="32" height="32" alt="" style="vertical-align:middle;border:0;border-radius:8px">
<span style="vertical-align:middle;margin-left:10px;font-size:18px;font-weight:800;color:#ffffff">${e(brand.siteName)}</span>
</a>
</td></tr>
<tr><td style="height:4px;background:${COLORS.brand};line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td style="background:${COLORS.surface};border:1px solid ${COLORS.line};border-top:0;border-radius:0 0 16px 16px;padding:32px 28px">
<h1 style="margin:0 0 20px;font-size:22px;line-height:30px;font-weight:800;color:${COLORS.fg}">${e(block.heading)}</h1>
${paragraphs}${button}${note}
</td></tr>
<tr><td style="padding:20px 8px;text-align:center;font-size:12px;line-height:18px;color:${COLORS.muted}">
${e(FOOTER[brand.locale](brand.siteName))}<br>
<a href="${e(brand.appUrl)}" style="color:${COLORS.muted}">${e(brand.appUrl.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    block.heading,
    "",
    ...block.paragraphs.flatMap((p) => [p, ""]),
    ...(block.button ? [`${block.button.label}: ${block.button.url}`, ""] : []),
    ...(block.note ? [block.note, ""] : []),
    "--",
    `${brand.siteName} · ${brand.appUrl}`,
  ].join("\n");

  return { subject: block.subject, html, text };
}

type Texts = {
  verifyEmail: (p: { username: string; url: string; site: string }) => Block;
  changeEmail: (p: { username: string; url: string; site: string; email: string }) => Block;
  emailChanged: (p: { username: string; site: string; email: string }) => Block;
  resetPassword: (p: { username: string; url: string; site: string }) => Block;
  passwordChanged: (p: { username: string; site: string }) => Block;
  twoFactor: (p: { username: string; site: string; enabled: boolean }) => Block;
};

const notYou: Record<Locale, string> = {
  de: "Warst du das nicht? Dann ändere bitte sofort dein Passwort oder antworte auf diese E-Mail.",
  en: "Wasn't you? Please change your password right away or reply to this e-mail.",
};

const TEXTS: Record<Locale, Texts> = {
  de: {
    verifyEmail: ({ username, url, site }) => ({
      subject: `Bestätige deine E-Mail-Adresse für ${site}`,
      preheader: "Nur noch ein Klick, dann kannst du deinen Server eintragen.",
      heading: `Willkommen, ${username}!`,
      paragraphs: [
        `Schön, dass du bei ${site} dabei bist. Bitte bestätige kurz deine E-Mail-Adresse, damit du Server eintragen kannst.`,
      ],
      button: { label: "E-Mail bestätigen", url },
      note: "Der Link ist 48 Stunden gültig. Du hast dich nicht registriert? Dann kannst du diese E-Mail ignorieren.",
    }),
    changeEmail: ({ username, url, email }) => ({
      subject: "Bestätige deine neue E-Mail-Adresse",
      preheader: `Bestätige ${email} als neue Adresse für deinen Account.`,
      heading: `Hallo ${username},`,
      paragraphs: [`du möchtest die E-Mail-Adresse deines Accounts auf ${email} ändern. Bestätige das mit einem Klick.`],
      button: { label: "Neue Adresse bestätigen", url },
      note: "Der Link ist 24 Stunden gültig. Bis dahin bleibt deine alte Adresse aktiv.",
    }),
    emailChanged: ({ username, email }) => ({
      subject: "Deine E-Mail-Adresse wird geändert",
      preheader: `Für deinen Account wurde ${email} als neue Adresse angefragt.`,
      heading: `Hallo ${username},`,
      paragraphs: [
        `für deinen Account wurde gerade ein Wechsel der E-Mail-Adresse auf ${email} angefragt. Die Änderung wird erst aktiv, wenn sie über einen Link an die neue Adresse bestätigt wird.`,
        notYou.de,
      ],
    }),
    resetPassword: ({ username, url }) => ({
      subject: "Passwort zurücksetzen",
      preheader: "Lege ein neues Passwort für deinen Account fest.",
      heading: `Hallo ${username},`,
      paragraphs: ["du hast angefragt, dein Passwort zurückzusetzen. Über den Button legst du ein neues fest."],
      button: { label: "Neues Passwort festlegen", url },
      note: "Der Link ist 1 Stunde gültig und funktioniert nur einmal. Du hast nichts angefragt? Dann ignoriere diese E-Mail, dein Passwort bleibt unverändert.",
    }),
    passwordChanged: ({ username }) => ({
      subject: "Dein Passwort wurde geändert",
      preheader: "Das Passwort deines Accounts wurde gerade geändert.",
      heading: `Hallo ${username},`,
      paragraphs: [
        "das Passwort deines Accounts wurde gerade geändert. Aus Sicherheitsgründen wurden alle anderen Geräte abgemeldet.",
        notYou.de,
      ],
    }),
    twoFactor: ({ username, enabled }) => ({
      subject: enabled ? "Zwei-Faktor-Authentifizierung aktiviert" : "Zwei-Faktor-Authentifizierung deaktiviert",
      preheader: enabled ? "Dein Account ist jetzt zusätzlich geschützt." : "Dein Account ist nicht mehr per 2FA geschützt.",
      heading: `Hallo ${username},`,
      paragraphs: [
        enabled
          ? "die Zwei-Faktor-Authentifizierung ist jetzt aktiv. Beim Anmelden fragen wir ab sofort zusätzlich nach dem Code aus deiner Authenticator-App. Bewahre deine Wiederherstellungscodes gut auf."
          : "die Zwei-Faktor-Authentifizierung wurde für deinen Account deaktiviert. Zum Anmelden reicht jetzt wieder dein Passwort.",
        notYou.de,
      ],
    }),
  },
  en: {
    verifyEmail: ({ username, url, site }) => ({
      subject: `Confirm your e-mail address for ${site}`,
      preheader: "One more click and you can add your server.",
      heading: `Welcome, ${username}!`,
      paragraphs: [`Great to have you on ${site}. Please confirm your e-mail address so you can add servers.`],
      button: { label: "Confirm e-mail", url },
      note: "The link is valid for 48 hours. Didn't sign up? Then you can ignore this e-mail.",
    }),
    changeEmail: ({ username, url, email }) => ({
      subject: "Confirm your new e-mail address",
      preheader: `Confirm ${email} as the new address of your account.`,
      heading: `Hi ${username},`,
      paragraphs: [`you want to change the e-mail address of your account to ${email}. Confirm it with one click.`],
      button: { label: "Confirm new address", url },
      note: "The link is valid for 24 hours. Your old address stays active until then.",
    }),
    emailChanged: ({ username, email }) => ({
      subject: "Your e-mail address is being changed",
      preheader: `${email} was requested as the new address of your account.`,
      heading: `Hi ${username},`,
      paragraphs: [
        `someone just requested to change the e-mail address of your account to ${email}. The change only takes effect once it is confirmed through a link sent to the new address.`,
        notYou.en,
      ],
    }),
    resetPassword: ({ username, url }) => ({
      subject: "Reset your password",
      preheader: "Choose a new password for your account.",
      heading: `Hi ${username},`,
      paragraphs: ["you asked to reset your password. Use the button to choose a new one."],
      button: { label: "Choose new password", url },
      note: "The link is valid for 1 hour and works only once. Didn't ask for this? Ignore this e-mail and your password stays the same.",
    }),
    passwordChanged: ({ username }) => ({
      subject: "Your password was changed",
      preheader: "The password of your account was just changed.",
      heading: `Hi ${username},`,
      paragraphs: [
        "the password of your account was just changed. For your security, all other devices were signed out.",
        notYou.en,
      ],
    }),
    twoFactor: ({ username, enabled }) => ({
      subject: enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
      preheader: enabled ? "Your account now has an extra layer of protection." : "Your account is no longer protected by 2FA.",
      heading: `Hi ${username},`,
      paragraphs: [
        enabled
          ? "two-factor authentication is now active. From now on we also ask for the code from your authenticator app when you sign in. Keep your recovery codes somewhere safe."
          : "two-factor authentication was turned off for your account. Your password alone is enough to sign in again.",
        notYou.en,
      ],
    }),
  },
};

type TemplateParams = {
  [K in keyof Texts]: Omit<Parameters<Texts[K]>[0], "site">;
};

export type MailTemplate = keyof Texts;

export function buildMail<K extends MailTemplate>(template: K, params: TemplateParams[K], brand: Brand): MailContent {
  const render = TEXTS[brand.locale][template] as (p: TemplateParams[K] & { site: string }) => Block;
  return renderMail(render({ ...params, site: brand.siteName }), brand);
}
