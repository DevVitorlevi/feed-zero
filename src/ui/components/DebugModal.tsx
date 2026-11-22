import type { GameState } from '../../engine/types';
import { peekThreats } from '../../engine/selectors';
import { THREAT_TYPE_LABEL, WEAKNESS_LABEL, ZONE_SHORT } from '../labels';
import { Modal } from './Modal';
import { PressButton } from './PressButton';

interface Props {
  game: GameState;
  onChoose: (swap: boolean) => void;
  onClose: () => void;
}

export function DebugModal({ game, onChoose, onClose }: Props) {
  const cards = peekThreats(game);

  return (
    <Modal title="Debug do Algoritmo (Caio)" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p>
          Estas são as próximas Ameaças do baralho, na ordem em que vão entrar. Você pode manter a
          ordem ou trocá-las.
        </p>
        <ol className="flex flex-wrap gap-4">
          {cards.map((c, i) => (
            <li key={c.id} className="flex w-36 flex-col gap-1">
              <span className="font-extrabold">{i === 0 ? '1ª (próxima)' : '2ª'}</span>
              <img
                src={c.image}
                alt={`Ameaça: ${c.name}`}
                width={600}
                height={840}
                className="rounded-[14px] border-[3px] border-ink bg-white"
                style={{ aspectRatio: '5 / 7' }}
              />
              <span className="text-sm font-bold">{c.name}</span>
              <span className="text-sm">
                {THREAT_TYPE_LABEL[c.type]} · {ZONE_SHORT[c.homeZone]} · Força {c.strength} ·
                Fraqueza: {WEAKNESS_LABEL[c.weakness]}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <PressButton className="btn" onClick={() => onChoose(false)}>
            Manter ordem
          </PressButton>
          <PressButton
            className="btn btn-primary"
            disabled={cards.length < 2}
            onClick={() => onChoose(true)}
          >
            Trocar ordem
          </PressButton>
        </div>
      </div>
    </Modal>
  );
}
