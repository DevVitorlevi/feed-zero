import { Cpu } from 'lucide-react';
import type { AlgoStep } from '../../engine/types';
import { PressButton } from './PressButton';

const STEPS: { id: AlgoStep; text: string }[] = [
  { id: 'event', text: '1. Evento: revela e aplica 1 Evento' },
  { id: 'threat', text: '2. Ameaça: entra nova Ameaça na zona de origem' },
  { id: 'hate', text: '3. Ódio Viral: +1 por zona com Ameaça' },
  { id: 'check', text: '4. Checagem: vitória, derrota ou próxima rodada' },
];

export function AlgorithmPanel({ step, onNext }: { step: AlgoStep; onNext: () => void }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="flex items-center gap-2 font-extrabold">
        <Cpu size={20} aria-hidden="true" />
        Fase do Algoritmo: avance um passo por vez e leia o registro.
      </p>
      <ol className="flex flex-col gap-1 text-sm">
        {STEPS.map((s) => {
          const current = s.id === step;
          return (
            <li
              key={s.id}
              aria-current={current ? 'step' : undefined}
              className="rounded-[10px] border-2 border-ink px-2 py-1"
              style={{
                background: current ? '#7B4FD6' : '#FFFFFF',
                color: current ? '#FFFFFF' : '#2B2B33',
                fontWeight: current ? 800 : 500,
              }}
            >
              {current ? '▶ ' : ''}
              {s.text}
            </li>
          );
        })}
      </ol>
      <div className="flex justify-end">
        <PressButton
          className="btn btn-primary"
          style={{ background: '#7B4FD6', color: '#fff' }}
          onClick={onNext}
        >
          Executar passo
        </PressButton>
      </div>
    </div>
  );
}
