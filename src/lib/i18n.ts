import { cookies } from "next/headers";
import { dict, type Key } from "./i18n-dict";

export const LANGS = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

export type { Key };
export { dict };

export function isLang(v: unknown): v is Lang {
  return LANGS.some((l) => l.code === v);
}

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export function t(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  const s = dict[lang][key];
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

export const plural = (lang: Lang, n: number) => t(lang, n === 1 ? "itemOne" : "itemMany", { n });
