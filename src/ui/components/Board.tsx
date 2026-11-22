import { motion } from 'framer-motion';
import { ZONES } from '../../content/zones';
import { threatStrength } from '../../engine/selectors';
import type { GameState, ZoneId } from '../../engine/types';
import { DARK_ZONES, ZONE_SHORT } from '../labels';
import { PlayerToken } from './PlayerToken';

const POS: Record<ZoneId, { x: number; y: number }> = {
  feed: { x: 50, y: 50 },
  comentarios: { x: 19, y: 32 },
  stories: { x: 50, y: 14 },
  trending: { x: 81, y: 32 },
  grupos: { x: 81, y: 68 },
  dms: { x: 50, y: 86 },
  central: { x: 19, y: 68 },
};

const LINKS = ZONES.flatMap((z) =>
  z.neighbors.filter((n) => z.id < n).map((n) => [z.id, n] as const),
);

interface Props {
  game: GameState;
  reachable: ZoneId[];
  onMove: (zone: ZoneId) => void;
  inspectId: string | null;
  onInspect: (threatId: string) => void;
}

export function Board({ game, reachable, onMove, inspectId, onInspect }: Props) {
  const active = game.players[game.activeIdx];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[720px] rounded-[20px] border-[3px] border-ink bg-white">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {LINKS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={POS[a].x}
            y1={POS[a].y}
            x2={POS[b].x}
            y2={POS[b].y}
            stroke="#2B2B33"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {ZONES.map((z) => {
        const isReachable = reachable.includes(z.id);
        const here = game.players.filter((p) => p.zone === z.id);
        const threats = game.threats.filter((t) => t.zone === z.id);
        const fg = DARK_ZONES.has(z.id) ? '#FFFFFF' : '#2B2B33';

        return (
          <div
            key={z.id}
            className="absolute w-[29%] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${POS[z.id].x}%`, top: `${POS[z.id].y}%` }}
          >
            <motion.div
              className="relative flex flex-col gap-1 rounded-[14px] border-[3px] border-ink p-1.5"
              style={{
                background: z.color,
                color: fg,
                outline: isReachable ? '4px solid var(--sun)' : 'none',
                outlineOffset: 3,
              }}
              animate={isReachable ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={
                isReachable ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined
              }
            >
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => onMove(z.id)}
                title={z.rule}
                aria-label={isReachable ? `Mover para ${z.name}` : z.name}
                className="text-left text-xs font-extrabold leading-tight after:absolute after:inset-0 after:content-[''] disabled:cursor-default sm:text-sm"
              >
                <span className="sm:hidden">{ZONE_SHORT[z.id]}</span>
                <span className="hidden sm:inline">{z.name}</span>
              </button>

              {here.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {here.map((p) => (
                    <PlayerToken key={p.id} player={p} active={p.id === active.id} />
                  ))}
                </div>
              )}

              {threats.map((t) => {
                const strength = threatStrength(game, t.card.id) ?? t.card.strength;
                const inspected = inspectId === t.card.id;
                return (
                  <button
                    key={t.card.id}
                    type="button"
                    onClick={() => onInspect(t.card.id)}
                    aria-pressed={inspected}
                    aria-label={`${t.card.name}, Força ${strength}`}
                    title={`${t.card.name} (Força ${strength})`}
                    className="relative z-10 flex min-h-[32px] items-center gap-1 rounded-[10px] border-[3px] border-ink bg-alert px-1 text-left text-xs font-bold text-white"
                    style={{
                      outline: inspected ? '3px solid var(--violet)' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    <span className="grid h-5 min-w-5 place-items-center rounded bg-white px-1 text-ink">
                      {strength}
                    </span>
                    <span className="truncate">{t.card.name}</span>
                  </button>
                );
              })}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
