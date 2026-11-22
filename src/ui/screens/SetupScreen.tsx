import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CHARACTERS } from '../../content/characteres';
import { CONFIG } from '../../content/config';
import type { CharacterId } from '../../engine/types';
import { useApp, useSend } from '../../state/GameContext';
import { PressButton } from '../components/PressButton';

interface Props {
  onBack: () => void;
  onStarted: () => void;
}

interface Slot {
  name: string;
  character: CharacterId;
}

const DEFAULT_CHARS: CharacterId[] = ['marina', 'caio', 'rafa', 'helena'];

const fade = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18 },
};

export function SetupScreen({ onBack, onStarted }: Props) {
  const { message } = useApp();
  const send = useSend();
  const [count, setCount] = useState(2);
  const [seed, setSeed] = useState('');
  const [slots, setSlots] = useState<Slot[]>(
    DEFAULT_CHARS.map((c, i) => ({ name: `Jogador ${i + 1}`, character: c })),
  );

  const active = slots.slice(0, count);
  const names = active.map((s) => s.name.trim());
  const chars = active.map((s) => s.character);
  const namesOk = names.every((n) => n !== '');
  const charsOk = new Set(chars).size === chars.length;
  const canStart = namesOk && charsOk;

  function update(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function start() {
    send({
      type: 'START_GAME',
      players: active.map((s) => ({ name: s.name.trim(), character: s.character })),
      seed: seed.trim() || undefined,
    });
    onStarted();
  }

  const counts = Array.from(
    { length: CONFIG.players.max - CONFIG.players.min + 1 },
    (_, i) => CONFIG.players.min + i,
  );

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold text-net">Nova partida</h1>

      <fieldset className="panel">
        <legend className="px-2 font-bold">Número de jogadores</legend>
        <div className="flex gap-2">
          {counts.map((n) => (
            <PressButton
              key={n}
              className={`btn flex-1 ${count === n ? 'btn-primary' : ''}`}
              aria-pressed={count === n}
              onClick={() => setCount(n)}
            >
              {n}
            </PressButton>
          ))}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {active.map((slot, i) => {
          const current = CHARACTERS.find((c) => c.id === slot.character);
          return (
            <motion.section
              key={i}
              layout
              className="panel flex flex-col gap-3"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <label className="flex flex-col gap-1 font-bold" htmlFor={`name-${i}`}>
                Nome do jogador {i + 1}
                <input
                  id={`name-${i}`}
                  className="input"
                  value={slot.name}
                  maxLength={20}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              </label>

              <div
                role="radiogroup"
                aria-label={`Personagem do jogador ${i + 1}`}
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {CHARACTERS.map((c) => {
                  const takenByOther = active.some((o, j) => j !== i && o.character === c.id);
                  const selected = slot.character === c.id;
                  return (
                    <PressButton
                      key={c.id}
                      role="radio"
                      aria-checked={selected}
                      disabled={takenByOther}
                      onClick={() => update(i, { character: c.id })}
                      className="btn flex h-auto flex-col items-center gap-1 p-2"
                      style={selected ? { background: c.color, color: '#fff' } : undefined}
                      animate={selected ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      <img
                        src={c.image}
                        alt={`Carta de ${c.name}: ${c.abilityName}`}
                        width={100}
                        height={140}
                        className="h-auto w-full max-w-[100px]"
                        style={{ aspectRatio: '5 / 7' }}
                      />
                      <span>{c.name}</span>
                    </PressButton>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={slot.character}
                  className="text-sm"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <strong>{current?.abilityName}:</strong> {current?.abilityText}
                </motion.p>
              </AnimatePresence>
            </motion.section>
          );
        })}
      </AnimatePresence>

      <label className="panel flex flex-col gap-1 font-bold" htmlFor="seed">
        Seed (opcional)
        <input
          id="seed"
          className="input"
          value={seed}
          placeholder="Deixe vazio para a seed padrão"
          onChange={(e) => setSeed(e.target.value)}
        />
      </label>

      <AnimatePresence initial={false}>
        {!namesOk && (
          <motion.p key="names" role="alert" className="font-bold text-alert" {...fade}>
            Todos os jogadores precisam de um nome.
          </motion.p>
        )}
        {!charsOk && (
          <motion.p key="chars" role="alert" className="font-bold text-alert" {...fade}>
            Cada jogador precisa de um personagem diferente.
          </motion.p>
        )}
        {message && (
          <motion.p key="msg" role="alert" className="font-bold text-alert" {...fade}>
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <PressButton className="btn" onClick={onBack}>
          Voltar
        </PressButton>
        <PressButton className="btn btn-primary flex-1" disabled={!canStart} onClick={start}>
          Começar
        </PressButton>
      </div>
    </main>
  );
}
