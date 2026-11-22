import { useState } from 'react';
import type { GameState } from '../../engine/types';
import { charDef } from '../labels';
import { Modal } from './Modal';
import { PressButton } from './PressButton';

interface Props {
  game: GameState;
  targets: string[];
  onConfirm: (toPlayerId: string, cardIds: string[]) => void;
  onClose: () => void;
}

export function SupportModal({ game, targets, onConfirm, onClose }: Props) {
  const me = game.players[game.activeIdx];
  const max = game.config.support.maxCards;
  const [toId, setToId] = useState<string>(targets[0] ?? '');
  const [cardIds, setCardIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setCardIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev.slice(-(max - 1)), id],
    );

  return (
    <Modal title="Apoiar um colega" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-1 font-extrabold">1. Quem recebe as cartas</legend>
          <div className="flex flex-wrap gap-2">
            {targets.map((id) => {
              const p = game.players.find((x) => x.id === id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === toId}
                  onClick={() => setToId(id)}
                  className={`btn ${id === toId ? 'btn-primary' : ''}`}
                >
                  {p.name} ({charDef(p.character).name}) · mão {p.hand.length}/
                  {game.config.limits.handMax}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 font-extrabold">2. Escolha 1 a {max} cartas para dar</legend>
          <div className="flex gap-3 overflow-x-auto px-1 pb-2 pt-3">
            {me.hand.map((c) => {
              const on = cardIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className="shrink-0 rounded-[14px]"
                  style={{
                    outline: on ? '4px solid var(--net)' : 'none',
                    outlineOffset: 2,
                    transform: on ? 'translateY(-8px)' : 'none',
                  }}
                >
                  <img
                    src={c.image}
                    alt={`${c.name}, valor ${c.value}${on ? ', selecionada' : ''}`}
                    width={600}
                    height={840}
                    draggable={false}
                    className="w-20 rounded-[14px] border-[3px] border-ink bg-white sm:w-24"
                    style={{ aspectRatio: '5 / 7' }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="panel text-sm">
          Você ganha +{game.config.support.reputation} Reputação. Se as cartas não couberem na mão
          do colega (limite {game.config.limits.handMax}), a ação é recusada.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <PressButton
            className="btn btn-primary"
            disabled={!toId || cardIds.length === 0}
            onClick={() => onConfirm(toId, cardIds)}
          >
            Apoiar
          </PressButton>
        </div>
      </div>
    </Modal>
  );
}
