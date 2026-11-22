import { motion, type HTMLMotionProps } from 'framer-motion';

export function PressButton({ disabled, ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...props}
    />
  );
}
