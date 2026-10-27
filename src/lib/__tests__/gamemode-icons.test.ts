import { describe, expect, it } from "vitest";
import { TAGS } from "../constants";
import { GAMEMODE_ICONS, ICON_PALETTE, ICON_SIZE } from "../gamemode-icons";

describe("GAMEMODE_ICONS", () => {
  it("has an icon for every tag", () => {
    expect(Object.keys(GAMEMODE_ICONS).sort()).toEqual([...TAGS].sort());
  });

  it.each(Object.entries(GAMEMODE_ICONS))("%s is a square grid using palette colors", (_, rows) => {
    expect(rows).toHaveLength(ICON_SIZE);
    for (const row of rows) {
      expect(row).toHaveLength(ICON_SIZE);
      for (const char of row) {
        if (char !== ".") expect(ICON_PALETTE).toHaveProperty(char);
      }
    }
  });
});
