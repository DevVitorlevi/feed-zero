import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { memo } from 'react';
import type { ResponseCard } from '../../engine/types';

interface Props {
  card: ResponseCard;
  selected: boolean;
  onToggle: (id: string) => void;
  onZoom: (id: string) => void;
}

export const CardView = memo(function CardView({ card, selected, onToggle, onZoom }: Props) {
  return (
    <motion.div
      className="flex shrink-0 flex-col gap-1"
      animate={{ y: selected ? -14 : 0, scale: selected ? 1.04 : 1 }}
      whileHover={{ y: selected ? -14 : -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onToggle(card.id)}
        onDoubleClick={() => onZoom(card.id)}
        className="block rounded-[14px]"
        style={{
          outline: selected ? '4px solid var(--net)' : 'none',
          outlineOffset: 2,
        }}
      >
        <img
          src={card.image}
          alt={`${card.name}, valor ${card.value}`}
          width={600}
          height={840}
          draggable={false}
          className="w-24 rounded-[14px] border-[3px] border-ink bg-white sm:w-28 lg:w-32"
          style={{ aspectRatio: '5 / 7' }}
        />
      </button>
      <button
        type="button"
        className="btn flex items-center justify-center gap-1 px-1 text-sm"
        onClick={() => onZoom(card.id)}
        aria-label={`Ampliar ${card.name}`}
      >
        <ZoomIn size={16} aria-hidden="true" />
        Ampliar
      </button>
    </motion.div>
  );
});
