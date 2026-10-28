import { afterEach, describe, expect, it, vi } from "vitest";

const lookup = vi.fn();
vi.mock("node:dns", () => ({ promises: { lookup: (...args: unknown[]) => lookup(...args) } }));

const { resolvePublicAddresses, AddressNotAllowedError } = await import("../address");

afterEach(() => lookup.mockReset());

describe("resolvePublicAddresses", () => {
  it("puts IPv4 before IPv6", async () => {
    lookup.mockResolvedValue([
      { address: "2a01:4f8::1", family: 6 },
      { address: "92.62.241.67", family: 4 },
    ]);
    expect(await resolvePublicAddresses("statelight.de")).toEqual(["92.62.241.67", "2a01:4f8::1"]);
  });

  it("drops private addresses and keeps public ones", async () => {
    lookup.mockResolvedValue([
      { address: "10.0.0.5", family: 4 },
      { address: "1.1.1.1", family: 4 },
    ]);
    expect(await resolvePublicAddresses("mixed.example.net")).toEqual(["1.1.1.1"]);
  });

  it("rejects hosts that only resolve to private addresses", async () => {
    lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    await expect(resolvePublicAddresses("evil.example.net")).rejects.toBeInstanceOf(AddressNotAllowedError);
  });

  it("does not look up IP literals", async () => {
    expect(await resolvePublicAddresses("1.2.3.4")).toEqual(["1.2.3.4"]);
    expect(lookup).not.toHaveBeenCalled();
  });
});
