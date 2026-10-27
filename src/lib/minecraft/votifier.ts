import crypto from "node:crypto";
import net from "node:net";
import { resolvePublicAddress } from "./address";

/**
 * Sends vote notifications to Votifier (v1, RSA) or NuVotifier (v2, token) listeners.
 * https://github.com/NuVotifier/NuVotifier/wiki/Technical-QA
 */

export type VotifierTarget = {
  host: string;
  port: number;
  protocol: "v1" | "v2";
  publicKey?: string | null;
  token?: string | null;
};

export type Vote = {
  serviceName: string;
  username: string;
  address: string;
  timestamp: number;
};

function toPem(key: string) {
  const trimmed = key.trim();
  if (trimmed.startsWith("-----BEGIN")) return trimmed;
  const body = trimmed.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}

export function buildV1Payload(vote: Vote, publicKey: string): Buffer {
  const message = `VOTE\n${vote.serviceName}\n${vote.username}\n${vote.address}\n${vote.timestamp}\n`;
  return crypto.publicEncrypt(
    { key: toPem(publicKey), padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(message, "utf8"),
  );
}

export function buildV2Payload(vote: Vote, token: string, challenge: string): Buffer {
  const payload = JSON.stringify({ ...vote, challenge });
  const signature = crypto.createHmac("sha256", token).update(payload).digest("base64");
  const message = Buffer.from(JSON.stringify({ payload, signature }), "utf8");
  const header = Buffer.alloc(4);
  header.writeUInt16BE(0x733a, 0);
  header.writeUInt16BE(message.length, 2);
  return Buffer.concat([header, message]);
}

export async function sendVote(target: VotifierTarget, vote: Vote, timeoutMs = 5000) {
  const address = await resolvePublicAddress(target.host);
  return new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: address, port: target.port });
    let greeting = "";
    let sent = false;
    let response = "";
    let done = false;

    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(timeoutMs, () => finish(new Error("Votifier timeout")));
    socket.on("error", (err) => finish(err));
    socket.on("close", () => {
      // v1 servers close the connection after reading the vote.
      if (sent && target.protocol === "v1") finish();
      else finish(new Error("Votifier closed the connection"));
    });

    socket.on("data", (chunk) => {
      if (!sent) {
        greeting += chunk.toString("utf8");
        if (!greeting.includes("\n")) return;
        const parts = greeting.trim().split(" ");
        try {
          if (target.protocol === "v2") {
            if (!target.token) throw new Error("Votifier token missing");
            const challenge = parts[2];
            if (!challenge) throw new Error("Server does not speak Votifier v2");
            socket.write(buildV2Payload(vote, target.token, challenge));
          } else {
            if (!target.publicKey) throw new Error("Votifier public key missing");
            socket.write(buildV1Payload(vote, target.publicKey), () => {
              sent = true;
              socket.end();
            });
            return;
          }
          sent = true;
        } catch (err) {
          finish(err as Error);
        }
        return;
      }
      response += chunk.toString("utf8");
      try {
        const parsed = JSON.parse(response) as { status?: string; cause?: string; error?: string };
        if (parsed.status === "ok") finish();
        else finish(new Error(parsed.cause || parsed.error || "Votifier rejected the vote"));
      } catch {
        // Wait for the rest of the JSON response.
      }
    });
  });
}
