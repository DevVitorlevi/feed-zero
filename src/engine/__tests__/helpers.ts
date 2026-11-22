import { expect } from 'vitest';
import { RESPONSE_TEMPLATES } from '../../content/responses';
import { THREATS } from '../../content/threats';
import { reduce } from '../reducer';
import { buildResponseDeck, createGame } from '../setup';
import type {
  Action,
  CharacterId,
  GameEvent,
  GameState,
  ResponseCard,
  ResponseKind,
  ThreatCard,
  ZoneId,
} from '../types';

export const CHARS: CharacterId[] = ['marina', 'caio', 'rafa', 'helena'];

export function newGame(chars: CharacterId[] = ['caio', 'marina'], seed = 'teste'): GameState {
  const players = chars.map((c, i) => ({ name: `J${i + 1}`, character: c }));
  return createGame(players, seed).state;
}

export function mutate(state: GameState, fn: (g: GameState) => void): GameState {
  const g = structuredClone(state);
  fn(g);
  return g;
}

let counter = 0;
export function card(kind: ResponseKind): ResponseCard {
  const t = RESPONSE_TEMPLATES.find((x) => x.kind === kind);
  if (!t) throw new Error(`kind inválido: ${kind}`);
  counter += 1;
  return {
    id: `t-${kind}-${counter}`,
    kind,
    name: t.name,
    value: t.value,
    playIntegrity: t.playIntegrity,
    image: `/cards/resp-${t.slug}.webp`,
  };
}

export function withHand(state: GameState, idx: number, kinds: ResponseKind[]): GameState {
  return mutate(state, (g) => {
    g.players[idx].hand = kinds.map(card);
  });
}

export function threatCard(id: string, overrides: Partial<ThreatCard> = {}): ThreatCard {
  const base = THREATS.find((t) => t.id === id);
  if (!base) throw new Error(`ameaça inválida: ${id}`);
  return { ...base, ...overrides };
}

export function withThreat(
  state: GameState,
  id: string,
  zone: ZoneId,
  overrides: Partial<ThreatCard> = {},
): GameState {
  return mutate(state, (g) => {
    g.threats = g.threats.filter((t) => t.card.id !== id);
    g.decks.threats = g.decks.threats.filter((t) => t.id !== id);
    g.threats.push({ card: threatCard(id, overrides), zone, since: g.round });
  });
}

export function ok(state: GameState, action: Action): GameState {
  const r = reduce(state, action);
  const rejected = r.events.find((e) => e.kind === 'rejected');
  expect(
    rejected,
    `ação ${action.type} recusada: ${rejected && 'reason' in rejected ? rejected.reason : ''}`,
  ).toBeUndefined();
  return r.state;
}

export function rejected(state: GameState, action: Action): string {
  const r = reduce(state, action);
  const ev = r.events.find(
    (e): e is Extract<GameEvent, { kind: 'rejected' }> => e.kind === 'rejected',
  );
  expect(ev, `ação ${action.type} deveria ser recusada`).toBeDefined();
  expect(r.state).toBe(state);
  return ev?.reason ?? '';
}

export function scene(opts: {
  chars?: CharacterId[];
  zone?: ZoneId;
  hand?: ResponseKind[];
  threats?: { id: string; zone: ZoneId; overrides?: Partial<ThreatCard> }[];
}): GameState {
  let s = newGame(opts.chars ?? ['caio', 'marina']);
  s = mutate(s, (g) => {
    g.threats = [];
    g.players[0].zone = opts.zone ?? 'feed';
    for (const p of g.players) p.hand = [];
    g.decks.responses = buildResponseDeck(g.config.responseCopies);
    g.decks.responsesDiscard = [];
  });
  s = withHand(s, 0, opts.hand ?? []);
  for (const t of opts.threats ?? []) s = withThreat(s, t.id, t.zone, t.overrides);
  return ok(s, { type: 'SKIP_MOVE' });
}

export function confront(
  state: GameState,
  threatId: string,
  kinds: ResponseKind[],
): { before: GameState; after: GameState } {
  const ids = kinds.map((k) => {
    const c = state.players[state.activeIdx].hand.find((h) => h.kind === k);
    if (!c) throw new Error(`mão sem ${k}`);
    return c.id;
  });
  return { before: state, after: ok(state, { type: 'CONFRONT', threatId, cardIds: ids }) };
}

export function ids(state: GameState, idx: number, kinds: ResponseKind[]): string[] {
  const used = new Set<string>();
  return kinds.map((k) => {
    const c = state.players[idx].hand.find((h) => h.kind === k && !used.has(h.id));
    if (!c) throw new Error(`mão sem ${k}`);
    used.add(c.id);
    return c.id;
  });
}

export function passTurn(state: GameState): GameState {
  let s = state;
  if (s.phase === 'turn.move') s = ok(s, { type: 'SKIP_MOVE' });
  s = mutate(s, (g) => {
    g.players[g.activeIdx].zone = 'central';
  });
  return ok(s, { type: 'REST' });
}

export function runAlgorithm(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < 6 && s.phase === 'algorithm'; i++) s = ok(s, { type: 'ALGORITHM_NEXT' });
  return s;
}

export function toAlgorithm(state: GameState): GameState {
  return mutate(state, (g) => {
    g.phase = 'algorithm';
    g.algoStep = 'event';
    g.history = [];
  });
}
