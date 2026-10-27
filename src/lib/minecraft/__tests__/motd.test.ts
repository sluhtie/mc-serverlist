import { describe, expect, it } from "vitest";
import { motdToPlainText, parseMotd } from "../motd";

describe("parseMotd", () => {
  it("parses legacy color codes", () => {
    expect(parseMotd("§aHello §lWorld")).toEqual([
      { text: "Hello ", color: "#55FF55" },
      { text: "World", color: "#55FF55", bold: true },
    ]);
  });

  it("parses JSON text components with inherited styles", () => {
    const segments = parseMotd({
      text: "",
      color: "gold",
      extra: [{ text: "A" }, { text: "B", color: "#123456", italic: true }],
    });
    expect(segments).toEqual([
      { text: "A", color: "#FFAA00" },
      { text: "B", color: "#123456", italic: true },
    ]);
  });

  it("accepts JSON strings and ignores unknown colors", () => {
    expect(parseMotd('{"text":"Hi","color":"not-a-color"}')).toEqual([{ text: "Hi" }]);
  });

  it("flattens to plain text", () => {
    expect(motdToPlainText(["§cRed", { text: " plain" }])).toBe("Red plain");
  });
});
