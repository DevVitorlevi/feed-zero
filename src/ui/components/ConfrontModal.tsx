import { viewPlayer } from '../activePlayer';
import { Flame } from 'lucide-react';
import { useMemo, useState } from 'react';
import { previewConfront } from '../../engine/confront';
import type { GameState } from '../../engine/types';
import { threatStrength } from '../../engine/selectors';
import { THREAT_TYPE_LABEL, WEAKNESS_LABEL, ZONE_SHORT } from '../labels';
import { Modal } from './Modal';
import { PressButton } from './PressButton';

interface Props {
  game: GameState;
  targets: string[];
  initialCards: string[];
  onConfirm: (threatId: string, cardIds: string[]) => void;
  onClose: () => void;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 border-b-2 border-ink/20 py-1 ${strong ? 'text-lg font-extrabold' : ''}`}
    >
      <span>{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function ConfrontModal({ game, targets, initialCards, onConfirm, onClose }: Props) {
  const me = viewPlayer(game);
  const [threatId, setThreatId] = useState<string>(targets[0] ?? '');
  const [cardIds, setCardIds] = useState<string[]>(
    initialCards.slice(0, game.config.confront.maxCards),
  );

  const threat = game.threats.find((t) => t.card.id === threatId);
  const preview = useMemo(
    () => previewConfront(game, me.id, threatId, cardIds),
    [game, me.id, threatId, cardIds],
  );

  const toggle = (id: string) =>
    setCardIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev.slice(-(game.config.confront.maxCards - 1)), id],
    );

  const canConfirm = preview.allowed && cardIds.length >= game.config.confront.minCards;

  return (
    <Modal title="Enfrentar Ameaça" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {targets.length > 1 && (
          <fieldset>
            <legend className="mb-1 font-extrabold">1. Escolha a Ameaça</legend>
            <div className="flex flex-wrap gap-2">
              {targets.map((id) => {
                const t = game.threats.find((x) => x.card.id === id);
                if (!t) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={id === threatId}
                    onClick={() => setThreatId(id)}
                    className={`btn ${id === threatId ? 'btn-primary' : ''}`}
                  >
                    {t.card.name} ({ZONE_SHORT[t.zone]})
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {threat && (
          <div className="flex gap-3">
            <img
              src={threat.card.image}
              alt={`Ameaça: ${threat.card.name}`}
              width={600}
              height={840}
              className="w-28 shrink-0 rounded-[14px] border-[3px] border-ink bg-white sm:w-36"
              style={{ aspectRatio: '5 / 7' }}
            />
            <div className="flex flex-col gap-1">
              <p className="text-lg font-extrabold">{threat.card.name}</p>
              <p>
                {THREAT_TYPE_LABEL[threat.card.type]} · {ZONE_SHORT[threat.zone]}
              </p>
              <p>
                Força exigida:{' '}
                <strong>{threatStrength(game, threat.card.id) ?? threat.card.strength}</strong>{' '}
                (base {threat.card.strength})
              </p>
              <p>
                Fraqueza: <strong>{WEAKNESS_LABEL[threat.card.weakness]}</strong> (+
                {game.config.confront.weaknessBonus} se jogar essa carta)
              </p>
            </div>
          </div>
        )}

        <fieldset>
          <legend className="mb-1 font-extrabold">
            {targets.length > 1 ? '2' : '1'}. Escolha {game.config.confront.minCards} a{' '}
            {game.config.confront.maxCards} cartas da sua mão
          </legend>
          {me.hand.length === 0 ? (
            <p>Sem cartas na mão.</p>
          ) : (
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
          )}
        </fieldset>

        <section className="panel" aria-live="polite" aria-label="Pré-visualização do cálculo">
          <h3 className="mb-1 font-extrabold">Pré-visualização</h3>
          {cardIds.length === 0 ? (
            <p>Selecione ao menos uma carta para ver o cálculo.</p>
          ) : !preview.allowed ? (
            <p className="font-bold text-alert">{preview.reason ?? 'Jogada não permitida.'}</p>
          ) : (
            <>
              <Row label="Soma das cartas" value={`${preview.cardsTotal}`} />
              <Row label="Bônus de Fraqueza" value={signed(preview.weaknessBonus)} />
              <Row label="Bônus de habilidade" value={signed(preview.abilityBonus)} />
              <Row label="Seu total" value={`${preview.total}`} strong />
              <Row
                label={`Força exigida (zona ${signed(preview.zoneMod)})`}
                value={`${preview.required}`}
                strong
              />
              <p
                className="mt-2 rounded-[10px] border-[3px] border-ink px-3 py-2 text-center font-extrabold"
                style={{
                  background: preview.willSucceed ? '#19B5A5' : '#F7C331',
                  color: '#2B2B33',
                }}
              >
                {preview.willSucceed
                  ? `Elimina a Ameaça: +${preview.rewards.reputation} Reputação${
                      preview.rewards.integrity ? `, +${preview.rewards.integrity} Integridade` : ''
                    }`
                  : 'Não elimina: as cartas vão para o descarte'}
              </p>
              {preview.onPlay.integrity !== 0 && (
                <p className="mt-1">
                  Ao jogar: {signed(preview.onPlay.integrity)} Integridade (sucesso ou não).
                </p>
              )}
              {preview.usesShortcut && (
                <p
                  role="alert"
                  className="mt-2 flex items-start gap-2 rounded-[10px] border-[3px] border-ink px-3 py-2 font-bold text-white"
                  style={{ background: '#E5484D' }}
                >
                  <Flame size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Atalho: custa {preview.costs.integrity} Integridade e +{preview.costs.hate} Ódio
                    Viral, mesmo se falhar. Ignora a Fraqueza e a eliminação não conta para o bônus
                    ético.
                  </span>
                </p>
              )}
            </>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <PressButton
            className="btn btn-primary"
            style={preview.usesShortcut ? { background: '#E5484D', color: '#fff' } : undefined}
            disabled={!canConfirm}
            onClick={() => onConfirm(threatId, cardIds)}
          >
            {preview.usesShortcut
              ? `Confirmar (custa ${preview.costs.integrity} Integridade)`
              : 'Confirmar'}
          </PressButton>
        </div>
      </div>
    </Modal>
  );
}
