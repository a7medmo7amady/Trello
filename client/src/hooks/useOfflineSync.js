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

  // Initial Load from Server
  useEffect(() => {
    const init = async () => {
      // Initialize mocks if empty
      if (stateRef.current?.lists && stateRef.current?.cards) {
        await api.initializeServerState({ lists: stateRef.current.lists, cards: stateRef.current.cards });
      }

      // Fetch initial server state
      try {
        const serverState = await api.getServerState();
        if (serverState && isMountedRef.current) {
          dispatch({
            type: ACTIONS.APPLY_SERVER_STATE,
            payload: {
              lists: serverState.lists,
              cards: serverState.cards,
              lastSyncedAt: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        console.error("Initial sync failed", err);
      }
    };
    init();
  }, []);

  const processSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    setLastSyncError(null);

    // Capture latest state reference
    const currentState = stateRef.current;

    try {
      // 1. Push Local Changes
      if (currentState?.syncQueue?.length > 0) {
        const queueToProcess = [...currentState.syncQueue];
        const result = await api.syncChanges(queueToProcess);

        // Remove processed items
        if (result && result.results) {
          const successfulIds = result.results
            .filter((r) => r.success)
            .map((r) => r.changeId);

          for (const id of successfulIds) {
            dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: { queueId: id } });
          }
        }
      }

      // 2. Pull Server State & Check Conflicts
      const serverState = await api.getServerState();
      if (!serverState) return;

      // refresh current state again in case changes happened while awaiting above
      const freshState = stateRef.current;
      const conflicts = [];

      // Check Lists
      for (const serverList of serverState.lists) {
        const localList = freshState.lists.find(l => l.id === serverList.id);
        if (localList) {
          const conflict = api.checkForConflicts(localList, serverList);
          if (conflict) conflicts.push(conflict);
        }
      }
      // Check Cards
      for (const serverCard of serverState.cards) {
        const localCard = freshState.cards.find(c => c.id === serverCard.id);
        if (localCard) {
          const conflict = api.checkForConflicts(localCard, serverCard);
          if (conflict) conflicts.push(conflict);
        }
      }

      // Dispatch conflicts if any
      for (const conflict of conflicts) {
        // Check if we already have this conflict to avoid potential dupes
        const exists = freshState.conflicts.find(c => c.itemId === conflict.itemId);
        if (!exists) {
          dispatch({ type: ACTIONS.MERGE_CONFLICT, payload: { conflict } });
        }
      }

      // If no conflicts, auto-update local state to match server (convergence)
      // This is crucial for "Use Server" to stick, and for general sync
      if (conflicts.length === 0) {
        dispatch({
          type: ACTIONS.APPLY_SERVER_STATE,
          payload: {
            lists: serverState.lists,
            cards: serverState.cards,
            lastSyncedAt: new Date().toISOString(),
          }
        });
      }

      dispatch({ type: ACTIONS.MARK_SYNCED });

    } catch (e) {
      setLastSyncError(e.message);
    } finally {
      if (isMountedRef.current) setIsSyncing(false);
    }
  }, [dispatch, isSyncing]);

  const forceSync = useCallback(async () => {
    return processSync();
  }, [processSync]);

  // Interval Sync
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      processSync();
    }, SYNC_INTERVAL);
    return () => clearInterval(syncIntervalRef.current);
  }, [processSync]);

  return {
    isSyncing,
    isOnline: navigator.onLine,
    lastSyncError,
    pendingChanges,
    conflicts: state?.conflicts || [],
    forceSync
  };
};

export default useOfflineSync;