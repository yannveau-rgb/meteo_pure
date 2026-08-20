import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalA11yOptions {
  /** Set false for a modal that must be dismissed via its own buttons (no backdrop/Escape shortcut). */
  closeOnEscape?: boolean;
}

/**
 * Turns a modal's content box into a real dialog for keyboard and
 * screen-reader users: traps Tab navigation inside it, closes on Escape,
 * and returns focus to whatever triggered it on close. None of the app's
 * modals had any of this — Tab could walk straight through into the page
 * behind a modal that visually covered it, and there was no way to close
 * one without a mouse.
 *
 * Returns a ref to attach to the modal's outermost focusable container
 * (the glass-premium box, not the backdrop). That element also needs
 * `role="dialog"` and `aria-modal="true"` in the JSX — kept explicit there
 * rather than injected here, so each caller's aria-label/aria-labelledby
 * stays visible at the call site.
 */
export function useModalA11y(
  isOpen: boolean,
  onClose: () => void,
  { closeOnEscape = true }: ModalA11yOptions = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement;

    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? container)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null);
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
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, closeOnEscape]);

  return containerRef;
}
