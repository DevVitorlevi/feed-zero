import type { ThreatCard } from '../engine/types';

export const THREATS: ThreatCard[] = [
  {
    id: 'ameaca-algoritmo-recomenda-odio',
    name: 'Algoritmo recomenda conteúdo de ódio',
    homeZone: 'feed',
    type: 'sistema',
    strength: 4,
    weakness: 'dados',
    image: '/cards/ameaca-algoritmo-recomenda-odio.webp',
  },
  {
    id: 'ameaca-bot-de-odio',
    name: 'Bot de ódio automatizado',
    homeZone: 'comentarios',
    type: 'perfil_falso',
    strength: 3,
    weakness: 'bloquear',
    image: '/cards/ameaca-bot-de-odio.webp',
  },
  {
    id: 'ameaca-comentario-ofensivo-vaga',
    name: 'Comentário ofensivo em post de vaga',
    homeZone: 'comentarios',
    type: 'discurso_odio',
    strength: 2,
    weakness: 'denunciar',
    image: '/cards/ameaca-comentario-ofensivo-vaga.webp',
  },
  {
    id: 'ameaca-mensagem-privada',
    name: 'Mensagem privada com ameaça',
    homeZone: 'dms',
    type: 'assedio',
    strength: 2,
    weakness: 'acolher',
    image: '/cards/ameaca-mensagem-privada.webp',
  },
  {
    id: 'ameaca-noticia-falsa',
    name: 'Notícia falsa sobre grupo racial',
    homeZone: 'trending',
    type: 'desinformacao',
    strength: 3,
    weakness: 'dados',
    image: '/cards/ameaca-noticia-falsa.webp',
  },
];
