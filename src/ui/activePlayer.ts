import type { GameState, PlayerState } from '../engine/types';
export function viewPlayer(g: GameState): PlayerState {
  const i = Math.min(Math.max(g.activeIdx, 0), g.players.length - 1);
  return g.players[i];
}

export function turnPlayer(g: GameState): PlayerState | null {
  if (g.phase === 'algorithm' || g.phase === 'ended') return null;
  return g.players[g.activeIdx] ?? null;
}
