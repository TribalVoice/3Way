import { SeatId, Settings, SpeakTarget } from './types';
import { providerLabel, seatDisplayName } from './providers';

export type RoutePrefixResult = {
  /** Remaining message after stripping the route token (may be empty) */
  text: string;
  target: SpeakTarget;
  /** Human label for toast, e.g. "Grok" or "Both" */
  matchedLabel: string;
};

function normalizeToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * If the message begins with BOTH / ALL / SEAT A|B / current provider names,
 * return the route target and the message with that prefix removed.
 * Only matches a leading token (optional : , - after it).
 */
export function parseRoutePrefix(
  message: string,
  settings: Settings
): RoutePrefixResult | null {
  const trimmed = message.trimStart();
  if (!trimmed) return null;

  // First token: letters/digits/spaces inside until separator or end
  // e.g. "GROK: hello", "Seat A - hi", "BOTH what do you think"
  const m = trimmed.match(
    /^([A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*){0,2})(?:\s*[:\-–,]\s*|\s+)/
  );
  // Also allow keyword as entire message
  const whole = trimmed.match(
    /^([A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*){0,2})\s*$/
  );

  const tokenRaw = m?.[1] ?? whole?.[1];
  if (!tokenRaw) return null;

  const token = normalizeToken(tokenRaw);
  const labelA = normalizeToken(seatDisplayName(settings.seatA));
  const labelB = normalizeToken(seatDisplayName(settings.seatB));
  const providerA = normalizeToken(providerLabel(settings.seatA.provider));
  const providerB = normalizeToken(providerLabel(settings.seatB.provider));

  let target: SpeakTarget | null = null;
  let matchedLabel = '';

  // Avoid bare "A"/"B" — too easy to false-positive ("A good point…")
  const bothAliases = new Set(['both', 'all', 'everyone']);
  const aExplicit = new Set(['seat a', 'seata', 'seat-a']);
  const bExplicit = new Set(['seat b', 'seatb', 'seat-b']);

  // If both seats share the same provider, require Seat A / Seat B (not the shared name)
  const sameProvider =
    settings.seatA.provider === settings.seatB.provider;

  if (bothAliases.has(token)) {
    target = 'both';
    matchedLabel = 'Both';
  } else if (aExplicit.has(token)) {
    target = 'a';
    matchedLabel = seatDisplayName(settings.seatA);
  } else if (bExplicit.has(token)) {
    target = 'b';
    matchedLabel = seatDisplayName(settings.seatB);
  } else if (!sameProvider && (token === labelA || token === providerA)) {
    target = 'a';
    matchedLabel = seatDisplayName(settings.seatA);
  } else if (!sameProvider && (token === labelB || token === providerB)) {
    target = 'b';
    matchedLabel = seatDisplayName(settings.seatB);
  } else if (sameProvider && (token === labelA || token === providerA)) {
    return null;
  }

  if (!target) return null;

  let text: string;
  if (whole && !m) {
    text = '';
  } else if (m) {
    text = trimmed.slice(m[0].length).trimStart();
  } else {
    text = '';
  }

  return { text, target, matchedLabel };
}

export function routePrefixHint(settings: Settings): string {
  const a = seatDisplayName(settings.seatA);
  const b = seatDisplayName(settings.seatB);
  return `Start with BOTH, ${a}, ${b}, Seat A, or Seat B`;
}
