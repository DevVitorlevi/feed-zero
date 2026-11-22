import type { DilemmaCard, Effect } from '../../engine/types';
import { Modal } from './Modal';
import { PressButton } from './PressButton';

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function effectText(e: Effect): { text: string; good: boolean } {
  switch (e.t) {
    case 'integrity':
      return { text: `${signed(e.n)} Integridade`, good: e.n > 0 };
    case 'reputation':
      return { text: `${signed(e.n)} Reputação`, good: e.n > 0 };
    case 'hate':
      return { text: `${signed(e.n)} Ódio Viral`, good: e.n < 0 };
    case 'drawResponse':
      return { text: `Compra ${e.n} Resposta${e.n > 1 ? 's' : ''}`, good: true };
  }
}

interface Props {
  dilemma: DilemmaCard;
  playerName: string;
  onChoose: (option: 'a' | 'b') => void;
}

export function DilemmaModal({ dilemma, playerName, onChoose }: Props) {
  return (
    <Modal title={`Dilema de ${playerName}`} headerBg="#F7C331" headerFg="#2B2B33">
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={dilemma.image}
          alt={`Dilema: ${dilemma.name}`}
          width={600}
          height={840}
          className="mx-auto w-40 shrink-0 self-start rounded-[14px] border-[3px] border-ink bg-white sm:w-48"
          style={{ aspectRatio: '5 / 7' }}
        />
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-lg font-extrabold">{dilemma.name}</p>
          <p>{dilemma.prompt}</p>
          {(['a', 'b'] as const).map((key) => {
            const opt = dilemma[key];
            return (
              <PressButton
                key={key}
                className="btn flex flex-col items-start gap-1 py-2 text-left"
                onClick={() => onChoose(key)}
              >
                <span className="font-extrabold">
                  Opção {key.toUpperCase()}: {opt.label}
                </span>
                <span className="flex flex-wrap gap-1">
                  {opt.effects.map((e, i) => {
                    const x = effectText(e);
                    return (
                      <span
                        key={i}
                        className="rounded-full border-2 border-ink px-2 text-sm font-bold"
                        style={{
                          background: x.good ? '#19B5A5' : '#E5484D',
                          color: x.good ? '#2B2B33' : '#fff',
                        }}
                      >
                        {x.text}
                      </span>
                    );
                  })}
                </span>
              </PressButton>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
