'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  translate,
  type Locale,
  type TxKey,
} from './index';

type TFunc = (key: TxKey | string, params?: Record<string, string | number>) => string;

const LanguageContext = createContext<{
  locale: Locale;
  t: TFunc;
}>({
  locale: DEFAULT_LOCALE,
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
});

export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = useCallback<TFunc>(
    (key, params) => translate(locale, key, params),
    [locale]
  );
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
