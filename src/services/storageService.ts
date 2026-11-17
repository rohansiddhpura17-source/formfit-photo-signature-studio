import type { HistoryRecord, Preset, Settings } from '../types';

const DB_NAME = 'formfit-studio';
const DB_VERSION = 1;
const STORES = ['kv', 'presets', 'history'] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;
let memoryFallback = false;

function openDB(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('history')) db.createObjectStore('history', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open local database'));
    });
  }
  return dbPromise;
}

async function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = action(tx.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed'));
  });
}

function lsKey(store: StoreName) {
  return `formfit:${store}`;
}

function readFallback<T>(store: StoreName): T[] {
  try {
    const raw = localStorage.getItem(lsKey(store));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeFallback<T>(store: StoreName, rows: T[]) {
  try {
    localStorage.setItem(lsKey(store), JSON.stringify(rows));
  } catch {
    memoryFallback = true;
  }
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  try {
    return await withStore<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
  } catch {
    return readFallback<T>(store);
  }
}

export async function dbPut<T>(store: StoreName, value: T): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => s.put(value));
  } catch {
    const rows = readFallback<T>(store);
    const incoming = value as { key?: string; id?: string };
    const filtered = rows.filter((row) => {
      const existing = row as { key?: string; id?: string };
      return incoming.key ? existing.key !== incoming.key : existing.id !== incoming.id;
    });
    writeFallback(store, [...filtered, value]);
  }
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => s.delete(key));
  } catch {
    const rows = readFallback<Record<string, unknown>>(store).filter(
      (row) => row.id !== key && row.key !== key,
    );
    writeFallback(store, rows);
  }
}

export async function dbClear(store: StoreName): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => s.clear());
  } catch {
    writeFallback(store, []);
  }
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: 'light',
  density: 'comfortable',
  defaultFormat: 'image/jpeg',
  defaultCompressionMode: 'auto',
  safetyMarginKB: 2,
  defaultPhotoPresetId: 'ibps-po-mt-2025',
  confirmBeforeDelete: true,
  reduceMotion: false,
};

export async function loadSettings(): Promise<Settings> {
  const rows = await dbGetAll<{ key: string; value: Settings }>('kv');
  const saved = rows.find((row) => row.key === 'settings')?.value;
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await dbPut('kv', { key: 'settings', value: settings });
}

export async function loadCustomPresets(): Promise<Preset[]> {
  return dbGetAll<Preset>('presets');
}

export async function saveCustomPreset(preset: Preset): Promise<void> {
  await dbPut('presets', preset);
}

export async function deleteCustomPreset(id: string): Promise<void> {
  await dbDelete('presets', id);
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  const rows = await dbGetAll<HistoryRecord>('history');
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function addHistory(record: HistoryRecord): Promise<void> {
  await dbPut('history', record);
  const all = await loadHistory();
  // Keep local metadata bounded; never store image data.
  for (const old of all.slice(120)) await dbDelete('history', old.id);
}

export async function deleteHistory(id: string): Promise<void> {
  await dbDelete('history', id);
}

export async function clearHistory(): Promise<void> {
  await dbClear('history');
}

export async function clearAllLocalData(): Promise<void> {
  await Promise.all([dbClear('history'), dbClear('presets'), dbClear('kv')]);
  try {
    localStorage.removeItem(lsKey('history'));
    localStorage.removeItem(lsKey('presets'));
    localStorage.removeItem(lsKey('kv'));
  } catch {
    /* ignore */
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function isStorageFallback(): boolean {
  return memoryFallback;
}
