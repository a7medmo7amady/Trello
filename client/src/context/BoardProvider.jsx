import { createContext, useReducer, useEffect, useMemo } from 'react';
import { boardReducer, initialState, ACTIONS } from './boardReducer';
import { loadFromStorage, saveToStorage } from '../services/storage';

export const BoardStateContext = createContext(null);
export const BoardDispatchContext = createContext(null);

const STORAGE_KEY = 'kanban-board-state';

const seedData = {
  lists: [
    { id: 'list-1', title: 'Backlog', order: 0, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-2', title: 'In Progress', order: 1, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-3', title: 'Review', order: 2, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-4', title: 'Done', order: 3, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
  ],
  cards: [
    { id: 'card-1', listId: 'list-1', title: 'Set up project structure', description: 'Initialize Vite React project with Tailwind', tags: ['setup'], order: 0, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'card-2', listId: 'list-1', title: 'Create core components', description: 'Build Board, ListColumn, Card components', tags: ['components'], order: 1, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'card-3', listId: 'list-2', title: 'Implement drag and drop', description: 'Add HTML5 DnD API support', tags: ['feature', 'dnd'], order: 0, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
  ],
};

export const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState, (initial) => {
    const stored = loadFromStorage(STORAGE_KEY);
    if (stored && stored.lists && stored.lists.length > 0) {
      return {
        ...initial,
        lists: stored.lists || [],
        cards: stored.cards || [],
        syncQueue: stored.syncQueue || [],
        lastSyncedAt: stored.lastSyncedAt || null,
      };
    }
    return {
      ...initial,
      lists: seedData.lists,
      cards: seedData.cards,
    };
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEY, {
      lists: state.lists,
      cards: state.cards,
      syncQueue: state.syncQueue,
      lastSyncedAt: state.lastSyncedAt,
    });
  }, [state.lists, state.cards, state.syncQueue, state.lastSyncedAt]);

  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: ACTIONS.SET_ONLINE_STATUS, payload: { isOnline: true } });
    };

    const handleOffline = () => {
      dispatch({ type: ACTIONS.SET_ONLINE_STATUS, payload: { isOnline: false } });
    };

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const stored = JSON.parse(e.newValue);
          if (stored && stored.lists) {
            dispatch({
              type: ACTIONS.APPLY_SERVER_STATE,
              payload: {
                lists: stored.lists,
                cards: stored.cards,
                lastSyncedAt: stored.lastSyncedAt,
              },
            });
          }
        } catch (error) {
          console.error('Failed to parse storage change:', error);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);

    dispatch({ type: ACTIONS.SET_ONLINE_STATUS, payload: { isOnline: navigator.onLine } });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const contextValue = useMemo(() => state, [state]);
  const dispatchValue = useMemo(() => dispatch, []);

  return (
    <BoardStateContext.Provider value={contextValue}>
      <BoardDispatchContext.Provider value={dispatchValue}>
        {children}
      </BoardDispatchContext.Provider>
    </BoardStateContext.Provider>
  );
};

export { ACTIONS };
export default BoardProvider;