// ============================================================================
// PROJECT PERSISTENCE — IndexedDB document store + localStorage preferences
// ============================================================================
//
// Local-first persistence:
//   - IndexedDB  → project documents (one record per project, keyed by id)
//   - localStorage → small prefs only (last active project reference)

import type { LikharaProject } from '../core';

const DB_NAME = 'likhara_studio';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

export const ACTIVE_PROJECT_PREF_KEY = 'likhara_active_project';

export type SaveResult = { ok: true } | { ok: false; error: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const store = db.createObjectStore(PROJECTS_STORE, {
          keyPath: 'id',
        });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error || new Error('Failed to open the project database.')
      );
    request.onblocked = () =>
      reject(
        new Error(
          'Project database is blocked by another open Likhara tab. Close it and retry.'
        )
      );
  });
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'name' in err) {
    const name = String((err as { name: unknown }).name);
    if (name === 'QuotaExceededError')
      return 'Storage quota exceeded — free up space or export a backup of your projects.';
    return `Storage write failed (${name}).`;
  }
  return 'Unknown storage failure.';
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('IndexedDB request failed.'));
  });
}

/** Resolves only after the transaction has durably committed. */
function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () =>
      reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function listProjects(): Promise<LikharaProject[]> {
  try {
    const db = await openDb();
    try {
      const store = db
        .transaction(PROJECTS_STORE, 'readonly')
        .objectStore(PROJECTS_STORE);
      const all = await requestToPromise(store.getAll() as IDBRequest);
      return (all as LikharaProject[]).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      );
    } finally {
      db.close();
    }
  } catch (err) {
    throw new Error(describeError(err));
  }
}

export async function getProject(id: string): Promise<LikharaProject | null> {
  try {
    const db = await openDb();
    try {
      const store = db
        .transaction(PROJECTS_STORE, 'readonly')
        .objectStore(PROJECTS_STORE);
      const found = await requestToPromise(
        store.get(id) as IDBRequest<LikharaProject | undefined>
      );
      return found ?? null;
    } finally {
      db.close();
    }
  } catch (err) {
    throw new Error(describeError(err));
  }
}

/** Persists one project document, scoped strictly by its own id. */
export async function saveProjectRecord(
  project: LikharaProject
): Promise<SaveResult> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(PROJECTS_STORE, 'readwrite');
      tx.objectStore(PROJECTS_STORE).put(project);
      await txDone(tx);
      return { ok: true };
    } finally {
      db.close();
    }
  } catch (err) {
    return { ok: false, error: describeError(err) };
  }
}

export async function deleteProjectRecord(id: string): Promise<SaveResult> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(PROJECTS_STORE, 'readwrite');
      tx.objectStore(PROJECTS_STORE).delete(id);
      await txDone(tx);
      return { ok: true };
    } finally {
      db.close();
    }
  } catch (err) {
    return { ok: false, error: describeError(err) };
  }
}

// ---- localStorage preferences (small values only) --------------------------

export function getActiveProjectId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_PROJECT_PREF_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string | null): void {
  try {
    if (id === null) window.localStorage.removeItem(ACTIVE_PROJECT_PREF_KEY);
    else window.localStorage.setItem(ACTIVE_PROJECT_PREF_KEY, id);
  } catch {
    // Preferences are non-critical; project data must never depend on this.
  }
}
