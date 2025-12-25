import { createContext, useReducer, useEffect, useMemo } from 'react';
import { boardReducer, initialState, ACTIONS } from './boardReducer';
import { loadFromStorage, saveToStorage, loadFromStorageAsync } from '../services/storage';

export const BoardStateContext = createContext(null);
export const BoardDispatchContext = createContext(null);

const STORAGE_KEY = 'kanban-board-state';

import seedData from '../data/seed.json';

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

  // Async load for IndexedDB fallback
  useEffect(() => {
    const loadAsync = async () => {
      // Only attempt to load if we don't have valid data or if we suspect we might have more data in IDB
      // But simpler: just try to load from IDB if we're using seed data or partial data
      try {
        const stored = await loadFromStorageAsync(STORAGE_KEY);
        if (stored && stored.lists && stored.lists.length > 0) {
          // We found data in storage (maybe IDB) that we missed in the initial sync load
          // Only dispatch if it's different/newer, but for now just loading it if state is default
          // Checking if current state is essentially default/empty compared to loaded
          if (JSON.stringify(state.lists) === JSON.stringify(seedData.lists) &&
            JSON.stringify(state.cards) === JSON.stringify(seedData.cards) &&
            stored.cards.length !== seedData.cards.length) {

            dispatch({
              type: ACTIONS.APPLY_SERVER_STATE,
              payload: {
                lists: stored.lists,
                cards: stored.cards,
                lastSyncedAt: stored.lastSyncedAt,
              },
            });
          }
        }
      } catch (err) {
        console.error("Failed to load async data:", err);
      }
    };
    loadAsync();
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