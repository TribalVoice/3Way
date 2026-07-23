/**
 * Optional support link shown in the app UI.
 * Set this to your Buy Me a Coffee (or Ko-fi / GitHub Sponsors) page.
 * Leave empty to hide support buttons.
 *
 * Example: 'https://www.buymeacoffee.com/yourname'
 */
export const BUY_ME_A_COFFEE_URL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL) ||
  '';

export const SUPPORT_LABEL = 'Buy me a coffee';

export function isSupportEnabled(): boolean {
  return Boolean(BUY_ME_A_COFFEE_URL && BUY_ME_A_COFFEE_URL.startsWith('http'));
}
