import { motion } from 'framer-motion';
import { Home, Link2, Repeat, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { GameResult } from '../../engine/types';
import { useApp, useSend } from '../../state/GameContext';
import { Confetti } from '../components/Confetti';
import { EventLog } from '../components/EventLog';
import { PressButton } from '../components/PressButton';
import { charDef } from '../labels';

const OUTCOME: Record<
  GameResult['outcome'],
  { title: string; text: string; bg: string; fg: string }
> = {
  victory: {
    title: 'Vitória coletiva!',
    text: 'O Feed ficou limpo. A equipe eliminou as Ameaças a tempo.',
    bg: '#19B5A5',
    fg: '#2B2B33',
  },
  feed_tomado: {
    title: 'Feed Tomado',
    text: 'O Ódio Viral chegou ao máximo. Todos perderam. Abaixo, a pontuação parcial.',
    bg: '#E5484D',
    fg: '#FFFFFF',
  },
  sem_saida: {
    title: 'Sem saída',
    text: 'Acabaram as Ameaças e a meta não foi atingida. Não há mais como vencer. Abaixo, a pontuação parcial.',
    bg: '#7B4FD6',
    fg: '#FFFFFF',
  },
};

export function ResultScreen({ onHome }: { onHome: () => void }) {
  const { game } = useApp();
  const send = useSend();
  const [copied, setCopied] = useState(false);
  if (!game || !game.result) return null;

  const { outcome, ranking } = game.result;
  const o = OUTCOME[outcome];
  const won = outcome === 'victory';
  const lost = outcome === 'feed_tomado';

  async function copyLink() {
    if (!game) return;
    try {
      const url = new URL(window.location.href);
      url.search = `?seed=${encodeURIComponent(game.seed)}`;
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      {won && <Confetti />}
      <motion.section
        role="status"
        aria-live="polite"
        className="rounded-[20px] border-[3px] border-ink p-5 text-center"
        style={{ background: o.bg, color: o.fg }}
        initial={{ opacity: 0, scale: 0.9, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <h1 className={`text-3xl font-extrabold sm:text-5xl${lost ? ' glitch-title' : ''}`}>
          {o.title}
        </h1>
        <p className="mt-2 text-base font-bold sm:text-lg">{o.text}</p>
        <p className="mt-2 text-sm font-bold">
          Eliminadas {game.eliminated}/{game.goal} · Ódio Viral {game.hate}/
          {game.config.limits.hateMax} · Rodadas {game.round}
        </p>
      </motion.section>

      <section className="panel" aria-label="Pontuação final">
        <h2 className="mb-2 text-xl font-extrabold">
          {won ? 'Ranking final' : 'Pontuação parcial (sem vencedor)'}
        </h2>
        <ol className="flex flex-col gap-2">
          {ranking.map((r, i) => {
            const p = game.players.find((x) => x.id === r.playerId);
            if (!p) return null;
            const def = charDef(p.character);
            const isWinner = won && i === 0;
            return (
              <li
                key={r.playerId}
                className="rounded-[14px] border-[3px] border-ink p-3"
                style={{ background: isWinner ? '#F7C331' : '#FFFFFF' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-extrabold">
                    {i + 1}º {p.name} ({def.name}){isWinner && ' · Vencedor(a)'}
                  </span>
                  <span className="text-2xl font-extrabold">{r.score} pts</span>
                </div>
                <p className="text-sm">
                  Reputação {r.breakdown.reputation} + Integridade {r.breakdown.integrity} + Ameaças
                  sem atalho {r.breakdown.cleanKills}
                  {' · '}Apoios {p.stats.supports} · Atalhos {p.stats.shortcuts}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs">
          Desempate: maior Integridade, depois mais Apoios. Seed da partida:{' '}
          <strong>{game.seed}</strong>
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <PressButton
          className="btn btn-primary flex items-center gap-1"
          onClick={() => send({ type: 'RESTART', sameSeed: false })}
        >
          <RotateCcw size={18} aria-hidden="true" />
          Jogar de novo
        </PressButton>
        <PressButton
          className="btn flex items-center gap-1"
          onClick={() => send({ type: 'RESTART', sameSeed: true })}
        >
          <Repeat size={18} aria-hidden="true" />
          Mesma seed
        </PressButton>
        <PressButton className="btn flex items-center gap-1" onClick={onHome}>
          <Home size={18} aria-hidden="true" />
          Início
        </PressButton>
        <PressButton className="btn flex items-center gap-1" onClick={copyLink}>
          <Link2 size={18} aria-hidden="true" />
          {copied ? 'Link copiado' : 'Copiar link da seed'}
        </PressButton>
      </div>

      <EventLog game={game} limit={12} />
    </main>
  );
}
