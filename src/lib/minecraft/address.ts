import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * Guards outgoing connections (status ping, Votifier) against pointing at
 * internal infrastructure. Set ALLOW_PRIVATE_ADDRESSES=true for local testing.
 */

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const PRIVATE_V4: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export function isPrivateAddress(ip: string) {
  if (net.isIPv4(ip)) {
    const value = ipv4ToInt(ip);
    return PRIVATE_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (value & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(lower);
  }
  return true;
}

export class AddressNotAllowedError extends Error {}

/**
 * Resolves a hostname to all IPs that are safe to connect to, IPv4 first: many hosts publish an
 * AAAA record, but Docker networks usually have no IPv6 route, so trying it first fails.
 */
export async function resolvePublicAddresses(host: string) {
  const allowPrivate = process.env.ALLOW_PRIVATE_ADDRESSES === "true";
  const addresses = net.isIP(host)
    ? [host]
    : (await dns.lookup(host, { all: true })).sort((a, b) => a.family - b.family).map((a) => a.address);
  const allowed = allowPrivate ? addresses : addresses.filter((ip) => !isPrivateAddress(ip));
  if (allowed.length === 0) {
    throw new AddressNotAllowedError(`${host} resolves to a private address`);
  }
  return allowed;
}

/** Resolves a hostname to an IP that is safe to connect to. */
export async function resolvePublicAddress(host: string) {
  return (await resolvePublicAddresses(host))[0];
}

const HOSTNAME_RE = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

export function isValidHost(host: string) {
  return net.isIP(host) !== 0 || HOSTNAME_RE.test(host);
}

/**
 * Splits a pasted "host:port" (or "[ipv6]:port") into its parts. Players copy addresses in
 * that form, so the address field accepts it instead of rejecting it as an invalid host.
 */
export function splitHostPort(input: string): { host: string; port: number | null } {
  const value = input.trim();
  const bracketed = /^\[([^\]]+)\](?::(\d{1,5}))?$/.exec(value);
  if (bracketed) return { host: bracketed[1], port: bracketed[2] ? Number(bracketed[2]) : null };
  // More than one colon without brackets is a bare IPv6 address.
  const match = /^([^:]+):(\d{1,5})$/.exec(value);
  if (match) return { host: match[1], port: Number(match[2]) };
  return { host: value, port: null };
}
