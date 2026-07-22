import { Room, Turn, Speaker, TurnStatus, TurnKind } from './types';

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

/** Drop in-flight turns left over from a closed tab / crash */
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

/**
 * Build OpenAI-style messages for one model from the full room transcript.
 * Complete turns only; speakers labeled so both models share one room history.
 * Streaming turns with partial content are excluded until complete.
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

    const content = turnToProviderContent(turn);

    if (turn.speaker === 'user' || turn.kind === 'document') {
      messages.push({ role: 'user', content });
      continue;
    }

    if (turn.speaker === forSpeaker) {
      messages.push({ role: 'assistant', content });
    } else {
      const label = speakerLabel(turn.speaker);
      messages.push({
        role: 'user',
        content: `[${label} said]: ${content}`,
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
    `Documents appear as "[Attached document: filename]" with extracted text.`,
    `Speak as yourself. Be clear and direct. You may agree, disagree, or build on ${other}'s points when relevant.`,
    `Do not pretend to be the user or ${other}. Do not narrate the whole room unless asked.`,
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
    const who =
      t.speaker === 'user'
        ? 'You'
        : t.speaker === 'gemini'
          ? 'Gemini'
          : 'Grok';
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
