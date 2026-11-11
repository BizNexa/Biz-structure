import { en, type Strings } from './en';

/** Hindi and Marathi packs fall back to English until translated. */
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type Lang = 'en' | 'hi' | 'mr';
const PACKS: Record<Lang, DeepPartial<Strings>> = { en, hi: {}, mr: {} };
let current: Lang = 'en';
export const setLang = (l: Lang) => (current = l);

function lookup(pack: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), pack);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = lookup(PACKS[current], key) ?? lookup(en, key);
  if (typeof s !== 'string') return key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = (s as string).replace(`{${k}}`, String(v));
  return s as string;
}

/** [title, detail] pair for an option or flag. */
export function tPair(key: string): [string, string] {
  const v = lookup(PACKS[current], key) ?? lookup(en, key);
  return Array.isArray(v) ? [String(v[0]), String(v[1] ?? '')] : [key, ''];
}

export function tList(key: string): string[] {
  const v = lookup(en, key);
  return Array.isArray(v) ? (v as string[]) : [];
}
