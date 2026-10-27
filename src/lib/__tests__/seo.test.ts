import { describe, expect, it } from "vitest";
import { TAGS } from "../constants";
import { jsonLd, truncate } from "../seo";
import { LOCALES } from "../i18n/config";
import { tagDescription, tagFromSlug, tagHref, tagSlug } from "../tags";

describe("truncate", () => {
  it("keeps short text and collapses whitespace", () => {
    expect(truncate("  Ein   kurzer\nText ")).toBe("Ein kurzer Text");
  });

  it("cuts long text on a word boundary", () => {
    const result = truncate("Survival Server mit Freunden und Community", 25);
    expect(result).toBe("Survival Server mit…");
    expect(result.length).toBeLessThanOrEqual(25);
  });

  it("cuts inside a word when there is no space to break on", () => {
    expect(truncate("a".repeat(30), 10)).toBe(`${"a".repeat(9)}…`);
  });
});

describe("jsonLd", () => {
  it("escapes < so user content cannot close the script tag", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("game mode slugs", () => {
  it("round-trips every tag through a unique, URL-safe slug", () => {
    const slugs = TAGS.map(tagSlug);
    expect(new Set(slugs).size).toBe(TAGS.length);
    for (const tag of TAGS) {
      expect(tagSlug(tag)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(tagFromSlug(tagSlug(tag))).toBe(tag);
    }
  });

  it("builds landing page paths", () => {
    expect(tagHref("Hide and Seek")).toBe("/spielmodus/hide-and-seek");
    expect(tagFromSlug("unknown")).toBeUndefined();
  });

  it("has a description for every tag in every locale", () => {
    for (const locale of LOCALES) {
      for (const tag of TAGS) expect(tagDescription(tag, locale).length).toBeGreaterThan(80);
    }
    expect(tagDescription("Survival", "en")).not.toBe(tagDescription("Survival", "de"));
  });
});
