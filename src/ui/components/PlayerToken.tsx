import type { PlayerState } from '../../engine/types';
import { CHAR_FG, charDef } from '../labels';

interface Props {
  player: PlayerState;
  active: boolean;
}

export function PlayerToken({ player, active }: Props) {
  const def = charDef(player.character);
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink text-xs font-extrabold"
      style={{
        background: def.color,
        color: CHAR_FG[player.character],
        opacity: player.suspended ? 0.5 : 1,
        outline: active ? '3px solid var(--violet)' : 'none',
        outlineOffset: 2,
      }}
      title={`${player.name} (${def.name})${player.suspended ? ', suspenso' : ''}`}
      aria-label={`${player.name}, ${def.name}${active ? ', jogando agora' : ''}`}
    >
      {player.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
