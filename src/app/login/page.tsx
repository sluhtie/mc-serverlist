import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Anmelden", robots: NOINDEX };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-bold">Anmelden</h1>
      <div className="card p-6">
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
    </div>
  );
}
