import { ProjectIndex, ProjectMeta, Room } from './types';
import { createEmptyRoom, generateId, sanitizeRoom } from './room';

const INDEX_KEY = '3way-projects-index';
const ACTIVE_KEY = '3way-active-project';
const LEGACY_ROOM_KEY = '3way-room';

function projectKey(id: string): string {
  return `3way-project-${id}`;
}

function emptyIndex(activeId: string, title = 'Main'): ProjectIndex {
  const now = Date.now();
  return {
    activeId,
    projects: [
      {
        id: activeId,
        title,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

export function loadProjectIndex(): ProjectIndex {
  if (typeof window === 'undefined') {
    const id = 'bootstrap';
    return emptyIndex(id);
  }

  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectIndex;
      if (
        parsed &&
        Array.isArray(parsed.projects) &&
        parsed.projects.length > 0 &&
        typeof parsed.activeId === 'string'
      ) {
        // Ensure active exists
        if (!parsed.projects.some((p) => p.id === parsed.activeId)) {
          parsed.activeId = parsed.projects[0].id;
        }
        return parsed;
      }
    }
  } catch {
    // fall through to migrate
  }

  // Migrate legacy single room
  const id = generateId();
  let room = createEmptyRoom();
  try {
    const legacy = localStorage.getItem(LEGACY_ROOM_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Room;
      if (parsed && Array.isArray(parsed.turns)) {
        room = sanitizeRoom(parsed);
      }
    }
  } catch {
    // ignore
  }

  const title =
    room.turns.length > 0 ? 'Main' : 'Main';
  const index = emptyIndex(id, title);
  saveProjectIndex(index);
  saveProjectRoom(id, room);
  try {
    localStorage.removeItem(LEGACY_ROOM_KEY);
  } catch {
    // ignore
  }
  return index;
}

export function saveProjectIndex(index: ProjectIndex): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    localStorage.setItem(ACTIVE_KEY, index.activeId);
  } catch {
    // storage full
  }
}

export function loadProjectRoom(id: string): Room {
  if (typeof window === 'undefined') return createEmptyRoom();
  try {
    const raw = localStorage.getItem(projectKey(id));
    if (raw) {
      const parsed = JSON.parse(raw) as Room;
      if (parsed && Array.isArray(parsed.turns)) {
        return sanitizeRoom(parsed);
      }
    }
  } catch {
    // ignore
  }
  return createEmptyRoom();
}

export function saveProjectRoom(id: string, room: Room): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(projectKey(id), JSON.stringify(room));
  } catch {
    // storage full
  }
}

export function touchProject(
  index: ProjectIndex,
  id: string,
  title?: string
): ProjectIndex {
  const now = Date.now();
  return {
    ...index,
    projects: index.projects.map((p) =>
      p.id === id
        ? {
            ...p,
            updatedAt: now,
            title: title !== undefined ? title : p.title,
          }
        : p
    ),
  };
}

export function createProject(
  index: ProjectIndex,
  title?: string
): { index: ProjectIndex; id: string } {
  const id = generateId();
  const now = Date.now();
  const meta: ProjectMeta = {
    id,
    title: (title || '').trim() || `Project ${index.projects.length + 1}`,
    createdAt: now,
    updatedAt: now,
  };
  const next: ProjectIndex = {
    activeId: id,
    projects: [meta, ...index.projects],
  };
  saveProjectIndex(next);
  saveProjectRoom(id, createEmptyRoom());
  return { index: next, id };
}

export function renameProject(
  index: ProjectIndex,
  id: string,
  title: string
): ProjectIndex {
  const clean = title.trim() || 'Untitled';
  const next = touchProject(index, id, clean);
  saveProjectIndex(next);
  return next;
}

export function deleteProject(
  index: ProjectIndex,
  id: string
): { index: ProjectIndex; room: Room } {
  if (index.projects.length <= 1) {
    // Reset the only project instead of deleting
    const only = index.projects[0];
    const empty = createEmptyRoom();
    saveProjectRoom(only.id, empty);
    const next = touchProject(index, only.id);
    saveProjectIndex(next);
    return { index: next, room: empty };
  }

  try {
    localStorage.removeItem(projectKey(id));
  } catch {
    // ignore
  }

  const projects = index.projects.filter((p) => p.id !== id);
  let activeId = index.activeId;
  if (activeId === id) {
    activeId = projects[0].id;
  }
  const next: ProjectIndex = { projects, activeId };
  saveProjectIndex(next);
  return { index: next, room: loadProjectRoom(activeId) };
}

export function setActiveProject(
  index: ProjectIndex,
  id: string
): { index: ProjectIndex; room: Room } | null {
  if (!index.projects.some((p) => p.id === id)) return null;
  const next: ProjectIndex = { ...index, activeId: id };
  saveProjectIndex(next);
  return { index: next, room: loadProjectRoom(id) };
}

export function getActiveMeta(index: ProjectIndex): ProjectMeta {
  return (
    index.projects.find((p) => p.id === index.activeId) || index.projects[0]
  );
}
