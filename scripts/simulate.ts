import { CHARACTERS } from '../src/content/characteres';
import { previewConfront } from '../src/engine/confront';
import { nextRandom, hashSeed } from '../src/engine/rng';
import { reduce } from '../src/engine/reducer';
import { getLegalActions } from '../src/engine/selectors';
import { createGame } from '../src/engine/setup';
import type { Action, GameState } from '../src/engine/types';

type Policy = 'aleatorio' | 'sensato' | 'casual';
const MAX_ACTIONS = 3000;
const casualSkill = Number(process.env.SKILL ?? 0.6);

class Rand {
  private s: number;
  constructor(seed: string) {
    this.s = hashSeed(seed);
  }
  next(): number {
    const r = nextRandom(this.s);
    this.s = r.state;
    return r.value;
  }
  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
}

function cardSets(state: GameState): string[][] {
  const hand = state.players[state.activeIdx].hand;
  const sets: string[][] = hand.map((c) => [c.id]);
  for (let i = 0; i < hand.length; i++)
    for (let j = i + 1; j < hand.length; j++) sets.push([hand[i].id, hand[j].id]);
  return sets;
}

function confrontOptions(state: GameState, shortcut: boolean) {
  const me = state.players[state.activeIdx];
  const out: { action: Action; cards: number; success: boolean; clean: boolean }[] = [];
  for (const t of getLegalActions(state).confrontTargets) {
    for (const ids of cardSets(state)) {
      const p = previewConfront(state, me.id, t, ids);
      if (!p.allowed || p.usesShortcut !== shortcut) continue;
      out.push({
        action: { type: 'CONFRONT', threatId: t, cardIds: ids },
        cards: ids.length,
        success: p.willSucceed,
        clean: !p.usesShortcut,
      });
    }
  }
  return out;
}

function bestConfront(state: GameState, allowShortcut: boolean): Action | null {
  const clean = confrontOptions(state, false)
    .filter((o) => o.success)
    .sort((a, b) => a.cards - b.cards);
  if (clean[0]) return clean[0].action;
  if (!allowShortcut) return null;
  const sc = confrontOptions(state, true).filter((o) => o.success);
  return sc[0]?.action ?? null;
}

function sensibleAction(state: GameState, rnd: Rand): Action {
  const legal = getLegalActions(state);
  const me = state.players[state.activeIdx];
  if (state.phase === 'algorithm') return { type: 'ALGORITHM_NEXT' };
  if (state.phase === 'turn.dilemma') {
    return { type: 'CHOOSE_DILEMMA', option: rnd.next() < 0.75 ? 'a' : 'b' };
  }
  if (state.phase === 'turn.move') {
    if (me.integrity <= 2 && me.zone !== 'central' && legal.moveZones.includes('central')) {
      return { type: 'MOVE', zone: 'central' };
    }
    let best: Action = { type: 'SKIP_MOVE' };
    let bestScore = bestConfront(reduce(state, { type: 'SKIP_MOVE' }).state, false) ? 1 : 0;
    for (const z of legal.moveZones) {
      const next = reduce(state, { type: 'MOVE', zone: z }).state;
      const score = bestConfront(next, false) ? 2 : 0;
      if (score > bestScore) {
        bestScore = score;
        best = { type: 'MOVE', zone: z };
      }
    }
    return best;
  }
  if (me.integrity <= 2 && legal.canRest) return { type: 'REST' };
  const shortcutOk = state.hate >= 9 || me.integrity >= 6;
  const c = bestConfront(state, shortcutOk);
  if (c) return c;
  if (legal.canRest && me.integrity <= 4) return { type: 'REST' };
  if (legal.supportTargets.length > 0 && me.hand.length >= 4) {
    const to = legal.supportTargets[0];
    return { type: 'SUPPORT', toPlayerId: to, cardIds: [me.hand[0].id] };
  }
  if (legal.canExplore) return { type: 'EXPLORE' };
  if (legal.canRest) return { type: 'REST' };
  throw new Error('Bot sem ação legal em turn.act');
}

function randomAction(state: GameState, rnd: Rand): Action {
  const legal = getLegalActions(state);
  const me = state.players[state.activeIdx];
  if (state.phase === 'algorithm') return { type: 'ALGORITHM_NEXT' };
  if (state.phase === 'turn.dilemma')
    return { type: 'CHOOSE_DILEMMA', option: rnd.next() < 0.5 ? 'a' : 'b' };
  if (state.phase === 'turn.move') {
    const opts: Action[] = [
      { type: 'SKIP_MOVE' },
      ...legal.moveZones.map((zone) => ({ type: 'MOVE', zone }) as Action),
    ];
    return rnd.pick(opts);
  }
  const opts: Action[] = [];
  const confronts = [...confrontOptions(state, false), ...confrontOptions(state, true)];
  for (const c of confronts) opts.push(c.action);
  if (legal.canExplore) opts.push({ type: 'EXPLORE' });
  if (legal.canRest) opts.push({ type: 'REST' });
  for (const to of legal.supportTargets) {
    if (me.hand.length > 0)
      opts.push({ type: 'SUPPORT', toPlayerId: to, cardIds: [rnd.pick(me.hand).id] });
  }
  if (legal.canDebug && rnd.next() < 0.3)
    opts.push({ type: 'DEBUG_REORDER', swap: rnd.next() < 0.5 });
  if (opts.length === 0) throw new Error('Bot sem ação legal em turn.act');
  return rnd.pick(opts);
}

interface Stats {
  games: number;
  victory: number;
  feed_tomado: number;
  sem_saida: number;
  stuck: number;
  errors: number;
  rounds: number;
  maxActions: number;
  rejections: number;
}

function playGame(
  n: number,
  index: number,
  policy: Policy,
): { state: GameState; actions: number; rejections: number } {
  const rnd = new Rand(`sim-${policy}-${n}-${index}`);
  const chars = [...CHARACTERS.map((c) => c.id)];
  const picked: typeof chars = [];
  while (picked.length < n) picked.push(chars.splice(Math.floor(rnd.next() * chars.length), 1)[0]);
  let state = createGame(
    picked.map((c, i) => ({ name: `Bot${i + 1}`, character: c })),
    `sim-${index}`,
  ).state;
  let actions = 0;
  let rejections = 0;
  while (state.phase !== 'ended' && actions < MAX_ACTIONS) {
    const useSensible = policy === 'sensato' || (policy === 'casual' && rnd.next() < casualSkill);
    const action = useSensible ? sensibleAction(state, rnd) : randomAction(state, rnd);
    const r = reduce(state, action);
    if (r.events.some((e) => e.kind === 'rejected')) rejections += 1;
    state = r.state;
    actions += 1;
  }
  return { state, actions, rejections };
}

function run(games: number): void {
  const only = process.env.POLICY as Policy | undefined;
  const policies: Policy[] = only ? [only] : ['sensato', 'casual', 'aleatorio'];
  console.log(
    `Simulação: ${games} partidas por configuração (meta 4 com 2 jogadores, 5 com 3 e 4)\n`,
  );
  let failed = false;
  for (const policy of policies) {
    console.log(`Política: ${policy}`);
    console.log(
      'jog | vitória | Feed Tomado | sem saída | rodadas (média) | ações (máx) | recusas | travadas | erros',
    );
    for (const n of [2, 3, 4]) {
      const s: Stats = {
        games,
        victory: 0,
        feed_tomado: 0,
        sem_saida: 0,
        stuck: 0,
        errors: 0,
        rounds: 0,
        maxActions: 0,
        rejections: 0,
      };
      for (let i = 0; i < games; i++) {
        try {
          const { state, actions, rejections } = playGame(n, i, policy);
          s.maxActions = Math.max(s.maxActions, actions);
          s.rejections += rejections;
          if (state.phase !== 'ended') s.stuck += 1;
          else {
            s.rounds += state.round;
            const o = state.result?.outcome;
            if (o === 'victory') s.victory += 1;
            else if (o === 'feed_tomado') s.feed_tomado += 1;
            else s.sem_saida += 1;
          }
        } catch (e) {
          s.errors += 1;
          if (s.errors === 1) console.error(`  erro (partida ${i}):`, e);
        }
      }
      const finished = games - s.stuck - s.errors;
      const pct = (x: number) => `${((x / games) * 100).toFixed(1)}%`.padStart(7);
      console.log(
        `${String(n).padStart(3)} | ${pct(s.victory)} | ${pct(s.feed_tomado).padStart(11)} | ${pct(s.sem_saida).padStart(9)} | ${(s.rounds / Math.max(1, finished)).toFixed(1).padStart(15)} | ${String(s.maxActions).padStart(11)} | ${String(s.rejections).padStart(7)} | ${String(s.stuck).padStart(8)} | ${s.errors}`,
      );
      if (s.stuck > 0 || s.errors > 0 || s.rejections > 0) failed = true;
    }
    console.log('');
  }
  if (failed) {
    console.error('Simulação com travadas, erros ou ações recusadas dos bots.');
    process.exitCode = 1;
  } else {
    console.log('OK: nenhuma exceção, nenhum loop, nenhuma ação recusada.');
  }
}

const arg = Number(process.argv[2]);
run(Number.isFinite(arg) && arg > 0 ? arg : 1000);
