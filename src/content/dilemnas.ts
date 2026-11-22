import type { DilemmaCard } from '../engine/types';

export const DILEMMAS: DilemmaCard[] = [
  {
    id: 'dilema-brincadeira',
    name: '“Brincadeira” no grupo da turma',
    prompt: 'Alguém posta uma “brincadeira” com estereótipo no grupo da turma. E agora?',
    image: '/cards/dilema-brincadeira.webp',
    a: {
      label: 'Chamar a atenção',
      effects: [
        { t: 'reputation', n: -1 },
        { t: 'integrity', n: 2 },
      ],
    },
    b: {
      label: 'Deixar passar',
      effects: [
        { t: 'reputation', n: 1 },
        { t: 'integrity', n: -1 },
        { t: 'hate', n: 1 },
      ],
    },
  },
  {
    id: 'dilema-print',
    name: 'Print que expõe a vítima',
    prompt: 'Você tem um print que expõe a vítima de um ataque. Compartilhar ajuda a denunciar?',
    image: '/cards/dilema-print.webp',
    a: {
      label: 'Compartilhar “para denunciar”',
      effects: [
        { t: 'reputation', n: 2 },
        { t: 'integrity', n: -2 },
        { t: 'hate', n: 1 },
      ],
    },
    b: {
      label: 'Não compartilhar e denunciar à plataforma',
      effects: [
        { t: 'integrity', n: 1 },
        { t: 'drawResponse', n: 1 },
      ],
    },
  },
  {
    id: 'dilema-usuario-popular',
    name: 'Usuário popular',
    prompt:
      'Um usuário popular espalha conteúdo que viola as regras. Aplicar a mesma regra para todos?',
    image: '/cards/dilema-usuario-popular.webp',
    a: {
      label: 'Remover com a mesma regra',
      effects: [
        { t: 'reputation', n: -1 },
        { t: 'integrity', n: 2 },
      ],
    },
    b: {
      label: 'Deixar no ar',
      effects: [
        { t: 'reputation', n: 2 },
        { t: 'integrity', n: -2 },
        { t: 'hate', n: 1 },
      ],
    },
  },
];
