import { useCallback, useMemo, useState } from 'react';
import type { GameConfig, PlayerState } from '../../engine/types';
import { cardCaption } from '../labels';
import { CardLightbox, type LightboxItem } from './CardLightbox';
import { CardView } from './CardView';

interface Props {
  player: PlayerState;
  config: GameConfig;
  selected: string[];
  onToggle: (id: string) => void;
}

export function Hand({ player, config, selected, onToggle }: Props) {
  const cards = player.hand;
  const [zoom, setZoom] = useState<number | null>(null);

  const items = useMemo<LightboxItem[]>(
    () =>
      cards.map((c) => ({
        id: c.id,
        image: c.image,
        alt: `${c.name}, valor ${c.value}`,
        title: c.name,
        caption: cardCaption(c, config),
      })),
    [cards, config],
  );

  const openZoom = useCallback(
    (id: string) => {
      const i = cards.findIndex((c) => c.id === id);
      if (i >= 0) setZoom(i);
    },
    [cards],
  );
  const closeZoom = useCallback(() => setZoom(null), []);

  return (
    <section className="panel" aria-label={`Mão de ${player.name}`}>
      <h2 className="mb-2 font-extrabold">
        Mão de {player.name} ({cards.length}/{config.limits.handMax})
      </h2>
      {cards.length === 0 ? (
        <p>Sem cartas na mão.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-1 pb-2 pt-4">
          {cards.map((c) => (
            <CardView
              key={c.id}
              card={c}
              selected={selected.includes(c.id)}
              onToggle={onToggle}
              onZoom={openZoom}
            />
          ))}
        </div>
      )}

      <CardLightbox
        items={items}
        index={zoom}
        onIndex={setZoom}
        onClose={closeZoom}
        action={(item) =>
          selected.includes(item.id)
            ? { label: 'Tirar da seleção', onClick: () => onToggle(item.id) }
            : { label: 'Selecionar carta', onClick: () => onToggle(item.id) }
        }
      />
    </section>
  );
}
