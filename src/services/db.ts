import { Creation } from '../types';

const DB_NAME = 'nano_banana_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'creations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('views', 'views', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCreation(creation: Creation): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(creation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB, usando fallback:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('creations_backup') || '[]');
      const filtered = existing.filter((c: Creation) => c.id !== creation.id);
      filtered.unshift(creation);
      // Keep max 20 in localStorage fallback to avoid quota
      localStorage.setItem('creations_backup', JSON.stringify(filtered.slice(0, 20)));
    } catch (e) {
      console.error('Falha no fallback de storage', e);
    }
  }
}

export async function getAllCreations(): Promise<Creation[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items: Creation[] = req.result || [];
        // Sort by createdAt descending
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao ler do IndexedDB, usando fallback:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('creations_backup') || '[]');
      return existing;
    } catch {
      return [];
    }
  }
}

export async function deleteCreation(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao deletar do IndexedDB:', err);
    const existing = JSON.parse(localStorage.getItem('creations_backup') || '[]');
    localStorage.setItem('creations_backup', JSON.stringify(existing.filter((c: Creation) => c.id !== id)));
  }
}

export async function incrementCreationMetric(
  id: string,
  metric: 'views' | 'downloads' | 'likes'
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: Creation = getReq.result;
      if (item) {
        item[metric] = (item[metric] || 0) + 1;
        store.put(item);
      }
    };
  } catch (err) {
    console.warn('Erro ao atualizar métrica:', err);
  }
}

export async function toggleFavorite(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: Creation = getReq.result;
        if (item) {
          item.isFavorite = !item.isFavorite;
          store.put(item);
          resolve(item.isFavorite);
        } else {
          resolve(false);
        }
      };
      getReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
