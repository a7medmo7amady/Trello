import { useContext, useEffect, useRef, useCallback, useState } from 'react';
import { BoardStateContext, BoardDispatchContext, ACTIONS } from '../context/BoardProvider';
import * as api from '../services/api';
import { saveToStorage, loadFromStorage } from '../services/storage';

const SYNC_INTERVAL = 3000; // Faster sync for testing (3s)
const SYNC_QUEUE_KEY = 'kanban-sync-queue';

export const useOfflineSync = () => {
  const state = useContext(BoardStateContext);
  const dispatch = useContext(BoardDispatchContext);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const syncIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Ref to hold latest state to avoid stale closures in async sync loop
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persistence for queue
  useEffect(() => {
    isMountedRef.current = true;
    if (stateRef.current?.syncQueue) {
      saveToStorage(SYNC_QUEUE_KEY, stateRef.current.syncQueue);
      setPendingChanges(stateRef.current.syncQueue.length);
    }
    return () => { isMountedRef.current = false; };
  }, [state?.syncQueue]);

  // Initial sync - just push local to server, don't overwrite local
  useEffect(() => {
    const init = async () => {
      try {
        // Push local state to server (server will merge/update)
        if (stateRef.current?.lists?.length > 0 || stateRef.current?.cards?.length > 0) {
          await api.initializeServerState({
            lists: stateRef.current.lists,
            cards: stateRef.current.cards
          });
        }
      } catch (err) {
        console.error("Initial sync failed", err);
      }
    };
    init();
  }, []);

  // Manual sync - compare local vs server
  const [foundConflicts, setFoundConflicts] = useState([]);

  const processSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    setLastSyncError(null);
    setFoundConflicts([]);

    try {
      const localState = stateRef.current;

      // Get server state
      const serverState = await api.getServerState();
      if (!serverState || !serverState.cards || serverState.cards.length === 0) {
        // No server data - push local to server
        await api.initializeServerState({
          lists: localState.lists,
          cards: localState.cards
        });
        dispatch({ type: ACTIONS.MARK_SYNCED });
        setIsSyncing(false);
        return { success: true, conflicts: [] };
      }

      // Compare local vs server - find conflicts
      const conflicts = [];

      for (const localCard of localState.cards) {
        const serverCard = serverState.cards.find(c => c.id === localCard.id);
        if (serverCard) {
          const isDifferent =
            localCard.title !== serverCard.title ||
            localCard.description !== serverCard.description ||
            localCard.listId !== serverCard.listId ||
            JSON.stringify(localCard.tags) !== JSON.stringify(serverCard.tags);

          if (isDifferent) {
            conflicts.push({
              id: localCard.id,
              type: 'card',
              local: localCard,
              server: serverCard,
            });
          }
        }
      }

      for (const localList of localState.lists) {
        const serverList = serverState.lists.find(l => l.id === localList.id);
        if (serverList) {
          if (localList.title !== serverList.title) {
            conflicts.push({
              id: localList.id,
              type: 'list',
              local: localList,
              server: serverList,
            });
          }
        }
      }

      if (conflicts.length > 0) {
        setFoundConflicts(conflicts);
        setIsSyncing(false);
        return { success: false, conflicts };
      }

      // No conflicts - push local to server
      await api.initializeServerState({
        lists: localState.lists,
        cards: localState.cards
      });

      dispatch({ type: ACTIONS.CLEAR_QUEUE });
      dispatch({ type: ACTIONS.MARK_SYNCED });
      setIsSyncing(false);
      return { success: true, conflicts: [] };

    } catch (e) {
      setLastSyncError(e.message);
      setIsSyncing(false);
      return { success: false, error: e.message };
    }
  }, [dispatch, isSyncing]);

  const resolveConflict = useCallback((conflictId, choice) => {
    const conflict = foundConflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    if (choice === 'local') {
      // Keep local - will push to server on next sync
    } else {
      // Use server - apply server version to local
      if (conflict.type === 'card') {
        dispatch({
          type: ACTIONS.UPDATE_CARD,
          payload: { cardId: conflict.id, updates: conflict.server }
        });
      } else {
        dispatch({
          type: ACTIONS.RENAME_LIST,
          payload: { listId: conflict.id, title: conflict.server.title }
        });
      }
    }

    setFoundConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, [foundConflicts, dispatch]);

  const forceSync = useCallback(async () => {
    return processSync();
  }, [processSync]);

  // NO auto sync - user clicks manually

  return {
    isSyncing,
    isOnline: navigator.onLine,
    lastSyncError,
    pendingChanges,
    foundConflicts,
    resolveConflict,
    forceSync
  };
};

export default useOfflineSync;