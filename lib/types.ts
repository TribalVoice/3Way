/** Backend API providers */
export type ProviderId = 'gemini' | 'grok' | 'claude';

/** Room speakers: user + two configurable seats */
export type SeatId = 'a' | 'b';

/** Legacy speakers kept so old transcripts still render */
export type Speaker = 'user' | SeatId | 'gemini' | 'grok';

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
  kind?: TurnKind;
  fileName?: string;
  truncated?: boolean;
  /** Provider used when this AI turn was created */
  provider?: ProviderId;
  /** Human label at send time, e.g. "Claude" or "Gemini" */
  displayName?: string;
}

export interface Room {
  turns: Turn[];
  title?: string;
  exportedAt?: number;
}

export interface SeatConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
}

export interface Settings {
  seatA: SeatConfig;
  seatB: SeatConfig;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_GROK_MODEL = 'grok-4.5';
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5';

export const DEFAULT_SETTINGS: Settings = {
  seatA: {
    provider: 'gemini',
    apiKey: '',
    model: DEFAULT_GEMINI_MODEL,
  },
  seatB: {
    provider: 'grok',
    apiKey: '',
    model: DEFAULT_GROK_MODEL,
  },
};

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

export const CLAUDE_MODEL_OPTIONS = [
  'claude-sonnet-4-5',
  'claude-sonnet-4-0',
  'claude-opus-4-5',
  'claude-opus-4-1',
  'claude-haiku-4-5',
  'claude-3-5-haiku-latest',
  'claude-3-5-sonnet-latest',
];

export type SpeakTarget = 'both' | SeatId;

export const ROOM_EXPORT_VERSION = 1;

export interface RoomExport {
  version: typeof ROOM_EXPORT_VERSION;
  app: '3way-lite';
  exportedAt: number;
  title?: string;
  room: Room;
}
