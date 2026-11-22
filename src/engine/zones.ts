import { ZONES } from '../content/zones';
import type { GameState, ThreatOnBoard, ZoneId } from './types';

const ADJ: Record<string, ZoneId[]> = Object.fromEntries(ZONES.map((z) => [z.id, z.neighbors]));

export function neighbors(zone: ZoneId): ZoneId[] {
  return ADJ[zone] ?? [];
}

export function distance(from: ZoneId, to: ZoneId): number {
  if (from === to) return 0;
  const seen = new Set<ZoneId>([from]);
  let frontier: ZoneId[] = [from];
  let d = 0;
  while (frontier.length > 0) {
    d += 1;
    const next: ZoneId[] = [];
    for (const z of frontier) {
      for (const n of neighbors(z)) {
        if (seen.has(n)) continue;
        if (n === to) return d;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return Infinity;
}

export function reachableZones(from: ZoneId, range: number): ZoneId[] {
  return ZONES.map((z) => z.id).filter((z) => z !== from && distance(from, z) <= range);
}

export function zoneStrengthMod(state: GameState, threat: ThreatOnBoard): number {
  const fx = state.config.zoneEffects[threat.zone];
  if (!fx) return 0;
  let mod = fx.strengthMod ?? 0;
  if (fx.strengthModIfOtherThreat) {
    const others = state.threats.some(
      (t) => t.zone === threat.zone && t.card.id !== threat.card.id,
    );
    if (others) mod += fx.strengthModIfOtherThreat;
  }
  return mod;
}

export function effectiveStrength(state: GameState, threat: ThreatOnBoard): number {
  return Math.max(
    state.config.confront.minStrength,
    threat.card.strength + zoneStrengthMod(state, threat),
  );
}

export function zoneName(id: ZoneId): string {
  return ZONES.find((z) => z.id === id)?.name ?? id;
}
