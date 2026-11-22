import { Undo2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CONFIG } from '../../content/config';
import { getLegalActions } from '../../engine/selectors';
import type { ZoneId } from '../../engine/types';
import { useApp, useSend } from '../../state/GameContext';
import { Board } from '../components/Board';
import { Hand } from '../components/Hand';
import { HateMeter } from '../components/HateMeter';
import { PhaseBanner } from '../components/PhaseBanner';
import { PlayerPanel } from '../components/PlayerPanel';
import { PressButton } from '../components/PressButton';
import { ThreatInspector } from '../components/ThreatInspector';

const MAX_SELECTED = CONFIG.confront.maxCards;

export function GameScreen({ onExit }: { onExit: () => void }) {
  const { game, message } = useApp();
  const send = useSend();
  const [selected, setSelected] = useState<string[]>([]);
  const [inspectId, setInspectId] = useState<string | null>(null);

  const legal = useMemo(() => (game ? getLegalActions(game) : null), [game]);

  const toggleCard = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev.slice(Math.max(0, prev.length - (MAX_SELECTED - 1))), id],
    );
  }, []);

  if (!game || !legal) return null;

  const active = game.players[game.activeIdx];
  const validSelected = selected.filter((id) => active.hand.some((c) => c.id === id));
  const move = (zone: ZoneId) => send({ type: 'MOVE', zone });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-3 p-3 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold text-net">Feed Zero</h1>
          <span className="rounded-full border-[3px] border-ink bg-white px-3 py-0.5 text-sm font-bold">
            Rodada {game.round}
          </span>
          <span className="rounded-full border-[3px] border-ink bg-teal px-3 py-0.5 text-sm font-bold">
            Eliminadas {game.eliminated}/{game.goal}
          </span>
        </div>
        <div className="flex gap-2">
          <PressButton
            className="btn"
            disabled={!legal.canUndo}
            onClick={() => send({ type: 'UNDO' })}
          >
            <Undo2 size={18} className="mr-1 inline" aria-hidden="true" />
            Desfazer
          </PressButton>
          <PressButton className="btn" onClick={onExit}>
            Menu
          </PressButton>
        </div>
      </header>

      <PhaseBanner game={game} />

      {message && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-[14px] border-[3px] border-ink bg-alert px-3 py-2 font-bold text-white"
        >
          <span>{message}</span>
          <button
            type="button"
            className="btn text-ink"
            onClick={() => send({ type: 'DISMISS_MESSAGE' })}
          >
            Entendi
          </button>
        </div>
      )}

      <div className="grid flex-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="order-2 flex flex-col gap-3 lg:order-1">
          <HateMeter value={game.hate} max={game.config.limits.hateMax} />
          <PlayerPanel game={game} />
        </aside>

        <section className="order-1 flex flex-col gap-3 lg:order-2">
          <Board
            game={game}
            reachable={game.phase === 'turn.move' ? legal.moveZones : []}
            onMove={move}
            inspectId={inspectId}
            onInspect={setInspectId}
          />

          <div className="panel flex flex-wrap items-center justify-between gap-2">
            {game.phase === 'turn.move' && (
              <>
                <p className="font-bold">Toque numa zona destacada para mover.</p>
                <PressButton
                  className="btn btn-primary"
                  disabled={!legal.canSkipMove}
                  onClick={() => send({ type: 'SKIP_MOVE' })}
                >
                  Ficar
                </PressButton>
              </>
            )}
            {game.phase === 'turn.act' && (
              <p className="font-bold">As ações do turno entram no próximo bloco.</p>
            )}
            {game.phase === 'ended' && (
              <PressButton className="btn btn-primary" onClick={onExit}>
                Voltar ao título
              </PressButton>
            )}
          </div>

          <Hand
            player={active}
            config={game.config}
            selected={validSelected}
            onToggle={toggleCard}
          />
        </section>

        <aside className="order-3 flex flex-col gap-3">
          <ThreatInspector game={game} threatId={inspectId} onClose={() => setInspectId(null)} />
          <section className="panel text-sm">O registro de eventos entra no próximo bloco.</section>
        </aside>
      </div>
    </div>
  );
}
