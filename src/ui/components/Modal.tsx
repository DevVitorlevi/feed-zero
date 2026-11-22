import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose?: () => void;
  headerBg?: string;
  headerFg?: string;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  onClose,
  headerBg = '#2F6FED',
  headerFg = '#FFFFFF',
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(43,43,51,0.6)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[20px] border-[3px] border-ink sm:max-w-3xl sm:rounded-[20px]"
        style={{ background: 'var(--paper)' }}
      >
        <div
          className="flex items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-2"
          style={{ background: headerBg, color: headerFg }}
        >
          <h2 className="text-lg font-extrabold">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="btn flex items-center justify-center px-2 text-ink"
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </motion.div>
    </div>
  );
}
