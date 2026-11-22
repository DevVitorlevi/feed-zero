import { X, ZoomIn } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { threatStrength } from '../../engine/selectors';
import { zoneName } from '../../engine/zones';
import type { GameState } from '../../engine/types';
import { THREAT_TYPE_LABEL, WEAKNESS_LABEL } from '../labels';
import { CardLightbox, type LightboxItem } from './CardLightbox';

interface Props {
  game: GameState;
  threatId: string | null;
  onClose: () => void;
}

export function ThreatInspector({ game, threatId, onClose }: Props) {
  const [zoom, setZoom] = useState<number | null>(null);
  const t = threatId ? game.threats.find((x) => x.card.id === threatId) : undefined;
  const effective = t ? (threatStrength(game, t.card.id) ?? t.card.strength) : 0;

  const items = useMemo<LightboxItem[]>(
    () =>
      t
        ? [
            {
              id: t.card.id,
              image: t.card.image,
              alt: `${t.card.name}, Força ${t.card.strength}, Fraqueza ${WEAKNESS_LABEL[t.card.weakness]}`,
              title: t.card.name,
              caption: `Força ${effective} · Fraqueza: ${WEAKNESS_LABEL[t.card.weakness]} · ${zoneName(t.zone)}`,
            },
          ]
        : [],
    [t, effective],
  );
  const closeZoom = useCallback(() => setZoom(null), []);

  if (!t) {
    return (
      <section className="panel text-sm">
        Toque em uma Ameaça no tabuleiro para ver a carta, a Fraqueza e a Força efetiva.
      </section>
    );
  }

  return (
    <section className="panel flex flex-col gap-2" aria-label={`Ameaça ${t.card.name}`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-extrabold">{t.card.name}</h2>
        <button
          type="button"
          className="btn grid min-w-[44px] place-items-center px-0"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="relative mx-auto block w-full max-w-[220px] rounded-[14px]"
        onClick={() => setZoom(0)}
        aria-label={`Ampliar ${t.card.name}`}
      >
        <img
          src={t.card.image}
          alt={`${t.card.name}, Força ${t.card.strength}, Fraqueza ${WEAKNESS_LABEL[t.card.weakness]}`}
          width={600}
          height={840}
          className="w-full rounded-[14px] border-[3px] border-ink bg-white"
          style={{ aspectRatio: '5 / 7' }}
        />
        <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border-[3px] border-ink bg-white">
          <ZoomIn size={18} aria-hidden="true" />
        </span>
      </button>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-bold">Tipo</dt>
        <dd>{THREAT_TYPE_LABEL[t.card.type]}</dd>
        <dt className="font-bold">Zona</dt>
        <dd>{zoneName(t.zone)}</dd>
        <dt className="font-bold">Fraqueza</dt>
        <dd>{WEAKNESS_LABEL[t.card.weakness]}</dd>
        <dt className="font-bold">Força</dt>
        <dd>
          {effective}
          {effective !== t.card.strength && ` (base ${t.card.strength})`}
        </dd>
      </dl>

      <CardLightbox items={items} index={zoom} onIndex={setZoom} onClose={closeZoom} />
    </section>
  );
}
