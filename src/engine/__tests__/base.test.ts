import { describe, expect, it } from 'vitest';
import { THREATS } from '../../content/threats';
import { drawResponses, placeThreat } from '../ops';
import { hashSeed, nextRandom, shuffle } from '../rng';
import { reduce } from '../reducer';
import { distance, neighbors, reachableZones } from '../zones';
import type { GameEvent } from '../types';
import { card, mutate, newGame, ok, rejected, withHand } from './helpers';
import { ZONE_IDS } from '../../content/zones';

describe('1. Seed e determinismo', () => {
  it('Seed igual gera a mesma partida (cartas e ordem); seeds diferentes geram partidas diferentes', () => {
    const a = newGame(['caio', 'marina'], 'seed-a');
    const b = newGame(['caio', 'marina'], 'seed-a');
    const c = newGame(['caio', 'marina'], 'seed-c');
    expect(a).toEqual(b);
    expect(a.decks.responses.map((x) => x.id)).not.toEqual(c.decks.responses.map((x) => x.id));
    expect(a.decks.threats.map((x) => x.id)).not.toEqual(c.decks.threats.map((x) => x.id));
  });

  it('A mesma sequência de ações na mesma seed leva ao mesmo estado final', () => {
    const run = () => {
      let s = newGame(['caio', 'marina'], 'sequencia');
      s = ok(s, { type: 'MOVE', zone: 'trending' });
      s = ok(s, { type: 'EXPLORE' });
      return ok(s, { type: 'CHOOSE_DILEMMA', option: 'a' });
    };
    expect(run()).toEqual(run());
  });

  it('O embaralhamento é uma permutação e não altera o array original', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const r = shuffle(items, hashSeed('x'));
    expect([...r.items].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
    const v = nextRandom(123).value;
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });
});

describe('2. Preparação', () => {
  it('Cada jogador tem 3 Respostas (o primeiro compra mais 1 ao iniciar o turno) e 2 Ameaças entram em campo', () => {
    const s = newGame(['caio', 'marina']);
    expect(s.players[0].hand).toHaveLength(4);
    expect(s.players[1].hand).toHaveLength(3);
    expect(s.threats).toHaveLength(2);
    expect(s.hate).toBe(0);
    expect(s.eliminated).toBe(0);
    expect(s.round).toBe(1);
    expect(s.phase).toBe('turn.move');
    for (const p of s.players) {
      expect(p.zone).toBe('feed');
      expect(p.integrity).toBe(5);
      expect(p.reputation).toBe(0);
    }
    for (const t of s.threats) expect(t.zone).toBe(t.card.homeZone);
  });

  it('Ameaça sorteada para a Central (zona segura) vai para o Feed', () => {
    const s = newGame();
    const g = structuredClone(s);
    g.decks.threats.unshift({ ...THREATS[0], id: 'ameaca-teste-central', homeZone: 'central' });
    const events: GameEvent[] = [];
    placeThreat(g, events);
    const placed = g.threats.find((t) => t.card.id === 'ameaca-teste-central');
    expect(placed?.zone).toBe('feed');
    expect(events).toContainEqual({
      kind: 'threat_entered',
      threatId: 'ameaca-teste-central',
      zone: 'feed',
      redirected: true,
    });
  });

  it('Com 4 jogadores as 9 Respostas do MVP acabam nas mãos, sem exceção e sem perder cartas', () => {
    const s = newGame(['marina', 'caio', 'rafa', 'helena']);
    const inHands = s.players.reduce((n, p) => n + p.hand.length, 0);
    expect(inHands + s.decks.responses.length).toBe(9);
  });

  it('Recusa partida com número de jogadores, nomes ou personagens inválidos', () => {
    const s = newGame();
    const one = reduce(s, { type: 'START_GAME', players: [{ name: 'A', character: 'caio' }] });
    expect(one.events[0].kind).toBe('rejected');
    const dup = reduce(s, {
      type: 'START_GAME',
      players: [
        { name: 'A', character: 'caio' },
        { name: 'B', character: 'caio' },
      ],
    });
    expect(dup.events[0].kind).toBe('rejected');
    const noName = reduce(s, {
      type: 'START_GAME',
      players: [
        { name: ' ', character: 'caio' },
        { name: 'B', character: 'rafa' },
      ],
    });
    expect(noName.events[0].kind).toBe('rejected');
  });

  it('Meta de eliminações vem do config: 4 com 2 jogadores e 5 com 3 ou 4', () => {
    expect(newGame(['caio', 'marina']).goal).toBe(4);
    expect(newGame(['caio', 'marina', 'rafa']).goal).toBe(5);
    expect(newGame(['marina', 'caio', 'rafa', 'helena']).goal).toBe(5);
  });
});

describe('3. Movimento', () => {
  it('O grafo é simétrico e o Feed liga a todas as outras zonas', () => {
    for (const z of ZONE_IDS) for (const n of neighbors(z)) expect(neighbors(n)).toContain(z);
    for (const z of ZONE_IDS.filter((x) => x !== 'feed')) expect(distance('feed', z)).toBe(1);
    expect(neighbors('feed')).toHaveLength(6);
  });

  it('Distância é o menor número de arestas (BFS) e o anel é Comentários–Stories–Trending–Grupos–DMs–Central', () => {
    expect(distance('comentarios', 'stories')).toBe(1);
    expect(distance('comentarios', 'trending')).toBe(2);
    expect(distance('central', 'comentarios')).toBe(1);
    expect(distance('stories', 'dms')).toBe(2);
    // Com o Feed no centro, nenhuma zona fica a mais de 2 passos de outra.
    for (const a of ZONE_IDS)
      for (const b of ZONE_IDS) expect(distance(a, b)).toBeLessThanOrEqual(2);
  });

  it('Mover até 2 zonas é permitido; o Feed alcança todas', () => {
    const s = newGame();
    expect(reachableZones('feed', 2)).toHaveLength(6);
    for (const z of ZONE_IDS.filter((x) => x !== 'feed')) {
      const m = ok(s, { type: 'MOVE', zone: z });
      expect(m.players[0].zone).toBe(z);
      expect(m.phase).toBe('turn.act');
    }
    const far = mutate(s, (g) => {
      g.players[0].zone = 'comentarios';
    });
    expect(ok(far, { type: 'MOVE', zone: 'trending' }).players[0].zone).toBe('trending');
  });

  it('Distância acima do alcance é recusada (alcance vem do config) e mover para a própria zona também', () => {
    const s = mutate(newGame(), (g) => {
      g.config.moveRange = 1;
      g.players[0].zone = 'comentarios';
    });
    rejected(s, { type: 'MOVE', zone: 'trending' });
    expect(ok(s, { type: 'MOVE', zone: 'stories' }).players[0].zone).toBe('stories');
    rejected(s, { type: 'MOVE', zone: 'comentarios' });
  });

  it('Só se move uma vez por turno, antes de agir', () => {
    const s = ok(newGame(), { type: 'MOVE', zone: 'stories' });
    rejected(s, { type: 'MOVE', zone: 'feed' });
    rejected(s, { type: 'SKIP_MOVE' });
  });
});

describe('4. Compra de cartas', () => {
  it('A compra respeita o limite de 5 cartas na mão', () => {
    const s = withHand(newGame(), 0, ['dados', 'dados', 'dados', 'dados']);
    const g = structuredClone(s);
    const drawn = drawResponses(g, g.players[0], 3, []);
    expect(drawn).toBe(1);
    expect(g.players[0].hand).toHaveLength(5);
  });

  it('Baralho vazio reembaralha o descarte (determinístico, com o RNG da seed)', () => {
    const base = withHand(newGame(), 0, ['dados']);
    const prep = mutate(base, (g) => {
      g.decks.responsesDiscard = [card('denunciar'), card('bloquear'), card('acolher')];
      g.decks.responses = [];
    });
    const run = () => {
      const g = structuredClone(prep);
      const n = drawResponses(g, g.players[0], 3, []);
      return {
        n,
        ids: g.players[0].hand.map((c) => c.id),
        rng: g.rngState,
        discard: g.decks.responsesDiscard.length,
      };
    };
    const a = run();
    expect(a.n).toBe(3);
    expect(a.discard).toBe(0);
    expect(a).toEqual(run());
    expect(a.rng).not.toBe(prep.rngState);
  });

  it('Sem cartas no baralho nem no descarte, a compra devolve só o que existe', () => {
    const prep = mutate(withHand(newGame(), 0, []), (g) => {
      g.decks.responses = [card('dados')];
      g.decks.responsesDiscard = [];
    });
    const g = structuredClone(prep);
    expect(drawResponses(g, g.players[0], 3, [])).toBe(1);
  });
});
