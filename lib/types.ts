/** Backend API providers */
export type ProviderId =
  | 'gemini'
  | 'grok'
  | 'claude'
  | 'perplexity'
  | 'nvidia';

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
  provider?: ProviderId;
  displayName?: string;
}

export interface Room {
  turns: Turn[];
  title?: string;
  exportedAt?: number;
}

/** Seat only picks who speaks and which model — keys live in the register */
export interface SeatConfig {
  provider: ProviderId;
  model: string;
}

/** One saved API key per provider (browser localStorage) */
export type ProviderKeys = Record<ProviderId, string>;

export interface Settings {
  keys: ProviderKeys;
  seatA: SeatConfig;
  seatB: SeatConfig;
  /**
   * When true, messages starting with BOTH / seat provider name / "Seat A|B"
   * auto-select Next reply and strip that prefix before send.
   */
  routeByPrefix?: boolean;
}

export const EMPTY_PROVIDER_KEYS: ProviderKeys = {
  gemini: '',
  grok: '',
  claude: '',
  perplexity: '',
  nvidia: '',
};

export interface ProjectMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectIndex {
  projects: ProjectMeta[];
  activeId: string;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_GROK_MODEL = 'grok-4.5';
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5';
export const DEFAULT_PERPLEXITY_MODEL = 'sonar';
/** Popular free-endpoint chat models on build.nvidia.com (ids change; custom field allowed) */
export const DEFAULT_NVIDIA_MODEL = 'deepseek-ai/deepseek-v4-flash';

export const DEFAULT_SETTINGS: Settings = {
  keys: { ...EMPTY_PROVIDER_KEYS },
  seatA: {
    provider: 'gemini',
    model: DEFAULT_GEMINI_MODEL,
  },
  seatB: {
    provider: 'grok',
    model: DEFAULT_GROK_MODEL,
  },
  routeByPrefix: false,
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

export const PERPLEXITY_MODEL_OPTIONS = [
  'sonar',
  'sonar-pro',
  'sonar-reasoning',
  'sonar-reasoning-pro',
  'sonar-deep-research',
];

/**
 * Curated NVIDIA Build / NIM chat model ids (July 2026 snapshot).
 * Catalog churns often — Settings always supports custom ids from build.nvidia.com View code.
 */
export const NVIDIA_MODEL_OPTIONS = [
  'deepseek-ai/deepseek-v4-flash',
  'deepseek-ai/deepseek-v4-pro',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.3-70b-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'nvidia/nemotron-mini-4b-instruct',
  'mistralai/mistral-7b-instruct-v0.3',
  'google/gemma-2-9b-it',
];

/** Retired / renamed NVIDIA ids → current defaults */
export const NVIDIA_RETIRED_MODELS: Record<string, string> = {
  'deepseek-ai/deepseek-r1': 'deepseek-ai/deepseek-v4-flash',
  'deepseek-ai/deepseek-r1-distill-llama-8b': 'deepseek-ai/deepseek-v4-flash',
  'deepseek-ai/deepseek-r1-distill-qwen-32b': 'deepseek-ai/deepseek-v4-pro',
};

export type SpeakTarget = 'both' | SeatId;

export const ROOM_EXPORT_VERSION = 1;

export interface RoomExport {
  version: typeof ROOM_EXPORT_VERSION;
  app: '3way-lite';
  exportedAt: number;
  title?: string;
  room: Room;
}
