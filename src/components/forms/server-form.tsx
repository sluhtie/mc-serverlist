"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/select";
import { COUNTRIES, MAX_TAGS, TAGS } from "@/lib/constants";
import type { FormState } from "@/lib/form";
import { createServer, updateServer } from "@/server/actions/servers";
import { FieldError, FormMessage } from "./form-message";

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
};

const initial: FormState = {};

export function ServerForm({ values = empty }: { values?: ServerFormValues }) {
  const editing = Boolean(values.id);
  const [state, action, pending] = useActionState(editing ? updateServer : createServer, initial);
  const [tags, setTags] = useState<string[]>(values.tags);
  const [votifier, setVotifier] = useState(values.votifierEnabled);
  const [protocol, setProtocol] = useState(values.votifierProtocol);

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : current.length < MAX_TAGS
          ? [...current, tag]
          : current,
    );

  return (
    <form action={action} className="space-y-8">
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 text-lg font-semibold">Allgemein</legend>
        <div>
          <label className="label" htmlFor="name">
            Servername *
          </label>
          <input id="name" name="name" defaultValue={values.name} className="input" required maxLength={64} />
          <FieldError state={state} name="name" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label className="label" htmlFor="host">
              Server-Adresse *
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
              Port
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
        <p className="text-xs text-zinc-500">
          Wir prüfen beim Speichern, ob der Server erreichbar ist. SRV-Records werden unterstützt.
        </p>
        <div>
          <label className="label" htmlFor="shortDescription">
            Kurzbeschreibung *
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
            Beschreibung
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={values.description}
            rows={8}
            maxLength={5000}
            className="input"
          />
          <FieldError state={state} name="description" />
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 text-lg font-semibold">Spielmodi & Details</legend>
        <div>
          <span className="label">
            Tags ({tags.length}/{MAX_TAGS})
          </span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <label
                  key={tag}
                  className={`cursor-pointer rounded-md border px-2.5 py-1 text-sm ${
                    active
                      ? "border-brand-500 bg-brand-500/15 text-brand-300"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
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
              Land
            </label>
            <Select
              id="country"
              name="country"
              defaultValue={values.country ?? ""}
              options={[
                { value: "", label: "Keine Angabe" },
                ...Object.entries(COUNTRIES).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
          <div>
            <label className="label" htmlFor="bannerUrl">
              Banner-URL (468×60)
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
              Website
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
              Discord-Einladung
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
        <legend className="px-2 text-lg font-semibold">Votifier (Vote-Belohnungen)</legend>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="votifierEnabled"
            checked={votifier}
            onChange={(e) => setVotifier(e.target.checked)}
            className="checkbox"
          />
          Votes per Votifier/NuVotifier an meinen Server senden
        </label>
        {votifier && (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem]">
            <div>
              <label className="label" htmlFor="votifierHost">
                Votifier-Host
              </label>
              <input
                id="votifierHost"
                name="votifierHost"
                defaultValue={values.votifierHost ?? ""}
                placeholder="Leer = Server-Adresse"
                className="input font-mono"
              />
              <FieldError state={state} name="votifierHost" />
            </div>
            <div>
              <label className="label" htmlFor="votifierPort">
                Port
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
                Protokoll
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
                  Token (aus <code>plugins/Votifier/config.yml</code>)
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
                  Public Key (aus <code>rsa/public.key</code>)
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

      <button className="btn-primary" disabled={pending}>
        {pending ? "Prüfe Server…" : editing ? "Änderungen speichern" : "Server eintragen"}
      </button>
    </form>
  );
}
