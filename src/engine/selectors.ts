import { canReachThreat } from './confront';
import {
  currentPlayer,
  debugRejection,
  exploreRejection,
  handRoom,
  moveRejection,
  restRejection,
  skipMoveRejection,
} from './rules';
import { effectiveStrength, reachableZones } from './zones';
import type { GameState, ThreatCard, ZoneId } from './types';

export interface LegalActions {
  phase: GameState['phase'];
  activePlayerId: string | null;
  moveZones: ZoneId[];
  canSkipMove: boolean;
  confrontTargets: string[];
  canExplore: boolean;
  supportTargets: string[];
  canRest: boolean;
  canDebug: boolean;
  canUndo: boolean;
  canAlgorithmNext: boolean;
  pendingDilemma: boolean;
}

export function getLegalActions(state: GameState): LegalActions {
  const ended = state.phase === 'ended';
  const algorithm = state.phase === 'algorithm';
  const none: LegalActions = {
    phase: state.phase,
    activePlayerId: null,
    moveZones: [],
    canSkipMove: false,
    confrontTargets: [],
    canExplore: false,
    supportTargets: [],
    canRest: false,
    canDebug: false,
    canUndo: false,
    canAlgorithmNext: algorithm,
    pendingDilemma: false,
  };
  if (ended || algorithm) return none;

  const me = currentPlayer(state);
  const acting = state.phase === 'turn.act';
  return {
    ...none,
    activePlayerId: me.id,
    moveZones: reachableZones(me.zone, state.config.moveRange).filter(
      (z) => moveRejection(state, z) === null,
    ),
    canSkipMove: skipMoveRejection(state) === null,
    confrontTargets: acting
      ? state.threats.filter((t) => canReachThreat(state, me, t)).map((t) => t.card.id)
      : [],
    canExplore: exploreRejection(state) === null,
    supportTargets:
      acting && me.hand.length > 0
        ? state.players
            .filter((p) => p.id !== me.id && p.zone === me.zone && handRoom(state, p) > 0)
            .map((p) => p.id)
        : [],
    canRest: restRejection(state) === null,
    canDebug: debugRejection(state) === null,
    canUndo: state.history.length > 0,
    pendingDilemma: state.phase === 'turn.dilemma',
  };
}

export function peekThreats(state: GameState): ThreatCard[] {
  return state.decks.threats.slice(0, state.config.abilities.caio.peekCount);
}

export function threatStrength(state: GameState, threatId: string): number | null {
  const t = state.threats.find((x) => x.card.id === threatId);
  return t ? effectiveStrength(state, t) : null;
}
