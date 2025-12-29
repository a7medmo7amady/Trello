const DB_NAME = 'kanban-board-db';
const DB_VERSION = 1;
const STORE_NAME = 'board-data';

let db = null;

export const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

const saveToIndexedDB = async (key, data) => {
  const database = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ key, data, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const loadFromIndexedDB = async (key) => {
  try {
    const database = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
};

export const saveToStorage = (key, data) => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);

    saveToIndexedDB(key, data).catch(() => { });
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Saving to IndexedDB instead.');
      saveToIndexedDB(key, data).catch(() => { });
    }
  }
};

export const loadFromStorage = (key) => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized) {
      return JSON.parse(serialized);
    }
    return null;
  } catch {
    return null;
  }
};

export const loadFromStorageAsync = async (key) => {
  try {
    const indexedDBData = await loadFromIndexedDB(key);
    if (indexedDBData) {
      return indexedDBData;
    }
    return loadFromStorage(key);
  } catch {
    return loadFromStorage(key);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);

    initIndexedDB()
      .then((database) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key);
      })
      .catch(() => { });
  } catch {
    // ignore
  }
};

export const clearStorage = () => {
  try {
    localStorage.clear();

    initIndexedDB()
      .then((database) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
      })
      .catch(() => { });
  } catch {
    // ignore
  }
};

export const getStorageInfo = () => {
  let localStorageUsed = 0;

  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        localStorageUsed += localStorage.getItem(key).length * 2;
      }
    }
  } catch {
    // ignore
  }

  return {
    localStorageUsed,
    localStorageUsedMB: (localStorageUsed / (1024 * 1024)).toFixed(2),
    localStorageLimit: '5-10 MB (varies by browser)',
  };
};

export default {
  saveToStorage,
  loadFromStorage,
  loadFromStorageAsync,
  removeFromStorage,
  clearStorage,
  getStorageInfo,
  initIndexedDB,
};