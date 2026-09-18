import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { fadeIn, scaleIn } from './motion';

/**
 * Accessible modal: portal, Esc/backdrop dismiss, focus trap-lite (returns
 * focus on close), scroll-lock, spring entrance from its trigger source.
 */
export default function Modal({ open, onClose, title, icon: Icon, children, footer, width = 560, dismissible = true }) {
  const panelRef = useRef(null);
  const lastActive = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onClose?.();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => panelRef.current?.querySelector('input, textarea, select, button')?.focus(), 30);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      lastActive.current?.focus?.();
    };
  }, [open, onClose, dismissible]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          variants={fadeIn} initial="hidden" animate="visible" exit="exit"
          onMouseDown={(e) => { if (dismissible && e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            ref={panelRef}
            className="modal"
            role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}
            style={{ maxWidth: width }}
            variants={scaleIn} initial="hidden" animate="visible" exit="exit"
          >
            {title && (
              <div className="modal-header">
                <h3 id="modal-title">
                  {Icon && <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icon size={17} /></span>}
                  {title}
                </h3>
                {dismissible && (
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close dialog"><X size={17} /></button>
                )}
              </div>
            )}
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
