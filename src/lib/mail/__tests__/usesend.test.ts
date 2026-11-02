import { describe, expect, it, vi } from "vitest";
import { buildUseSendRequest, sendWithUseSend } from "../usesend";

const config = { apiKey: "us_test", baseUrl: "https://mail.example.com/" };
const mail = {
  from: "MCServerlist <noreply@mc-serverlist.net>",
  to: "steve@example.com",
  subject: "Hallo",
  html: "<p>Hallo</p>",
  text: "Hallo",
};

describe("buildUseSendRequest", () => {
  it("posts the mail as JSON with the API key", () => {
    const { url, init } = buildUseSendRequest(config, mail);
    expect(url).toBe("https://mail.example.com/api/v1/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer us_test");
    expect(JSON.parse(init.body)).toEqual(mail);
  });
});

describe("sendWithUseSend", () => {
  it("returns the e-mail id", async () => {
    const fetcher = vi.fn(async () => Response.json({ emailId: "em_1" }));
    await expect(sendWithUseSend(config, mail, fetcher)).resolves.toBe("em_1");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("throws with useSend's error message", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ error: { code: "FORBIDDEN", message: "Domain not verified" } }, { status: 403 }),
    );
    await expect(sendWithUseSend(config, mail, fetcher)).rejects.toThrow("useSend responded 403: Domain not verified");
  });

  it("falls back to the status text when the body is not JSON", async () => {
    const fetcher = vi.fn(async () => new Response("oops", { status: 502, statusText: "Bad Gateway" }));
    await expect(sendWithUseSend(config, mail, fetcher)).rejects.toThrow("useSend responded 502: Bad Gateway");
  });
});
