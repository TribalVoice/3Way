export type Locale = 'en' | 'pt-BR' | 'es';

export const LOCALES: { id: Locale; label: string; nativeLabel: string }[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português (Brasil)' },
  { id: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'pt-BR' || value === 'es';
}
