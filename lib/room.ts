import { Room, Turn, Speaker, TurnStatus } from './types';

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
  };
}

export function appendTurn(room: Room, turn: Turn): Room {
  return { turns: [...room.turns, turn] };
}

export function updateTurn(
  room: Room,
  id: string,
  updates: Partial<Turn>
): Room {
  return {
    turns: room.turns.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    ),
  };
}

export function removeTurn(room: Room, id: string): Room {
  return { turns: room.turns.filter((t) => t.id !== id) };
}

/** Drop in-flight turns left over from a closed tab / crash */
export function sanitizeRoom(room: Room): Room {
  return {
    turns: room.turns
      .filter((t) => t.status !== 'pending')
      .map((t) =>
        t.status === 'error' && !t.content
          ? t
          : t.status === 'error'
            ? t
            : { ...t, status: 'complete' as const }
      ),
  };
}

export function hasPendingTurns(room: Room): boolean {
  return room.turns.some((t) => t.status === 'pending');
}

export function speakerLabel(speaker: Speaker): string {
  switch (speaker) {
    case 'user':
      return 'User';
    case 'gemini':
      return 'Gemini';
    case 'grok':
      return 'Grok';
  }
}

/**
 * Build OpenAI-style messages for one model from the full room transcript.
 * Complete turns only; speakers labeled so both models share one room history.
 */
export function buildProviderMessages(
  room: Room,
  forSpeaker: 'gemini' | 'grok',
  excludeTurnIds: Set<string> = new Set()
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const turn of room.turns) {
    if (excludeTurnIds.has(turn.id)) continue;
    if (turn.status !== 'complete') continue;
    if (!turn.content.trim()) continue;

    if (turn.speaker === 'user') {
      messages.push({ role: 'user', content: turn.content });
      continue;
    }

    if (turn.speaker === forSpeaker) {
      messages.push({ role: 'assistant', content: turn.content });
    } else {
      // Other AI (or any non-self speaker) appears as a user-labeled note
      // so this model knows what was said in the room without role confusion.
      const label = speakerLabel(turn.speaker);
      messages.push({
        role: 'user',
        content: `[${label} said]: ${turn.content}`,
      });
    }
  }

  return messages;
}

export function systemPromptFor(speaker: 'gemini' | 'grok'): string {
  const name = speaker === 'gemini' ? 'Gemini' : 'Grok';
  const other = speaker === 'gemini' ? 'Grok' : 'Gemini';
  return [
    `You are ${name} in a live three-way chat room with a human user and ${other}.`,
    `The user controls the pace: they choose when you speak and may ask only you, only ${other}, or both of you.`,
    `You can see the full room transcript. Messages from ${other} appear as "[${other} said]: ...".`,
    `Speak as yourself. Be clear and direct. You may agree, disagree, or build on ${other}'s points when relevant.`,
    `Do not pretend to be the user or ${other}. Do not narrate the whole room unless asked.`,
  ].join(' ');
}
