import type { Breakdown, GameConfig, GameResult, GameState, PlayerState } from './types';

export function breakdownOf(p: PlayerState, config: GameConfig): Breakdown {
  const cleanKills = p.stats.cleanKills * config.scoring.cleanKillPoints;
  return {
    reputation: p.reputation,
    integrity: p.integrity,
    cleanKills,
    total: p.reputation + p.integrity + cleanKills,
  };
}

export function computeResult(g: GameState, outcome: GameResult['outcome']): GameResult {
  const rows = g.players.map((p, idx) => ({
    idx,
    playerId: p.id,
    supports: p.stats.supports,
    breakdown: breakdownOf(p, g.config),
  }));
  rows.sort(
    (a, b) =>
      b.breakdown.total - a.breakdown.total ||
      b.breakdown.integrity - a.breakdown.integrity ||
      b.supports - a.supports ||
      a.idx - b.idx,
  );
  return {
    outcome,
    ranking: rows.map((r) => ({
      playerId: r.playerId,
      score: r.breakdown.total,
      breakdown: r.breakdown,
    })),
  };
}

export function evaluateEnd(g: GameState): GameResult['outcome'] | null {
  if (g.hate >= g.config.limits.hateMax) return 'feed_tomado';
  if (g.eliminated >= g.goal) return 'victory';
  if (g.decks.threats.length === 0 && g.threats.length === 0) return 'sem_saida';
  return null;
}
