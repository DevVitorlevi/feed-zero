import { CONFIG } from '../content/config';
import { COPY } from '../content/copy';
import { DILEMMAS } from '../content/dilemmas';
import { EVENTS } from '../content/events';
import { RESPONSE_TEMPLATES } from '../content/responses';
import { THREATS } from '../content/threats';
import { addLog, drawResponses, placeThreat } from './ops';
import { beginTurn } from './flow';
import { hashSeed, shuffle } from './rng';
import type {
  Action,
  CharacterId,
  GameConfig,
  GameEvent,
  GameState,
  PlayerState,
  ReduceResult,
  ResponseCard,
} from './types';

export const DEFAULT_SEED = 'feed-zero';

export function buildResponseDeck(copies: number): ResponseCard[] {
  const deck: ResponseCard[] = [];
  for (let round = 0; round < copies; round++) {
    for (const t of RESPONSE_TEMPLATES) {
      for (let i = 1; i <= t.copies; i++) {
        deck.push({
          id: `resp-${t.slug}-${round * t.copies + i}`,
          kind: t.kind,
          name: t.name,
          value: t.value,
          playIntegrity: t.playIntegrity,
          image: `/cards/resp-${t.slug}.webp`,
        });
      }
    }
  }
  return deck;
}

type StartPlayers = Extract<Action, { type: 'START_GAME' }>['players'];

export function setupRejection(players: StartPlayers, config: GameConfig): string | null {
  if (players.length < config.players.min || players.length > config.players.max) {
    return COPY.reject.setupPlayers;
  }
  if (players.some((p) => p.name.trim() === '')) return COPY.reject.setupNames;
  const chars = new Set<CharacterId>(players.map((p) => p.character));
  if (chars.size !== players.length) return COPY.reject.setupCharacters;
  return null;
}

export function goalFor(config: GameConfig, playerCount: number): number {
  return playerCount === 2 ? config.goal.twoPlayers : config.goal.default;
}

export function createGame(
  players: StartPlayers,
  seed: string = DEFAULT_SEED,
  config: GameConfig = CONFIG,
): ReduceResult {
  const events: GameEvent[] = [{ kind: 'game_started' }];
  let rngState = hashSeed(seed);

  const shuffled = <T>(items: T[]): T[] => {
    const r = shuffle(items, rngState);
    rngState = r.state;
    return r.items;
  };

  const g: GameState = {
    version: 1,
    seed,
    rngState,
    config: structuredClone(config),
    goal: goalFor(config, players.length),
    round: 1,
    activeIdx: 0,
    phase: 'turn.move',
    players: [],
    threats: [],
    decks: {
      threats: shuffled([...THREATS]),
      responses: shuffled(buildResponseDeck(config.responseCopies)),
      responsesDiscard: [],
      dilemmas: shuffled([...DILEMMAS]),
      dilemmasDiscard: [],
      events: shuffled([...EVENTS]),
      eventsDiscard: [],
    },
    hate: 0,
    eliminated: 0,
    turn: { moved: false, acted: false },
    log: [],
    history: [],
  };
  g.rngState = rngState;

  g.players = players.map<PlayerState>((p, i) => ({
    id: `p${i + 1}`,
    name: p.name.trim(),
    character: p.character,
    zone: config.start.zone,
    integrity: config.start.integrity,
    reputation: config.start.reputation,
    hand: [],
    suspended: false,
    stats: { cleanKills: 0, supports: 0, shortcuts: 0 },
    debugUsedRound: 0,
  }));

  addLog(g, COPY.log.gameStarted(g.players.length));
  for (const p of g.players) drawResponses(g, p, config.start.handSize, events);
  for (let i = 0; i < config.start.initialThreats; i++) placeThreat(g, events);
  events.push({ kind: 'round_started', round: 1 });
  beginTurn(g, events);
  return { state: g, events };
}
