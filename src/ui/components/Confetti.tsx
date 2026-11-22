import { motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#F7C331', '#2F6FED', '#19B5A5', '#E5484D', '#7B4FD6'];
const PIECES = 44;

const pieces = Array.from({ length: PIECES }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  delay: (i % 11) * 0.12,
  duration: 2.8 + (i % 5) * 0.45,
  size: 8 + (i % 3) * 4,
  spin: (i % 2 === 0 ? 1 : -1) * (360 + (i % 4) * 120),
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}));

export function Confetti() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 border-2 border-ink"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
          initial={{ y: '-8vh', rotate: 0, opacity: 1 }}
          animate={{ y: '108vh', rotate: p.spin, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', times: [0, 0.85, 1] }}
        />
      ))}
    </div>
  );
}
