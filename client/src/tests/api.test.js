import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as api from '../services/api';

vi.mock('../services/storage', () => ({
  loadFromStorage: vi.fn(),
  saveToStorage: vi.fn(),
  loadFromStorageAsync: vi.fn().mockResolvedValue(null),
}));

describe('api service', () => {
  beforeEach(() => {
    api.initializeServerState({ lists: [], cards: [] });
  });

  describe('initializeServerState', () => {
    it('should initialize with empty state', () => {
      api.initializeServerState({ lists: [], cards: [] });
      // No error thrown means success
      expect(true).toBe(true);
    });
  });

  describe('getServerState', () => {
    it('should return server state', async () => {
      api.initializeServerState({ lists: [], cards: [] });
      const state = await api.getServerState();
      expect(state).toHaveProperty('lists');
      expect(state).toHaveProperty('cards');
    });
  });

  describe('createList', () => {
    it('should create a new list', async () => {
      const list = { id: 'list-1', title: 'New List' };
      const result = await api.createList(list);
      expect(result.id).toBe(list.id);
    });
  });

  describe('createCard', () => {
    it('should create a new card', async () => {
      const card = { id: 'card-1', listId: 'list-1', title: 'New Card' };
      const result = await api.createCard(card);
      expect(result.id).toBe(card.id);
    });
  });

  describe('checkForConflicts', () => {
    it('should detect no conflict when versions match', () => {
      const local = { id: '1', title: 'Same', version: 1, lastModifiedAt: '2024-01-01' };
      const server = { id: '1', title: 'Same', version: 1, lastModifiedAt: '2024-01-01' };

      expect(api.checkForConflicts(local, server)).toBeNull();
    });

    it('should detect conflict when server is newer', () => {
      const local = { id: '1', title: 'Local', version: 1, lastModifiedAt: '2024-01-01' };
      const server = { id: '1', title: 'Server', version: 2, lastModifiedAt: '2024-01-02' };

      const conflict = api.checkForConflicts(local, server);
      expect(conflict).not.toBeNull();
    });
  });

  describe('syncChanges', () => {
    it('should process empty sync queue', async () => {
      const result = await api.syncChanges([]);
      expect(result).toHaveProperty('results');
    });

    it('should handle create list changes', async () => {
      const changes = [
        { id: 'change-1', type: 'CREATE_LIST', data: { id: 'list-1', title: 'New' } },
      ];
      const result = await api.syncChanges(changes);
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('threeWayMerge', () => {
    it('should be a function', () => {
      expect(typeof api.threeWayMerge).toBe('function');
    });
  });
});
