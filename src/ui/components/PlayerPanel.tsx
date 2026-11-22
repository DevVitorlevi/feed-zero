import { motion } from 'framer-motion';
import { Heart, Layers, MapPin, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameState } from '../../engine/types';
import { turnPlayer } from '../activePlayer';
import { ZONE_SHORT, charDef } from '../labels';

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] border-2 border-ink bg-paper px-2 py-1">
      <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
        {icon}
        {label}
      </span>
      <motion.span
        key={String(value)}
        className="min-w-0 truncate text-base font-extrabold"
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {value}
      </motion.span>
    </div>
  );
}

export function PlayerPanel({ game }: { game: GameState }) {
  const active = turnPlayer(game);
  return (
    <ul className="flex flex-col gap-2" aria-label="Jogadores">
      {game.players.map((p) => {
        const def = charDef(p.character);
        const isActive = active !== null && p.id === active.id;
        return (
          <li
            key={p.id}
            className="rounded-[14px] border-[3px] bg-white p-2"
            style={{ borderColor: isActive ? '#7B4FD6' : '#2B2B33', borderLeftWidth: 10 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-extrabold">{p.name}</span>
              <span
                className="shrink-0 rounded-full border-2 border-ink px-2 text-sm font-bold"
                style={{
                  background: def.color,
                  color: def.id === 'caio' || def.id === 'helena' ? '#fff' : '#2B2B33',
                }}
              >
                {def.name}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <Stat
                icon={<Heart size={16} aria-hidden="true" />}
                label="Integridade"
                value={`${p.integrity}/${game.config.limits.integrityMax}`}
              />
              <Stat
                icon={<Star size={16} aria-hidden="true" />}
                label="Reputação"
                value={p.reputation}
              />
              <Stat
                icon={<Layers size={16} aria-hidden="true" />}
                label="Mão"
                value={`${p.hand.length}/${game.config.limits.handMax}`}
              />
              <Stat
                icon={<MapPin size={16} aria-hidden="true" />}
                label="Zona"
                value={ZONE_SHORT[p.zone]}
              />
            </div>

            {(isActive || p.suspended) && (
              <div className="mt-2 flex flex-wrap gap-1 text-sm font-bold">
                {isActive && (
                  <span className="rounded-full bg-violet px-2 text-white">Jogando agora</span>
                )}
                {p.suspended && (
                  <span className="rounded-full bg-alert px-2 text-white">
                    Suspenso (perde o próximo turno)
                  </span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
