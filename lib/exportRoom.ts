import {
  Room,
  RoomExport,
  ROOM_EXPORT_VERSION,
  Turn,
} from './types';
import { createEmptyRoom, sanitizeRoom, roomToMarkdown } from './room';

export function buildRoomExport(room: Room, title?: string): RoomExport {
  const clean = sanitizeRoom(room);
  return {
    version: ROOM_EXPORT_VERSION,
    app: '3way-lite',
    exportedAt: Date.now(),
    title,
    room: {
      ...clean,
      title: title || clean.title,
      exportedAt: Date.now(),
    },
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(filename, blob);
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(filename, blob);
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportRoomAsJson(room: Room): void {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadJson(`3way-room-${stamp}.json`, buildRoomExport(room));
}

export function exportRoomAsMarkdown(room: Room): void {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadText(`3way-room-${stamp}.md`, roomToMarkdown(room));
}

function isTurn(value: unknown): value is Turn {
  if (!value || typeof value !== 'object') return false;
  const t = value as Partial<Turn>;
  return (
    typeof t.id === 'string' &&
    typeof t.speaker === 'string' &&
    typeof t.content === 'string' &&
    typeof t.timestamp === 'number' &&
    typeof t.status === 'string'
  );
}

/**
 * Parse a previously exported room JSON (or a raw { turns: [] } object).
 */
export function parseRoomImport(raw: string): Room {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Import file is not valid JSON.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Import file has an invalid structure.');
  }

  const obj = data as Record<string, unknown>;

  // Full export wrapper
  if (obj.room && typeof obj.room === 'object') {
    const room = obj.room as Room;
    if (!Array.isArray(room.turns)) {
      throw new Error('Import is missing room.turns.');
    }
    const turns = room.turns.filter(isTurn).map((t) => ({
      ...t,
      status:
        t.status === 'pending' || t.status === 'streaming'
          ? ('complete' as const)
          : t.status,
    }));
    return sanitizeRoom({ turns, title: room.title });
  }

  // Bare room
  if (Array.isArray(obj.turns)) {
    const turns = (obj.turns as unknown[]).filter(isTurn).map((t) => ({
      ...t,
      status:
        t.status === 'pending' || t.status === 'streaming'
          ? ('complete' as const)
          : t.status,
    }));
    return sanitizeRoom({ turns, title: obj.title as string | undefined });
  }

  throw new Error(
    'Unrecognized import format. Use a 3Way Lite JSON export.'
  );
}

export function createEmptyRoomImportSafe(): Room {
  return createEmptyRoom();
}
