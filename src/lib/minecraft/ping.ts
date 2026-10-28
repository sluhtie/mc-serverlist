import { promises as dns } from "node:dns";
import net from "node:net";
import { resolvePublicAddresses } from "./address";

/**
 * Minimal implementation of the Java Edition Server List Ping protocol (1.7+).
 * https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping
 */

export type PingResult = {
  online: true;
  version: string | null;
  protocol: number | null;
  playersOnline: number;
  playersMax: number;
  motd: unknown;
  favicon: string | null;
  latencyMs: number;
};

export type PingFailure = { online: false; error: string };

const DEFAULT_PORT = 25565;
const MAX_RESPONSE_BYTES = 1024 * 1024;

export function encodeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (v !== 0);
  return Buffer.from(bytes);
}

/** Returns the decoded value and how many bytes it used, or null if the buffer is incomplete. */
export function decodeVarInt(buf: Buffer, offset = 0): { value: number; size: number } | null {
  let value = 0;
  let size = 0;
  while (true) {
    if (offset + size >= buf.length) return null;
    const byte = buf[offset + size];
    value |= (byte & 0x7f) << (7 * size);
    size++;
    if (size > 5) throw new Error("VarInt too big");
    if ((byte & 0x80) === 0) return { value, size };
  }
}

function encodeString(value: string): Buffer {
  const data = Buffer.from(value, "utf8");
  return Buffer.concat([encodeVarInt(data.length), data]);
}

function packet(id: number, payload: Buffer): Buffer {
  const body = Buffer.concat([encodeVarInt(id), payload]);
  return Buffer.concat([encodeVarInt(body.length), body]);
}

function isIp(host: string) {
  return net.isIP(host) !== 0;
}

/** Resolves `_minecraft._tcp` SRV records the same way the vanilla client does. */
export async function resolveAddress(host: string, port: number) {
  if (port !== DEFAULT_PORT || isIp(host)) return { host, port };
  try {
    const records = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    if (records.length > 0) {
      records.sort((a, b) => a.priority - b.priority || b.weight - a.weight);
      return { host: records[0].name, port: records[0].port };
    }
  } catch {
    // No SRV record: connect directly.
  }
  return { host, port };
}

// Caps how long a host with many records can keep the status worker busy.
const MAX_ADDRESSES = 3;

export async function pingServer(
  host: string,
  port = DEFAULT_PORT,
  timeoutMs = 5000,
): Promise<PingResult | PingFailure> {
  let target: { addresses: string[]; port: number };
  try {
    const resolved = await resolveAddress(host, port);
    target = { addresses: await resolvePublicAddresses(resolved.host), port: resolved.port };
  } catch (err) {
    return { online: false, error: (err as Error).message };
  }

  // Like the vanilla client, fall through to the next address when one cannot be reached.
  let result: PingResult | PingFailure = { online: false, error: "no address" };
  for (const address of target.addresses.slice(0, MAX_ADDRESSES)) {
    result = await pingAddress(address, target.port, host, port, timeoutMs);
    if (result.online) return result;
  }
  return result;
}

function pingAddress(
  address: string,
  targetPort: number,
  host: string,
  port: number,
  timeoutMs: number,
): Promise<PingResult | PingFailure> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: address, port: targetPort });
    let buffer = Buffer.alloc(0);
    let settled = false;
    let sentAt = 0;

    const finish = (result: PingResult | PingFailure) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs, () => finish({ online: false, error: "timeout" }));
    socket.on("error", (err) => finish({ online: false, error: err.message }));
    socket.on("close", () => finish({ online: false, error: "connection closed" }));

    socket.on("connect", () => {
      const portBuf = Buffer.alloc(2);
      portBuf.writeUInt16BE(port);
      const handshake = packet(
        0x00,
        Buffer.concat([
          encodeVarInt(-1), // protocol version: -1 asks the server for its own version
          encodeString(host), // the original hostname, needed by proxies with virtual hosts
          portBuf,
          encodeVarInt(1), // next state: status
        ]),
      );
      sentAt = Date.now();
      socket.write(Buffer.concat([handshake, packet(0x00, Buffer.alloc(0))]));
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length > MAX_RESPONSE_BYTES) {
        finish({ online: false, error: "response too large" });
        return;
      }
      try {
        const length = decodeVarInt(buffer);
        if (!length || buffer.length < length.size + length.value) return;
        let offset = length.size;
        const id = decodeVarInt(buffer, offset);
        if (!id) return;
        offset += id.size;
        if (id.value !== 0x00) {
          finish({ online: false, error: `unexpected packet ${id.value}` });
          return;
        }
        const strLen = decodeVarInt(buffer, offset);
        if (!strLen) return;
        offset += strLen.size;
        const json = buffer.subarray(offset, offset + strLen.value).toString("utf8");
        finish(parseStatus(json, Date.now() - sentAt));
      } catch (err) {
        finish({ online: false, error: (err as Error).message });
      }
    });
  });
}

type StatusJson = {
  version?: { name?: string; protocol?: number };
  players?: { online?: number; max?: number };
  description?: unknown;
  favicon?: string;
};

export function parseStatus(json: string, latencyMs: number): PingResult | PingFailure {
  let data: StatusJson;
  try {
    data = JSON.parse(json) as StatusJson;
  } catch {
    return { online: false, error: "invalid status json" };
  }
  const favicon =
    typeof data.favicon === "string" && data.favicon.startsWith("data:image/png;base64,")
      ? data.favicon
      : null;
  return {
    online: true,
    version: data.version?.name?.slice(0, 128) ?? null,
    protocol: data.version?.protocol ?? null,
    playersOnline: Math.max(0, Number(data.players?.online) || 0),
    playersMax: Math.max(0, Number(data.players?.max) || 0),
    motd: data.description ?? "",
    favicon,
    latencyMs,
  };
}
