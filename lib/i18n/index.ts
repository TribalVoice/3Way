import { en, type MessageKey } from './en';
import { ptBR } from './pt-BR';
import { es } from './es';
import { DEFAULT_LOCALE, type Locale, isLocale } from './locales';

export type { Locale, MessageKey };
export { LOCALES, DEFAULT_LOCALE, isLocale } from './locales';

const catalogs: Record<Locale, MessageKey> = {
  en,
  'pt-BR': ptBR,
  es,
};

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
        : Prefix extends ''
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export type TxKey = NestedKeyOf<MessageKey>;

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  let raw =
    getByPath(catalogs[loc], key) ?? getByPath(catalogs.en, key) ?? key;
  if (typeof raw !== 'string') return key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      raw = raw.split(`{${k}}`).join(String(v));
    }
  }
  return raw;
}

/** Language name for system prompts sent to models */
export function replyLanguageInstruction(locale: Locale): string {
  switch (locale) {
    case 'pt-BR':
      return 'Reply in Brazilian Portuguese (pt-BR), unless the user clearly asks for another language.';
    case 'es':
      return 'Reply in Spanish (es), unless the user clearly asks for another language.';
    default:
      return 'Reply in English, unless the user clearly asks for another language.';
  }
}
