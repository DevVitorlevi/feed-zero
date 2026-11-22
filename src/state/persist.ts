import type { GameState } from '../engine/types';

const KEY = 'feed-zero:save';
const VERSION = 2;

interface Save {
  version: number;
  state: GameState;
}

type Rec = Record<string, unknown>;

function isRec(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNum(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validPlayer(value: unknown): boolean {
  if (!isRec(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.character === 'string' &&
    typeof value.zone === 'string' &&
    isNum(value.integrity) &&
    isNum(value.reputation) &&
    Array.isArray(value.hand)
  );
}

function validThreat(value: unknown): boolean {
  if (!isRec(value)) return false;
  return typeof value.zone === 'string' && isRec(value.card) && typeof value.card.id === 'string';
}

function validConfig(value: unknown): boolean {
  if (!isRec(value)) return false;
  return isRec(value.limits) && isRec(value.confront);
}

function looksValid(value: unknown): value is Save {
  if (!isRec(value) || value.version !== VERSION || !isRec(value.state)) return false;
  const s = value.state;
  return (
    s.version === 1 &&
    typeof s.seed === 'string' &&
    typeof s.phase === 'string' &&
    s.phase !== 'ended' &&
    isNum(s.hate) &&
    isNum(s.round) &&
    isNum(s.eliminated) &&
    isNum(s.goal) &&
    Array.isArray(s.players) &&
    s.players.length >= 2 &&
    s.players.every(validPlayer) &&
    isNum(s.activeIdx) &&
    s.activeIdx >= 0 &&
    s.activeIdx <= s.players.length &&
    Array.isArray(s.threats) &&
    s.threats.every(validThreat) &&
    validConfig(s.config)
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
