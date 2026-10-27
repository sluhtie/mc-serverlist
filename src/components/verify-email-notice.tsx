import { ResendVerificationForm } from "@/components/forms/settings-forms";
import { MailIcon } from "@/components/icons";
import { getDictionary } from "@/lib/i18n/server";

/** Shown until the account's address is confirmed; adding servers is locked until then. */
export async function VerifyEmailNotice({ email }: { email: string }) {
  const t = await getDictionary();
  return (
    <div className="card flex flex-col gap-4 border-amber-500/40 p-5 sm:flex-row sm:items-start">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-warn">
        <MailIcon className="h-5 w-5" />
      </div>
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold">{t.settings.verifyBannerTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.settings.verifyBannerText(email)}</p>
        </div>
        <ResendVerificationForm />
      </div>
    </div>
  );
}
