import { COPY } from '../content/copy';
import { distance } from './zones';
import type { GameState, PlayerState, ZoneId } from './types';

const R = COPY.reject;

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.activeIdx];
}

export function moveRejection(state: GameState, zone: ZoneId): string | null {
  if (state.phase === 'ended') return R.ended;
  if (state.phase !== 'turn.move') return R.alreadyMoved;
  const me = currentPlayer(state);
  if (me.zone === zone) return R.sameZone;
  if (distance(me.zone, zone) > state.config.moveRange) return R.outOfRange;
  return null;
}

export function skipMoveRejection(state: GameState): string | null {
  if (state.phase === 'ended') return R.ended;
  if (state.phase !== 'turn.move') return R.alreadyMoved;
  return null;
}

function actRejection(state: GameState): string | null {
  if (state.phase === 'ended') return R.ended;
  if (state.phase === 'turn.move') return R.needMove;
  if (state.phase === 'turn.dilemma') return R.needDilemmaChoice;
  if (state.phase !== 'turn.act') return R.wrongPhase;
  return null;
}

export function exploreRejection(state: GameState): string | null {
  const base = actRejection(state);
  if (base) return base;
  if (state.decks.dilemmas.length + state.decks.dilemmasDiscard.length === 0) return R.noDilemma;
  return null;
}

export function restRejection(state: GameState): string | null {
  const base = actRejection(state);
  if (base) return base;
  if (currentPlayer(state).zone !== state.config.safeZone) return R.restOnlyCentral;
  return null;
}

/** Quantas cartas o jogador ainda cabe receber. */
export function handRoom(state: GameState, p: PlayerState): number {
  return Math.max(0, state.config.limits.handMax - p.hand.length);
}

export function supportRejection(
  state: GameState,
  toPlayerId: string,
  cardIds: string[],
): string | null {
  const base = actRejection(state);
  if (base) return base;
  const me = currentPlayer(state);
  const to = state.players.find((p) => p.id === toPlayerId);
  if (!to) return R.supportUnknownPlayer;
  if (to.id === me.id) return R.supportSelf;
  if (to.zone !== me.zone) return R.supportNotSameZone;
  if (cardIds.length < 1 || cardIds.length > state.config.support.maxCards)
    return R.supportCardCount;
  if (new Set(cardIds).size !== cardIds.length) return R.duplicateCards;
  if (!cardIds.every((id) => me.hand.some((c) => c.id === id))) return R.cardsNotInHand;
  if (cardIds.length > handRoom(state, to)) return R.supportHandFull;
  return null;
}

export function debugRejection(state: GameState): string | null {
  if (state.phase === 'ended') return R.ended;
  if (state.phase !== 'turn.move' && state.phase !== 'turn.act') return R.wrongPhase;
  const me = currentPlayer(state);
  if (me.character !== 'caio') return R.debugOnlyCaio;
  if (me.debugUsedRound === state.round) return R.debugUsed;
  if (state.decks.threats.length < state.config.abilities.caio.peekCount) return R.debugNotEnough;
  return null;
}
