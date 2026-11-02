// Client for the useSend HTTP API (https://usesend.com, also self-hostable). Uses plain fetch
// instead of the SDK, because sending one mail is a single POST request.
import type { MailContent } from "./templates";

export type UseSendConfig = { apiKey: string; baseUrl: string };

export type UseSendMail = MailContent & { from: string; to: string };

/** Builds the request for POST /api/v1/emails. Pure, so it can be unit tested. */
export function buildUseSendRequest(config: UseSendConfig, mail: UseSendMail) {
  return {
    url: `${config.baseUrl.replace(/\/+$/, "")}/api/v1/emails`,
    init: {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mail.from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text }),
    } satisfies RequestInit,
  };
}

/** Reads the error message from a failed response without ever throwing. */
async function errorMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error: unknown }).error;
      if (typeof error === "string") return error;
      if (error && typeof error === "object" && "message" in error) return String(error.message);
    }
  } catch {
    // Not JSON, fall back to the status text.
  }
  return response.statusText || "unknown error";
}

/** Sends one mail and returns useSend's e-mail id. Throws with a readable message on failure. */
export async function sendWithUseSend(config: UseSendConfig, mail: UseSendMail, fetcher: typeof fetch = fetch) {
  const { url, init } = buildUseSendRequest(config, mail);
  const response = await fetcher(url, { ...init, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`useSend responded ${response.status}: ${await errorMessage(response)}`);
  }
  const data = (await response.json().catch(() => null)) as { emailId?: unknown } | null;
  return typeof data?.emailId === "string" ? data.emailId : null;
}
