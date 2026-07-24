import {
  ProviderId,
  SeatConfig,
  SeatId,
  Settings,
  Speaker,
  Turn,
  GEMINI_MODEL_OPTIONS,
  GROK_MODEL_OPTIONS,
  CLAUDE_MODEL_OPTIONS,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROK_MODEL,
  DEFAULT_CLAUDE_MODEL,
  GEMINI_RETIRED_MODELS,
} from './types';

export const PROVIDER_OPTIONS: {
  id: ProviderId;
  label: string;
  keyPlaceholder: string;
}[] = [
  { id: 'gemini', label: 'Google Gemini', keyPlaceholder: 'AIza...' },
  { id: 'grok', label: 'xAI Grok', keyPlaceholder: 'xai-...' },
  { id: 'claude', label: 'Anthropic Claude', keyPlaceholder: 'sk-ant-...' },
];

export function providerLabel(id: ProviderId): string {
  switch (id) {
    case 'gemini':
      return 'Gemini';
    case 'grok':
      return 'Grok';
    case 'claude':
      return 'Claude';
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
  }
}

export function normalizeModel(provider: ProviderId, model: string): string {
  const m = model.trim() || defaultModelFor(provider);
  if (provider === 'gemini' && GEMINI_RETIRED_MODELS.has(m)) {
    return DEFAULT_GEMINI_MODEL;
  }
  return m;
}

export function getSeat(settings: Settings, seat: SeatId): SeatConfig {
  return seat === 'a' ? settings.seatA : settings.seatB;
}

export function seatReady(seat: SeatConfig): boolean {
  return Boolean(seat.apiKey?.trim());
}

export function seatDisplayName(seat: SeatConfig): string {
  return providerLabel(seat.provider);
}

/** Label for a historical or live turn */
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

/** Map legacy gemini/grok speakers onto seats when matching context */
export function speakerMatchesSeat(
  turnSpeaker: Speaker,
  seat: SeatId,
  seatProvider: ProviderId
): boolean {
  if (turnSpeaker === seat) return true;
  // Legacy transcripts
  if (seat === 'a' && turnSpeaker === 'gemini' && seatProvider === 'gemini') {
    return true;
  }
  if (seat === 'b' && turnSpeaker === 'grok' && seatProvider === 'grok') {
    return true;
  }
  if (turnSpeaker === 'gemini' && seatProvider === 'gemini') return true;
  if (turnSpeaker === 'grok' && seatProvider === 'grok') return true;
  return false;
}
