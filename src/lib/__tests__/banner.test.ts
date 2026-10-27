import { describe, expect, it } from "vitest";
import { bannerTheme, hashString } from "../banner";

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("GommeHD")).toBe(hashString("GommeHD"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const input of ["", "x", "Ein sehr langer Servername mit Ümlauten"]) {
      const hash = hashString(input);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });
});

describe("bannerTheme", () => {
  it("returns the same theme for the same name, ignoring case", () => {
    expect(bannerTheme("CraftLand")).toEqual(bannerTheme("craftland"));
  });

  it("keeps hues out of the red range", () => {
    for (let i = 0; i < 200; i++) {
      const { hue } = bannerTheme(`server-${i}`);
      expect(hue).toBeGreaterThanOrEqual(30);
      expect(hue).toBeLessThan(330);
    }
  });

  it("produces columns within bounds", () => {
    const theme = bannerTheme("Skyblock Paradise", 30, 6);
    expect(theme.columns).toHaveLength(30);
    for (const h of theme.columns) {
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(6);
    }
  });
});
