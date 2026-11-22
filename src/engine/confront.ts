import { COPY } from '../content/copy';
import { addLog, changeHate, changeIntegrity, changeReputation, findPlayer } from './ops';
import { currentPlayer } from './rules';
import { distance, effectiveStrength, zoneName, zoneStrengthMod } from './zones';
import type {
  ConfrontPreview,
  GameEvent,
  GameState,
  PlayerState,
  ResponseCard,
  ThreatOnBoard,
} from './types';

const R = COPY.reject;

export function canReachThreat(
  state: GameState,
  player: PlayerState,
  threat: ThreatOnBoard,
): boolean {
  const d = distance(player.zone, threat.zone);
  if (d === 0) return true;
  return player.character === 'helena' && d <= state.config.abilities.helena.reach;
}

function emptyPreview(reason: string): ConfrontPreview {
  return {
    allowed: false,
    reason,
    cardsTotal: 0,
    weaknessBonus: 0,
    abilityBonus: 0,
    total: 0,
    required: 0,
    zoneMod: 0,
    usesShortcut: false,
    costs: { integrity: 0, hate: 0 },
    onPlay: { integrity: 0 },
    willSucceed: false,
    rewards: { reputation: 0, integrity: 0 },
  };
}

export function previewConfront(
  state: GameState,
  playerId: string,
  threatId: string,
  cardIds: string[],
): ConfrontPreview {
  if (state.phase === 'ended') return emptyPreview(R.ended);
  const player = findPlayer(state, playerId);
  if (!player) return emptyPreview(R.notYourTurn);
  const threat = state.threats.find((t) => t.card.id === threatId);
  if (!threat) return emptyPreview(R.noThreat);

  const cfg = state.config;
  const cards = cardIds
    .map((id) => player.hand.find((c) => c.id === id))
    .filter((c): c is ResponseCard => c !== undefined);

  const usesShortcut = cards.some((c) => c.kind === 'cancelamento');
  const cardsTotal = cards.reduce((sum, c) => sum + c.value, 0);
  const weaknessBonus =
    !usesShortcut && cards.some((c) => c.kind === threat.card.weakness)
      ? cfg.confront.weaknessBonus
      : 0;
  const abilityBonus =
    player.character === 'marina' && cfg.abilities.marina.types.includes(threat.card.type)
      ? cfg.abilities.marina.bonus
      : 0;
  const total = cardsTotal + weaknessBonus + abilityBonus;
  const zoneMod = zoneStrengthMod(state, threat);
  const required = effectiveStrength(state, threat);

  const isRafa = player.character === 'rafa';
  const extra = isRafa ? cfg.abilities.rafa.shortcutExtra : 0;
  const costs = usesShortcut
    ? { integrity: cfg.shortcut.integrityCost + extra, hate: cfg.shortcut.hateCost + extra }
    : { integrity: 0, hate: 0 };

  const fx = cfg.zoneEffects[threat.zone];
  const noRep = fx?.noReputation === true;
  const rewards = {
    reputation: noRep
      ? 0
      : cfg.confront.baseReputation +
        (fx?.bonusReputation ?? 0) +
        (isRafa ? cfg.abilities.rafa.reputationBonus : 0),
    integrity: fx?.bonusIntegrity ?? 0,
  };
  const onPlay = { integrity: cards.reduce((sum, c) => sum + (c.playIntegrity ?? 0), 0) };

  const base: ConfrontPreview = {
    allowed: true,
    cardsTotal,
    weaknessBonus,
    abilityBonus,
    total,
    required,
    zoneMod,
    usesShortcut,
    costs,
    onPlay,
    willSucceed: total >= required,
    rewards,
  };

  const deny = (reason: string): ConfrontPreview => ({
    ...base,
    allowed: false,
    reason,
    willSucceed: false,
  });

  if (state.phase === 'turn.move') return deny(R.needMove);
  if (state.phase === 'turn.dilemma') return deny(R.needDilemmaChoice);
  if (state.phase !== 'turn.act') return deny(R.wrongPhase);
  if (currentPlayer(state).id !== playerId) return deny(R.notYourTurn);
  if (!canReachThreat(state, player, threat)) return deny(R.threatNotReachable);
  if (cardIds.length < cfg.confront.minCards || cardIds.length > cfg.confront.maxCards)
    return deny(R.cardCount);
  if (new Set(cardIds).size !== cardIds.length) return deny(R.duplicateCards);
  if (cards.length !== cardIds.length) return deny(R.cardsNotInHand);
  return base;
}

export function resolveConfront(
  g: GameState,
  threatId: string,
  cardIds: string[],
  preview: ConfrontPreview,
  events: GameEvent[],
): void {
  const player = currentPlayer(g);
  const threat = g.threats.find((t) => t.card.id === threatId);
  if (!threat) return;

  const played = cardIds
    .map((id) => player.hand.find((c) => c.id === id))
    .filter((c): c is ResponseCard => !!c);
  player.hand = player.hand.filter((c) => !cardIds.includes(c.id));
  g.decks.responsesDiscard.push(...played);
  events.push({
    kind: 'cards_played',
    playerId: player.id,
    cardIds,
    shortcut: preview.usesShortcut,
  });
  addLog(g, COPY.log.played(player.name, played.map((c) => c.name).join(' + ')));

  if (preview.usesShortcut) {
    changeIntegrity(g, player, -preview.costs.integrity, events);
    changeHate(g, preview.costs.hate, events);
    addLog(
      g,
      COPY.log.shortcutCost(player.name, preview.costs.integrity, preview.costs.hate),
      'bad',
    );
  }
  if (preview.onPlay.integrity > 0) {
    changeIntegrity(g, player, preview.onPlay.integrity, events);
    addLog(g, COPY.log.acolherIntegrity(player.name, preview.onPlay.integrity), 'good');
  }

  if (!preview.willSucceed) {
    addLog(
      g,
      COPY.log.confrontFailed(player.name, threat.card.name, preview.total, preview.required),
      'bad',
    );
    events.push({ kind: 'confront_failed', threatId, playerId: player.id });
    return;
  }

  g.threats = g.threats.filter((t) => t.card.id !== threatId);
  g.eliminated += 1;
  if (preview.usesShortcut) player.stats.shortcuts += 1;
  else player.stats.cleanKills += 1;
  changeReputation(player, preview.rewards.reputation, events);
  changeIntegrity(g, player, preview.rewards.integrity, events);
  addLog(
    g,
    COPY.log.eliminated(
      player.name,
      threat.card.name,
      zoneName(threat.zone),
      preview.rewards.reputation,
      preview.rewards.integrity,
    ),
    'good',
  );
  events.push({ kind: 'threat_removed', threatId, zone: threat.zone, playerId: player.id });
}
