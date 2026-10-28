import { describe, expect, it } from "vitest";
import { isExternalRequest } from "../api-source";
import { dayKey, fillDays, nearestIndex, parseStatRange, percentChange } from "../charts";

describe("dayKey", () => {
  it("uses the Berlin calendar day", () => {
    expect(dayKey(new Date("2026-10-27T22:30:00Z"))).toBe("2026-10-27");
    expect(dayKey(new Date("2026-10-27T23:30:00Z"))).toBe("2026-10-28");
    expect(dayKey(new Date("2026-07-01T22:30:00Z"))).toBe("2026-07-02");
  });
});

describe("fillDays", () => {
  it("returns one point per day ending today and fills gaps with zero", () => {
    const points = fillDays([{ day: "2026-10-26", n: 4 }, { day: "2026-10-28", n: 2 }], 3, new Date("2026-10-28T10:00:00Z"));
    expect(points.map((p) => [dayKey(new Date(p.t)), p.v])).toEqual([
      ["2026-10-26", 4],
      ["2026-10-27", 0],
      ["2026-10-28", 2],
    ]);
  });

  it("counts late evening as the next Berlin day", () => {
    const points = fillDays([], 2, new Date("2026-10-27T23:30:00Z"));
    expect(points.map((p) => dayKey(new Date(p.t)))).toEqual(["2026-10-27", "2026-10-28"]);
  });

  it("does not skip or repeat days across a DST change", () => {
    const keys = fillDays([], 5, new Date("2026-10-27T12:00:00Z")).map((p) => dayKey(new Date(p.t)));
    expect(keys).toEqual(["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"]);
  });
});

describe("nearestIndex", () => {
  const points = [0, 10, 100].map((t) => ({ t, v: 1 }));

  it("picks by time for line charts", () => {
    expect(nearestIndex(points, 0.04, true)).toBe(0);
    expect(nearestIndex(points, 0.2, true)).toBe(1);
    expect(nearestIndex(points, 0.9, true)).toBe(2);
  });

  it("picks by slot for bar charts and clamps the edges", () => {
    expect(nearestIndex(points, 0.5, false)).toBe(1);
    expect(nearestIndex(points, 1, false)).toBe(2);
    expect(nearestIndex(points, -1, false)).toBe(0);
    expect(nearestIndex([], 0.5, false)).toBe(-1);
  });
});

describe("parseStatRange", () => {
  it("accepts known ranges and falls back to 30 days", () => {
    expect(parseStatRange("7")).toBe(7);
    expect(parseStatRange(["90"])).toBe(90);
    expect(parseStatRange("12")).toBe(30);
    expect(parseStatRange(undefined)).toBe(30);
  });
});

describe("percentChange", () => {
  it("compares with the previous period", () => {
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 10)).toBe(-50);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("isExternalRequest", () => {
  const app = "https://www.mc-serverlist.net";
  const req = (headers: Record<string, string>) => new Request("https://www.mc-serverlist.net/api/x", { headers });

  it("treats requests without origin or referer as external", () => {
    expect(isExternalRequest(req({}), app)).toBe(true);
  });

  it("recognizes our own pages with or without www", () => {
    expect(isExternalRequest(req({ referer: "https://www.mc-serverlist.net/server/foo" }), app)).toBe(false);
    expect(isExternalRequest(req({ origin: "https://mc-serverlist.net" }), app)).toBe(false);
  });

  it("counts other sites and broken headers as external", () => {
    expect(isExternalRequest(req({ referer: "https://example.net/" }), app)).toBe(true);
    expect(isExternalRequest(req({ referer: "not a url" }), app)).toBe(true);
  });
});
