import { COPY } from '../content/copy';
import { algorithmNext } from './algorithm';
import { previewConfront, resolveConfront } from './confront';
import { finishAction } from './flow';
import {
  addLog,
  applyEffects,
  changeIntegrity,
  changeReputation,
  drawResponses,
  findPlayer,
  takeDilemma,
} from './ops';
import {
  currentPlayer,
  debugRejection,
  exploreRejection,
  moveRejection,
  restRejection,
  skipMoveRejection,
  supportRejection,
} from './rules';
import { createGame, setupRejection } from './setup';
import { zoneName } from './zones';
import type { Action, GameEvent, GameState, ReduceResult } from './types';

const R = COPY.reject;

function reject(state: GameState, reason: string): ReduceResult {
  return { state, events: [{ kind: 'rejected', reason }] };
}

function draftOf(state: GameState): GameState {
  return structuredClone({ ...state, history: [] });
}

function commit(
  prev: GameState,
  draft: GameState,
  events: GameEvent[],
  track: boolean,
): ReduceResult {
  if (draft.phase === 'algorithm' || draft.phase === 'ended') {
    draft.history = [];
  } else if (track) {
    const snapshot: GameState = { ...prev, history: [] };
    draft.history = [...prev.history, snapshot].slice(-prev.config.historyMax);
  } else {
    draft.history = prev.history;
  }
  return { state: draft, events };
}

export function reduce(state: GameState, action: Action): ReduceResult {
  switch (action.type) {
    case 'START_GAME': {
      const reason = setupRejection(action.players, state.config);
      if (reason) return reject(state, reason);
      return createGame(action.players, action.seed, state.config);
    }
    case 'RESTART': {
      const players = state.players.map((p) => ({ name: p.name, character: p.character }));
      const seed = action.sameSeed ? state.seed : `${state.seed}.${state.rngState.toString(36)}`;
      const r = createGame(players, seed, state.config);
      return {
        state: r.state,
        events: [{ kind: 'restarted', sameSeed: action.sameSeed }, ...r.events],
      };
    }
    case 'UNDO': {
      if (state.phase === 'algorithm' || state.phase === 'ended' || state.history.length === 0) {
        return reject(state, R.undoUnavailable);
      }
      const snap = state.history[state.history.length - 1];
      const restored: GameState = { ...snap, history: state.history.slice(0, -1) };
      return { state: restored, events: [{ kind: 'undo' }] };
    }
    case 'ALGORITHM_NEXT': {
      if (state.phase !== 'algorithm')
        return reject(state, state.phase === 'ended' ? R.ended : R.noAlgorithm);
      const g = draftOf(state);
      const events: GameEvent[] = [];
      algorithmNext(g, events);
      return commit(state, g, events, false);
    }
    case 'MOVE': {
      const reason = moveRejection(state, action.zone);
      if (reason) return reject(state, reason);
      const g = draftOf(state);
      const events: GameEvent[] = [];
      const me = currentPlayer(g);
      const from = me.zone;
      me.zone = action.zone;
      g.phase = 'turn.act';
      g.turn.moved = true;
      addLog(g, COPY.log.moved(me.name, zoneName(action.zone)));
      events.push({ kind: 'player_moved', playerId: me.id, from, to: action.zone });
      return commit(state, g, events, true);
    }
    case 'SKIP_MOVE': {
      const reason = skipMoveRejection(state);
      if (reason) return reject(state, reason);
      const g = draftOf(state);
      g.phase = 'turn.act';
      g.turn.moved = true;
      addLog(g, COPY.log.stayed(currentPlayer(g).name));
      return commit(state, g, [], true);
    }
    case 'CONFRONT': {
      const me = currentPlayer(state);
      const preview = previewConfront(state, me.id, action.threatId, action.cardIds);
      if (!preview.allowed) return reject(state, preview.reason ?? R.wrongPhase);
      const g = draftOf(state);
      const events: GameEvent[] = [];
      resolveConfront(g, action.threatId, action.cardIds, preview, events);
      g.turn.acted = true;
      finishAction(g, events);
      return commit(state, g, events, true);
    }
    case 'EXPLORE': {
      const reason = exploreRejection(state);
      if (reason) return reject(state, reason);
      const g = draftOf(state);
      const events: GameEvent[] = [];
      const me = currentPlayer(g);
      const card = takeDilemma(g);
      if (!card) return reject(state, R.noDilemma);
      g.pendingDilemma = card;
      g.phase = 'turn.dilemma';
      g.turn.acted = true;
      addLog(g, COPY.log.explored(me.name, card.name));
      events.push({ kind: 'dilemma_drawn', dilemmaId: card.id, playerId: me.id });
      const extra = g.config.zoneEffects[me.zone]?.exploreDrawsResponse ?? 0;
      if (extra > 0 && drawResponses(g, me, extra, events) > 0)
        addLog(g, COPY.log.exploreDraw(me.name));
      return commit(state, g, events, true);
    }
    case 'CHOOSE_DILEMMA': {
      if (state.phase !== 'turn.dilemma' || !state.pendingDilemma) {
        return reject(state, state.phase === 'ended' ? R.ended : R.wrongPhase);
      }
      const g = draftOf(state);
      const events: GameEvent[] = [];
      const me = currentPlayer(g);
      const card = g.pendingDilemma;
      if (!card) return reject(state, R.wrongPhase);
      const option = action.option === 'a' ? card.a : card.b;
      addLog(g, COPY.log.dilemmaChoice(me.name, option.label));
      applyEffects(g, me, option.effects, events);
      g.decks.dilemmasDiscard.push(card);
      g.pendingDilemma = undefined;
      events.push({
        kind: 'dilemma_resolved',
        dilemmaId: card.id,
        option: action.option,
        playerId: me.id,
      });
      finishAction(g, events);
      return commit(state, g, events, true);
    }
    case 'SUPPORT': {
      const reason = supportRejection(state, action.toPlayerId, action.cardIds);
      if (reason) return reject(state, reason);
      const g = draftOf(state);
      const events: GameEvent[] = [];
      const me = currentPlayer(g);
      const to = findPlayer(g, action.toPlayerId);
      if (!to) return reject(state, R.supportUnknownPlayer);
      const given = me.hand.filter((c) => action.cardIds.includes(c.id));
      me.hand = me.hand.filter((c) => !action.cardIds.includes(c.id));
      to.hand.push(...given);
      me.stats.supports += 1;
      changeReputation(me, g.config.support.reputation, events);
      g.turn.acted = true;
      addLog(
        g,
        COPY.log.supported(me.name, to.name, given.length, g.config.support.reputation),
        'good',
      );
      events.push({ kind: 'cards_given', fromId: me.id, toId: to.id, count: given.length });
      finishAction(g, events);
      return commit(state, g, events, true);
    }
    case 'REST': {
      const reason = restRejection(state);
      if (reason) return reject(state, reason);
      const g = draftOf(state);
      const events: GameEvent[] = [];
      const me = currentPlayer(g);
      changeIntegrity(g, me, g.config.rest.integrity, events);
      drawResponses(g, me, g.config.rest.draw, events);
      g.turn.acted = true;
      addLog(g, COPY.log.rested(me.name, g.config.rest.integrity, g.config.rest.draw), 'good');
      events.push({ kind: 'rested', playerId: me.id });
      finishAction(g, events);
      return commit(state, g, events, true);
    }
    case 'DEBUG_REORDER': {
      const reason = debugRejection(state);
      if (reason) return reject(state, reason);
      const g = draftOf(state);
      const me = currentPlayer(g);
      me.debugUsedRound = g.round;
      if (action.swap) {
        const [a, b] = [g.decks.threats[0], g.decks.threats[1]];
        g.decks.threats[0] = b;
        g.decks.threats[1] = a;
      }
      addLog(g, COPY.log.debug(me.name, action.swap));
      return commit(
        state,
        g,
        [{ kind: 'debug_used', playerId: me.id, swapped: action.swap }],
        true,
      );
    }
    default: {
      const never: never = action;
      return reject(state, `${R.wrongPhase} (${JSON.stringify(never)})`);
    }
  }
}
