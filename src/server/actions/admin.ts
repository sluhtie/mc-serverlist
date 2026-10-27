"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { str } from "@/lib/form";

const { servers, users, reports, sessions } = schema;

export async function setPublished(formData: FormData) {
  await requireAdmin();
  await db
    .update(servers)
    .set({ published: formData.get("published") === "true" })
    .where(eq(servers.id, str(formData, "id")));
  revalidatePath("/admin/servers");
  revalidatePath("/");
}

export async function setFeatured(formData: FormData) {
  await requireAdmin();
  const days = Number(str(formData, "days"));
  const featuredUntil =
    Number.isFinite(days) && days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
  await db.update(servers).set({ featuredUntil }).where(eq(servers.id, str(formData, "id")));
  revalidatePath("/admin/servers");
  revalidatePath("/");
}

export async function setRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id === admin.id) return; // Do not lock yourself out.
  const role = str(formData, "role") === "admin" ? "admin" : "user";
  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

export async function setBanned(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id === admin.id) return;
  const banned = formData.get("banned") === "true";
  await db.update(users).set({ banned }).where(eq(users.id, id));
  if (banned) {
    await db.delete(sessions).where(eq(sessions.userId, id));
    // Hide the servers of banned users from the public list.
    await db.update(servers).set({ published: false }).where(eq(servers.ownerId, id));
  }
  revalidatePath("/admin/users");
  revalidatePath("/");
}

export async function setReportStatus(formData: FormData) {
  await requireAdmin();
  const status = str(formData, "status") === "resolved" ? "resolved" : "open";
  await db
    .update(reports)
    .set({ status })
    .where(eq(reports.id, Number(str(formData, "id"))));
  revalidatePath("/admin/reports");
}
