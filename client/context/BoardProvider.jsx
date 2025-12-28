import { createContext, useReducer, useEffect, useCallback } from 'react';
import { boardReducer, initialState, ACTIONS } from './boardReducer';
import { loadFromStorage, saveToStorage } from '../services/storage';

// Create contexts
export const BoardStateContext = createContext(null);
export const BoardDispatchContext = createContext(null);

// Storage key
const STORAGE_KEY = 'kanban-board-state';

/**
 * BoardProvider Component
 *
 * Provides global board state via Context + useReducer pattern.
 * Handles persistence to localStorage/IndexedDB and manages
 * the sync queue for offline operations.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const BoardProvider = ({ children }) => {
  // Initialize state with data from storage
  const [state, dispatch] = useReducer(boardReducer, initialState, (initial) => {
    const stored = loadFromStorage(STORAGE_KEY);
    if (stored) {
      return {
        ...initial,
        lists: stored.lists || [],
        cards: stored.cards || [],
        syncQueue: stored.syncQueue || [],
        lastSyncedAt: stored.lastSyncedAt || null,
      };
    }
    return initial;
  });

  // Persist state to storage whenever it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEY, {
      lists: state.lists,
      cards: state.cards,
      syncQueue: state.syncQueue,
      lastSyncedAt: state.lastSyncedAt,
    });
  }, [state.lists, state.cards, state.syncQueue, state.lastSyncedAt]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online - syncing queued changes...');
      // Trigger sync logic here (handled by useOfflineSync hook)
    };

    const handleOffline = () => {
      console.log('App is offline - changes will be queued');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BoardStateContext.Provider value={state}>
      <BoardDispatchContext.Provider value={dispatch}>
        {children}
      </BoardDispatchContext.Provider>
    </BoardStateContext.Provider>
  );
};

export { ACTIONS };
export default BoardProvider;
