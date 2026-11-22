import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delta: number;
  tick: number;
  goodWhenUp: boolean;
  className?: string;
}

const GOOD = '#9BE7B8';
const BAD = '#F5A3A6';

export function FlashValue({ children, delta, tick, goodWhenUp, className }: Props) {
  if (delta === 0) {
    return <span className={className}>{children}</span>;
  }
  const good = goodWhenUp ? delta > 0 : delta < 0;
  const sign = delta > 0 ? '+' : '−';

  return (
    <span className="flex min-w-0 items-center gap-1">
      <motion.span
        key={`badge-${tick}`}
        aria-hidden="true"
        className="shrink-0 rounded-full border-2 border-ink px-1.5 text-sm font-extrabold text-ink"
        style={{ background: good ? GOOD : BAD }}
        initial={{ opacity: 1, scale: 1.4 }}
        animate={{ opacity: [1, 1, 0], scale: 1 }}
        transition={{ duration: 1.8, times: [0, 0.7, 1] }}
      >
        {sign}
        {Math.abs(delta)}
      </motion.span>
      <motion.span
        key={`value-${tick}`}
        className={`rounded px-1 ${className ?? ''}`}
        initial={{ scale: 1.3, backgroundColor: good ? GOOD : BAD }}
        animate={{ scale: 1, backgroundColor: 'rgba(255,255,255,0)' }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 20,
          backgroundColor: { duration: 1.2 },
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
