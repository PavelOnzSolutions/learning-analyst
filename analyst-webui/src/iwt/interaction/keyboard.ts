import type { Intent } from './keyboard-routing';

export type KeyboardHandlers = Record<Intent, () => void>;

const TYPABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTypableTarget(el: Element | null): boolean {
  if (!el) return false;
  if (TYPABLE_TAGS.has(el.tagName)) return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  if (el.closest('.iwt-overlay, .iwt-page')) return true;
  return false;
}

function keyToIntent(e: KeyboardEvent): Intent | null {
  switch (e.key) {
    case 'ArrowLeft':  return 'focusPrev';
    case 'ArrowRight': return 'focusNext';
    case 'ArrowUp':    return 'collapse';
    case 'ArrowDown':  return 'drill';
    case 'Enter':
    case ' ':
    case 'Spacebar':   return 'activate';
    case 'Escape':
    case 'Esc':        return 'reset';
    default:           return null;
  }
}

const REPEAT_GUARDED: ReadonlySet<Intent> = new Set(['drill', 'activate', 'expand', 'collapse', 'reset']);

export function attachKeyboard(target: Document, handlers: KeyboardHandlers): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const intent = keyToIntent(e);
    if (!intent) return;

    // Escape always reaches the keyboard layer so it can close overlays;
    // every other intent is suppressed inside text inputs / overlay DOM.
    if (intent !== 'reset' && isTypableTarget(document.activeElement)) return;

    if (e.repeat && REPEAT_GUARDED.has(intent)) return;

    e.preventDefault();
    handlers[intent]();
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
