import { viewPlayer } from '../activePlayer';
import { motion } from 'framer-motion';
import { Heart, Layers, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameState } from '../../engine/types';
import { ZONE_SHORT, charDef } from '../labels';

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1 font-bold" title={label}>
      {icon}
      <motion.span
        key={String(value)}
        className="inline-block"
        initial={{ scale: 1.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {value}
      </motion.span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PlayerPanel({ game }: { game: GameState }) {
  const active = viewPlayer(game);
  return (
    <ul className="flex flex-col gap-2" aria-label="Jogadores">
      {game.players.map((p) => {
        const def = charDef(p.character);
        const isActive = p.id === active.id && game.phase !== 'ended';
        return (
          <li
            key={p.id}
            className="rounded-[14px] border-[3px] bg-white p-2"
            style={{ borderColor: isActive ? '#7B4FD6' : '#2B2B33', borderLeftWidth: 10 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-extrabold">{p.name}</span>
              <span
                className="rounded-full border-2 border-ink px-2 text-xs font-bold"
                style={{
                  background: def.color,
                  color: def.id === 'caio' || def.id === 'helena' ? '#fff' : '#2B2B33',
                }}
              >
                {def.name}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Stat
                icon={<Heart size={16} aria-hidden="true" />}
                value={`${p.integrity}/${game.config.limits.integrityMax}`}
                label="Integridade"
              />
              <Stat
                icon={<Star size={16} aria-hidden="true" />}
                value={p.reputation}
                label="Reputação"
              />
              <Stat
                icon={<Layers size={16} aria-hidden="true" />}
                value={p.hand.length}
                label="Cartas na mão"
              />
              <span className="text-xs">{ZONE_SHORT[p.zone]}</span>
            </div>
            {(isActive || p.suspended) && (
              <div className="mt-1 flex gap-1 text-xs font-bold">
                {isActive && (
                  <span className="rounded-full bg-violet px-2 text-white">Jogando</span>
                )}
                {p.suspended && (
                  <span className="rounded-full bg-alert px-2 text-white">Suspenso</span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
