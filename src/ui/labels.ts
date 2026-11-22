import { CHARACTERS } from '../content/characteres';
import type {
  CharacterId,
  GameConfig,
  ResponseCard,
  ThreatType,
  Weakness,
  ZoneId,
} from '../engine/types';

export const THREAT_TYPE_LABEL: Record<ThreatType, string> = {
  discurso_odio: 'Discurso de ódio',
  desinformacao: 'Desinformação',
  perfil_falso: 'Perfil falso',
  assedio: 'Assédio',
  sistema: 'Sistema',
};

export const WEAKNESS_LABEL: Record<Weakness, string> = {
  denunciar: 'Denunciar',
  dados: 'Responder com dados',
  acolher: 'Acolher a vítima',
  bloquear: 'Bloquear perfil',
  mobilizar: 'Mobilizar a comunidade',
  prova: 'Prova',
};

export const ZONE_SHORT: Record<ZoneId, string> = {
  feed: 'Feed',
  comentarios: 'Comentários',
  stories: 'Stories',
  trending: 'Trending',
  grupos: 'Grupos',
  dms: 'DMs',
  central: 'Central',
};

export const DARK_ZONES: ReadonlySet<ZoneId> = new Set<ZoneId>(['feed', 'grupos', 'central']);

export const CHAR_FG: Record<CharacterId, string> = {
  marina: '#2B2B33',
  caio: '#FFFFFF',
  rafa: '#2B2B33',
  helena: '#FFFFFF',
};

export function charDef(id: CharacterId) {
  const def = CHARACTERS.find((c) => c.id === id);
  if (!def) throw new Error(`Personagem desconhecido: ${id}`);
  return def;
}

export function cardCaption(card: ResponseCard, cfg: GameConfig): string {
  const parts = [`Valor ${card.value}`];
  if (card.playIntegrity) parts.push(`+${card.playIntegrity} Integridade ao jogar`);
  if (card.kind === 'cancelamento') {
    parts.push(
      `Atalho: ignora a Fraqueza, custa ${cfg.shortcut.integrityCost} Integridade e +${cfg.shortcut.hateCost} Ódio Viral`,
    );
  }
  return parts.join(' · ');
}
