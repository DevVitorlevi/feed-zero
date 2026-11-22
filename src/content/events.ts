import type { EventCard } from '../engine/types';

export const EVENTS: EventCard[] = [
  {
    id: 'evento-polemica',
    name: 'Algoritmo impulsiona polêmica',
    image: '/cards/evento-polemica.webp',
    effect: 'hate+1',
  },
  {
    id: 'evento-campanha',
    name: 'Campanha de conscientização',
    image: '/cards/evento-campanha.webp',
    effect: 'everyoneDraws1',
  },
  {
    id: 'evento-noticia-viral',
    name: 'Notícia viral',
    image: '/cards/evento-noticia-viral.webp',
    effect: 'extraThreat',
  },
];
