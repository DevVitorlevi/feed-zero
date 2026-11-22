import { describe, expect, it } from 'vitest';
import { DILEMMAS } from '../../content/dilemmas';
import { EVENTS } from '../../content/events';
import { THREATS } from '../../content/threats';
import { reduce } from '../reducer';
import { computeResult } from '../scoring';
import { getLegalActions, peekThreats } from '../selectors';
import type { Action, GameState } from '../types';
import {
  card,
  ids,
  mutate,
  newGame,
  ok,
  passTurn,
  rejected,
  runAlgorithm,
  scene,
  toAlgorithm,
  withHand,
  withThreat,
} from './helpers';

const OFENSIVO = 'ameaca-comentario-ofensivo-vaga';
const MSG = 'ameaca-mensagem-privada';
const ALGO = 'ameaca-algoritmo-recomenda-odio';

function withDilemmaOnTop(s: GameState, id: string): GameState {
  return mutate(s, (g) => {
    const d = DILEMMAS.find((x) => x.id === id);
    if (!d) throw new Error(id);
    g.decks.dilemmas = [d, ...g.decks.dilemmas.filter((x) => x.id !== id)];
  });
}

describe('15. Explorar e Dilemas', () => {
  const table: [string, 'a' | 'b', number, number, number, number][] = [
    ['dilema-brincadeira', 'a', -1, +2, 0, 0],
    ['dilema-brincadeira', 'b', +1, -1, +1, 0],
    ['dilema-print', 'a', +2, -2, +1, 0],
    ['dilema-print', 'b', 0, +1, 0, 1],
    ['dilema-usuario-popular', 'a', -1, +2, 0, 0],
    ['dilema-usuario-popular', 'b', +2, -2, +1, 0],
  ];
  for (const [id, opt, dRep, dInt, dHate, dDraw] of table) {
    it(`${id}, opção ${opt}: Reputação ${dRep}, Integridade ${dInt}, Ódio ${dHate}, compra ${dDraw}`, () => {
      let s = scene({ zone: 'feed', hand: ['dados', 'dados'] });
      s = mutate(s, (g) => {
        g.players[0].reputation = 3;
      });
      s = withDilemmaOnTop(s, id);
      s = ok(s, { type: 'EXPLORE' });
      expect(s.phase).toBe('turn.dilemma');
      expect(s.pendingDilemma?.id).toBe(id);
      s = ok(s, { type: 'CHOOSE_DILEMMA', option: opt });
      const p = s.players[0];
      expect(p.reputation).toBe(3 + dRep);
      expect(p.integrity).toBe(5 + dInt);
      expect(s.hate).toBe(dHate);
      expect(p.hand).toHaveLength(2 + dDraw);
      expect(s.pendingDilemma).toBeUndefined();
      expect(s.decks.dilemmasDiscard.map((d) => d.id)).toContain(id);
      expect(s.activeIdx).toBe(1); // o turno termina sozinho
    });
  }

  it('Em Comentários, explorar compra também 1 Resposta; nas outras zonas, não', () => {
    const c = ok(scene({ zone: 'comentarios', hand: ['dados'] }), { type: 'EXPLORE' });
    expect(c.players[0].hand).toHaveLength(2);
    const f = ok(scene({ zone: 'feed', hand: ['dados'] }), { type: 'EXPLORE' });
    expect(f.players[0].hand).toHaveLength(1);
  });

  it('Durante o Dilema só é possível escolher A ou B', () => {
    const s = ok(scene({ zone: 'feed', hand: ['dados'] }), { type: 'EXPLORE' });
    rejected(s, { type: 'EXPLORE' });
    rejected(s, { type: 'REST' });
    rejected(s, { type: 'CONFRONT', threatId: 'x', cardIds: [] });
  });

  it('Os 3 Dilemas se repetem reembaralhando o descarte', () => {
    let s = scene({ zone: 'feed', hand: [] });
    for (let i = 0; i < 4; i++) {
      s = mutate(s, (g) => {
        g.activeIdx = 0;
        g.phase = 'turn.act';
      });
      s = ok(s, { type: 'EXPLORE' });
      s = ok(s, { type: 'CHOOSE_DILEMMA', option: 'a' });
    }
    expect(s.decks.dilemmas.length + s.decks.dilemmasDiscard.length).toBe(3);
  });
});

describe('16. Apoiar', () => {
  const base = () => {
    let s = scene({ zone: 'feed', hand: ['dados', 'denunciar', 'bloquear'] });
    s = withHand(s, 1, ['acolher', 'acolher', 'acolher']);
    return s;
  };

  it('Entrega cartas a quem está na mesma zona e ganha +1 Reputação', () => {
    const s = base();
    const after = ok(s, {
      type: 'SUPPORT',
      toPlayerId: 'p2',
      cardIds: ids(s, 0, ['dados', 'denunciar']),
    });
    expect(after.players[0].reputation).toBe(1);
    expect(after.players[0].stats.supports).toBe(1);
    expect(after.players[0].hand).toHaveLength(1);
    expect(after.players[1].hand).toHaveLength(5);
    expect(after.activeIdx).toBe(1);
  });
  it('Exige estar na mesma zona e outro jogador', () => {
    const away = mutate(base(), (g) => {
      g.players[1].zone = 'stories';
    });
    rejected(away, { type: 'SUPPORT', toPlayerId: 'p2', cardIds: ids(away, 0, ['dados']) });
    const s = base();
    rejected(s, { type: 'SUPPORT', toPlayerId: 'p1', cardIds: ids(s, 0, ['dados']) });
    rejected(s, { type: 'SUPPORT', toPlayerId: 'p9', cardIds: ids(s, 0, ['dados']) });
  });
  it('Respeita o limite de 5 da mão do destinatário e o máximo de 2 cartas', () => {
    const full = withHand(base(), 1, ['dados', 'dados', 'dados', 'dados']);
    rejected(full, {
      type: 'SUPPORT',
      toPlayerId: 'p2',
      cardIds: ids(full, 0, ['dados', 'denunciar']),
    });
    ok(full, { type: 'SUPPORT', toPlayerId: 'p2', cardIds: ids(full, 0, ['dados']) });
    const s = base();
    const three = withHand(s, 1, []);
    rejected(three, {
      type: 'SUPPORT',
      toPlayerId: 'p2',
      cardIds: ids(three, 0, ['dados', 'denunciar', 'bloquear']),
    });
    rejected(three, { type: 'SUPPORT', toPlayerId: 'p2', cardIds: [] });
  });
  it('Só entrega cartas da própria mão', () => {
    const s = base();
    rejected(s, { type: 'SUPPORT', toPlayerId: 'p2', cardIds: ['carta-fantasma'] });
  });
});

describe('17. Descansar', () => {
  it('Só na Central de Moderação', () => {
    const s = scene({ zone: 'feed' });
    rejected(s, { type: 'REST' });
  });
  it('+1 Integridade (teto 8) e compra 2 Respostas', () => {
    let s = scene({ zone: 'central', hand: ['dados'] });
    s = mutate(s, (g) => {
      g.players[0].integrity = 7;
    });
    const a = ok(s, { type: 'REST' });
    expect(a.players[0].integrity).toBe(8);
    expect(a.players[0].hand).toHaveLength(3);
    const b = ok(
      mutate(s, (g) => (g.players[0].integrity = 8)),
      { type: 'REST' },
    );
    expect(b.players[0].integrity).toBe(8);
  });
  it('A compra respeita o limite de 5 cartas', () => {
    const s = scene({ zone: 'central', hand: ['dados', 'dados', 'dados', 'dados'] });
    expect(ok(s, { type: 'REST' }).players[0].hand).toHaveLength(5);
  });
});

describe('18. Fase do Algoritmo', () => {
  const eventOnTop = (s: GameState, id: string) =>
    mutate(s, (g) => {
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error(id);
      g.decks.events = [e, ...g.decks.events.filter((x) => x.id !== id)];
    });

  it('Segue os 4 passos em ordem: Evento, Ameaça, Ódio, Checagem', () => {
    let s = toAlgorithm(scene({ zone: 'feed' }));
    const steps: (string | undefined)[] = [s.algoStep];
    for (let i = 0; i < 3; i++) {
      s = ok(s, { type: 'ALGORITHM_NEXT' });
      steps.push(s.algoStep);
    }
    expect(steps).toEqual(['event', 'threat', 'hate', 'check']);
    s = ok(s, { type: 'ALGORITHM_NEXT' });
    expect(s.round).toBe(2);
    expect(s.phase).toBe('turn.move');
    expect(s.activeIdx).toBe(0);
  });
  it('Evento Algoritmo impulsiona polêmica: Ódio Viral +1', () => {
    const s = ok(eventOnTop(toAlgorithm(scene({ zone: 'feed' })), 'evento-polemica'), {
      type: 'ALGORITHM_NEXT',
    });
    expect(s.hate).toBe(1);
    expect(s.decks.eventsDiscard.map((e) => e.id)).toContain('evento-polemica');
  });
  it('Evento Campanha de conscientização: todos compram 1 Resposta', () => {
    let s = scene({ zone: 'feed', hand: ['dados', 'dados'] });
    s = withHand(s, 1, ['dados']);
    const after = ok(eventOnTop(toAlgorithm(s), 'evento-campanha'), { type: 'ALGORITHM_NEXT' });
    expect(after.players[0].hand).toHaveLength(3);
    expect(after.players[1].hand).toHaveLength(2);
  });
  it('Evento Notícia viral: entra 1 Ameaça extra', () => {
    const s = eventOnTop(toAlgorithm(scene({ zone: 'feed' })), 'evento-noticia-viral');
    expect(ok(s, { type: 'ALGORITHM_NEXT' }).threats).toHaveLength(1);
  });
  it('Nova Ameaça: 1 por rodada e 2 a partir da rodada 5', () => {
    const at = (round: number) =>
      ok(
        mutate(toAlgorithm(scene({ zone: 'feed' })), (g) => {
          g.algoStep = 'threat';
          g.round = round;
        }),
        { type: 'ALGORITHM_NEXT' },
      ).threats.length;
    expect(at(1)).toBe(1);
    expect(at(4)).toBe(1);
    expect(at(5)).toBe(2);
    expect(at(8)).toBe(2);
  });
  it('Ódio Viral sobe +1 por ZONA com Ameaça, não por Ameaça', () => {
    let s = scene({
      zone: 'feed',
      threats: [
        { id: ALGO, zone: 'feed' },
        { id: OFENSIVO, zone: 'feed' },
        { id: MSG, zone: 'stories' },
      ],
    });
    s = mutate(toAlgorithm(s), (g) => {
      g.algoStep = 'hate';
    });
    const after = ok(s, { type: 'ALGORITHM_NEXT' });
    expect(after.hate).toBe(2);
    expect(after.algoStep).toBe('check');
  });
  it('Sem Ameaças no tabuleiro o Ódio Viral não sobe', () => {
    const s = mutate(toAlgorithm(scene({ zone: 'feed' })), (g) => {
      g.algoStep = 'hate';
    });
    expect(ok(s, { type: 'ALGORITHM_NEXT' }).hate).toBe(0);
  });
  it('Baralho de Eventos reembaralha o descarte', () => {
    let s = scene({ zone: 'feed' });
    for (let i = 0; i < 4; i++) {
      s = toAlgorithm(s);
      s = mutate(s, (g) => {
        g.hate = 0;
        g.threats = [];
        g.decks.threats = THREATS.slice();
      });
      s = runAlgorithm(s);
      s = mutate(s, (g) => {
        g.phase = 'turn.act';
      });
    }
    expect(s.decks.events.length + s.decks.eventsDiscard.length).toBe(3);
  });
  it('Passos só andam durante o Algoritmo', () => {
    rejected(scene({ zone: 'feed' }), { type: 'ALGORITHM_NEXT' });
  });
  it('Depois que todos jogam, a partida entra no Algoritmo', () => {
    let s = scene({ zone: 'central', hand: [] });
    s = ok(s, { type: 'REST' });
    s = passTurn(s);
    expect(s.phase).toBe('algorithm');
    expect(s.algoStep).toBe('event');
  });
});

describe('19. Fim de jogo', () => {
  it('Vitória coletiva ao atingir a meta', () => {
    let s = scene({
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    s = mutate(s, (g) => {
      g.eliminated = g.goal - 1;
    });
    const after = ok(s, {
      type: 'CONFRONT',
      threatId: OFENSIVO,
      cardIds: ids(s, 0, ['denunciar']),
    });
    expect(after.phase).toBe('ended');
    expect(after.result?.outcome).toBe('victory');
    expect(after.result?.ranking).toHaveLength(2);
  });
  it('Derrota "Feed Tomado" quando o Ódio Viral chega a 12', () => {
    let s = scene({
      zone: 'feed',
      hand: ['cancelamento'],
      threats: [{ id: ALGO, zone: 'feed', overrides: { strength: 9 } }],
    });
    s = mutate(s, (g) => {
      g.hate = 11;
    });
    const after = ok(s, { type: 'CONFRONT', threatId: ALGO, cardIds: ids(s, 0, ['cancelamento']) });
    expect(after.phase).toBe('ended');
    expect(after.result?.outcome).toBe('feed_tomado');
    expect(after.hate).toBe(12);
  });
  it('Derrota é conferida também no passo de checagem do Algoritmo', () => {
    let s = toAlgorithm(scene({ zone: 'feed' }));
    s = mutate(s, (g) => {
      g.algoStep = 'check';
      g.hate = 12;
    });
    const after = ok(s, { type: 'ALGORITHM_NEXT' });
    expect(after.result?.outcome).toBe('feed_tomado');
  });
  it('Derrota por "sem saída": sem Ameaças no baralho nem no tabuleiro e meta não atingida', () => {
    let s = scene({
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    s = mutate(s, (g) => {
      g.decks.threats = [];
    });
    const after = ok(s, {
      type: 'CONFRONT',
      threatId: OFENSIVO,
      cardIds: ids(s, 0, ['denunciar']),
    });
    expect(after.result?.outcome).toBe('sem_saida');
  });
  it('Derrota tem prioridade quando as duas condições ocorrem juntas', () => {
    let s = scene({
      zone: 'comentarios',
      hand: ['cancelamento'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    s = mutate(s, (g) => {
      g.eliminated = g.goal - 1;
      g.hate = 11;
    });
    const after = ok(s, {
      type: 'CONFRONT',
      threatId: OFENSIVO,
      cardIds: ids(s, 0, ['cancelamento']),
    });
    expect(after.eliminated).toBe(after.goal);
    expect(after.result?.outcome).toBe('feed_tomado');
  });
  it('Depois do fim nenhuma ação é aceita', () => {
    let s = scene({
      zone: 'comentarios',
      hand: ['denunciar'],
      threats: [{ id: OFENSIVO, zone: 'comentarios' }],
    });
    s = mutate(s, (g) => {
      g.eliminated = g.goal - 1;
    });
    const end = ok(s, { type: 'CONFRONT', threatId: OFENSIVO, cardIds: ids(s, 0, ['denunciar']) });
    rejected(end, { type: 'SKIP_MOVE' });
    rejected(end, { type: 'ALGORITHM_NEXT' });
    rejected(end, { type: 'UNDO' });
  });
});

describe('20. Pontuação e desempate', () => {
  const build = (rows: { rep: number; int: number; clean: number; sup: number }[]) => {
    const s = newGame(['caio', 'marina', 'rafa', 'helena'].slice(0, rows.length) as never);
    return mutate(s, (g) => {
      rows.forEach((r, i) => {
        g.players[i].reputation = r.rep;
        g.players[i].integrity = r.int;
        g.players[i].stats.cleanKills = r.clean;
        g.players[i].stats.supports = r.sup;
      });
    });
  };

  it('Pontuação = Reputação + Integridade + 1 por Ameaça eliminada sem atalho', () => {
    const r = computeResult(
      build([
        { rep: 4, int: 6, clean: 2, sup: 0 },
        { rep: 1, int: 1, clean: 0, sup: 0 },
      ]),
      'victory',
    );
    expect(r.ranking[0].breakdown).toEqual({
      reputation: 4,
      integrity: 6,
      cleanKills: 2,
      total: 12,
    });
    expect(r.ranking[0].playerId).toBe('p1');
  });
  it('Empate: maior Integridade vence', () => {
    const r = computeResult(
      build([
        { rep: 6, int: 3, clean: 0, sup: 5 },
        { rep: 3, int: 6, clean: 0, sup: 0 },
      ]),
      'victory',
    );
    expect(r.ranking.map((x) => x.playerId)).toEqual(['p2', 'p1']);
  });
  it('Empate de pontos e Integridade: mais Apoios vence', () => {
    const r = computeResult(
      build([
        { rep: 3, int: 5, clean: 0, sup: 1 },
        { rep: 3, int: 5, clean: 0, sup: 3 },
      ]),
      'victory',
    );
    expect(r.ranking.map((x) => x.playerId)).toEqual(['p2', 'p1']);
  });
  it('Em derrota coletiva o ranking é parcial (sem vencedor declarado no desfecho)', () => {
    const r = computeResult(
      build([
        { rep: 1, int: 1, clean: 0, sup: 0 },
        { rep: 2, int: 2, clean: 0, sup: 0 },
      ]),
      'feed_tomado',
    );
    expect(r.outcome).toBe('feed_tomado');
    expect(r.ranking).toHaveLength(2);
  });
});

describe('21. Desfazer', () => {
  it('Restaura exatamente o estado anterior, incluindo rngState', () => {
    const base = mutate(scene({ zone: 'central', hand: ['dados'] }), (g) => {
      g.decks.responses = [];
      g.decks.responsesDiscard = [card('denunciar'), card('bloquear'), card('acolher')];
    });
    const after = ok(base, { type: 'REST' });
    expect(after.rngState).not.toBe(base.rngState);
    const undone = ok(after, { type: 'UNDO' });
    expect(undone).toEqual(base);
    expect(undone.rngState).toBe(base.rngState);
  });
  it('Desfaz várias ações em sequência (até 5) e some a opção quando o histórico acaba', () => {
    let s = newGame();
    const s0 = s;
    s = ok(s, { type: 'MOVE', zone: 'trending' });
    const s1 = s;
    s = ok(s, { type: 'EXPLORE' });
    s = ok(s, { type: 'CHOOSE_DILEMMA', option: 'b' });
    s = ok(s, { type: 'UNDO' });
    s = ok(s, { type: 'UNDO' });
    expect(s).toEqual(s1);
    s = ok(s, { type: 'UNDO' });
    expect(s).toEqual(s0);
    rejected(s, { type: 'UNDO' });
  });
  it('Guarda no máximo 5 fotografias', () => {
    let s = scene({ zone: 'central', hand: [] });
    for (let i = 0; i < 8; i++) {
      s = mutate(s, (g) => {
        g.activeIdx = 0;
        g.phase = 'turn.act';
        g.players[0].zone = 'central';
      });
      s = ok(s, { type: 'REST' });
    }
    expect(s.history.length).toBeLessThanOrEqual(5);
  });
  it('Não desfaz através da Fase do Algoritmo', () => {
    let s = scene({ zone: 'central' });
    s = ok(s, { type: 'REST' });
    s = passTurn(s);
    expect(s.phase).toBe('algorithm');
    expect(s.history).toHaveLength(0);
    rejected(s, { type: 'UNDO' });
    s = runAlgorithm(s);
    expect(s.history).toHaveLength(0);
  });
});

describe('22. Ações inválidas', () => {
  it('Não alteram o estado e devolvem rejected com motivo', () => {
    const s = newGame();
    const cases: Action[] = [
      { type: 'MOVE', zone: 'feed' },
      { type: 'CONFRONT', threatId: 'x', cardIds: [] },
      { type: 'EXPLORE' },
      { type: 'REST' },
      { type: 'CHOOSE_DILEMMA', option: 'a' },
      { type: 'SUPPORT', toPlayerId: 'p2', cardIds: [] },
      { type: 'ALGORITHM_NEXT' },
      { type: 'UNDO' },
    ];
    for (const a of cases) {
      const r = reduce(s, a);
      expect(r.state).toBe(s);
      expect(r.events).toHaveLength(1);
      expect(r.events[0].kind).toBe('rejected');
      expect(r.events[0].kind === 'rejected' && r.events[0].reason.length).toBeGreaterThan(5);
    }
  });
  it('Agir antes de mover é recusado com instrução do que fazer', () => {
    const reason = rejected(newGame(), { type: 'EXPLORE' });
    expect(reason).toContain('Mova');
  });
  it('O estado recebido nunca é mutado', () => {
    const s = newGame();
    const frozen = JSON.stringify(s);
    ok(s, { type: 'MOVE', zone: 'dms' });
    expect(JSON.stringify(s)).toBe(frozen);
  });
});

describe('Seletores', () => {
  it('getLegalActions reflete a fase: mover, agir, algoritmo', () => {
    const s = newGame();
    const l = getLegalActions(s);
    expect(l.moveZones).toHaveLength(6);
    expect(l.canSkipMove).toBe(true);
    expect(l.canExplore).toBe(false);
    expect(l.canDebug).toBe(true);
    const acted = ok(s, { type: 'MOVE', zone: 'central' });
    const la = getLegalActions(acted);
    expect(la.moveZones).toEqual([]);
    expect(la.canRest).toBe(true);
    expect(la.canExplore).toBe(true);
    expect(la.canUndo).toBe(true);
    const algo = getLegalActions(toAlgorithm(acted));
    expect(algo.canAlgorithmNext).toBe(true);
    expect(algo.activePlayerId).toBeNull();
  });
  it('peekThreats mostra as 2 próximas Ameaças do baralho', () => {
    const s = newGame();
    expect(peekThreats(s).map((t) => t.id)).toEqual(s.decks.threats.slice(0, 2).map((t) => t.id));
  });
  it('withThreat coloca a Ameaça no tabuleiro e a tira do baralho', () => {
    const s = withThreat(newGame(), ALGO, 'feed');
    expect(s.threats.filter((t) => t.card.id === ALGO)).toHaveLength(1);
    expect(s.decks.threats.some((t) => t.id === ALGO)).toBe(false);
  });
});
