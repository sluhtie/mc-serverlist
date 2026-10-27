import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Registrieren" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-bold">Account erstellen</h1>
      <div className="card p-6">
        <RegisterForm next={typeof next === "string" ? next : undefined} />
      </div>
    </div>
  );
}
