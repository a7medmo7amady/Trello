import { v4 as uuidv4 } from 'uuid';

// Action Types
export const ACTIONS = {
  // List actions
  ADD_LIST: 'ADD_LIST',
  RENAME_LIST: 'RENAME_LIST',
  ARCHIVE_LIST: 'ARCHIVE_LIST',
  RESTORE_LIST: 'RESTORE_LIST',
  REORDER_LISTS: 'REORDER_LISTS',

  // Card actions
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  REORDER_CARD: 'REORDER_CARD',

  // Bulk actions
  SET_BOARD: 'SET_BOARD',
  CLEAR_BOARD: 'CLEAR_BOARD',

  // Sync actions
  MARK_SYNCED: 'MARK_SYNCED',
  QUEUE_CHANGE: 'QUEUE_CHANGE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',

  // Undo/Redo
  UNDO: 'UNDO',
  REDO: 'REDO',
};

/**
 * Creates a new list object
 */
const createList = (title, order) => ({
  id: uuidv4(),
  title,
  order,
  archived: false,
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  version: 1,
});

/**
 * Creates a new card object
 */
const createCard = (listId, title, order) => ({
  id: uuidv4(),
  listId,
  title,
  description: '',
  tags: [],
  order,
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  version: 1,
});

/**
 * Updates timestamp and version for an item
 */
const touchItem = (item) => ({
  ...item,
  lastModifiedAt: new Date().toISOString(),
  version: item.version + 1,
});

/**
 * Initial state structure
 */
export const initialState = {
  lists: [],
  cards: [],
  syncQueue: [],
  lastSyncedAt: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

/**
 * Board Reducer
 * Handles all state mutations for the Kanban board
 * All updates are immutable and trackable for sync
 */
export const boardReducer = (state, action) => {
  switch (action.type) {
    // ==========================================
    // List Actions
    // ==========================================

    case ACTIONS.ADD_LIST: {
      const { title } = action.payload;
      const maxOrder = Math.max(0, ...state.lists.map((l) => l.order));
      const newList = createList(title, maxOrder + 1);

      return {
        ...state,
        lists: [...state.lists, newList],
        syncQueue: [
          ...state.syncQueue,
          { type: 'CREATE_LIST', data: newList, timestamp: Date.now() },
        ],
      };
    }

    case ACTIONS.RENAME_LIST: {
      const { listId, title } = action.payload;

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId ? touchItem({ ...list, title }) : list
        ),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'UPDATE_LIST',
            data: { id: listId, title },
            timestamp: Date.now(),
          },
        ],
      };
    }

    case ACTIONS.ARCHIVE_LIST: {
      const { listId } = action.payload;

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId ? touchItem({ ...list, archived: true }) : list
        ),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'ARCHIVE_LIST',
            data: { id: listId },
            timestamp: Date.now(),
          },
        ],
      };
    }

    case ACTIONS.RESTORE_LIST: {
      const { listId } = action.payload;

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId ? touchItem({ ...list, archived: false }) : list
        ),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'RESTORE_LIST',
            data: { id: listId },
            timestamp: Date.now(),
          },
        ],
      };
    }

    case ACTIONS.REORDER_LISTS: {
      const { listIds } = action.payload;

      return {
        ...state,
        lists: state.lists.map((list) => {
          const newOrder = listIds.indexOf(list.id);
          if (newOrder !== -1 && newOrder !== list.order) {
            return touchItem({ ...list, order: newOrder });
          }
          return list;
        }),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'REORDER_LISTS',
            data: { listIds },
            timestamp: Date.now(),
          },
        ],
      };
    }

    // ==========================================
    // Card Actions
    // ==========================================

    case ACTIONS.ADD_CARD: {
      const { listId, title } = action.payload;
      const listCards = state.cards.filter((c) => c.listId === listId);
      const maxOrder = Math.max(0, ...listCards.map((c) => c.order), 0);
      const newCard = createCard(listId, title, maxOrder + 1);

      return {
        ...state,
        cards: [...state.cards, newCard],
        syncQueue: [
          ...state.syncQueue,
          { type: 'CREATE_CARD', data: newCard, timestamp: Date.now() },
        ],
      };
    }

    case ACTIONS.UPDATE_CARD: {
      const { cardId, updates } = action.payload;

      return {
        ...state,
        cards: state.cards.map((card) =>
          card.id === cardId ? touchItem({ ...card, ...updates }) : card
        ),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'UPDATE_CARD',
            data: { id: cardId, ...updates },
            timestamp: Date.now(),
          },
        ],
      };
    }

    case ACTIONS.DELETE_CARD: {
      const { cardId } = action.payload;

      return {
        ...state,
        cards: state.cards.filter((card) => card.id !== cardId),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'DELETE_CARD',
            data: { id: cardId },
            timestamp: Date.now(),
          },
        ],
      };
    }

    case ACTIONS.MOVE_CARD: {
      const { cardId, sourceListId, targetListId, targetIndex } = action.payload;

      // Get cards in target list and calculate new orders
      const targetCards = state.cards
        .filter((c) => c.listId === targetListId && c.id !== cardId)
        .sort((a, b) => a.order - b.order);

      // Insert at target index
      const updatedCards = state.cards.map((card) => {
        if (card.id === cardId) {
          return touchItem({
            ...card,
            listId: targetListId,
            order: targetIndex,
          });
        }

        // Reorder other cards in target list
        if (card.listId === targetListId) {
          const currentIdx = targetCards.findIndex((c) => c.id === card.id);
          const newOrder = currentIdx >= targetIndex ? currentIdx + 1 : currentIdx;
          if (newOrder !== card.order) {
            return touchItem({ ...card, order: newOrder });
          }
        }

        return card;
      });

      return {
        ...state,
        cards: updatedCards,
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'MOVE_CARD',
            data: { cardId, sourceListId, targetListId, targetIndex },
            timestamp: Date.now(),
          },
        ],
      };
    }

    case ACTIONS.REORDER_CARD: {
      const { cardId, listId, newIndex } = action.payload;

      const listCards = state.cards
        .filter((c) => c.listId === listId)
        .sort((a, b) => a.order - b.order);

      const cardToMove = listCards.find((c) => c.id === cardId);
      if (!cardToMove) return state;

      const oldIndex = listCards.indexOf(cardToMove);
      if (oldIndex === newIndex) return state;

      // Remove and reinsert
      const reordered = [...listCards];
      reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, cardToMove);

      // Update orders
      const updatedCards = state.cards.map((card) => {
        if (card.listId !== listId) return card;
        const newOrder = reordered.findIndex((c) => c.id === card.id);
        if (newOrder !== card.order) {
          return touchItem({ ...card, order: newOrder });
        }
        return card;
      });

      return {
        ...state,
        cards: updatedCards,
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'REORDER_CARD',
            data: { cardId, listId, newIndex },
            timestamp: Date.now(),
          },
        ],
      };
    }

    // ==========================================
    // Bulk Actions
    // ==========================================

    case ACTIONS.SET_BOARD: {
      const { lists, cards } = action.payload;
      return {
        ...state,
        lists: lists || state.lists,
        cards: cards || state.cards,
      };
    }

    case ACTIONS.CLEAR_BOARD: {
      return {
        ...state,
        lists: [],
        cards: [],
      };
    }

    // ==========================================
    // Sync Actions
    // ==========================================

    case ACTIONS.MARK_SYNCED: {
      return {
        ...state,
        lastSyncedAt: new Date().toISOString(),
      };
    }

    case ACTIONS.CLEAR_QUEUE: {
      return {
        ...state,
        syncQueue: [],
      };
    }

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
};

export default boardReducer;
