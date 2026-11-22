import type { ZoneId } from '../engine/types';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  color: string;
  rule: string;
  neighbors: ZoneId[];
}

export const ZONES: ZoneDef[] = [
  {
    id: 'feed',
    name: 'Feed',
    color: '#2F6FED',
    rule: '+1 Reputação ao eliminar Ameaça aqui.',
    neighbors: ['comentarios', 'stories', 'trending', 'grupos', 'dms', 'central'],
  },
  {
    id: 'comentarios',
    name: 'Comentários',
    color: '#F28B30',
    rule: 'Ao Explorar, compra também 1 Resposta.',
    neighbors: ['feed', 'central', 'stories'],
  },
  {
    id: 'stories',
    name: 'Stories',
    color: '#F7E28A',
    rule: 'Ameaças aqui têm Força −1.',
    neighbors: ['feed', 'comentarios', 'trending'],
  },
  {
    id: 'trending',
    name: 'Trending',
    color: '#F7C331',
    rule: 'Ameaças têm Força +1, mas eliminá-las dá +2 Reputação.',
    neighbors: ['feed', 'stories', 'grupos'],
  },
  {
    id: 'grupos',
    name: 'Grupos Fechados',
    color: '#2B2B33',
    rule: 'Ameaça tem Força +1 se houver outra Ameaça na zona.',
    neighbors: ['feed', 'trending', 'dms'],
  },
  {
    id: 'dms',
    name: 'Mensagens Diretas',
    color: '#19B5A5',
    rule: 'Eliminar Ameaça aqui não dá Reputação, mas dá +1 Integridade.',
    neighbors: ['feed', 'grupos', 'central'],
  },
  {
    id: 'central',
    name: 'Central de Moderação',
    color: '#0E8A7D',
    rule: 'Zona segura: Ameaças não entram. Aqui se pode Descansar.',
    neighbors: ['feed', 'dms', 'comentarios'],
  },
];

export const ZONE_IDS: ZoneId[] = ZONES.map((z) => z.id);
