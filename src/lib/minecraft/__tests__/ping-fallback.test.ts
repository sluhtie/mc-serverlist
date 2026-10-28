import net from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { encodeVarInt } from "../ping";

const lookup = vi.fn();
vi.mock("node:dns", () => ({
  promises: { lookup: (...args: unknown[]) => lookup(...args), resolveSrv: vi.fn() },
}));

const { pingServer } = await import("../ping");

function packet(id: number, payload: Buffer) {
  const body = Buffer.concat([encodeVarInt(id), payload]);
  return Buffer.concat([encodeVarInt(body.length), body]);
}

// Answers every status request with a fixed response, like a minimal Minecraft server.
const server = net.createServer((socket) => {
  socket.once("data", () => {
    const json = Buffer.from(JSON.stringify({ version: { name: "1.21.4", protocol: 769 }, players: { online: 3, max: 50 } }));
    socket.write(packet(0x00, Buffer.concat([encodeVarInt(json.length), json])));
  });
  socket.on("error", () => {});
});
let port = 0;

beforeAll(async () => {
  vi.stubEnv("ALLOW_PRIVATE_ADDRESSES", "true");
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as net.AddressInfo).port;
});

afterAll(() => {
  vi.unstubAllEnvs();
  server.close();
});

describe("pingServer with several A records", () => {
  it("skips addresses that refuse the connection", async () => {
    // Nothing listens on 127.0.0.2, so the first address fails like a dead node of a DNS pool.
    lookup.mockResolvedValue([
      { address: "127.0.0.2", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    const result = await pingServer("pool.example.net", port, 2000);
    expect(result).toMatchObject({ online: true, playersOnline: 3, playersMax: 50 });
  });

  it("reports the last error when no address answers", async () => {
    lookup.mockResolvedValue([{ address: "127.0.0.2", family: 4 }]);
    const result = await pingServer("dead.example.net", port, 2000);
    expect(result.online).toBe(false);
  });
});
