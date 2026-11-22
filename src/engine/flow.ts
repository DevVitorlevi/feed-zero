import { COPY } from '../content/copy';
import { addLog, checkSuspension, drawResponses } from './ops';
import { computeResult, evaluateEnd } from './scoring';
import type { GameEvent, GameState } from './types';

export function endGame(
  g: GameState,
  outcome: 'victory' | 'feed_tomado' | 'sem_saida',
  events: GameEvent[],
): void {
  g.result = computeResult(g, outcome);
  g.phase = 'ended';
  g.algoStep = undefined;
  g.pendingDilemma = undefined;
  g.history = [];
  const text =
    outcome === 'victory'
      ? COPY.log.victory
      : outcome === 'feed_tomado'
        ? COPY.log.feedTomado
        : COPY.log.semSaida;
  addLog(g, text, outcome === 'victory' ? 'good' : 'bad');
  events.push({ kind: 'game_ended', outcome });
}

export function checkEnd(g: GameState, events: GameEvent[]): boolean {
  const outcome = evaluateEnd(g);
  if (!outcome) return false;
  endGame(g, outcome, events);
  return true;
}

export function enterAlgorithm(g: GameState, events: GameEvent[]): void {
  g.phase = 'algorithm';
  g.algoStep = 'event';
  g.history = [];
  g.turn = { moved: false, acted: false };
  addLog(g, COPY.log.algorithmStart);
  events.push({ kind: 'algorithm_step', step: 'event' });
}

export function beginTurn(g: GameState, events: GameEvent[]): void {
  while (g.activeIdx < g.players.length) {
    const p = g.players[g.activeIdx];
    if (p.suspended) {
      p.suspended = false;
      addLog(g, COPY.log.turnSkipped(p.name), 'bad');
      events.push({ kind: 'turn_skipped', playerId: p.id });
      g.activeIdx += 1;
      continue;
    }
    const drawn = drawResponses(g, p, 1, events);
    if (drawn > 0) addLog(g, COPY.log.drew(p.name, drawn));
    g.phase = 'turn.move';
    g.turn = { moved: false, acted: false };
    events.push({ kind: 'turn_started', playerId: p.id });
    return;
  }
  enterAlgorithm(g, events);
}

export function endTurn(g: GameState, events: GameEvent[]): void {
  g.activeIdx += 1;
  beginTurn(g, events);
}

export function finishAction(g: GameState, events: GameEvent[]): void {
  for (const p of g.players) checkSuspension(g, p, events);
  if (checkEnd(g, events)) return;
  endTurn(g, events);
}
