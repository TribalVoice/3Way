import {
  ProviderId,
  ProviderKeys,
  SeatConfig,
  SeatId,
  Settings,
  Speaker,
  Turn,
  EMPTY_PROVIDER_KEYS,
  GEMINI_MODEL_OPTIONS,
  GROK_MODEL_OPTIONS,
  CLAUDE_MODEL_OPTIONS,
  PERPLEXITY_MODEL_OPTIONS,
  NVIDIA_MODEL_OPTIONS,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROK_MODEL,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_PERPLEXITY_MODEL,
  DEFAULT_NVIDIA_MODEL,
  GEMINI_RETIRED_MODELS,
  NVIDIA_RETIRED_MODELS,
} from './types';

export const ALL_PROVIDER_IDS: ProviderId[] = [
  'gemini',
  'grok',
  'claude',
  'perplexity',
  'nvidia',
];

export const PROVIDER_OPTIONS: {
  id: ProviderId;
  label: string;
  keyPlaceholder: string;
  note?: string;
}[] = [
  { id: 'gemini', label: 'Google Gemini', keyPlaceholder: 'AIza...' },
  { id: 'grok', label: 'xAI Grok', keyPlaceholder: 'xai-...' },
  { id: 'claude', label: 'Anthropic Claude', keyPlaceholder: 'sk-ant-...' },
  {
    id: 'perplexity',
    label: 'Perplexity',
    keyPlaceholder: 'pplx-...',
    note: 'May use live web search depending on model.',
  },
  {
    id: 'nvidia',
    label: 'NVIDIA Build',
    keyPlaceholder: 'nvapi-...',
    note: 'Free NIM endpoints for development; rate limits apply. Catalog changes often — if a dropdown model 404s, use “Enter custom model name” with the id from build.nvidia.com → model page → View code.',
  },
];

export function providerLabel(id: ProviderId): string {
  switch (id) {
    case 'gemini':
      return 'Gemini';
    case 'grok':
      return 'Grok';
    case 'claude':
      return 'Claude';
    case 'perplexity':
      return 'Perplexity';
    case 'nvidia':
      return 'NVIDIA';
  }
}

export function modelOptionsFor(provider: ProviderId): string[] {
  switch (provider) {
    case 'gemini':
      return GEMINI_MODEL_OPTIONS;
    case 'grok':
      return GROK_MODEL_OPTIONS;
    case 'claude':
      return CLAUDE_MODEL_OPTIONS;
    case 'perplexity':
      return PERPLEXITY_MODEL_OPTIONS;
    case 'nvidia':
      return NVIDIA_MODEL_OPTIONS;
  }
}

export function defaultModelFor(provider: ProviderId): string {
  switch (provider) {
    case 'gemini':
      return DEFAULT_GEMINI_MODEL;
    case 'grok':
      return DEFAULT_GROK_MODEL;
    case 'claude':
      return DEFAULT_CLAUDE_MODEL;
    case 'perplexity':
      return DEFAULT_PERPLEXITY_MODEL;
    case 'nvidia':
      return DEFAULT_NVIDIA_MODEL;
  }
}

export function normalizeModel(provider: ProviderId, model: string): string {
  const m = model.trim() || defaultModelFor(provider);
  if (provider === 'gemini' && GEMINI_RETIRED_MODELS.has(m)) {
    return DEFAULT_GEMINI_MODEL;
  }
  if (provider === 'nvidia' && NVIDIA_RETIRED_MODELS[m]) {
    return NVIDIA_RETIRED_MODELS[m];
  }
  return m;
}

export function emptyProviderKeys(): ProviderKeys {
  return { ...EMPTY_PROVIDER_KEYS };
}

export function getProviderKey(
  settings: Settings,
  provider: ProviderId
): string {
  return (settings.keys?.[provider] ?? '').trim();
}

export function getSeat(settings: Settings, seat: SeatId): SeatConfig {
  return seat === 'a' ? settings.seatA : settings.seatB;
}

/** Seat can speak if its provider has a saved key in the register */
export function seatReady(settings: Settings, seat: SeatId): boolean {
  const cfg = getSeat(settings, seat);
  return Boolean(getProviderKey(settings, cfg.provider));
}

export function seatDisplayName(seat: SeatConfig): string {
  return providerLabel(seat.provider);
}

export function turnDisplayName(turn: Turn): string {
  if (turn.kind === 'document') return turn.fileName || 'Document';
  if (turn.speaker === 'user') return 'You';
  if (turn.displayName) return turn.displayName;
  if (turn.provider) return providerLabel(turn.provider);
  if (turn.speaker === 'gemini') return 'Gemini';
  if (turn.speaker === 'grok') return 'Grok';
  if (turn.speaker === 'a') return 'Seat A';
  if (turn.speaker === 'b') return 'Seat B';
  return 'AI';
}

export function isAiSpeaker(speaker: Speaker): boolean {
  return speaker !== 'user';
}

export function isSeatSpeaker(speaker: Speaker): speaker is SeatId {
  return speaker === 'a' || speaker === 'b';
}
