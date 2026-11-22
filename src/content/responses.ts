import type { ResponseKind } from '../engine/types';

export interface ResponseTemplate {
  kind: ResponseKind;
  name: string;
  value: number;
  copies: number;
  slug: string;
  playIntegrity?: number;
}

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  { kind: 'denunciar', name: 'Denunciar', value: 2, copies: 2, slug: 'denunciar' },
  { kind: 'dados', name: 'Responder com dados', value: 2, copies: 2, slug: 'dados' },
  {
    kind: 'acolher',
    name: 'Acolher a vítima',
    value: 1,
    copies: 2,
    slug: 'acolher',
    playIntegrity: 1,
  },
  { kind: 'bloquear', name: 'Bloquear perfil', value: 1, copies: 1, slug: 'bloquear' },
  { kind: 'mobilizar', name: 'Mobilizar a comunidade', value: 3, copies: 1, slug: 'mobilizar' },
  {
    kind: 'cancelamento',
    name: 'Cancelamento em Massa',
    value: 4,
    copies: 1,
    slug: 'cancelamento',
  },
];
