// Operator details for the imprint (§ 5 DDG) and the privacy policy (Art. 13 GDPR).
// They come from LEGAL_* environment variables, so the public repository holds no personal data
// and every instance of the software shows its own operator.

export type LegalOperator = {
  name: string | null;
  /** Postal address, one entry per line. */
  address: string[];
  email: string | null;
  phone: string | null;
  /** Hosting provider as free text, e.g. "Example GmbH, Musterstraße 1, 12345 Berlin". */
  hosting: string | null;
  /** Mail provider used for SMTP, as free text. */
  mailProvider: string | null;
};

/** Everything the privacy policy texts need to describe this instance. */
export type PrivacyContext = {
  siteName: string;
  /** Contact e-mail, or null when only the imprint's other contact details exist. */
  email: string | null;
  hosting: string | null;
  mailProvider: string | null;
  turnstile: boolean;
};

export type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

const blank = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** Reads the LEGAL_* variables. The address is comma-separated: "Street 1, 12345 City". */
export function parseLegalOperator(source: Record<string, string | undefined>): LegalOperator {
  return {
    name: blank(source.LEGAL_NAME),
    address: (source.LEGAL_ADDRESS ?? "")
      .split(",")
      .map((line) => line.trim())
      .filter(Boolean),
    email: blank(source.LEGAL_EMAIL),
    phone: blank(source.LEGAL_PHONE),
    hosting: blank(source.LEGAL_HOSTING),
    mailProvider: blank(source.LEGAL_MAIL_PROVIDER),
  };
}

/** The imprint needs at least a name, a postal address and an e-mail address. */
export function isLegalOperatorComplete(operator: LegalOperator) {
  return Boolean(operator.name && operator.address.length > 0 && operator.email);
}
