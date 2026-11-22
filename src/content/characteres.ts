import type { CharacterId } from '../engine/types';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  role: string;
  color: string;
  abilityName: string;
  abilityText: string;
  image: string;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'marina',
    name: 'Marina',
    role: 'Estudante de Engenharia de Software',
    color: '#F28B30',
    abilityName: 'Voz da Experiência',
    abilityText: '+1 ao enfrentar Discurso de ódio ou Assédio.',
    image: '/cards/char-marina.webp',
  },
  {
    id: 'caio',
    name: 'Caio',
    role: 'Dev júnior em uma big tech',
    color: '#2F6FED',
    abilityName: 'Debug do Algoritmo',
    abilityText: '1x por rodada, vê as 2 primeiras Ameaças do baralho e pode trocar a ordem.',
    image: '/cards/char-caio.webp',
  },
  {
    id: 'rafa',
    name: 'Rafa',
    role: 'Influenciador',
    color: '#F7C331',
    abilityName: 'Alcance',
    abilityText: '+1 Reputação por Ameaça eliminada, mas as penalidades do atalho valem +1.',
    image: '/cards/char-rafa.webp',
  },
  {
    id: 'helena',
    name: 'Helena',
    role: 'Moderadora de conteúdo',
    color: '#7B4FD6',
    abilityName: 'Acesso de Moderação',
    abilityText: 'Pode enfrentar Ameaça em zona adjacente sem se mover.',
    image: '/cards/char-helena.webp',
  },
];
