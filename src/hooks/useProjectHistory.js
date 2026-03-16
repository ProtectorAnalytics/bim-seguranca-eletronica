import { useRef, useCallback, useEffect } from 'react';
import { createStore, get, set, del } from 'idb-keyval';

// Dedicated IndexedDB store for undo/redo history
const historyStore = createStore('bim-history', 'snapshots');

const MAX_SNAPSHOTS = 50;
const MAX_BYTES = 50 * 1024 * 1024; // 50MB cap for history store
const PAST_KEY = 'history_past';
const FUTURE_KEY = 'history_future';

/**
 * useProjectHistory — Persistent undo/redo with IndexedDB
 *
 * Replaces the in-memory useRef({past,future}) approach.
 * Snapshots survive page reload and browser close.
 * Uses idb-keyval for simple async key-value storage.
 *
 * Usage:
 *   const { pushSnapshot, undo, redo, clearHistory } = useProjectHistory(setProject);
 */
export function useProjectHistory(_setProject) {
  // In-memory cache (synced to/from IndexedDB)
  const past = useRef([]);
  const future = useRef([]);
  const skipNext = useRef(false);
  const loaded = useRef(false);

  // Load history from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const [p, f] = await Promise.all([
          get(PAST_KEY, historyStore),
          get(FUTURE_KEY, historyStore),
        ]);
        if (Array.isArray(p)) past.current = p;
        if (Array.isArray(f)) future.current = f;
        loaded.current = true;
      } catch (e) {
        console.warn('[history] Failed to load from IndexedDB', e);
        loaded.current = true;
      }
    })();
  }, []);

  // Persist to IndexedDB (debounced — only after push/undo/redo)
  const persistAsync = useCallback(() => {
    try {
      set(PAST_KEY, past.current.slice(), historyStore).catch(() => {});
      set(FUTURE_KEY, future.current.slice(), historyStore).catch(() => {});
    } catch (_e) {
      // IndexedDB unavailable — fallback to in-memory only
    }
  }, []);

  // Push a snapshot before a change
  const pushSnapshot = useCallback((prevProject) => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    try {
      const snap = JSON.stringify(prevProject);
      past.current.push(snap);
      if (past.current.length > MAX_SNAPSHOTS) past.current.shift();

      // Prune oldest snapshots if total size exceeds cap
      let totalBytes = past.current.reduce((sum, s) => sum + s.length * 2, 0)
        + future.current.reduce((sum, s) => sum + s.length * 2, 0);
      while (totalBytes > MAX_BYTES && past.current.length > 1) {
        const removed = past.current.shift();
        totalBytes -= removed.length * 2;
      }

      future.current = [];
      persistAsync();
    } catch (e) {
      console.warn('[history] Snapshot failed', e);
    }
  }, [persistAsync]);

  // Undo
  const undo = useCallback(() => {
    try {
      if (!past.current.length) return;
      _setProject(prev => {
        future.current.push(JSON.stringify(prev));
        const restored = JSON.parse(past.current.pop());
        skipNext.current = true;
        persistAsync();
        return restored;
      });
    } catch (e) {
      console.error('[history] Undo error', e);
    }
  }, [_setProject, persistAsync]);

  // Redo
  const redo = useCallback(() => {
    try {
      if (!future.current.length) return;
      _setProject(prev => {
        past.current.push(JSON.stringify(prev));
        const restored = JSON.parse(future.current.pop());
        skipNext.current = true;
        persistAsync();
        return restored;
      });
    } catch (e) {
      console.error('[history] Redo error', e);
    }
  }, [_setProject, persistAsync]);

  // Clear all history (e.g., when switching projects)
  const clearHistory = useCallback(() => {
    past.current = [];
    future.current = [];
    del(PAST_KEY, historyStore).catch(() => {});
    del(FUTURE_KEY, historyStore).catch(() => {});
  }, []);

  return { pushSnapshot, undo, redo, clearHistory, skipNext };
}
