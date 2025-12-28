import { describe, it, expect, beforeEach } from 'vitest';
import { boardReducer, initialState, ACTIONS } from '../context/boardReducer';

describe('boardReducer', () => {
  let state;

  beforeEach(() => {
    state = { ...initialState };
  });

  describe('List Actions', () => {
    it('should add a new list', () => {
      const action = { type: ACTIONS.ADD_LIST, payload: { title: 'New List' } };
      const newState = boardReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.lists[0].title).toBe('New List');
      expect(newState.lists[0].archived).toBe(false);
      expect(newState.syncQueue).toHaveLength(1);
      expect(newState.syncQueue[0].type).toBe('CREATE_LIST');
    });

    it('should rename a list', () => {
      state.lists = [{ id: 'list-1', title: 'Old Title', version: 1 }];
      const action = { type: ACTIONS.RENAME_LIST, payload: { listId: 'list-1', title: 'New Title' } };
      const newState = boardReducer(state, action);

      expect(newState.lists[0].title).toBe('New Title');
      expect(newState.lists[0].version).toBe(2);
    });

    it('should archive a list', () => {
      state.lists = [{ id: 'list-1', title: 'Test', archived: false, version: 1 }];
      const action = { type: ACTIONS.ARCHIVE_LIST, payload: { listId: 'list-1' } };
      const newState = boardReducer(state, action);

      expect(newState.lists[0].archived).toBe(true);
    });

    it('should restore a list', () => {
      state.lists = [{ id: 'list-1', title: 'Test', archived: true, version: 1 }];
      const action = { type: ACTIONS.RESTORE_LIST, payload: { listId: 'list-1' } };
      const newState = boardReducer(state, action);

      expect(newState.lists[0].archived).toBe(false);
    });
  });

  describe('Card Actions', () => {
    beforeEach(() => {
      state.lists = [{ id: 'list-1', title: 'Test List' }];
    });

    it('should add a new card', () => {
      const action = { type: ACTIONS.ADD_CARD, payload: { listId: 'list-1', title: 'New Card' } };
      const newState = boardReducer(state, action);

      expect(newState.cards).toHaveLength(1);
      expect(newState.cards[0].title).toBe('New Card');
      expect(newState.cards[0].listId).toBe('list-1');
      expect(newState.syncQueue[0].type).toBe('CREATE_CARD');
    });

    it('should update a card', () => {
      state.cards = [{ id: 'card-1', listId: 'list-1', title: 'Old', version: 1 }];
      const action = {
        type: ACTIONS.UPDATE_CARD,
        payload: { cardId: 'card-1', updates: { title: 'Updated', description: 'Desc' } },
      };
      const newState = boardReducer(state, action);

      expect(newState.cards[0].title).toBe('Updated');
      expect(newState.cards[0].description).toBe('Desc');
      expect(newState.cards[0].version).toBe(2);
    });

    it('should delete a card', () => {
      state.cards = [{ id: 'card-1', listId: 'list-1', title: 'Test' }];
      const action = { type: ACTIONS.DELETE_CARD, payload: { cardId: 'card-1' } };
      const newState = boardReducer(state, action);

      expect(newState.cards).toHaveLength(0);
    });

    it('should move a card between lists', () => {
      state.lists = [
        { id: 'list-1', title: 'List 1' },
        { id: 'list-2', title: 'List 2' },
      ];
      state.cards = [{ id: 'card-1', listId: 'list-1', title: 'Test', version: 1 }];

      const action = {
        type: ACTIONS.MOVE_CARD,
        payload: { cardId: 'card-1', sourceListId: 'list-1', targetListId: 'list-2', targetIndex: 0 },
      };
      const newState = boardReducer(state, action);

      expect(newState.cards[0].listId).toBe('list-2');
    });
  });

  describe('Bulk Actions', () => {
    it('should set board state', () => {
      const lists = [{ id: 'list-1', title: 'Test' }];
      const cards = [{ id: 'card-1', listId: 'list-1', title: 'Card' }];
      const action = { type: ACTIONS.SET_BOARD, payload: { lists, cards } };
      const newState = boardReducer(state, action);

      expect(newState.lists).toEqual(lists);
      expect(newState.cards).toEqual(cards);
    });

    it('should clear board', () => {
      state.lists = [{ id: 'list-1', title: 'Test' }];
      state.cards = [{ id: 'card-1', listId: 'list-1', title: 'Card' }];
      const action = { type: ACTIONS.CLEAR_BOARD };
      const newState = boardReducer(state, action);

      expect(newState.lists).toHaveLength(0);
      expect(newState.cards).toHaveLength(0);
    });
  });

  describe('Sync Actions', () => {
    it('should mark synced', () => {
      const action = { type: ACTIONS.MARK_SYNCED };
      const newState = boardReducer(state, action);

      expect(newState.lastSyncedAt).toBeDefined();
    });

    it('should clear queue', () => {
      state.syncQueue = [{ type: 'CREATE_CARD', data: {} }];
      const action = { type: ACTIONS.CLEAR_QUEUE };
      const newState = boardReducer(state, action);

      expect(newState.syncQueue).toHaveLength(0);
    });

    it('should remove item from queue', () => {
      state.syncQueue = [
        { id: 'q-1', type: 'CREATE_CARD', data: {} },
        { id: 'q-2', type: 'UPDATE_CARD', data: {} },
      ];
      const action = { type: ACTIONS.REMOVE_FROM_QUEUE, payload: { queueId: 'q-1' } };
      const newState = boardReducer(state, action);

      expect(newState.syncQueue).toHaveLength(1);
      expect(newState.syncQueue[0].id).toBe('q-2');
    });
  });

  describe('Undo/Redo', () => {
    it('should push history', () => {
      state.lists = [{ id: 'list-1', title: 'Test' }];
      const action = { type: ACTIONS.PUSH_HISTORY };
      const newState = boardReducer(state, action);

      expect(newState.history).toHaveLength(1);
      expect(newState.historyIndex).toBe(0);
    });

    it('should undo', () => {
      state.history = [
        { lists: [{ id: 'list-1', title: 'Before' }], cards: [] },
        { lists: [{ id: 'list-1', title: 'After' }], cards: [] },
      ];
      state.historyIndex = 1;
      state.lists = [{ id: 'list-1', title: 'After' }];

      const action = { type: ACTIONS.UNDO };
      const newState = boardReducer(state, action);

      expect(newState.lists[0].title).toBe('Before');
      expect(newState.historyIndex).toBe(0);
    });

    it('should redo', () => {
      state.history = [
        { lists: [{ id: 'list-1', title: 'Before' }], cards: [] },
        { lists: [{ id: 'list-1', title: 'After' }], cards: [] },
      ];
      state.historyIndex = 0;
      state.lists = [{ id: 'list-1', title: 'Before' }];

      const action = { type: ACTIONS.REDO };
      const newState = boardReducer(state, action);

      expect(newState.lists[0].title).toBe('After');
      expect(newState.historyIndex).toBe(1);
    });
  });

  describe('Conflict Resolution', () => {
    it('should add conflict', () => {
      const conflict = { id: 'c-1', itemId: 'card-1', type: 'card' };
      const action = { type: ACTIONS.MERGE_CONFLICT, payload: { conflict } };
      const newState = boardReducer(state, action);

      expect(newState.conflicts).toHaveLength(1);
      expect(newState.conflicts[0].id).toBe('c-1');
    });

    it('should resolve conflict with local version', () => {
      state.conflicts = [{ id: 'c-1', itemId: 'card-1', type: 'card', localVersion: {}, serverVersion: {} }];
      const action = { type: ACTIONS.RESOLVE_CONFLICT, payload: { conflictId: 'c-1', resolution: 'local' } };
      const newState = boardReducer(state, action);

      expect(newState.conflicts).toHaveLength(0);
    });
  });
});
