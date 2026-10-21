import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_FLAG = 'meteo_pure_chunk_reload';

/**
 * `React.lazy` that survives a deployment.
 *
 * Code-split chunks carry a content hash. A tab (or a document served from the
 * Service Worker cache while offline / on a slow network) that still runs the
 * previous build asks for chunk names the new deployment no longer serves: the
 * dynamic import rejects and the whole tree behind the Suspense boundary dies.
 *
 * One retry covers a transient network blip; if that fails too, reload once
 * so the fresh index.html (and its matching chunks) takes over. The session
 * flag prevents a reload loop when the failure is genuine (truly offline).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> & { preload: () => Promise<unknown> } {
  let pending: Promise<{ default: T }> | null = null;

  const load = (): Promise<{ default: T }> => {
    if (!pending) {
      pending = factory()
        .catch(() => new Promise<{ default: T }>((r) => setTimeout(r, 400)).then(factory))
        .then((mod) => {
          try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* storage optional */ }
          return mod;
        })
        .catch((err) => {
          pending = null;
          let alreadyReloaded = false;
          try { alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1'; } catch { /* ignore */ }
          if (!alreadyReloaded && navigator.onLine !== false) {
            try { sessionStorage.setItem(RELOAD_FLAG, '1'); } catch { /* ignore */ }
            window.location.reload();
          }
          throw err;
        });
    }
    return pending;
  };

  const Component = lazy(load) as LazyExoticComponent<T> & { preload: () => Promise<unknown> };
  // Lets callers warm a chunk ahead of need (idle time, hover, etc.).
  Component.preload = () => load().catch(() => undefined);
  return Component;
}

/**
 * Runs `cb` when the main thread is idle (falls back to a timeout on Safari,
 * which still lacks requestIdleCallback). Returns a cancel function.
 */
export function whenIdle(cb: () => void, timeout = 2500): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 1200);
  return () => window.clearTimeout(id);
}
