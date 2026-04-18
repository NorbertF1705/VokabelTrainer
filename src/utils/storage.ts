/**
 * Persistent storage via IndexedDB with localStorage fallback.
 * IndexedDB is significantly more reliable on iOS Safari / PWAs than localStorage.
 */

const DB_NAME = 'vokabeltrainer_db';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

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
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB is unavailable
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
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
