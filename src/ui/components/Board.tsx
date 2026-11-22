import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { ZONES } from '../../content/zones';
import { threatStrength } from '../../engine/selectors';
import type { GameState, ZoneId } from '../../engine/types';
import { turnPlayer } from '../activePlayer';
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

const GRID: Record<ZoneId, { row: number; col: number }> = {
  comentarios: { row: 1, col: 1 },
  stories: { row: 1, col: 2 },
  trending: { row: 1, col: 3 },
  central: { row: 2, col: 1 },
  feed: { row: 2, col: 2 },
  grupos: { row: 2, col: 3 },
  dms: { row: 3, col: 2 },
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
  const active = turnPlayer(game);

  return (
    <div className="relative mx-auto grid w-full max-w-[720px] grid-cols-3 gap-1 rounded-[20px] border-[3px] border-ink bg-white p-1 sm:m-auto sm:block sm:aspect-square sm:gap-0 sm:p-0">
      <svg
        className="absolute inset-0 hidden h-full w-full sm:block"
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
        const wrapStyle = {
          gridRow: GRID[z.id].row,
          gridColumn: GRID[z.id].col,
          '--l': `${POS[z.id].x}%`,
          '--t': `${POS[z.id].y}%`,
        } as CSSProperties;

        return (
          <div
            key={z.id}
            className="min-w-0 sm:absolute sm:left-[var(--l)] sm:top-[var(--t)] sm:w-[29%] sm:-translate-x-1/2 sm:-translate-y-1/2"
            style={wrapStyle}
          >
            <motion.div
              className="relative flex h-full flex-col gap-1 rounded-[14px] border-[3px] border-ink p-1 sm:p-1.5"
              style={{
                background: z.color,
                color: fg,
                outline: isReachable ? '4px solid var(--sun)' : 'none',
                outlineOffset: 3,
              }}
              animate={isReachable ? { scale: [1, 1.03, 1] } : { scale: 1 }}
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
                className="min-h-[24px] break-words text-left text-sm font-extrabold leading-tight after:absolute after:inset-0 after:content-[''] disabled:cursor-default"
              >
                <span className="sm:hidden">{ZONE_SHORT[z.id]}</span>
                <span className="hidden sm:inline">{z.name}</span>
              </button>

              {here.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {here.map((p) => (
                    <PlayerToken key={p.id} player={p} active={active?.id === p.id} />
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
                    className="relative z-10 flex min-h-[44px] items-center gap-1 rounded-[10px] border-[3px] border-ink bg-alert px-1 text-left text-sm font-bold leading-tight text-white"
                    style={{
                      outline: inspected ? '3px solid var(--violet)' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded bg-white px-1 text-ink">
                      {strength}
                    </span>
                    <span className="line-clamp-2 min-w-0 break-words">{t.card.name}</span>
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
