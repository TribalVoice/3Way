import {
  Room,
  Settings,
  DEFAULT_SETTINGS,
  SeatConfig,
  ProviderId,
} from './types';
import { createEmptyRoom, sanitizeRoom } from './room';
import { defaultModelFor, normalizeModel } from './providers';

const ROOM_KEY = '3way-room';
const SETTINGS_KEY = '3way-settings';
const LEGACY_TREE_KEY = 'branchchat-tree';
const LEGACY_SETTINGS_KEY = 'branchchat-settings';

export function loadRoom(): Room {
  if (typeof window === 'undefined') return createEmptyRoom();
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Room;
      if (parsed && Array.isArray(parsed.turns)) {
        return sanitizeRoom(parsed);
      }
    }
  } catch {
    // ignore
  }
  return createEmptyRoom();
}

export function saveRoom(room: Room): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify(room));
  } catch {
    // storage full or unavailable
  }
}

function asProvider(value: unknown, fallback: ProviderId): ProviderId {
  if (value === 'gemini' || value === 'grok' || value === 'claude') return value;
  return fallback;
}

function normalizeSeat(
  seat: Partial<SeatConfig> | undefined,
  fallback: SeatConfig
): SeatConfig {
  const provider = asProvider(seat?.provider, fallback.provider);
  return {
    provider,
    apiKey: (seat?.apiKey ?? fallback.apiKey ?? '').trim(),
    model: normalizeModel(provider, seat?.model || fallback.model || defaultModelFor(provider)),
  };
}

/**
 * Load settings with migration from:
 * - seatA / seatB shape (current)
 * - legacy geminiApiKey / grokApiKey / models
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

    // New shape
    if (parsed.seatA || parsed.seatB) {
      const settings: Settings = {
        seatA: normalizeSeat(
          parsed.seatA as Partial<SeatConfig> | undefined,
          DEFAULT_SETTINGS.seatA
        ),
        seatB: normalizeSeat(
          parsed.seatB as Partial<SeatConfig> | undefined,
          DEFAULT_SETTINGS.seatB
        ),
      };
      saveSettings(settings);
      return settings;
    }

    // Legacy flat Gemini / Grok keys
    const geminiKey = String(parsed.geminiApiKey ?? '');
    const grokKey = String(parsed.grokApiKey ?? '');
    const geminiModel = normalizeModel(
      'gemini',
      String(parsed.geminiModel ?? DEFAULT_SETTINGS.seatA.model)
    );
    const grokModel = normalizeModel(
      'grok',
      String(parsed.grokModel ?? DEFAULT_SETTINGS.seatB.model)
    );

    const settings: Settings = {
      seatA: {
        provider: 'gemini',
        apiKey: geminiKey,
        model: geminiModel,
      },
      seatB: {
        provider: 'grok',
        apiKey: grokKey,
        model: grokModel,
      },
    };
    saveSettings(settings);
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
