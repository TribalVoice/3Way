/**
 * Optional support link shown in the app UI.
 * Override with env: NEXT_PUBLIC_BUY_ME_A_COFFEE_URL
 */
export const BUY_ME_A_COFFEE_URL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL) ||
  'https://ko-fi.com/tribalvoice';

export const SUPPORT_LABEL = 'Support on Ko-fi';

export function isSupportEnabled(): boolean {
  return Boolean(BUY_ME_A_COFFEE_URL && BUY_ME_A_COFFEE_URL.startsWith('http'));
}
