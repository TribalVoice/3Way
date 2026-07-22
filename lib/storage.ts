import {
  Room,
  Settings,
  DEFAULT_SETTINGS,
  GEMINI_RETIRED_MODELS,
} from './types';
import { createEmptyRoom, sanitizeRoom } from './room';

const ROOM_KEY = '3way-room';
const SETTINGS_KEY = '3way-settings';
/** Legacy BranchChat keys — migrated once if present */
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

function normalizeGeminiModel(model: string | undefined): string {
  const m = (model ?? '').trim() || DEFAULT_SETTINGS.geminiModel;
  if (GEMINI_RETIRED_MODELS.has(m)) {
    return DEFAULT_SETTINGS.geminiModel;
  }
  return m;
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    let raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
    }
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const settings: Settings = {
      geminiApiKey: parsed.geminiApiKey ?? '',
      grokApiKey: parsed.grokApiKey ?? '',
      geminiModel: normalizeGeminiModel(parsed.geminiModel),
      grokModel: parsed.grokModel?.trim() || DEFAULT_SETTINGS.grokModel,
    };
    // Persist migration so Settings UI shows the new default
    if (parsed.geminiModel !== settings.geminiModel) {
      saveSettings(settings);
    }
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
