import type { Locale } from "../config";
import { de, type Dictionary } from "./de";
import { en } from "./en";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { de, en };
