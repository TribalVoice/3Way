import { ChatTree, Settings, DEFAULT_SETTINGS } from './types';

const TREE_KEY = 'branchchat-tree';
const SETTINGS_KEY = 'branchchat-settings';

export function loadTree(): ChatTree | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TREE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChatTree;
  } catch {
    return null;
  }
}

export function saveTree(tree: ChatTree): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TREE_KEY, JSON.stringify(tree));
  } catch {
    // storage full or unavailable
  }
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      geminiApiKey: parsed.geminiApiKey ?? '',
      grokApiKey: parsed.grokApiKey ?? '',
      geminiModel: parsed.geminiModel ?? DEFAULT_SETTINGS.geminiModel,
      grokModel: parsed.grokModel ?? DEFAULT_SETTINGS.grokModel,
    };
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
