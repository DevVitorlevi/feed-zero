import type { GameState } from '../../engine/types';

const MARK = { good: '✔', bad: '✖', neutral: '•' } as const;
const BG = { good: '#CDEFEA', bad: '#FBD5D6', neutral: '#FFFFFF' } as const;

export function EventLog({ game, limit = 40 }: { game: GameState; limit?: number }) {
  const entries = [...game.log].slice(-limit).reverse();

  return (
    <section className="panel" aria-label="Registro de eventos">
      <h2 className="mb-2 font-extrabold">Registro</h2>
      {entries.length === 0 ? (
        <p className="text-sm">Nada aconteceu ainda.</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1 text-sm">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-[10px] border-2 border-ink px-2 py-1"
              style={{ background: BG[e.tone] }}
            >
              <span className="mr-1 font-extrabold" aria-hidden="true">
                {MARK[e.tone]}
              </span>
              <span className="mr-1 font-bold">R{e.round}</span>
              {e.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
