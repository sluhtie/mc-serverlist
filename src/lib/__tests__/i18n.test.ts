import { describe, expect, it } from "vitest";
import { delocalizePath, localizePath } from "../i18n/config";
import { de } from "../i18n/dictionaries/de";
import { en } from "../i18n/dictionaries/en";
import { languageAlternates } from "../seo";

describe("localizePath", () => {
  it("leaves German paths unprefixed", () => {
    expect(localizePath("/server/foo", "de")).toBe("/server/foo");
    expect(localizePath("/", "de")).toBe("/");
  });

  it("prefixes English paths and keeps query and hash", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/?page=2", "en")).toBe("/en?page=2");
    expect(localizePath("/#ranking", "en")).toBe("/en#ranking");
    expect(localizePath("/server/foo/vote", "en")).toBe("/en/server/foo/vote");
  });

  it("translates localized segments", () => {
    expect(localizePath("/spielmodus", "en")).toBe("/en/gamemodes");
    expect(localizePath("/spielmodus/hide-and-seek?sort=players", "en")).toBe(
      "/en/gamemodes/hide-and-seek?sort=players",
    );
    // Only the first segment is a route name; a server called "spielmodus" keeps its slug.
    expect(localizePath("/server/spielmodus", "en")).toBe("/en/server/spielmodus");
  });

  it("does not touch external or protocol-relative URLs", () => {
    expect(localizePath("https://example.net/x", "en")).toBe("https://example.net/x");
    expect(localizePath("//evil.example", "en")).toBe("//evil.example");
  });
});

describe("delocalizePath", () => {
  it("maps public URLs back to internal paths", () => {
    expect(delocalizePath("/")).toEqual({ locale: "de", path: "/" });
    expect(delocalizePath("/spielmodus/survival")).toEqual({ locale: "de", path: "/spielmodus/survival" });
    expect(delocalizePath("/en")).toEqual({ locale: "en", path: "/" });
    expect(delocalizePath("/en/gamemodes/survival")).toEqual({ locale: "en", path: "/spielmodus/survival" });
    expect(delocalizePath("/en/server/foo")).toEqual({ locale: "en", path: "/server/foo" });
  });

  it("does not treat paths that merely start with the prefix as English", () => {
    expect(delocalizePath("/english")).toEqual({ locale: "de", path: "/english" });
  });

  it("round-trips with localizePath", () => {
    for (const path of ["/", "/spielmodus", "/spielmodus/bedwars", "/server/a/vote", "/login"]) {
      expect(delocalizePath(localizePath(path, "en")).path).toBe(path);
    }
  });
});

describe("languageAlternates", () => {
  it("lists every locale plus x-default", () => {
    expect(languageAlternates("/spielmodus")).toEqual({
      de: "/spielmodus",
      en: "/en/gamemodes",
      "x-default": "/spielmodus",
    });
  });
});

describe("dictionaries", () => {
  // TypeScript checks the shape; this catches copy-paste leftovers in the translation.
  it("has an English text for every German one", () => {
    const flatten = (value: unknown, prefix = ""): [string, unknown][] =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.entries(value).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
        : [[prefix, value]];
    const german = new Map(flatten(de));
    const english = flatten(en);
    expect(english.map(([key]) => key).sort()).toEqual([...german.keys()].sort());
    const identical = english.filter(([key, value]) => typeof value === "string" && value === german.get(key));
    // Words that are the same in both languages.
    const same = new Set([
      "meta.admin",
      "meta.rankingName",
      "nav.admin",
      "prefs.system",
      "footer.api",
      "common.online",
      "common.offline",
      "common.featured",
      "countries.US",
      "countries.INT",
      "home.rankingEyebrow",
      "home.versionLabel",
      "server.statPing",
      "server.motd",
      "server.version",
      "server.votifier",
      "server.website",
      "server.discord",
      "server.reportDetails",
      "serverForm.port",
      "serverForm.website",
      "markdown.link",
      "admin.statVotes",
      "admin.colServer",
      "admin.colStatus",
      "admin.colVotes",
      "admin.colFeatured",
      "admin.ok",
      "admin.roleAdmin",
      "admin.roleUser",
      "auth.code",
      "og.status",
    ]);
    expect(identical.map(([key]) => key).filter((key) => !same.has(key))).toEqual([]);
  });
});
