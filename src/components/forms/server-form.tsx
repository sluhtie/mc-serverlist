"use client";

import { startTransition, useActionState, useState } from "react";
import { Select } from "@/components/ui/select";
import { COUNTRIES, MAX_TAGS, TAGS } from "@/lib/constants";
import type { FormState } from "@/lib/form";
import { useT } from "@/lib/i18n/client";
import { createServer, updateServer } from "@/server/actions/servers";
import { FieldError, FormMessage } from "./form-message";
import { MarkdownEditor } from "./markdown-editor";

export type ServerFormValues = {
  id?: string;
  name: string;
  host: string;
  port: number;
  shortDescription: string;
  description: string;
  website: string | null;
  discord: string | null;
  bannerUrl: string | null;
  country: string | null;
  tags: string[];
  votifierEnabled: boolean;
  votifierHost: string | null;
  votifierPort: number | null;
  votifierProtocol: "v1" | "v2";
  votifierPublicKey: string | null;
  votifierToken: string | null;
  bedrockEnabled: boolean;
  bedrockHost: string | null;
  bedrockPort: number | null;
};

const empty: ServerFormValues = {
  name: "",
  host: "",
  port: 25565,
  shortDescription: "",
  description: "",
  website: null,
  discord: null,
  bannerUrl: null,
  country: null,
  tags: [],
  votifierEnabled: false,
  votifierHost: null,
  votifierPort: 8192,
  votifierProtocol: "v2",
  votifierPublicKey: null,
  votifierToken: null,
  bedrockEnabled: false,
  bedrockHost: null,
  bedrockPort: 19132,
};

const initial: FormState = {};

export function ServerForm({ values = empty }: { values?: ServerFormValues }) {
  const t = useT();
  const editing = Boolean(values.id);
  const [state, action, pending] = useActionState(editing ? updateServer : createServer, initial);
  const [tags, setTags] = useState<string[]>(values.tags);
  const [votifier, setVotifier] = useState(values.votifierEnabled);
  const [protocol, setProtocol] = useState(values.votifierProtocol);
  const [bedrock, setBedrock] = useState(values.bedrockEnabled);

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : current.length < MAX_TAGS
          ? [...current, tag]
          : current,
    );

  return (
    <form
      action={action}
      // React resets a form after its action runs. On a validation error that silently put
      // the port back to 25565, so submit manually and keep what the user typed.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-8"
    >
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 font-display text-lg font-bold">{t.serverForm.general}</legend>
        <div>
          <label className="label" htmlFor="name">
            {t.serverForm.name}
          </label>
          <input id="name" name="name" defaultValue={values.name} className="input" required maxLength={64} />
          <FieldError state={state} name="name" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label className="label" htmlFor="host">
              {t.serverForm.host}
            </label>
            <input
              id="host"
              name="host"
              defaultValue={values.host}
              placeholder="play.example.net"
              className="input font-mono"
              required
            />
            <FieldError state={state} name="host" />
          </div>
          <div>
            <label className="label" htmlFor="port">
              {t.serverForm.port}
            </label>
            <input
              id="port"
              name="port"
              type="number"
              min={1}
              max={65535}
              defaultValue={values.port}
              className="input font-mono"
            />
            <FieldError state={state} name="port" />
          </div>
        </div>
        <p className="text-xs text-subtle">
          {t.serverForm.pingNote}
        </p>
        <div>
          <label className="label" htmlFor="shortDescription">
            {t.serverForm.shortDescription}
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            defaultValue={values.shortDescription}
            className="input"
            required
            maxLength={160}
          />
          <FieldError state={state} name="shortDescription" />
        </div>
        <div>
          <label className="label" htmlFor="description">
            {t.serverForm.description}
          </label>
          <MarkdownEditor id="description" name="description" defaultValue={values.description} maxLength={5000} />
          <FieldError state={state} name="description" />
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 font-display text-lg font-bold">{t.serverForm.details}</legend>
        <div>
          <span className="label">
            {t.serverForm.tags(tags.length, MAX_TAGS)}
          </span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <label
                  key={tag}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-sm transition has-focus-visible:ring-4 has-focus-visible:ring-brand-500/20 ${
                    active
                      ? "border-brand-500 bg-brand-500/15 font-medium text-accent"
                      : "border-line-strong bg-inset text-fg-soft hover:border-subtle"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    checked={active}
                    onChange={() => toggleTag(tag)}
                    className="sr-only"
                  />
                  {tag}
                </label>
              );
            })}
          </div>
          <FieldError state={state} name="tags" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="country">
              {t.serverForm.country}
            </label>
            <Select
              id="country"
              name="country"
              defaultValue={values.country ?? ""}
              options={[
                { value: "", label: t.serverForm.noCountry },
                ...COUNTRIES.map((value) => ({ value, label: t.countries[value] })),
              ]}
            />
          </div>
          <div>
            <label className="label" htmlFor="bannerUrl">
              {t.serverForm.banner}
            </label>
            <input
              id="bannerUrl"
              name="bannerUrl"
              type="url"
              defaultValue={values.bannerUrl ?? ""}
              placeholder="https://…/banner.gif"
              className="input"
            />
            <FieldError state={state} name="bannerUrl" />
          </div>
          <div>
            <label className="label" htmlFor="website">
              {t.serverForm.website}
            </label>
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={values.website ?? ""}
              placeholder="https://example.net"
              className="input"
            />
            <FieldError state={state} name="website" />
          </div>
          <div>
            <label className="label" htmlFor="discord">
              {t.serverForm.discord}
            </label>
            <input
              id="discord"
              name="discord"
              type="url"
              defaultValue={values.discord ?? ""}
              placeholder="https://discord.gg/…"
              className="input"
            />
            <FieldError state={state} name="discord" />
          </div>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 font-display text-lg font-bold">{t.serverForm.votifier}</legend>
        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="votifierEnabled"
            checked={votifier}
            onChange={(e) => setVotifier(e.target.checked)}
            className="checkbox"
          />
          {t.serverForm.votifierEnable}
        </label>
        {votifier && (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem]">
            <div>
              <label className="label" htmlFor="votifierHost">
                {t.serverForm.votifierHost}
              </label>
              <input
                id="votifierHost"
                name="votifierHost"
                defaultValue={values.votifierHost ?? ""}
                placeholder={t.serverForm.votifierHostPlaceholder}
                className="input font-mono"
              />
              <FieldError state={state} name="votifierHost" />
            </div>
            <div>
              <label className="label" htmlFor="votifierPort">
                {t.serverForm.port}
              </label>
              <input
                id="votifierPort"
                name="votifierPort"
                type="number"
                defaultValue={values.votifierPort ?? 8192}
                className="input font-mono"
              />
              <FieldError state={state} name="votifierPort" />
            </div>
            <div>
              <label className="label" htmlFor="votifierProtocol">
                {t.serverForm.protocol}
              </label>
              <Select
                id="votifierProtocol"
                name="votifierProtocol"
                value={protocol}
                onValueChange={(value) => setProtocol(value === "v1" ? "v1" : "v2")}
                options={[
                  { value: "v2", label: "v2 (Token)" },
                  { value: "v1", label: "v1 (RSA)" },
                ]}
              />
            </div>
            {protocol === "v2" ? (
              <div className="sm:col-span-3">
                <label className="label" htmlFor="votifierToken">
                  {t.serverForm.token} <code>plugins/Votifier/config.yml</code>)
                </label>
                <input
                  id="votifierToken"
                  name="votifierToken"
                  defaultValue={values.votifierToken ?? ""}
                  className="input font-mono"
                  autoComplete="off"
                />
                <FieldError state={state} name="votifierToken" />
              </div>
            ) : (
              <div className="sm:col-span-3">
                <label className="label" htmlFor="votifierPublicKey">
                  {t.serverForm.publicKey} <code>rsa/public.key</code>)
                </label>
                <textarea
                  id="votifierPublicKey"
                  name="votifierPublicKey"
                  defaultValue={values.votifierPublicKey ?? ""}
                  rows={4}
                  className="input font-mono text-xs"
                />
                <FieldError state={state} name="votifierPublicKey" />
              </div>
            )}
          </div>
        )}
      </fieldset>

      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 font-display text-lg font-bold">{t.serverForm.bedrock}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="bedrockEnabled"
            checked={bedrock}
            onChange={(e) => setBedrock(e.target.checked)}
            className="checkbox"
          />
          {t.serverForm.bedrockEnable}
        </label>
        {bedrock && (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div>
              <label className="label" htmlFor="bedrockHost">
                {t.serverForm.bedrockHost}
              </label>
              <input
                id="bedrockHost"
                name="bedrockHost"
                defaultValue={values.bedrockHost ?? ""}
                placeholder={t.serverForm.bedrockHostPlaceholder}
                className="input font-mono"
              />
              <FieldError state={state} name="bedrockHost" />
            </div>
            <div>
              <label className="label" htmlFor="bedrockPort">
                {t.serverForm.port}
              </label>
              <input
                id="bedrockPort"
                name="bedrockPort"
                type="number"
                min={1}
                max={65535}
                defaultValue={values.bedrockPort ?? 19132}
                className="input font-mono"
              />
              <FieldError state={state} name="bedrockPort" />
            </div>
          </div>
        )}
      </fieldset>

      <button className="btn-primary px-6 py-3 text-base" disabled={pending}>
        {pending ? t.serverForm.checking : editing ? t.serverForm.save : t.serverForm.create}
      </button>
    </form>
  );
}
