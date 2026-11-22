import { COPY } from '../content/copy';
import { shuffle } from './rng';
import { zoneName } from './zones';
import type {
  DilemmaCard,
  Effect,
  EventCard,
  GameEvent,
  GameState,
  LogEntry,
  PlayerState,
  ResponseCard,
  ThreatCard,
} from './types';

export function addLog(g: GameState, text: string, tone: LogEntry['tone'] = 'neutral'): void {
  const last = g.log[g.log.length - 1];
  g.log.push({ id: last ? last.id + 1 : 1, round: g.round, text, tone });
  if (g.log.length > g.config.logMax) g.log.splice(0, g.log.length - g.config.logMax);
}

export function activePlayer(g: GameState): PlayerState {
  return g.players[g.activeIdx];
}

export function findPlayer(g: GameState, id: string): PlayerState | undefined {
  return g.players.find((p) => p.id === id);
}

function takeTop<T>(g: GameState, deck: T[], discard: T[]): T | undefined {
  if (deck.length === 0 && discard.length > 0) {
    const r = shuffle(discard, g.rngState);
    g.rngState = r.state;
    deck.push(...r.items);
    discard.length = 0;
  }
  return deck.shift();
}

export function takeResponse(g: GameState): ResponseCard | undefined {
  return takeTop(g, g.decks.responses, g.decks.responsesDiscard);
}
export function takeDilemma(g: GameState): DilemmaCard | undefined {
  return takeTop(g, g.decks.dilemmas, g.decks.dilemmasDiscard);
}
export function takeEvent(g: GameState): EventCard | undefined {
  return takeTop(g, g.decks.events, g.decks.eventsDiscard);
}
export function takeThreat(g: GameState): ThreatCard | undefined {
  return g.decks.threats.shift();
}

export function drawResponses(
  g: GameState,
  p: PlayerState,
  n: number,
  events: GameEvent[],
): number {
  let drawn = 0;
  while (drawn < n && p.hand.length < g.config.limits.handMax) {
    const card = takeResponse(g);
    if (!card) break;
    p.hand.push(card);
    drawn += 1;
  }
  if (drawn > 0) events.push({ kind: 'cards_drawn', playerId: p.id, count: drawn });
  return drawn;
}

export function changeIntegrity(
  g: GameState,
  p: PlayerState,
  delta: number,
  events: GameEvent[],
): void {
  if (delta === 0) return;
  const before = p.integrity;
  p.integrity = Math.min(g.config.limits.integrityMax, p.integrity + delta);
  events.push({
    kind: 'stat_changed',
    playerId: p.id,
    stat: 'integrity',
    delta: p.integrity - before,
    value: p.integrity,
  });
}

export function changeReputation(p: PlayerState, delta: number, events: GameEvent[]): void {
  if (delta === 0) return;
  const before = p.reputation;
  p.reputation = Math.max(0, p.reputation + delta);
  events.push({
    kind: 'stat_changed',
    playerId: p.id,
    stat: 'reputation',
    delta: p.reputation - before,
    value: p.reputation,
  });
}

export function changeHate(g: GameState, delta: number, events: GameEvent[]): void {
  if (delta === 0) return;
  const before = g.hate;
  g.hate = Math.max(0, Math.min(g.config.limits.hateMax, g.hate + delta));
  if (g.hate !== before)
    events.push({ kind: 'hate_changed', delta: g.hate - before, value: g.hate });
}

export function applyEffects(
  g: GameState,
  p: PlayerState,
  effects: Effect[],
  events: GameEvent[],
): void {
  for (const e of effects) {
    switch (e.t) {
      case 'integrity':
        changeIntegrity(g, p, e.n, events);
        break;
      case 'reputation':
        changeReputation(p, e.n, events);
        break;
      case 'hate':
        changeHate(g, e.n, events);
        break;
      case 'drawResponse':
        drawResponses(g, p, e.n, events);
        break;
      default: {
        const never: never = e;
        throw new Error(`Efeito desconhecido: ${JSON.stringify(never)}`);
      }
    }
  }
}

export function checkSuspension(g: GameState, p: PlayerState, events: GameEvent[]): void {
  if (p.integrity > 0) return;
  p.suspended = true;
  p.zone = g.config.suspension.returnZone;
  p.integrity = g.config.suspension.returnIntegrity;
  addLog(g, COPY.log.suspended(p.name), 'bad');
  events.push({ kind: 'player_suspended', playerId: p.id });
}

export function placeThreat(g: GameState, events: GameEvent[]): boolean {
  const card = takeThreat(g);
  if (!card) {
    addLog(g, COPY.log.noMoreThreats);
    return false;
  }
  const redirected = card.homeZone === g.config.safeZone;
  const zone = redirected ? g.config.redirectZone : card.homeZone;
  g.threats.push({ card, zone, since: g.round });
  addLog(g, COPY.log.threatEntered(card.name, zoneName(zone), redirected), 'bad');
  events.push({ kind: 'threat_entered', threatId: card.id, zone, redirected });
  return true;
}
