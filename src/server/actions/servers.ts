"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import { COUNTRIES, MAX_TAGS, REPORT_REASONS, TAGS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { fieldErrorsFrom, str, type FormState } from "@/lib/form";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getDictionary, localRedirect } from "@/lib/i18n/server";
import { isValidHost, splitHostPort } from "@/lib/minecraft/address";
import { pingServer } from "@/lib/minecraft/ping";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/security";
import { uniqueSlug } from "@/lib/servers";
import { refreshServerStatus } from "@/server/status";

const { servers } = schema;

// Built per request, so validation messages come in the visitor's language.
function serverSchema(t: Dictionary) {
  const optionalUrl = z
    .string()
    .max(255)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), t.errors.httpOnly)
    .transform((v) => v || null);

  return z
    .object({
      name: z.string().min(3, t.errors.minChars(3)).max(64, t.errors.maxChars(64)),
      host: z.string().toLowerCase().refine(isValidHost, t.errors.invalidHost),
      port: z.coerce.number().int().min(1).max(65535),
      shortDescription: z.string().min(10, t.errors.minChars(10)).max(160, t.errors.maxChars(160)),
      description: z.string().max(5000, t.errors.maxChars(5000)),
      website: optionalUrl,
      discord: optionalUrl,
      bannerUrl: optionalUrl,
      country: z
        .string()
        .refine((v) => v === "" || COUNTRIES.some((c) => c === v), t.errors.invalidCountry)
        .transform((v) => v || null),
      tags: z.array(z.enum(TAGS)).max(MAX_TAGS, t.errors.maxTags(MAX_TAGS)),
      votifierEnabled: z.boolean(),
      votifierHost: z.string().max(255),
      votifierPort: z.coerce.number().int().min(1).max(65535).optional(),
      votifierProtocol: z.enum(["v1", "v2"]),
      votifierPublicKey: z.string().max(2000),
      votifierToken: z.string().max(255),
      bedrockEnabled: z.boolean(),
      bedrockHost: z.string().toLowerCase().max(255),
      bedrockPort: z.coerce.number().int().min(1).max(65535),
    })
    .superRefine((data, ctx) => {
      if (data.bedrockEnabled && data.bedrockHost && !isValidHost(data.bedrockHost)) {
        ctx.addIssue({ code: "custom", path: ["bedrockHost"], message: t.errors.invalidAddress });
      }
      if (!data.votifierEnabled) return;
      if (data.votifierHost && !isValidHost(data.votifierHost)) {
        ctx.addIssue({ code: "custom", path: ["votifierHost"], message: t.errors.invalidAddress });
      }
      if (!data.votifierPort) {
        ctx.addIssue({ code: "custom", path: ["votifierPort"], message: t.errors.portMissing });
      }
      if (data.votifierProtocol === "v1" && !data.votifierPublicKey) {
        ctx.addIssue({ code: "custom", path: ["votifierPublicKey"], message: t.errors.keyMissing });
      }
      if (data.votifierProtocol === "v2" && !data.votifierToken) {
        ctx.addIssue({ code: "custom", path: ["votifierToken"], message: t.errors.tokenMissing });
      }
    });
}

type ServerInput = z.infer<ReturnType<typeof serverSchema>>;

function parseServerForm(formData: FormData, t: Dictionary) {
  // A port typed into the address field ("play.example.net:25603") wins over the port field.
  const address = splitHostPort(str(formData, "host"));
  const bedrock = splitHostPort(str(formData, "bedrockHost"));
  return serverSchema(t).safeParse({
    name: str(formData, "name"),
    host: address.host,
    port: address.port ?? (str(formData, "port") || 25565),
    shortDescription: str(formData, "shortDescription"),
    description: str(formData, "description"),
    website: str(formData, "website"),
    discord: str(formData, "discord"),
    bannerUrl: str(formData, "bannerUrl"),
    country: str(formData, "country"),
    tags: formData.getAll("tags").map(String),
    votifierEnabled: formData.get("votifierEnabled") === "on",
    votifierHost: str(formData, "votifierHost"),
    votifierPort: str(formData, "votifierPort") || undefined,
    votifierProtocol: str(formData, "votifierProtocol") || "v2",
    votifierPublicKey: str(formData, "votifierPublicKey"),
    votifierToken: str(formData, "votifierToken"),
    bedrockEnabled: formData.get("bedrockEnabled") === "on",
    bedrockHost: bedrock.host,
    bedrockPort: bedrock.port ?? (str(formData, "bedrockPort") || 19132),
  });
}

function toColumns(data: ServerInput) {
  return {
    name: data.name,
    host: data.host,
    port: data.port,
    shortDescription: data.shortDescription,
    description: data.description,
    website: data.website,
    discord: data.discord,
    bannerUrl: data.bannerUrl,
    country: data.country,
    tags: data.tags,
    votifierEnabled: data.votifierEnabled,
    votifierHost: data.votifierEnabled ? data.votifierHost || data.host : null,
    votifierPort: data.votifierEnabled ? (data.votifierPort ?? null) : null,
    votifierProtocol: data.votifierProtocol,
    votifierPublicKey: data.votifierEnabled ? data.votifierPublicKey || null : null,
    votifierToken: data.votifierEnabled ? data.votifierToken || null : null,
    bedrockEnabled: data.bedrockEnabled,
    // Empty means "same as the Java address", resolved when the page renders.
    bedrockHost: data.bedrockEnabled ? data.bedrockHost || null : null,
    bedrockPort: data.bedrockEnabled ? data.bedrockPort : null,
  };
}

// These come back when nothing listens or a firewall drops/rejects us, not from a wrong address.
const BLOCKED_ERROR = /EHOSTUNREACH|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|timeout/;

function unreachableMessage(t: Dictionary, error: string, fallback: (error: string) => string) {
  return BLOCKED_ERROR.test(error) ? t.errors.unreachableBlocked(error) : fallback(error);
}

async function addressTaken(host: string, port: number, ignoreId?: string) {
  const conditions = [sql`lower(${servers.host}) = ${host}`, eq(servers.port, port)];
  if (ignoreId) conditions.push(ne(servers.id, ignoreId));
  const rows = await db.select({ id: servers.id }).from(servers).where(and(...conditions)).limit(1);
  return rows.length > 0;
}

export async function createServer(_prev: FormState, formData: FormData): Promise<FormState> {
  const [user, t] = await Promise.all([requireUser("/submit"), getDictionary()]);
  // Confirmed addresses keep throwaway accounts from flooding the list.
  if (!user.emailVerified) return { error: t.errors.emailNotVerified };
  if (!rateLimit(`submit:${user.id}`, 5, 60 * 60 * 1000)) {
    return { error: t.errors.tooManySubmissions };
  }
  const parsed = parseServerForm(formData, t);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const data = parsed.data;

  if (await addressTaken(data.host, data.port)) {
    return { fieldErrors: { host: t.errors.alreadyListed } };
  }

  // Only accept servers that actually answer, otherwise the list fills up with dead entries.
  const status = await pingServer(data.host, data.port);
  if (!status.online) {
    return {
      fieldErrors: { host: unreachableMessage(t, status.error, t.errors.unreachable) },
    };
  }

  const [created] = await db
    .insert(servers)
    .values({ ...toColumns(data), slug: await uniqueSlug(data.name), ownerId: user.id })
    .returning({ id: servers.id, slug: servers.slug, host: servers.host, port: servers.port });

  await refreshServerStatus(created);
  revalidatePath("/");
  return localRedirect(`/server/${created.slug}?created=1`);
}

async function loadEditable(id: string, user: SessionUser) {
  const [server] = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  if (!server) return null;
  if (server.ownerId !== user.id && user.role !== "admin") return null;
  return server;
}

export async function updateServer(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData, "id");
  const [user, t] = await Promise.all([requireUser(`/account`), getDictionary()]);
  const server = await loadEditable(id, user);
  if (!server) return { error: t.errors.noPermission };

  const parsed = parseServerForm(formData, t);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const data = parsed.data;

  const addressChanged = data.host !== server.host.toLowerCase() || data.port !== server.port;
  if (addressChanged) {
    if (await addressTaken(data.host, data.port, server.id)) {
      return { fieldErrors: { host: t.errors.alreadyListed } };
    }
    const status = await pingServer(data.host, data.port);
    if (!status.online) {
      return { fieldErrors: { host: unreachableMessage(t, status.error, t.errors.unreachableShort) } };
    }
  }

  const slug = data.name !== server.name ? await uniqueSlug(data.name, server.id) : server.slug;
  await db
    .update(servers)
    .set({ ...toColumns(data), slug, updatedAt: new Date() })
    .where(eq(servers.id, server.id));
  if (addressChanged) await refreshServerStatus({ id: server.id, host: data.host, port: data.port });

  revalidatePath("/");
  revalidatePath(`/server/${slug}`);
  return localRedirect(`/server/${slug}`);
}

export async function deleteServer(formData: FormData) {
  const user = await requireUser("/account");
  const server = await loadEditable(str(formData, "id"), user);
  if (!server) return;
  await db.delete(servers).where(eq(servers.id, server.id));
  revalidatePath("/");
  await localRedirect(user.role === "admin" && server.ownerId !== user.id ? "/admin/servers" : "/account");
}

export async function refreshStatusNow(formData: FormData) {
  const user = await requireUser("/account");
  const server = await loadEditable(str(formData, "id"), user);
  if (!server) return;
  if (!rateLimit(`refresh:${server.id}`, 1, 60 * 1000)) return;
  await refreshServerStatus(server);
  revalidatePath(`/server/${server.slug}`);
}

const reportSchema = (t: Dictionary) =>
  z.object({
    serverId: z.uuid(),
    reason: z.string().refine((v) => REPORT_REASONS.some((r) => r === v), t.errors.chooseReason),
    message: z.string().max(1000, t.errors.maxChars(1000)),
  });

export async function reportServer(_prev: FormState, formData: FormData): Promise<FormState> {
  const [ip, t] = await Promise.all([getClientIp(), getDictionary()]);
  if (!rateLimit(`report:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: t.errors.tooManyReports };
  }
  const parsed = reportSchema(t).safeParse({
    serverId: str(formData, "serverId"),
    reason: str(formData, "reason"),
    message: str(formData, "message"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const user = await getCurrentUser();
  await db.insert(schema.reports).values({ ...parsed.data, reporterId: user?.id ?? null });
  return { success: t.errors.reportThanks };
}
