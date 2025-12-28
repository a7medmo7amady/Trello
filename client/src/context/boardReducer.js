import { v4 as uuidv4 } from 'uuid';

export const ACTIONS = {
  ADD_LIST: 'ADD_LIST',
  RENAME_LIST: 'RENAME_LIST',
  ARCHIVE_LIST: 'ARCHIVE_LIST',
  RESTORE_LIST: 'RESTORE_LIST',
  REORDER_LISTS: 'REORDER_LISTS',

  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  REORDER_CARD: 'REORDER_CARD',

  SET_BOARD: 'SET_BOARD',
  CLEAR_BOARD: 'CLEAR_BOARD',

  MARK_SYNCED: 'MARK_SYNCED',
  QUEUE_CHANGE: 'QUEUE_CHANGE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',

  UNDO: 'UNDO',
  REDO: 'REDO',
  PUSH_HISTORY: 'PUSH_HISTORY',

  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  APPLY_SERVER_STATE: 'APPLY_SERVER_STATE',
  MERGE_CONFLICT: 'MERGE_CONFLICT',
  RESOLVE_CONFLICT: 'RESOLVE_CONFLICT',
};

const createList = (title, order) => ({
  id: uuidv4(),
  title,
  order,
  archived: false,
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  version: 1,
});

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

const touchItem = (item) => ({
  ...item,
  lastModifiedAt: new Date().toISOString(),
  version: (item.version || 0) + 1,
});

export const initialState = {
  lists: [],
  cards: [],
  syncQueue: [],
  lastSyncedAt: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  history: [],
  historyIndex: -1,
  conflicts: [],
};

export const boardReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_LIST: {
      const { title } = action.payload;
      const maxOrder = state.lists.length > 0
        ? Math.max(...state.lists.map((l) => l.order || 0))
        : -1;
      const newList = createList(title, maxOrder + 1);

      return {
        ...state,
        lists: [...state.lists, newList],
        syncQueue: [
          ...state.syncQueue,
          { type: 'CREATE_LIST', data: newList, timestamp: Date.now(), id: uuidv4() },
        ],
      };
    }

    case ACTIONS.RENAME_LIST: {
      const { listId, title } = action.payload;
      const updatedList = state.lists.find((l) => l.id === listId);

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId ? touchItem({ ...list, title }) : list
        ),
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'UPDATE_LIST',
            data: { id: listId, title, version: (updatedList?.version || 0) + 1 },
            timestamp: Date.now(),
            id: uuidv4(),
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
            id: uuidv4(),
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
            id: uuidv4(),
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
            id: uuidv4(),
          },
        ],
      };
    }

    case ACTIONS.ADD_CARD: {
      const { listId, title, description = '', tags = [] } = action.payload;
      const listCards = state.cards.filter((c) => c.listId === listId);
      const maxOrder = listCards.length > 0
        ? Math.max(...listCards.map((c) => c.order || 0))
        : -1;
      const newCard = { ...createCard(listId, title, maxOrder + 1), description, tags };

      return {
        ...state,
        cards: [...state.cards, newCard],
        syncQueue: [
          ...state.syncQueue,
          { type: 'CREATE_CARD', data: newCard, timestamp: Date.now(), id: uuidv4() },
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
            id: uuidv4(),
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
            id: uuidv4(),
          },
        ],
      };
    }

    case ACTIONS.MOVE_CARD: {
      const { cardId, sourceListId, targetListId, targetIndex } = action.payload;
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) return state;

      const remaining = state.cards.filter((c) => c.id !== cardId);
      const targetListIndices = remaining
        .map((c, idx) => ({ c, idx }))
        .filter((x) => x.c.listId === targetListId)
        .map((x) => x.idx);

      let insertAt;
      if (targetListIndices.length === 0) {
        insertAt = remaining.length;
      } else {
        const boundedIndex = Math.max(0, Math.min(targetIndex ?? targetListIndices.length, targetListIndices.length));
        if (boundedIndex === targetListIndices.length) {
          insertAt = targetListIndices[targetListIndices.length - 1] + 1;
        } else {
          insertAt = targetListIndices[boundedIndex];
        }
      }

      const movedCard = touchItem({ ...card, listId: targetListId, order: targetIndex ?? 0 });
      const newCards = [...remaining.slice(0, insertAt), movedCard, ...remaining.slice(insertAt)];

      return {
        ...state,
        cards: newCards,
        syncQueue: [
          ...state.syncQueue,
          {
            type: 'MOVE_CARD',
            data: { cardId, sourceListId, targetListId, targetIndex },
            timestamp: Date.now(),
            id: uuidv4(),
          },
        ],
      };
    }

    case ACTIONS.REORDER_CARD: {
      const { cardId, listId, newIndex } = action.payload;
      const listCards = state.cards
        .filter((c) => c.listId === listId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const cardToMove = listCards.find((c) => c.id === cardId);
      if (!cardToMove) return state;

      const oldIndex = listCards.indexOf(cardToMove);
      if (oldIndex === newIndex) return state;

      const reordered = [...listCards];
      reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, cardToMove);

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
            id: uuidv4(),
          },
        ],
      };
    }

    case ACTIONS.SET_BOARD: {
      const { lists, cards } = action.payload;
      return {
        ...state,
        lists: lists ?? state.lists,
        cards: cards ?? state.cards,
      };
    }

    case ACTIONS.CLEAR_BOARD: {
      return {
        ...state,
        lists: [],
        cards: [],
      };
    }

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

    case ACTIONS.REMOVE_FROM_QUEUE: {
      const { queueId } = action.payload;
      return {
        ...state,
        syncQueue: state.syncQueue.filter((item) => item.id !== queueId),
      };
    }

    case ACTIONS.SET_ONLINE_STATUS: {
      return {
        ...state,
        isOnline: action.payload.isOnline,
      };
    }

    case ACTIONS.PUSH_HISTORY: {
      const { lists, cards } = state;
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ lists: JSON.parse(JSON.stringify(lists)), cards: JSON.parse(JSON.stringify(cards)) });

      const maxHistory = 50;
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case ACTIONS.UNDO: {
      if (state.historyIndex <= 0) return state;
      const prevState = state.history[state.historyIndex - 1];

      return {
        ...state,
        lists: prevState.lists,
        cards: prevState.cards,
        historyIndex: state.historyIndex - 1,
      };
    }

    case ACTIONS.REDO: {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextState = state.history[state.historyIndex + 1];

      return {
        ...state,
        lists: nextState.lists,
        cards: nextState.cards,
        historyIndex: state.historyIndex + 1,
      };
    }

    case ACTIONS.APPLY_SERVER_STATE: {
      const { lists, cards, lastSyncedAt } = action.payload;
      return {
        ...state,
        lists: lists ?? state.lists,
        cards: cards ?? state.cards,
        lastSyncedAt: lastSyncedAt ?? state.lastSyncedAt,
      };
    }

    case ACTIONS.MERGE_CONFLICT: {
      const { conflict } = action.payload;
      return {
        ...state,
        conflicts: [...state.conflicts, conflict],
      };
    }

    case ACTIONS.RESOLVE_CONFLICT: {
      const { conflictId, resolution } = action.payload;
      const conflict = state.conflicts.find((c) => c.id === conflictId);

      if (!conflict) {
        return state;
      }

      let newState = { ...state };

      if (resolution === 'local') {
        // To overwrite the server, we need to push a new update based on our current local state
        // This effectively tells the server "My version is newer/correct"
        if (conflict.type === 'card') {
          const currentCard = state.cards.find((c) => c.id === conflict.itemId);
          if (currentCard) {
            newState.syncQueue = [
              ...state.syncQueue,
              {
                type: 'UPDATE_CARD',
                data: { ...currentCard, version: (conflict.serverVersion?.version || 0) + 1 },
                timestamp: Date.now(),
                id: uuidv4(),
              },
            ];
          }
        } else if (conflict.type === 'list') {
          const currentList = state.lists.find((l) => l.id === conflict.itemId);
          if (currentList) {
            newState.syncQueue = [
              ...state.syncQueue,
              {
                type: 'UPDATE_LIST',
                data: { ...currentList, version: (conflict.serverVersion?.version || 0) + 1 },
                timestamp: Date.now(),
                id: uuidv4(),
              },
            ];
          }
        }
      } else if (resolution === 'server') {
        // Apply server version
        if (conflict.type === 'card') {
          newState.cards = newState.cards.map((card) => {
            if (card.id === conflict.itemId) {
              return conflict.serverVersion;
            }
            return card;
          });
        } else if (conflict.type === 'list') {
          newState.lists = newState.lists.map((list) => {
            if (list.id === conflict.itemId) {
              return conflict.serverVersion;
            }
            return list;
          });
        }
      }

      return {
        ...newState,
        conflicts: newState.conflicts.filter((c) => c.id !== conflictId),
      };
    }

    default:
      return state;
  }
};

export default boardReducer;