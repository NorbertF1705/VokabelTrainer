/**
 * Persistent storage via IndexedDB with localStorage fallback.
 * IndexedDB is significantly more reliable on iOS Safari / PWAs than localStorage.
 *
 * Every write also maintains a synchronous localStorage backup (_backup suffix).
 * On read, if IndexedDB returns null (e.g. after iOS eviction during a SW update),
 * the backup is used as a last resort before accepting default state.
 */

const DB_NAME = 'vokabeltrainer_db';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;
const BACKUP_SUFFIX = '_backup';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

export async function storageGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    const result = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    if (result !== null) return result;
    // IDB returned null (data evicted by iOS) → try localStorage backup
    try {
      return localStorage.getItem(key + BACKUP_SUFFIX);
    } catch {
      return null;
    }
  } catch {
    // IDB unavailable → fall back to localStorage (primary key, then backup)
    try {
      return localStorage.getItem(key) ?? localStorage.getItem(key + BACKUP_SUFFIX);
    } catch {
      return null;
    }
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  // Synchronous localStorage backup first — survives SW-triggered page reloads
  // and iOS IndexedDB eviction events
  try {
    localStorage.setItem(key + BACKUP_SUFFIX, value);
  } catch {
    // ignore quota errors
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage primary key if IDB unavailable
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore write errors (e.g. private browsing quota)
    }
  }
}

/**
 * One-time migration: reads a key from localStorage, writes it to IndexedDB,
 * then removes it from localStorage. Safe to call multiple times.
 */
export async function migrateFromLocalStorage(key: string): Promise<void> {
  try {
    const existing = await storageGet(key);
    if (existing !== null) return; // already migrated

    const raw = localStorage.getItem(key);
    if (raw !== null) {
      await storageSet(key, raw);
      localStorage.removeItem(key);
    }
  } catch {
    // Migration failure is non-fatal
  }
}
