import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CHARACTERS } from '../../content/characteres';
import { COPY } from '../../content/copy';
import { useApp } from '../../state/GameContext';
import { PressButton } from '../components/PressButton';

interface Props {
  onNewGame: () => void;
  onResume: () => void;
  onAbout: () => void;
}

const CHIP_COLORS = [
  { bg: '#2F6FED', fg: '#fff' },
  { bg: '#19B5A5', fg: '#2B2B33' },
  { bg: '#F7C331', fg: '#2B2B33' },
  { bg: '#7B4FD6', fg: '#fff' },
  { bg: '#F28B30', fg: '#2B2B33' },
  { bg: '#E5484D', fg: '#fff' },
];

const FAN = [
  { rotate: -12, x: 0 },
  { rotate: -4, x: -18 },
  { rotate: 4, x: -36 },
  { rotate: 12, x: -54 },
];

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

function CardFan() {
  return (
    <div
      className="flex items-center justify-center py-6 pl-14"
      aria-label="Personagens da Operação Feed Zero"
    >
      {CHARACTERS.map((c, i) => (
        <motion.div
          key={c.id}
          className="relative"
          style={{ rotate: FAN[i].rotate, marginLeft: FAN[i].x, zIndex: i }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -18, scale: 1.08, zIndex: 10 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.35 + i * 0.1 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          >
            <img
              src={c.image}
              alt={`Carta de ${c.name}: ${c.abilityName}`}
              width={400}
              height={559}
              className="w-24 rounded-[14px] border-[3px] border-ink bg-white sm:w-32 lg:w-40"
              style={{ aspectRatio: '5 / 7' }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export function TitleScreen({ onNewGame, onResume, onAbout }: Props) {
  const { game } = useApp();
  const [showRules, setShowRules] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <motion.h1
            className="flex items-center gap-3 text-5xl font-extrabold leading-none sm:text-7xl"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <span>Feed</span>
            <span className="-rotate-3 rounded-[14px] border-[3px] border-ink bg-net px-3 py-1 text-white">
              Zero
            </span>
          </motion.h1>

          <motion.p
            className="inline-block rounded-full border-[3px] border-ink bg-sun px-4 py-1 text-sm font-bold sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            {COPY.about.theme}
          </motion.p>

          <motion.p
            className="max-w-xl text-base sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {COPY.lore}
          </motion.p>

          <motion.ul
            className="flex max-w-xl flex-wrap justify-center gap-2 lg:justify-start"
            aria-label="Tags do tema"
            variants={list}
            initial="hidden"
            animate="show"
          >
            {COPY.about.tags.map((tag, i) => {
              const color = CHIP_COLORS[i % CHIP_COLORS.length];
              return (
                <motion.li
                  key={tag}
                  variants={item}
                  className="rounded-full border-[3px] border-ink px-3 py-1 text-sm font-bold"
                  style={{ background: color.bg, color: color.fg }}
                >
                  {tag}
                </motion.li>
              );
            })}
          </motion.ul>

          <motion.div
            className="flex w-full max-w-sm flex-col gap-3"
            variants={list}
            initial="hidden"
            animate="show"
          >
            {game && (
              <motion.div variants={item}>
                <PressButton className="btn btn-primary w-full" onClick={onResume}>
                  Continuar partida
                </PressButton>
              </motion.div>
            )}
            <motion.div variants={item}>
              <PressButton className="btn btn-primary w-full" onClick={onNewGame}>
                Nova partida
              </PressButton>
            </motion.div>
            <motion.div variants={item}>
              <PressButton
                className="btn w-full"
                aria-expanded={showRules}
                onClick={() => setShowRules((v) => !v)}
              >
                {showRules ? 'Fechar regras' : 'Como jogar'}
              </PressButton>
            </motion.div>
            <motion.div variants={item}>
              <PressButton className="btn w-full" onClick={onAbout}>
                Sobre o jogo
              </PressButton>
            </motion.div>
          </motion.div>
        </div>

        <CardFan />
      </div>

      <AnimatePresence initial={false}>
        {showRules && (
          <motion.section
            key="rules"
            className="w-full max-w-3xl overflow-hidden text-left"
            aria-label="Regras do jogo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <div className="panel">
              <ul className="flex flex-col gap-3">
                {COPY.rules.map((r) => (
                  <li key={r.title}>
                    <strong>{r.title}.</strong> {r.text}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
