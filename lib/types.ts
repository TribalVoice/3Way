export type Speaker = 'user' | 'gemini' | 'grok';

export type TurnStatus = 'pending' | 'streaming' | 'complete' | 'error';

export type TurnKind = 'message' | 'document';

export interface Turn {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: number;
  modelName?: string;
  status: TurnStatus;
  error?: string;
  /** message = normal chat; document = extracted file text */
  kind?: TurnKind;
  fileName?: string;
  truncated?: boolean;
}

export interface Room {
  turns: Turn[];
  /** Optional label for exports */
  title?: string;
  exportedAt?: number;
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

/** Max characters of extracted text kept per file */
export const MAX_DOCUMENT_CHARS = 80_000;

/** Max upload size before we refuse (bytes) */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export const GEMINI_MODEL_OPTIONS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

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

export type SpeakTarget = 'both' | 'gemini' | 'grok';

export const ROOM_EXPORT_VERSION = 1;

export interface RoomExport {
  version: typeof ROOM_EXPORT_VERSION;
  app: '3way-lite';
  exportedAt: number;
  title?: string;
  room: Room;
}
