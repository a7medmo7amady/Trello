import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

import {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearStorage,
  getStorageInfo,
} from '../services/storage';

describe('storage service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('saveToStorage', () => {
    it('should save data to localStorage', () => {
      const data = { test: 'value' };
      saveToStorage('test-key', data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(data)
      );
    });

    it('should handle complex data structures', () => {
      const data = {
        lists: [{ id: '1', title: 'List' }],
        cards: [{ id: '1', title: 'Card' }],
      };
      saveToStorage('board', data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'board',
        JSON.stringify(data)
      );
    });
  });

  describe('loadFromStorage', () => {
    it('should load data from localStorage', () => {
      const data = { test: 'value' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));

      const loaded = loadFromStorage('test-key');
      expect(loaded).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      const loaded = loadFromStorage('nonexistent');
      expect(loaded).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('not-json{');
      const loaded = loadFromStorage('invalid');
      expect(loaded).toBeNull();
    });
  });

  describe('removeFromStorage', () => {
    it('should remove item from localStorage', () => {
      removeFromStorage('to-remove');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('to-remove');
    });
  });

  describe('clearStorage', () => {
    it('should clear all localStorage items', () => {
      clearStorage();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage usage info', () => {
      const info = getStorageInfo();

      expect(info).toHaveProperty('localStorageUsed');
      expect(info).toHaveProperty('localStorageUsedMB');
      expect(info).toHaveProperty('localStorageLimit');
    });
  });
});
