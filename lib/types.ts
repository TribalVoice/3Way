export type Speaker = 'user' | 'gemini' | 'grok';

export type TurnStatus = 'pending' | 'complete' | 'error';

export interface Turn {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: number;
  modelName?: string;
  status: TurnStatus;
  error?: string;
}

export interface Room {
  turns: Turn[];
}

export interface Settings {
  geminiApiKey: string;
  grokApiKey: string;
  geminiModel: string;
  grokModel: string;
}

export const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  grokApiKey: '',
  geminiModel: 'gemini-3.6-flash',
  grokModel: 'grok-4.5',
};

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_GROK_MODEL = 'grok-4.5';

/** Stable / current chat-capable models (July 2026) */
export const GEMINI_MODEL_OPTIONS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

/**
 * Models closed to many new API keys or shut down.
 * Auto-upgraded to DEFAULT_GEMINI_MODEL on load.
 */
export const GEMINI_RETIRED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-pro-preview',
]);

export const GROK_MODEL_OPTIONS = [
  'grok-4.5',
  'grok-4-1-fast-non-reasoning',
  'grok-4-1-fast-reasoning',
  'grok-3-mini',
  'grok-3',
];

/** Who the user asks to speak next */
export type SpeakTarget = 'both' | 'gemini' | 'grok';
