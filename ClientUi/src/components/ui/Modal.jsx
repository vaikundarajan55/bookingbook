import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

/**
 * Animated modal: blurred backdrop + a panel that tilts up out of depth (3D spring).
 * Closes on Esc and backdrop click, locks body scroll, returns focus to the panel.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-ocean-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <div className="relative w-full" style={{ perspective: 1200 }}>
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={`relative mx-auto flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-glass outline-none sm:rounded-3xl ${SIZES[size]}`}
              initial={{ opacity: 0, y: 60, rotateX: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, rotateX: -6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{ transformOrigin: 'bottom center' }}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-ocean-500 via-brass to-ocean-500" />
              <header className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
                <h2 className="text-2xl font-semibold text-ocean">{title}</h2>
                <button onClick={onClose} className="rounded-full p-2 text-ink/50 transition hover:bg-ocean/5 hover:text-ocean" aria-label="Close dialog">
                  <X size={20} />
                </button>
              </header>
              <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
              {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ocean/10 bg-mist/60 px-6 py-4">{footer}</footer>}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
