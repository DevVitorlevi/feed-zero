import { Undo2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CONFIG } from '../../content/config';
import { getLegalActions } from '../../engine/selectors';
import type { ZoneId } from '../../engine/types';
import { useApp, useSend } from '../../state/GameContext';
import { viewPlayer } from '../activePlayer';
import { AlgorithmPanel } from '../components/AlgorithmPanel';
import { Board } from '../components/Board';
import { ConfrontModal } from '../components/ConfrontModal';
import { DebugModal } from '../components/DebugModal';
import { DilemmaModal } from '../components/DilemmaModal';
import { EventLog } from '../components/EventLog';
import { Hand } from '../components/Hand';
import { HateMeter } from '../components/HateMeter';
import { PhaseBanner } from '../components/PhaseBanner';
import { PlayerPanel } from '../components/PlayerPanel';
import { PressButton } from '../components/PressButton';
import { SupportModal } from '../components/SupportModal';
import { ThreatInspector } from '../components/ThreatInspector';

const MAX_SELECTED = CONFIG.confront.maxCards;

export function GameScreen({ onExit }: { onExit: () => void }) {
  const { game, message } = useApp();
  const send = useSend();
  const [selected, setSelected] = useState<string[]>([]);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [confrontOpen, setConfrontOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const legal = useMemo(() => (game ? getLegalActions(game) : null), [game]);

  const toggleCard = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev.slice(Math.max(0, prev.length - (MAX_SELECTED - 1))), id],
    );
  }, []);

  if (!game || !legal) return null;

  const active = viewPlayer(game);
  const validSelected = selected.filter((id) => active.hand.some((c) => c.id === id));
  const move = (zone: ZoneId) => send({ type: 'MOVE', zone });
  const moving = game.phase === 'turn.move';
  const acting = game.phase === 'turn.act';
  const inTurn = moving || acting || game.phase === 'turn.dilemma';

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
            reachable={moving ? legal.moveZones : []}
            onMove={move}
            inspectId={inspectId}
            onInspect={setInspectId}
          />

          <div className="panel flex flex-wrap items-center justify-between gap-2">
            {moving && (
              <>
                <p className="font-bold">Toque numa zona destacada para mover.</p>
                <div className="flex flex-wrap gap-2">
                  {legal.canDebug && (
                    <PressButton className="btn" onClick={() => setDebugOpen(true)}>
                      Debug do Algoritmo
                    </PressButton>
                  )}
                  <PressButton
                    className="btn btn-primary"
                    disabled={!legal.canSkipMove}
                    onClick={() => send({ type: 'SKIP_MOVE' })}
                  >
                    Ficar
                  </PressButton>
                </div>
              </>
            )}
            {acting && (
              <>
                <p className="font-bold">Escolha uma ação (só uma por turno).</p>
                <div className="flex flex-wrap gap-2">
                  <PressButton
                    className="btn btn-primary"
                    disabled={legal.confrontTargets.length === 0}
                    onClick={() => setConfrontOpen(true)}
                  >
                    Enfrentar
                  </PressButton>
                  <PressButton
                    className="btn"
                    disabled={!legal.canExplore}
                    onClick={() => send({ type: 'EXPLORE' })}
                  >
                    Explorar
                  </PressButton>
                  <PressButton
                    className="btn"
                    disabled={legal.supportTargets.length === 0}
                    onClick={() => setSupportOpen(true)}
                  >
                    Apoiar
                  </PressButton>
                  <PressButton
                    className="btn"
                    disabled={!legal.canRest}
                    onClick={() => send({ type: 'REST' })}
                  >
                    Descansar
                  </PressButton>
                  {legal.canDebug && (
                    <PressButton className="btn" onClick={() => setDebugOpen(true)}>
                      Debug do Algoritmo
                    </PressButton>
                  )}
                </div>
              </>
            )}
            {game.phase === 'algorithm' && (
              <AlgorithmPanel
                step={game.algoStep ?? 'event'}
                onNext={() => send({ type: 'ALGORITHM_NEXT' })}
              />
            )}
            {game.phase === 'ended' && (
              <PressButton className="btn btn-primary" onClick={onExit}>
                Voltar ao título
              </PressButton>
            )}
          </div>

          {inTurn && (
            <Hand
              player={active}
              config={game.config}
              selected={validSelected}
              onToggle={toggleCard}
            />
          )}
        </section>

        <aside className="order-3 flex flex-col gap-3">
          <ThreatInspector game={game} threatId={inspectId} onClose={() => setInspectId(null)} />
          <EventLog game={game} />
        </aside>
      </div>

      {confrontOpen && acting && (
        <ConfrontModal
          game={game}
          targets={legal.confrontTargets}
          initialCards={validSelected}
          onClose={() => setConfrontOpen(false)}
          onConfirm={(threatId, cardIds) => {
            send({ type: 'CONFRONT', threatId, cardIds });
            setConfrontOpen(false);
            setSelected([]);
          }}
        />
      )}

      {supportOpen && acting && (
        <SupportModal
          game={game}
          targets={legal.supportTargets}
          onClose={() => setSupportOpen(false)}
          onConfirm={(toPlayerId, cardIds) => {
            send({ type: 'SUPPORT', toPlayerId, cardIds });
            setSupportOpen(false);
            setSelected([]);
          }}
        />
      )}

      {debugOpen && legal.canDebug && (
        <DebugModal
          game={game}
          onClose={() => setDebugOpen(false)}
          onChoose={(swap) => {
            send({ type: 'DEBUG_REORDER', swap });
            setDebugOpen(false);
          }}
        />
      )}

      {game.phase === 'turn.dilemma' && game.pendingDilemma && (
        <DilemmaModal
          dilemma={game.pendingDilemma}
          playerName={active.name}
          onChoose={(option) => send({ type: 'CHOOSE_DILEMMA', option })}
        />
      )}
    </div>
  );
}
