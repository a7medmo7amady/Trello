/**
 * Storage Service
 *
 * Handles persistence to localStorage with IndexedDB fallback.
 * Provides offline storage capabilities for the Kanban board.
 */

const DB_NAME = 'kanban-board-db';
const DB_VERSION = 1;
const STORE_NAME = 'board-data';

let db = null;

/**
 * Initialize IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
export const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available, falling back to localStorage');
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

/**
 * Save data to IndexedDB
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @returns {Promise<void>}
 */
const saveToIndexedDB = async (key, data) => {
  try {
    const database = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, data, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB save failed:', error);
    throw error;
  }
};

/**
 * Load data from IndexedDB
 * @param {string} key - Storage key
 * @returns {Promise<any>}
 */
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
  } catch (error) {
    console.warn('IndexedDB load failed:', error);
    return null;
  }
};

/**
 * Save data to localStorage (synchronous fallback)
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
export const saveToStorage = (key, data) => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);

    // Also try to save to IndexedDB in background
    saveToIndexedDB(key, data).catch(() => {
      // Silently fail, localStorage is our fallback
    });
  } catch (error) {
    console.error('Failed to save to storage:', error);

    // Try IndexedDB as fallback for larger data
    if (error.name === 'QuotaExceededError') {
      saveToIndexedDB(key, data).catch((dbError) => {
        console.error('IndexedDB fallback also failed:', dbError);
      });
    }
  }
};

/**
 * Load data from localStorage (synchronous)
 * @param {string} key - Storage key
 * @returns {any} Parsed data or null
 */
export const loadFromStorage = (key) => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized) {
      return JSON.parse(serialized);
    }
    return null;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return null;
  }
};

/**
 * Load data from storage (async version that checks IndexedDB first)
 * @param {string} key - Storage key
 * @returns {Promise<any>}
 */
export const loadFromStorageAsync = async (key) => {
  try {
    // Try IndexedDB first
    const indexedDBData = await loadFromIndexedDB(key);
    if (indexedDBData) {
      return indexedDBData;
    }

    // Fall back to localStorage
    return loadFromStorage(key);
  } catch (error) {
    console.error('Failed to load from storage async:', error);
    return loadFromStorage(key);
  }
};

/**
 * Remove data from storage
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);

    // Also remove from IndexedDB
    initIndexedDB()
      .then((database) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key);
      })
      .catch(() => {
        // Silently fail
      });
  } catch (error) {
    console.error('Failed to remove from storage:', error);
  }
};

/**
 * Clear all storage
 */
export const clearStorage = () => {
  try {
    localStorage.clear();

    initIndexedDB()
      .then((database) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
      })
      .catch(() => {
        // Silently fail
      });
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};

/**
 * Get storage usage info
 * @returns {Object} Storage usage statistics
 */
export const getStorageInfo = () => {
  let localStorageUsed = 0;

  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        localStorageUsed += localStorage.getItem(key).length * 2; // UTF-16
      }
    }
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
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
