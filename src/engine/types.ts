export type ZoneId = 'feed' | 'comentarios' | 'stories' | 'trending' | 'grupos' | 'dms' | 'central';

export type ThreatType = 'discurso_odio' | 'desinformacao' | 'perfil_falso' | 'assedio' | 'sistema';

export type ResponseKind =
  'denunciar' | 'dados' | 'acolher' | 'bloquear' | 'mobilizar' | 'cancelamento';

export type Weakness = Exclude<ResponseKind, 'cancelamento'> | 'prova';

export type CharacterId = 'marina' | 'caio' | 'rafa' | 'helena';

export interface ThreatCard {
  id: string;
  name: string;
  homeZone: ZoneId;
  type: ThreatType;
  strength: number;
  weakness: Weakness;
  image: string;
}

export interface ResponseCard {
  id: string;
  kind: ResponseKind;
  name: string;
  value: number;
  playIntegrity?: number;
  image: string;
}

export type Effect =
  | { t: 'integrity'; n: number }
  | { t: 'reputation'; n: number }
  | { t: 'hate'; n: number }
  | { t: 'drawResponse'; n: number };

export interface DilemmaOption {
  label: string;
  effects: Effect[];
}

export interface DilemmaCard {
  id: string;
  name: string;
  prompt: string;
  image: string;
  a: DilemmaOption;
  b: DilemmaOption;
}

export interface EventCard {
  id: string;
  name: string;
  image: string;
  effect: 'hate+1' | 'everyoneDraws1' | 'extraThreat';
}

export interface ZoneEffect {
  strengthMod?: number;
  strengthModIfOtherThreat?: number;
  bonusReputation?: number;
  bonusIntegrity?: number;
  noReputation?: boolean;
  exploreDrawsResponse?: number;
}

export interface GameConfig {
  players: { min: number; max: number };
  start: {
    integrity: number;
    reputation: number;
    zone: ZoneId;
    handSize: number;
    initialThreats: number;
  };
  limits: { integrityMax: number; handMax: number; hateMax: number };
  moveRange: number;
  suspension: { returnIntegrity: number; returnZone: ZoneId };
  goal: { default: number; twoPlayers: number };
  threatsPerRoundBase: number;
  threatsPerRoundLate: { fromRound: number; count: number };
  rest: { integrity: number; draw: number };
  support: { maxCards: number; reputation: number };
  confront: {
    minCards: number;
    maxCards: number;
    weaknessBonus: number;
    baseReputation: number;
    minStrength: number;
  };
  shortcut: { integrityCost: number; hateCost: number };
  abilities: {
    marina: { bonus: number; types: ThreatType[] };
    caio: { peekCount: number };
    rafa: { reputationBonus: number; shortcutExtra: number };
    helena: { reach: number };
  };
  scoring: { cleanKillPoints: number };
  zoneEffects: Partial<Record<ZoneId, ZoneEffect>>;
  safeZone: ZoneId;
  redirectZone: ZoneId;
  responseCopies: number;
  logMax: number;
  historyMax: number;
}

export interface PlayerState {
  id: string;
  name: string;
  character: CharacterId;
  zone: ZoneId;
  integrity: number;
  reputation: number;
  hand: ResponseCard[];
  suspended: boolean;
  stats: { cleanKills: number; supports: number; shortcuts: number };
  debugUsedRound: number;
}

export interface ThreatOnBoard {
  card: ThreatCard;
  zone: ZoneId;
  since: number;
}

export type Phase = 'turn.move' | 'turn.act' | 'turn.dilemma' | 'algorithm' | 'ended';
export type AlgoStep = 'event' | 'threat' | 'hate' | 'check';

export interface LogEntry {
  id: number;
  round: number;
  text: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface Breakdown {
  reputation: number;
  integrity: number;
  cleanKills: number;
  total: number;
}

export interface GameResult {
  outcome: 'victory' | 'feed_tomado' | 'sem_saida';
  ranking: { playerId: string; score: number; breakdown: Breakdown }[];
}

export interface GameState {
  version: 1;
  seed: string;
  rngState: number;
  config: GameConfig;
  goal: number;
  round: number;
  activeIdx: number;
  phase: Phase;
  algoStep?: AlgoStep;
  players: PlayerState[];
  threats: ThreatOnBoard[];
  decks: {
    threats: ThreatCard[];
    responses: ResponseCard[];
    responsesDiscard: ResponseCard[];
    dilemmas: DilemmaCard[];
    dilemmasDiscard: DilemmaCard[];
    events: EventCard[];
    eventsDiscard: EventCard[];
  };
  hate: number;
  eliminated: number;
  pendingDilemma?: DilemmaCard;
  turn: { moved: boolean; acted: boolean };
  result?: GameResult;
  log: LogEntry[];
  history: GameState[];
}

export type Action =
  | { type: 'START_GAME'; players: { name: string; character: CharacterId }[]; seed?: string }
  | { type: 'MOVE'; zone: ZoneId }
  | { type: 'SKIP_MOVE' }
  | { type: 'CONFRONT'; threatId: string; cardIds: string[] }
  | { type: 'EXPLORE' }
  | { type: 'CHOOSE_DILEMMA'; option: 'a' | 'b' }
  | { type: 'SUPPORT'; toPlayerId: string; cardIds: string[] }
  | { type: 'REST' }
  | { type: 'DEBUG_REORDER'; swap: boolean }
  | { type: 'ALGORITHM_NEXT' }
  | { type: 'UNDO' }
  | { type: 'RESTART'; sameSeed: boolean };

export type GameEvent =
  | { kind: 'game_started' }
  | { kind: 'restarted'; sameSeed: boolean }
  | { kind: 'round_started'; round: number }
  | { kind: 'turn_started'; playerId: string }
  | { kind: 'turn_skipped'; playerId: string }
  | { kind: 'cards_drawn'; playerId: string; count: number }
  | { kind: 'player_moved'; playerId: string; from: ZoneId; to: ZoneId }
  | { kind: 'cards_played'; playerId: string; cardIds: string[]; shortcut: boolean }
  | { kind: 'threat_removed'; threatId: string; zone: ZoneId; playerId: string }
  | { kind: 'confront_failed'; threatId: string; playerId: string }
  | {
      kind: 'stat_changed';
      playerId: string;
      stat: 'integrity' | 'reputation';
      delta: number;
      value: number;
    }
  | { kind: 'hate_changed'; delta: number; value: number }
  | { kind: 'dilemma_drawn'; dilemmaId: string; playerId: string }
  | { kind: 'dilemma_resolved'; dilemmaId: string; option: 'a' | 'b'; playerId: string }
  | { kind: 'cards_given'; fromId: string; toId: string; count: number }
  | { kind: 'rested'; playerId: string }
  | { kind: 'player_suspended'; playerId: string }
  | { kind: 'debug_used'; playerId: string; swapped: boolean }
  | { kind: 'algorithm_step'; step: AlgoStep }
  | { kind: 'event_revealed'; eventId: string }
  | { kind: 'threat_entered'; threatId: string; zone: ZoneId; redirected: boolean }
  | { kind: 'game_ended'; outcome: GameResult['outcome'] }
  | { kind: 'undo' }
  | { kind: 'rejected'; reason: string };

export interface ReduceResult {
  state: GameState;
  events: GameEvent[];
}

export interface ConfrontPreview {
  allowed: boolean;
  reason?: string;
  cardsTotal: number;
  weaknessBonus: number;
  abilityBonus: number;
  total: number;
  required: number;
  zoneMod: number;
  usesShortcut: boolean;
  costs: { integrity: number; hate: number };
  onPlay: { integrity: number };
  willSucceed: boolean;
  rewards: { reputation: number; integrity: number };
}
