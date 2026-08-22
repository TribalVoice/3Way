import { Settings, SpeakTarget } from './types';
import { providerLabel, seatDisplayName } from './providers';

export type RoutePrefixResult = {
  /** Remaining message after stripping the route token (may be empty) */
  text: string;
  target: SpeakTarget;
  /** Human label for toast, e.g. "Grok" or "Both" */
  matchedLabel: string;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

type RouteDef = {
  aliases: string[];
  target: SpeakTarget;
  matchedLabel: string;
};

function buildRoutes(settings: Settings): RouteDef[] {
  const nameA = seatDisplayName(settings.seatA);
  const nameB = seatDisplayName(settings.seatB);
  const sameProvider =
    settings.seatA.provider === settings.seatB.provider;

  const routes: RouteDef[] = [
    {
      aliases: ['both', 'all', 'everyone'],
      target: 'both',
      matchedLabel: 'Both',
    },
    {
      aliases: ['seat a', 'seata'],
      target: 'a',
      matchedLabel: nameA,
    },
    {
      aliases: ['seat b', 'seatb'],
      target: 'b',
      matchedLabel: nameB,
    },
  ];

  // Current chair names / provider labels (skip if both seats share one provider —
  // then only Seat A / Seat B are unambiguous)
  if (!sameProvider) {
    routes.push({
      aliases: [nameA, providerLabel(settings.seatA.provider)],
      target: 'a',
      matchedLabel: nameA,
    });
    routes.push({
      aliases: [nameB, providerLabel(settings.seatB.provider)],
      target: 'b',
      matchedLabel: nameB,
    });
  }

  return routes;
}

/**
 * If the message begins with BOTH / Seat A|B / current seat provider names,
 * return the route target and the message with that prefix removed.
 *
 * Accepts: "Gemini: …", "GEMINI …", "both - …", or keyword alone.
 */
export function parseRoutePrefix(
  message: string,
  settings: Settings
): RoutePrefixResult | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const routes = buildRoutes(settings);

  // Flatten aliases, longest first so "seat a" wins over shorter tokens
  const candidates: {
    alias: string;
    target: SpeakTarget;
    matchedLabel: string;
  }[] = [];

  for (const r of routes) {
    for (const a of r.aliases) {
      const alias = norm(a);
      if (!alias) continue;
      candidates.push({
        alias,
        target: r.target,
        matchedLabel: r.matchedLabel,
      });
    }
  }

  candidates.sort((x, y) => y.alias.length - x.alias.length);

  const lower = trimmed.toLowerCase();

  for (const c of candidates) {
    // Alias at start, then end-of-string OR separator/whitespace
    // Separators: : , - – — .
    const pattern = new RegExp(
      `^${escapeRegExp(c.alias)}(?:\\s*[:\\-–—,.]\\s*|\\s+|$)`,
      'i'
    );
    const match = trimmed.match(pattern);
    if (!match) continue;

    // Extra guard: next char after alias in original must be boundary
    // (already enforced by regex)
    const text = trimmed.slice(match[0].length).trim();
    return {
      text,
      target: c.target,
      matchedLabel: c.matchedLabel,
    };
  }

  // Debug-friendly: also try first whitespace-separated word against aliases
  // (handles odd unicode spaces that \\s might miss in some engines — rare)
  void lower;

  return null;
}

/** Preview only — does not require a full message body after the keyword */
export function peekRoutePrefix(
  message: string,
  settings: Settings
): SpeakTarget | null {
  return parseRoutePrefix(message, settings)?.target ?? null;
}

export function routePrefixHint(settings: Settings): string {
  const a = seatDisplayName(settings.seatA);
  const b = seatDisplayName(settings.seatB);
  if (settings.seatA.provider === settings.seatB.provider) {
    return `Start with BOTH, Seat A, or Seat B`;
  }
  return `Start with BOTH, ${a}, ${b}, Seat A, or Seat B`;
}
