import { COPY } from '../content/copy';
import { beginTurn, checkEnd } from './flow';
import { addLog, changeHate, drawResponses, placeThreat, takeEvent } from './ops';
import type { AlgoStep, GameEvent, GameState } from './types';

const ORDER: AlgoStep[] = ['event', 'threat', 'hate', 'check'];

function threatsThisRound(g: GameState): number {
  const late = g.config.threatsPerRoundLate;
  return g.round >= late.fromRound ? late.count : g.config.threatsPerRoundBase;
}

function stepEvent(g: GameState, events: GameEvent[]): void {
  const card = takeEvent(g);
  if (!card) return;
  g.decks.eventsDiscard.push(card);
  addLog(g, COPY.log.eventRevealed(card.name));
  events.push({ kind: 'event_revealed', eventId: card.id });
  switch (card.effect) {
    case 'hate+1':
      changeHate(g, 1, events);
      addLog(g, COPY.log.eventHate, 'bad');
      break;
    case 'everyoneDraws1':
      for (const p of g.players) drawResponses(g, p, 1, events);
      addLog(g, COPY.log.eventDraw, 'good');
      break;
    case 'extraThreat':
      addLog(g, COPY.log.eventExtraThreat, 'bad');
      placeThreat(g, events);
      break;
    default: {
      const never: never = card.effect;
      throw new Error(`Evento desconhecido: ${String(never)}`);
    }
  }
}

function stepThreat(g: GameState, events: GameEvent[]): void {
  const n = threatsThisRound(g);
  for (let i = 0; i < n; i++) if (!placeThreat(g, events)) break;
}

/** Ódio Viral sobe +1 por ZONA com ao menos uma Ameaça (não por Ameaça). */
function stepHate(g: GameState, events: GameEvent[]): void {
  const zones = new Set(g.threats.map((t) => t.zone)).size;
  if (zones === 0) return;
  changeHate(g, zones, events);
  addLog(g, COPY.log.hateRose(zones, zones), 'bad');
}

/** Executa o passo atual da Fase do Algoritmo e avança para o próximo. */
export function algorithmNext(g: GameState, events: GameEvent[]): void {
  const step = g.algoStep ?? 'event';
  switch (step) {
    case 'event':
      stepEvent(g, events);
      break;
    case 'threat':
      stepThreat(g, events);
      break;
    case 'hate':
      stepHate(g, events);
      break;
    case 'check': {
      if (checkEnd(g, events)) return;
      g.round += 1;
      g.activeIdx = 0;
      g.algoStep = undefined;
      g.history = [];
      addLog(g, COPY.log.roundStarted(g.round));
      events.push({ kind: 'round_started', round: g.round });
      beginTurn(g, events);
      return;
    }
    default: {
      const never: never = step;
      throw new Error(`Passo desconhecido: ${String(never)}`);
    }
  }
  const next = ORDER[ORDER.indexOf(step) + 1];
  g.algoStep = next;
  events.push({ kind: 'algorithm_step', step: next });
}
