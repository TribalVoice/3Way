import {
  Room,
  Turn,
  Speaker,
  TurnStatus,
  TurnKind,
  SeatId,
  ProviderId,
  Settings,
} from './types';
import { getSeat, seatDisplayName, turnDisplayName } from './providers';
import { replyLanguageInstruction } from './i18n';
import { DEFAULT_LOCALE, isLocale } from './i18n/locales';

export function createEmptyRoom(): Room {
  return { turns: [] };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createTurn(
  speaker: Speaker,
  content: string,
  options: {
    modelName?: string;
    status?: TurnStatus;
    error?: string;
    kind?: TurnKind;
    fileName?: string;
    truncated?: boolean;
    provider?: ProviderId;
    displayName?: string;
  } = {}
): Turn {
  return {
    id: generateId(),
    speaker,
    content,
    timestamp: Date.now(),
    modelName: options.modelName,
    status: options.status ?? 'complete',
    error: options.error,
    kind: options.kind ?? 'message',
    fileName: options.fileName,
    truncated: options.truncated,
    provider: options.provider,
    displayName: options.displayName,
  };
}

export function appendTurn(room: Room, turn: Turn): Room {
  return { ...room, turns: [...room.turns, turn] };
}

export function updateTurn(
  room: Room,
  id: string,
  updates: Partial<Turn>
): Room {
  return {
    ...room,
    turns: room.turns.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  };
}

export function removeTurn(room: Room, id: string): Room {
  return { ...room, turns: room.turns.filter((t) => t.id !== id) };
}

export function sanitizeRoom(room: Room): Room {
  return {
    ...room,
    turns: room.turns
      .filter((t) => t.status !== 'pending' && t.status !== 'streaming')
      .map((t) =>
        t.status === 'error'
          ? t
          : { ...t, status: 'complete' as const, error: undefined }
      ),
  };
}

export function hasPendingTurns(room: Room): boolean {
  return room.turns.some(
    (t) => t.status === 'pending' || t.status === 'streaming'
  );
}

function turnToProviderContent(turn: Turn): string {
  if (turn.kind === 'document') {
    const name = turn.fileName || 'document';
    const note = turn.truncated
      ? '\n\n[Note: document text was truncated to fit context limits.]'
      : '';
    return `[Attached document: ${name}]\n\n${turn.content}${note}`;
  }
  return turn.content;
}

function isOwnTurn(
  turn: Turn,
  forSeat: SeatId,
  settings: Settings
): boolean {
  if (turn.speaker === forSeat) return true;

  const seat = getSeat(settings, forSeat);
  const other: SeatId = forSeat === 'a' ? 'b' : 'a';
  const otherSeat = getSeat(settings, other);

  // Legacy transcripts used speaker: gemini | grok
  if (turn.speaker === 'gemini') {
    if (seat.provider !== 'gemini') return false;
    // Prefer seat A when both seats are Gemini
    if (otherSeat.provider === 'gemini') return forSeat === 'a';
    return true;
  }
  if (turn.speaker === 'grok') {
    if (seat.provider !== 'grok') return false;
    if (otherSeat.provider === 'grok') return forSeat === 'b';
    return true;
  }

  return false;
}

/**
 * Build OpenAI-style messages for one seat from the full room transcript.
 */
export function buildProviderMessages(
  room: Room,
  forSeat: SeatId,
  settings: Settings,
  excludeTurnIds: Set<string> = new Set()
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const turn of room.turns) {
    if (excludeTurnIds.has(turn.id)) continue;
    if (turn.status !== 'complete') continue;
    if (!turn.content.trim()) continue;

    const content = turnToProviderContent(turn);

    if (turn.speaker === 'user' || turn.kind === 'document') {
      messages.push({ role: 'user', content });
      continue;
    }

    if (isOwnTurn(turn, forSeat, settings)) {
      messages.push({ role: 'assistant', content });
    } else {
      const label = turnDisplayName(turn);
      messages.push({
        role: 'user',
        content: `[${label} said]: ${content}`,
      });
    }
  }

  return messages;
}

export function systemPromptForSeat(
  forSeat: SeatId,
  settings: Settings
): string {
  const me = getSeat(settings, forSeat);
  const otherSeatId: SeatId = forSeat === 'a' ? 'b' : 'a';
  const other = getSeat(settings, otherSeatId);
  const name = seatDisplayName(me);
  const otherName = seatDisplayName(other);
  const locale = isLocale(settings.locale) ? settings.locale : DEFAULT_LOCALE;
  return [
    `You are ${name} in a live three-way chat room with a human user and ${otherName}.`,
    `The user controls the pace: they choose when you speak and may ask only you, only ${otherName}, or both of you.`,
    `You can see the full room transcript. Messages from ${otherName} appear as "[${otherName} said]: ...".`,
    `Documents appear as "[Attached document: filename]" with extracted text.`,
    `Speak as yourself. Be clear and direct. You may agree, disagree, or build on ${otherName}'s points when relevant.`,
    `Do not pretend to be the user or ${otherName}. Do not narrate the whole room unless asked.`,
    replyLanguageInstruction(locale),
    // Readability: this UI shows plain text (light markdown only). Raw LaTeX is hard to read.
    `Formatting: write for a plain chat card. Prefer everyday prose and normal units (e.g. "q_traffic ≈ 10 to 20 kPa").`,
    `Do not use LaTeX or math mode (no $...$, \\text{}, \\approx, _{...}, etc.). Avoid dense markdown tables unless essential.`,
    `Simple markdown is OK: short **bold** phrases, bullet lists, and \`code\` for symbols or identifiers.`,
  ].join(' ');
}

export function roomToMarkdown(room: Room): string {
  const lines: string[] = [
    '# 3Way Lite room export',
    '',
    `Exported: ${new Date().toISOString()}`,
    '',
  ];
  for (const t of room.turns) {
    if (t.status !== 'complete' && t.status !== 'error') continue;
    if (t.kind === 'document') {
      lines.push(`## Document: ${t.fileName || 'file'}`);
      if (t.truncated) lines.push('*(truncated)*');
      lines.push('');
      lines.push(t.content);
      lines.push('');
      continue;
    }
    const who = turnDisplayName(t);
    lines.push(`## ${who}`);
    if (t.status === 'error') {
      lines.push(`*Error: ${t.error || 'failed'}*`);
    } else {
      lines.push(t.content);
    }
    lines.push('');
  }
  return lines.join('\n');
}
