import {
  Settings,
  DEFAULT_SETTINGS,
  SeatConfig,
  ProviderId,
  ProviderKeys,
  EMPTY_PROVIDER_KEYS,
} from './types';
import { defaultModelFor, normalizeModel, emptyProviderKeys } from './providers';

const SETTINGS_KEY = '3way-settings';
const LEGACY_TREE_KEY = 'branchchat-tree';
const LEGACY_SETTINGS_KEY = 'branchchat-settings';

function asProvider(value: unknown, fallback: ProviderId): ProviderId {
  if (
    value === 'gemini' ||
    value === 'grok' ||
    value === 'claude' ||
    value === 'perplexity' ||
    value === 'nvidia'
  ) {
    return value;
  }
  return fallback;
}

function normalizeSeat(
  seat: Partial<SeatConfig> & { apiKey?: string } | undefined,
  fallback: SeatConfig
): SeatConfig {
  const provider = asProvider(seat?.provider, fallback.provider);
  return {
    provider,
    model: normalizeModel(
      provider,
      seat?.model || fallback.model || defaultModelFor(provider)
    ),
  };
}

function mergeKey(
  keys: ProviderKeys,
  provider: ProviderId,
  value: string | undefined
): void {
  const v = (value ?? '').trim();
  if (v && !keys[provider]) {
    keys[provider] = v;
  }
}

function normalizeKeys(raw: unknown): ProviderKeys {
  const keys = emptyProviderKeys();
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const id of Object.keys(EMPTY_PROVIDER_KEYS) as ProviderId[]) {
      const val = o[id];
      if (typeof val === 'string') {
        keys[id] = val.trim();
      }
    }
  }
  return keys;
}

/**
 * Load settings with migration:
 * - keys register + seatA/seatB (current)
 * - seat-level apiKey fields → keys[provider]
 * - legacy geminiApiKey / grokApiKey
 */
export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    let raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
    }
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const keys = normalizeKeys(parsed.keys);

    // Migrate keys that lived on seats
    if (parsed.seatA && typeof parsed.seatA === 'object') {
      const s = parsed.seatA as { provider?: string; apiKey?: string };
      const p = asProvider(s.provider, 'gemini');
      mergeKey(keys, p, s.apiKey);
    }
    if (parsed.seatB && typeof parsed.seatB === 'object') {
      const s = parsed.seatB as { provider?: string; apiKey?: string };
      const p = asProvider(s.provider, 'grok');
      mergeKey(keys, p, s.apiKey);
    }

    // Flat legacy
    mergeKey(keys, 'gemini', parsed.geminiApiKey as string | undefined);
    mergeKey(keys, 'grok', parsed.grokApiKey as string | undefined);

    let seatA: SeatConfig;
    let seatB: SeatConfig;

    if (parsed.seatA || parsed.seatB) {
      seatA = normalizeSeat(
        parsed.seatA as Partial<SeatConfig> | undefined,
        DEFAULT_SETTINGS.seatA
      );
      seatB = normalizeSeat(
        parsed.seatB as Partial<SeatConfig> | undefined,
        DEFAULT_SETTINGS.seatB
      );
    } else {
      seatA = {
        provider: 'gemini',
        model: normalizeModel(
          'gemini',
          String(parsed.geminiModel ?? DEFAULT_SETTINGS.seatA.model)
        ),
      };
      seatB = {
        provider: 'grok',
        model: normalizeModel(
          'grok',
          String(parsed.grokModel ?? DEFAULT_SETTINGS.seatB.model)
        ),
      };
    }

    const settings: Settings = { keys, seatA, seatB };
    saveSettings(settings);
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    // Never persist apiKey on seats
    const clean: Settings = {
      keys: {
        gemini: (settings.keys?.gemini ?? '').trim(),
        grok: (settings.keys?.grok ?? '').trim(),
        claude: (settings.keys?.claude ?? '').trim(),
        perplexity: (settings.keys?.perplexity ?? '').trim(),
        nvidia: (settings.keys?.nvidia ?? '').trim(),
      },
      seatA: {
        provider: settings.seatA.provider,
        model:
          settings.seatA.model.trim() ||
          defaultModelFor(settings.seatA.provider),
      },
      seatB: {
        provider: settings.seatB.provider,
        model:
          settings.seatB.model.trim() ||
          defaultModelFor(settings.seatB.provider),
      },
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean));
  } catch {
    // storage full or unavailable
  }
}

export function clearLegacyTree(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_TREE_KEY);
  } catch {
    // ignore
  }
}
