import { describe, expect, it } from "vitest";
import { isPrivateAddress, isValidHost, splitHostPort } from "../address";

describe("isPrivateAddress", () => {
  it.each(["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.20.0.1", "169.254.1.1", "::1", "fd00::1", "::ffff:10.0.0.1"])(
    "blocks %s",
    (ip) => expect(isPrivateAddress(ip)).toBe(true),
  );
  it.each(["1.1.1.1", "116.202.0.1", "2a01:4f8::1"])("allows %s", (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe("isValidHost", () => {
  it.each(["play.example.net", "mc.hypixel.net", "1.2.3.4"])("accepts %s", (h) =>
    expect(isValidHost(h)).toBe(true),
  );
  it.each(["localhost", "foo", "-bad.com", "a b.com", "http://x.com"])("rejects %s", (h) =>
    expect(isValidHost(h)).toBe(false),
  );
});

describe("splitHostPort", () => {
  it.each([
    ["statelight.de:25603", { host: "statelight.de", port: 25603 }],
    [" play.example.net ", { host: "play.example.net", port: null }],
    ["1.2.3.4:19132", { host: "1.2.3.4", port: 19132 }],
    ["[2a01:4f8::1]:25570", { host: "2a01:4f8::1", port: 25570 }],
    ["2a01:4f8::1", { host: "2a01:4f8::1", port: null }],
    ["play.example.net:abc", { host: "play.example.net:abc", port: null }],
  ])("splits %s", (input, expected) => expect(splitHostPort(input)).toEqual(expected));
});
