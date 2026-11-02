import crypto from "node:crypto";
import net from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildV1Payload, buildV2Payload, classifyVotifierError, sendVote } from "../votifier";

const vote = { serviceName: "Test", username: "Notch", address: "1.2.3.4", timestamp: 1700000000000 };

describe("Votifier v2", () => {
  it("signs the payload with HMAC-SHA256", () => {
    const packet = buildV2Payload(vote, "secret", "challenge123");
    expect(packet.readUInt16BE(0)).toBe(0x733a);
    const length = packet.readUInt16BE(2);
    const message = JSON.parse(packet.subarray(4, 4 + length).toString());
    const payload = JSON.parse(message.payload);
    expect(payload).toMatchObject({ ...vote, challenge: "challenge123" });
    const expected = crypto.createHmac("sha256", "secret").update(message.payload).digest("base64");
    expect(message.signature).toBe(expected);
  });
});

describe("Votifier v1", () => {
  it("encrypts a block the private key can read", () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    const base64Key = publicKey.export({ type: "spki", format: "der" }).toString("base64");
    const block = buildV1Payload(vote, base64Key);
    expect(block.length).toBe(256);
    const plain = crypto
      .privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING }, block)
      .toString();
    expect(plain).toBe("VOTE\nTest\nNotch\n1.2.3.4\n1700000000000\n");
  });
});

describe("sendVote against a local listener", () => {
  const listen = (onConnect: (socket: net.Socket) => void) =>
    new Promise<net.Server>((resolve) => {
      const server = net.createServer(onConnect);
      server.listen(0, "127.0.0.1", () => resolve(server));
    });
  const portOf = (server: net.Server) => (server.address() as net.AddressInfo).port;

  beforeAll(() => {
    process.env.ALLOW_PRIVATE_ADDRESSES = "true";
  });
  afterAll(() => {
    delete process.env.ALLOW_PRIVATE_ADDRESSES;
  });

  it("resolves when a v2 listener answers ok", async () => {
    const server = await listen((socket) => {
      socket.write("VOTIFIER 2.7.3 abc\n");
      socket.once("data", () => socket.end(JSON.stringify({ status: "ok" })));
    });
    await expect(
      sendVote({ host: "127.0.0.1", port: portOf(server), protocol: "v2", token: "t" }, vote),
    ).resolves.toBeUndefined();
    server.close();
  });

  it("passes the listener's reason on when it rejects the vote", async () => {
    const server = await listen((socket) => {
      socket.write("VOTIFIER 2.7.3 abc\n");
      socket.once("data", () =>
        socket.end(JSON.stringify({ status: "error", cause: "X", error: "Signature is not valid (invalid token?)" })),
      );
    });
    const err = await sendVote({ host: "127.0.0.1", port: portOf(server), protocol: "v2", token: "t" }, vote).catch(
      (e: unknown) => e,
    );
    expect(classifyVotifierError(err)).toEqual({
      kind: "rejected",
      detail: "Signature is not valid (invalid token?)",
    });
    server.close();
  });

  it("detects a port that does not speak Votifier", async () => {
    const server = await listen((socket) => socket.write("SSH-2.0-OpenSSH_9.6\r\n"));
    const err = await sendVote({ host: "127.0.0.1", port: portOf(server), protocol: "v2", token: "t" }, vote).catch(
      (e: unknown) => e,
    );
    expect(classifyVotifierError(err).kind).toBe("notVotifier");
    server.close();
  });

  it("reports an invalid v1 public key", async () => {
    const server = await listen((socket) => socket.write("VOTIFIER 1.9\n"));
    const err = await sendVote(
      { host: "127.0.0.1", port: portOf(server), protocol: "v1", publicKey: "not-a-key" },
      vote,
    ).catch((e: unknown) => e);
    expect(classifyVotifierError(err).kind).toBe("badKey");
    server.close();
  });

  it("classifies a closed port as refused", async () => {
    const server = await listen(() => {});
    const port = portOf(server);
    await new Promise((resolve) => server.close(resolve));
    const err = await sendVote({ host: "127.0.0.1", port, protocol: "v2", token: "t" }, vote).catch(
      (e: unknown) => e,
    );
    expect(classifyVotifierError(err).kind).toBe("refused");
  });

  it("blocks private addresses by default", async () => {
    delete process.env.ALLOW_PRIVATE_ADDRESSES;
    const err = await sendVote({ host: "10.0.0.1", port: 8192, protocol: "v2", token: "t" }, vote).catch(
      (e: unknown) => e,
    );
    expect(classifyVotifierError(err).kind).toBe("privateAddress");
    process.env.ALLOW_PRIVATE_ADDRESSES = "true";
  });
});
