import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";
import { safeMarkdownUrl } from "../markdown";

const render = (source: string) => renderToStaticMarkup(createElement(Markdown, null, source));

describe("safeMarkdownUrl", () => {
  it("allows http(s) and mailto links", () => {
    expect(safeMarkdownUrl("https://example.net/a?b=c", "href")).toBe("https://example.net/a?b=c");
    expect(safeMarkdownUrl("http://example.net", "href")).toBe("http://example.net/");
    expect(safeMarkdownUrl("mailto:team@example.net", "href")).toBe("mailto:team@example.net");
  });

  it("drops dangerous and relative URLs", () => {
    for (const url of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "vbscript:x", "/admin", "#top", ""]) {
      expect(safeMarkdownUrl(url, "href")).toBeNull();
    }
  });

  it("only allows https images", () => {
    expect(safeMarkdownUrl("https://example.net/a.png", "src")).toBe("https://example.net/a.png");
    expect(safeMarkdownUrl("http://example.net/a.png", "src")).toBeNull();
    expect(safeMarkdownUrl("data:image/png;base64,AAAA", "src")).toBeNull();
  });
});

describe("Markdown", () => {
  it("renders basic formatting", () => {
    const html = render("# Titel\n\n**fett** und *kursiv*\n\n- eins\n- zwei");
    expect(html).toContain("<h3");
    expect(html).toContain("<strong");
    expect(html).toContain("<em>kursiv</em>");
    expect(html).toContain("<li>eins</li>");
  });

  it("keeps single line breaks", () => {
    expect(render("Zeile 1\nZeile 2")).toContain("<br/>");
  });

  it("never renders raw HTML", () => {
    const html = render('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\nHallo <b>Welt</b>');
    expect(html).not.toMatch(/<script|<b>|onerror/);
    expect(html).toContain("Hallo");
  });

  it("strips javascript: links and marks links as user content", () => {
    expect(render("[klick](javascript:alert(1))")).not.toContain("javascript:");
    const html = render("[Discord](https://discord.gg/abc)");
    expect(html).toContain('href="https://discord.gg/abc"');
    expect(html).toContain('rel="noopener noreferrer nofollow ugc"');
  });

  it("renders GFM tables and strikethrough", () => {
    const html = render("| Rang | Preis |\n| --- | --- |\n| VIP | 5 € |\n\n~~alt~~");
    expect(html).toContain("<table");
    expect(html).toContain("<del");
  });
});
