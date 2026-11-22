import { describe, expect, it } from 'vitest';
import { previewConfront } from '../confront';
import { reduce } from '../reducer';
import { getLegalActions } from '../selectors';
import type { ResponseKind, ThreatCard, ZoneId } from '../types';
import { confront, ids, mutate, ok, rejected, scene } from './helpers';

const OFENSIVO = 'ameaca-comentario-ofensivo-vaga';
const BOT = 'ameaca-bot-de-odio';
const MSG = 'ameaca-mensagem-privada';
const NOTICIA = 'ameaca-noticia-falsa';
const ALGO = 'ameaca-algoritmo-recomenda-odio';

function previewOf(s: ReturnType<typeof scene>, threatId: string, kinds: ResponseKind[], idx = 0) {
  return previewConfront(s, s.players[idx].id, threatId, ids(s, idx, kinds));
}

describe('5. Enfrentar: soma, bônus de Fraqueza e atalho', () => {
  const s = scene({
    zone: 'comentarios',
    hand: ['denunciar', 'bloquear', 'cancelamento'],
    threats: [{ id: OFENSIVO, zone: 'comentarios' }],
  });

  it('Soma os valores e dá +1 se alguma carta é a Fraqueza da Ameaça', () => {
    const p = previewOf(s, OFENSIVO, ['denunciar']);
    expect(p).toMatchObject({
      allowed: true,
      cardsTotal: 2,
      weaknessBonus: 1,
      total: 3,
      required: 2,
      willSucceed: true,
    });
  });

  it('Sem a Fraqueza não há bônus; 2 cartas somam os dois valores', () => {
    const one = previewOf(s, OFENSIVO, ['bloquear']);
    expect(one).toMatchObject({ weaknessBonus: 0, total: 1, willSucceed: false });
    const two = previewOf(s, OFENSIVO, ['bloquear', 'denunciar']);
    expect(two).toMatchObject({ cardsTotal: 3, weaknessBonus: 1, total: 4 });
  });

  it('Com Cancelamento em Massa o bônus de Fraqueza é ignorado, mesmo com a carta certa', () => {
    const p = previewOf(s, OFENSIVO, ['cancelamento', 'denunciar']);
    expect(p).toMatchObject({ usesShortcut: true, weaknessBonus: 0, total: 6 });
  });

  it('A pré-visualização bate exatamente com o resultado da ação', () => {
    const preview = previewOf(s, OFENSIVO, ['denunciar']);
    const { after } = confront(s, OFENSIVO, ['denunciar']);
    expect(after.threats.some((t) => t.card.id === OFENSIVO)).toBe(!preview.willSucceed);
    expect(after.players[0].reputation).toBe(preview.rewards.reputation);
  });

  it('Falha: a Ameaça fica, as cartas vão ao descarte e nada é recompensado', () => {
    const { after } = confront(s, OFENSIVO, ['bloquear']);
    expect(after.threats.some((t) => t.card.id === OFENSIVO)).toBe(true);
    expect(after.players[0].hand.some((c) => c.kind === 'bloquear')).toBe(false);
    expect(after.decks.responsesDiscard.some((c) => c.kind === 'bloquear')).toBe(true);
    expect(after.eliminated).toBe(0);
    expect(after.players[0].reputation).toBe(0);
  });
});

describe('6. Modificadores de zona', () => {
  const required = (
    zone: ZoneId,
    id: string,
    extra: string[] = [],
    overrides: Partial<ThreatCard> = {},
  ) => {
    const s = scene({
      zone,
      hand: ['dados'],
      threats: [{ id, zone, overrides }, ...extra.map((e) => ({ id: e, zone }))],
    });
    return previewOf(s, id, ['dados']).required;
  };

  it('Stories: Força −1', () => expect(required('stories', OFENSIVO)).toBe(1));
  it('Trending: Força +1', () => expect(required('trending', OFENSIVO)).toBe(3));
  it('Grupos Fechados: +1 só se houver outra Ameaça na zona', () => {
    expect(required('grupos', OFENSIVO)).toBe(2);
    expect(required('grupos', OFENSIVO, [MSG])).toBe(3);
  });
  it('Feed e Comentários não alteram a Força', () => {
    expect(required('feed', ALGO)).toBe(4);
    expect(required('comentarios', BOT)).toBe(3);
  });
  it('A Força efetiva nunca fica abaixo de 1', () => {
    expect(required('stories', OFENSIVO, [], { strength: 1 })).toBe(1);
  });
});

describe('7. Recompensas por zona', () => {
  const rewardsOf = (zone: ZoneId, id: string, hand: ResponseKind[]) => {
    const s = scene({ zone, hand, threats: [{ id, zone }] });
    const { after } = confront(s, id, hand);
    return { p: after.players[0], eliminated: after.eliminated };
  };

  it('Base: +1 Reputação ao eliminar', () => {
    const r = rewardsOf('comentarios', OFENSIVO, ['denunciar']);
    expect(r.p.reputation).toBe(1);
    expect(r.p.integrity).toBe(5);
    expect(r.eliminated).toBe(1);
  });
  it('Feed soma +1 à base (total 2)', () => {
    expect(rewardsOf('feed', ALGO, ['dados', 'mobilizar']).p.reputation).toBe(2);
  });
  it('Trending soma +2 à base (total 3)', () => {
    expect(rewardsOf('trending', NOTICIA, ['dados', 'mobilizar']).p.reputation).toBe(3);
  });
  it('Mensagens Diretas: nenhuma Reputação, mas +1 Integridade', () => {
    const r = rewardsOf('dms', MSG, ['mobilizar']);
    expect(r.p.reputation).toBe(0);
    expect(r.p.integrity).toBe(6);
    expect(r.eliminated).toBe(1);
  });
  it('Eliminação sem atalho conta como cleanKill', () => {
    expect(rewardsOf('comentarios', OFENSIVO, ['denunciar']).p.stats.cleanKills).toBe(1);
  });
});

describe('8. Marina', () => {
  const s = scene({
    chars: ['marina', 'caio'],
    zone: 'feed',
    hand: ['dados'],
    threats: [OFENSIVO, MSG, BOT, NOTICIA, ALGO].map((id) => ({ id, zone: 'feed' as const })),
  });
  it('+1 contra Discurso de ódio e Assédio', () => {
    expect(previewOf(s, OFENSIVO, ['dados']).abilityBonus).toBe(1);
    expect(previewOf(s, MSG, ['dados']).abilityBonus).toBe(1);
  });
  it('Nenhum bônus contra Perfil falso, Desinformação e Sistema', () => {
    for (const id of [BOT, NOTICIA, ALGO]) expect(previewOf(s, id, ['dados']).abilityBonus).toBe(0);
  });
  it('Outros personagens não têm o bônus', () => {
    const c = scene({
      chars: ['caio', 'marina'],
      zone: 'feed',
      hand: ['dados'],
      threats: [{ id: OFENSIVO, zone: 'feed' }],
    });
    expect(previewOf(c, OFENSIVO, ['dados']).abilityBonus).toBe(0);
  });
});

describe('9. Rafa', () => {
  it('+1 Reputação por eliminação', () => {
    const s = scene({
      chars: ['rafa', 'caio'],
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    expect(confront(s, OFENSIVO, ['denunciar']).after.players[0].reputation).toBe(2);
  });
  it('Em Mensagens Diretas ele também não ganha Reputação (SDD §10 #4)', () => {
    const s = scene({
      chars: ['rafa', 'caio'],
      zone: 'dms',
      hand: ['mobilizar'],
      threats: [{ id: MSG, zone: 'dms' }],
    });
    const p = confront(s, MSG, ['mobilizar']).after.players[0];
    expect(p.reputation).toBe(0);
    expect(p.integrity).toBe(6);
  });
  it('Penalidades do atalho valem +1 (custa 3 Integridade e +2 Ódio Viral)', () => {
    const rafa = scene({
      chars: ['rafa', 'caio'],
      zone: 'feed',
      hand: ['cancelamento'],
      threats: [{ id: ALGO, zone: 'feed' }],
    });
    expect(previewOf(rafa, ALGO, ['cancelamento']).costs).toEqual({ integrity: 3, hate: 2 });
    const caio = scene({
      chars: ['caio', 'rafa'],
      zone: 'feed',
      hand: ['cancelamento'],
      threats: [{ id: ALGO, zone: 'feed' }],
    });
    expect(previewOf(caio, ALGO, ['cancelamento']).costs).toEqual({ integrity: 2, hate: 1 });
    const after = confront(rafa, ALGO, ['cancelamento']).after;
    expect(after.players[0].integrity).toBe(2);
    expect(after.hate).toBe(2);
  });
});

describe('10. Helena', () => {
  it('Enfrenta Ameaça em zona adjacente sem se mover', () => {
    const s = scene({
      chars: ['helena', 'caio'],
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'stories', overrides: {} }],
    });
    expect(previewOf(s, OFENSIVO, ['denunciar']).allowed).toBe(true);
    const after = confront(s, OFENSIVO, ['denunciar']).after;
    expect(after.players[0].zone).toBe('comentarios');
    expect(after.eliminated).toBe(1);
  });
  it('Recusa Ameaça a 2 de distância', () => {
    const s = scene({
      chars: ['helena', 'caio'],
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'trending' }],
    });
    expect(previewOf(s, OFENSIVO, ['denunciar']).allowed).toBe(false);
    rejected(s, { type: 'CONFRONT', threatId: OFENSIVO, cardIds: ids(s, 0, ['denunciar']) });
  });
  it('Quem não é Helena precisa estar na zona da Ameaça', () => {
    const s = scene({
      chars: ['caio', 'helena'],
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'stories' }],
    });
    expect(previewOf(s, OFENSIVO, ['denunciar']).allowed).toBe(false);
  });
  it('Os alvos legais de Helena incluem zonas adjacentes', () => {
    const s = scene({
      chars: ['helena', 'caio'],
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [
        { id: OFENSIVO, zone: 'stories' },
        { id: MSG, zone: 'trending' },
      ],
    });
    expect(getLegalActions(s).confrontTargets).toEqual([OFENSIVO]);
  });
});

describe('11. Caio: Debug do Algoritmo', () => {
  const base = () => scene({ chars: ['caio', 'marina'], zone: 'feed' });

  it('Reordena as 2 primeiras Ameaças do baralho e não gasta a ação do turno', () => {
    const s = base();
    const [a, b, c] = s.decks.threats.map((t) => t.id);
    const after = ok(s, { type: 'DEBUG_REORDER', swap: true });
    expect(after.decks.threats.map((t) => t.id).slice(0, 3)).toEqual([b, a, c]);
    expect(after.phase).toBe('turn.act');
    expect(after.activeIdx).toBe(0);
  });
  it('Sem trocar (swap=false) só espia, mas conta como uso', () => {
    const s = base();
    const after = ok(s, { type: 'DEBUG_REORDER', swap: false });
    expect(after.decks.threats.map((t) => t.id)).toEqual(s.decks.threats.map((t) => t.id));
    rejected(after, { type: 'DEBUG_REORDER', swap: true });
  });
  it('2º uso na mesma rodada é recusado e na rodada seguinte é liberado', () => {
    const used = ok(base(), { type: 'DEBUG_REORDER', swap: true });
    rejected(used, { type: 'DEBUG_REORDER', swap: false });
    const next = mutate(used, (g) => {
      g.round = 2;
    });
    ok(next, { type: 'DEBUG_REORDER', swap: false });
  });
  it('Só o Caio usa; baralho com menos de 2 Ameaças recusa', () => {
    const m = scene({ chars: ['marina', 'caio'], zone: 'feed' });
    rejected(m, { type: 'DEBUG_REORDER', swap: true });
    const short = mutate(base(), (g) => {
      g.decks.threats = g.decks.threats.slice(0, 1);
    });
    rejected(short, { type: 'DEBUG_REORDER', swap: true });
  });
});

describe('12. Cancelamento em Massa', () => {
  it('Custos pagos mesmo na falha; a Ameaça fica e não conta como cleanKill', () => {
    const s = scene({
      zone: 'feed',
      hand: ['cancelamento'],
      threats: [{ id: ALGO, zone: 'feed', overrides: { strength: 9 } }],
    });
    const after = confront(s, ALGO, ['cancelamento']).after;
    const p = after.players[0];
    expect(after.threats.some((t) => t.card.id === ALGO)).toBe(true);
    expect(p.integrity).toBe(3);
    expect(after.hate).toBe(1);
    expect(p.stats.cleanKills).toBe(0);
    expect(p.stats.shortcuts).toBe(0);
  });
  it('No sucesso elimina, mas não conta para o bônus ético (cleanKills) e rende Reputação normal', () => {
    const s = scene({
      zone: 'comentarios',
      hand: ['cancelamento'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    const after = confront(s, OFENSIVO, ['cancelamento']).after;
    const p = after.players[0];
    expect(after.eliminated).toBe(1);
    expect(p.stats.cleanKills).toBe(0);
    expect(p.stats.shortcuts).toBe(1);
    expect(p.integrity).toBe(3);
    expect(after.hate).toBe(1);
    expect(p.reputation).toBe(1);
  });
  it('O custo aparece na pré-visualização antes de confirmar', () => {
    const s = scene({
      zone: 'feed',
      hand: ['cancelamento'],
      threats: [{ id: ALGO, zone: 'feed' }],
    });
    expect(previewOf(s, ALGO, ['cancelamento']).costs).toEqual({ integrity: 2, hate: 1 });
  });
});

describe('13. Acolher a vítima', () => {
  it('+1 Integridade ao jogar, mesmo se o Enfrentar falhar', () => {
    const s = scene({
      zone: 'comentarios',
      hand: ['acolher'],
      threats: [{ id: OFENSIVO, zone: 'comentarios', overrides: { strength: 9 } }],
    });
    expect(previewOf(s, OFENSIVO, ['acolher']).onPlay.integrity).toBe(1);
    const after = confront(s, OFENSIVO, ['acolher']).after;
    expect(after.players[0].integrity).toBe(6);
    expect(after.eliminated).toBe(0);
  });
  it('Soma com a Fraqueza e a zona: eliminar Mensagem Privada em DMs rende +2 Integridade', () => {
    const s = scene({ zone: 'dms', hand: ['acolher'], threats: [{ id: MSG, zone: 'dms' }] });
    const after = confront(s, MSG, ['acolher']).after;
    expect(after.players[0].integrity).toBe(7);
    expect(after.eliminated).toBe(1);
  });
});

describe('14. Suspensão', () => {
  it('Integridade 0: suspenso, volta ao Feed com 2, perde o próximo turno e só ele', () => {
    let s = scene({
      zone: 'comentarios',
      hand: ['cancelamento'],
      threats: [{ id: OFENSIVO, zone: 'comentarios', overrides: { strength: 9 } }],
    });
    s = mutate(s, (g) => {
      g.players[0].integrity = 1;
    });
    s = confront(s, OFENSIVO, ['cancelamento']).after;
    const p1 = s.players[0];
    expect(p1.suspended).toBe(true);
    expect(p1.zone).toBe('feed');
    expect(p1.integrity).toBe(2);
    expect(s.activeIdx).toBe(1);

    const passAll = (st: typeof s) => {
      let x = st;
      if (x.phase === 'turn.move') x = ok(x, { type: 'SKIP_MOVE' });
      x = mutate(x, (g) => {
        g.players[g.activeIdx].zone = 'central';
      });
      x = ok(x, { type: 'REST' });
      for (let i = 0; i < 5 && x.phase === 'algorithm'; i++) x = ok(x, { type: 'ALGORITHM_NEXT' });
      return x;
    };
    let r2 = passAll(s);
    expect(r2.round).toBe(2);
    expect(r2.activeIdx).toBe(1);
    expect(r2.players[0].suspended).toBe(false);
    r2 = passAll(r2);
    expect(r2.round).toBe(3);
    expect(r2.activeIdx).toBe(0);
    expect(r2.phase).toBe('turn.move');
  });

  it('Suspensão também vale para perda de Integridade em Dilemas', () => {
    let s = scene({ zone: 'feed' });
    s = mutate(s, (g) => {
      g.players[0].integrity = 2;
      const d = g.decks.dilemmas.find((x) => x.id === 'dilema-print');
      if (d) g.decks.dilemmas = [d, ...g.decks.dilemmas.filter((x) => x.id !== d.id)];
    });
    s = ok(s, { type: 'EXPLORE' });
    s = ok(s, { type: 'CHOOSE_DILEMMA', option: 'a' }); // −2 Integridade
    expect(s.players[0].suspended).toBe(true);
    expect(s.players[0].integrity).toBe(2);
  });
});

describe('Pré-visualização em fases erradas', () => {
  it('Não permite enfrentar antes de mover ou durante um Dilema', () => {
    const s0 = mutate(
      scene({
        zone: 'comentarios',
        hand: ['denunciar'],
        threats: [{ id: OFENSIVO, zone: 'comentarios' }],
      }),
      (g) => {
        g.phase = 'turn.move';
      },
    );
    const p = previewConfront(s0, 'p1', OFENSIVO, ids(s0, 0, ['denunciar']));
    expect(p.allowed).toBe(false);
    expect(
      reduce(s0, { type: 'CONFRONT', threatId: OFENSIVO, cardIds: ids(s0, 0, ['denunciar']) })
        .events[0].kind,
    ).toBe('rejected');
  });
  it('Exige 1 ou 2 cartas, sem repetição e da própria mão', () => {
    const s = scene({
      zone: 'comentarios',
      hand: ['denunciar', 'dados', 'bloquear'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    const h = ids(s, 0, ['denunciar', 'dados', 'bloquear']);
    expect(previewConfront(s, 'p1', OFENSIVO, []).allowed).toBe(false);
    expect(previewConfront(s, 'p1', OFENSIVO, h).allowed).toBe(false);
    expect(previewConfront(s, 'p1', OFENSIVO, [h[0], h[0]]).allowed).toBe(false);
    expect(previewConfront(s, 'p1', OFENSIVO, ['carta-fantasma']).allowed).toBe(false);
  });
});
