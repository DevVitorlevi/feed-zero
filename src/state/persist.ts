import type { GameState } from '../engine/types';

const KEY = 'feed-zero:save';
const VERSION = 1;

interface Save {
  version: number;
  state: GameState;
}

function looksValid(value: unknown): value is Save {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<Save>;
  if (v.version !== VERSION || typeof v.state !== 'object' || v.state === null) return false;
  const s = v.state as Partial<GameState>;
  return (
    s.version === 1 &&
    typeof s.seed === 'string' &&
    Array.isArray(s.players) &&
    s.players.length >= 2 &&
    Array.isArray(s.threats) &&
    typeof s.phase === 'string' &&
    s.phase !== 'ended' &&
    typeof s.config === 'object'
  );
}

export function loadGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (looksValid(parsed)) return parsed.state;
    window.localStorage.removeItem(KEY);
    return null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    const save: Save = { version: VERSION, state };
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* empty */
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* empty */
  }
}
