import { describe, expect, it } from "vitest";
import { buildMail, escapeHtml } from "../templates";

const brand = { siteName: "MCServerlist", appUrl: "https://www.mc-serverlist.net" };

describe("escapeHtml", () => {
  it("escapes markup and quotes", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("buildMail", () => {
  const url = "https://www.mc-serverlist.net/verify-email?token=abc";

  it("renders the verification mail in German", () => {
    const mail = buildMail("verifyEmail", { username: "Steve", url }, { ...brand, locale: "de" });
    expect(mail.subject).toBe("Bestätige deine E-Mail-Adresse für MCServerlist");
    expect(mail.html).toContain('<html lang="de">');
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.html).toContain("E-Mail bestätigen");
    expect(mail.text).toContain(`E-Mail bestätigen: ${url}`);
    expect(mail.text).toContain("Willkommen, Steve!");
  });

  it("renders the same mail in English", () => {
    const mail = buildMail("verifyEmail", { username: "Steve", url }, { ...brand, locale: "en" });
    expect(mail.subject).toBe("Confirm your e-mail address for MCServerlist");
    expect(mail.html).toContain('<html lang="en">');
    expect(mail.html).toContain("Confirm e-mail");
  });

  it("escapes user-controlled values in the HTML part", () => {
    const mail = buildMail(
      "emailChanged",
      { username: "<script>x</script>", email: "a@b.c" },
      { ...brand, locale: "en" },
    );
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    // Plain text needs no escaping.
    expect(mail.text).toContain("Hi <script>x</script>,");
  });

  it("leaves out the button when a mail has none", () => {
    const mail = buildMail("passwordChanged", { username: "Alex" }, { ...brand, locale: "de" });
    expect(mail.html).not.toContain("Falls der Button nicht funktioniert");
    expect(mail.subject).toBe("Dein Passwort wurde geändert");
  });

  it("switches the 2FA mail between enabled and disabled", () => {
    const on = buildMail("twoFactor", { username: "Alex", enabled: true }, { ...brand, locale: "de" });
    const off = buildMail("twoFactor", { username: "Alex", enabled: false }, { ...brand, locale: "de" });
    expect(on.subject).toContain("aktiviert");
    expect(off.subject).toContain("deaktiviert");
  });
});
