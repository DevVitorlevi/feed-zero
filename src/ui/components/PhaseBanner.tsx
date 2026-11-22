import { AnimatePresence, motion } from 'framer-motion';
import type { GameState } from '../../engine/types';

function bannerFor(g: GameState): { text: string; bg: string; fg: string } {
  const name = g.players[g.activeIdx].name;
  switch (g.phase) {
    case 'turn.move':
      return {
        text: `Vez de ${name}: mova até ${g.config.moveRange} zonas ou fique`,
        bg: '#2F6FED',
        fg: '#FFFFFF',
      };
    case 'turn.act':
      return { text: `Vez de ${name}: escolha uma ação`, bg: '#2F6FED', fg: '#FFFFFF' };
    case 'turn.dilemma':
      return { text: `${name}: escolha a opção A ou B do Dilema`, bg: '#F7C331', fg: '#2B2B33' };
    case 'algorithm':
      return { text: 'Fase do Algoritmo', bg: '#7B4FD6', fg: '#FFFFFF' };
    case 'ended':
      return { text: 'Partida terminada', bg: '#2B2B33', fg: '#FFFFFF' };
  }
}

export function PhaseBanner({ game }: { game: GameState }) {
  const b = bannerFor(game);
  return (
    <div
      className="overflow-hidden rounded-[14px] border-[3px] border-ink px-4 py-2 text-center font-extrabold"
      style={{ background: b.bg, color: b.fg }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={b.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {b.text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
