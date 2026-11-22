import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface Props {
  value: number;
  max: number;
}

function cellColor(index: number): string {
  if (index < 4) return '#F7C331';
  if (index < 8) return '#F28B30';
  return '#E5484D';
}

export function HateMeter({ value, max }: Props) {
  const danger = value >= 9;
  return (
    <section className="panel">
      <div className="flex items-center justify-between font-bold">
        <span className="flex items-center gap-1">
          <Flame size={18} aria-hidden="true" /> Ódio Viral
        </span>
        <span>
          {value}/{max}
          {danger && ' · Perigo!'}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Ódio Viral"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="mt-2 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: max }, (_, i) => (
          <motion.span
            key={i}
            className="h-5 rounded-sm border-2 border-ink"
            animate={{ backgroundColor: i < value ? cellColor(i) : '#FFFFFF' }}
            transition={{ duration: 0.25, delay: i < value ? i * 0.03 : 0 }}
          />
        ))}
      </div>
    </section>
  );
}
