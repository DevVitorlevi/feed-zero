import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface LightboxItem {
  id: string;
  image: string;
  alt: string;
  title: string;
  caption?: string;
}

interface LightboxAction {
  label: string;
  onClick: () => void;
}

interface Props {
  items: LightboxItem[];
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
  action?: (item: LightboxItem) => LightboxAction | null;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function CardLightbox({ items, index, onIndex, onClose, action }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const item = index !== null ? items[index] : undefined;
  const open = item !== undefined;
  const count = items.length;

  useEffect(() => {
    if (index !== null && !items[index]) onClose();
  }, [index, items, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('[data-close]')?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' && count > 1 && index !== null) {
        onIndex((index - 1 + count) % count);
      } else if (e.key === 'ArrowRight' && count > 1 && index !== null) {
        onIndex((index + 1) % count);
      } else if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open]);

  const act = item && action ? action(item) : null;

  return createPortal(
    <AnimatePresence>
      {item && index !== null && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Carta ampliada: ${item.title}`}
            className="flex max-h-full w-full max-w-md flex-col gap-3 rounded-[20px] border-[3px] border-ink bg-paper p-3"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-lg font-extrabold">{item.title}</h2>
              <button
                type="button"
                data-close
                className="btn grid min-w-[44px] place-items-center px-0"
                onClick={onClose}
                aria-label="Fechar carta ampliada"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="flex min-h-0 items-center justify-center gap-2">
              {count > 1 && (
                <button
                  type="button"
                  className="btn grid min-w-[44px] shrink-0 place-items-center px-0"
                  onClick={() => onIndex((index - 1 + count) % count)}
                  aria-label="Carta anterior"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
              )}
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={item.id}
                  src={item.image}
                  alt={item.alt}
                  width={600}
                  height={840}
                  className="max-h-[62vh] min-h-0 w-auto min-w-0 max-w-full rounded-[14px] border-[3px] border-ink bg-white object-contain"
                  style={{ aspectRatio: '5 / 7' }}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.14 }}
                />
              </AnimatePresence>
              {count > 1 && (
                <button
                  type="button"
                  className="btn grid min-w-[44px] shrink-0 place-items-center px-0"
                  onClick={() => onIndex((index + 1) % count)}
                  aria-label="Próxima carta"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              )}
            </div>

            {item.caption && <p className="text-center text-sm font-bold">{item.caption}</p>}
            {count > 1 && (
              <p className="text-center text-xs" aria-live="polite">
                Carta {index + 1} de {count}
              </p>
            )}
            {act && (
              <button type="button" className="btn btn-primary" onClick={act.onClick}>
                {act.label}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
