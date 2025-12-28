import { useContext, useEffect, useRef, useCallback, useState } from 'react';
import { BoardStateContext, BoardDispatchContext, ACTIONS } from '../context/BoardProvider';
import * as api from '../services/api';
import { saveToStorage, loadFromStorage } from '../services/storage';

const SYNC_INTERVAL = 30000;
const RETRY_DELAY = 5000;
const MAX_RETRIES = 3;
const SYNC_QUEUE_KEY = 'kanban-sync-queue';

export const useOfflineSync = () => {
  const state = useContext(BoardStateContext);
  const dispatch = useContext(BoardDispatchContext);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const syncIntervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const persistQueue = useCallback((queue) => {
    saveToStorage(SYNC_QUEUE_KEY, queue);
  }, []);

  const _loadPersistedQueue = useCallback(() => {
    return loadFromStorage(SYNC_QUEUE_KEY) || [];
  }, []);

  const processQueue = useCallback(async () => {
    if (isSyncing) return { success: false, error: 'Already syncing', processed: 0 };

    if (!state || state.syncQueue.length === 0) {
      setPendingChanges(0);
      return { success: true, processed: 0 };
    }

    if (!navigator.onLine) {
      return { success: false, error: 'Offline', processed: 0 };
    }

    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const queueToProcess = [...state.syncQueue];
      setPendingChanges(queueToProcess.length);

      const result = await api.syncChanges(queueToProcess);

      if (!isMountedRef.current) return { success: false, error: 'Unmounted', processed: 0 };

      const successfulIds = result.results
        .filter((r) => r.success)
        .map((r) => r.changeId);

      for (const id of successfulIds) {
        dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: { queueId: id } });
      }

      const failedResults = result.results.filter((r) => !r.success);
      if (failedResults.length > 0) {
        setLastSyncError(`${failedResults.length} changes failed to sync`);
      }

      dispatch({ type: ACTIONS.MARK_SYNCED });

      if (result.serverState) {
        const conflicts = [];

        for (const serverList of result.serverState.lists) {
          const localList = state.lists.find((l) => l.id === serverList.id);
          if (localList) {
            const conflict = api.checkForConflicts(localList, serverList);
            if (conflict) {
              conflicts.push(conflict);
            }
          }
        }

        for (const serverCard of result.serverState.cards) {
          const localCard = state.cards.find((c) => c.id === serverCard.id);
          if (localCard) {
            const conflict = api.checkForConflicts(localCard, serverCard);
            if (conflict) {
              conflicts.push(conflict);
            }
          }
        }

        for (const conflict of conflicts) {
          dispatch({ type: ACTIONS.MERGE_CONFLICT, payload: { conflict } });
        }
      }

      retryCountRef.current = 0;
      setPendingChanges(state.syncQueue.length - successfulIds.length);

      return { success: true, processed: successfulIds.length };
    } catch (error) {
      if (!isMountedRef.current) return { success: false, error: 'Unmounted', processed: 0 };

      setLastSyncError(error.message);
      retryCountRef.current += 1;

      if (retryCountRef.current < MAX_RETRIES) {
        setTimeout(() => {
          if (isMountedRef.current && navigator.onLine) {
            processQueue();
          }
        }, RETRY_DELAY * retryCountRef.current);
      }

      return { success: false, error: error.message, processed: 0 };
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [state, dispatch]);

  const forceSync = useCallback(async () => {
    retryCountRef.current = 0;
    return processQueue();
  }, [processQueue]);

  useEffect(() => {
    const handleOnline = () => {
      if (state?.syncQueue?.length > 0) {
        processQueue();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [state?.syncQueue?.length, processQueue]);

  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine && state?.syncQueue?.length > 0) {
        processQueue();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state?.syncQueue?.length, processQueue]);

  useEffect(() => {
    if (state?.syncQueue) {
      persistQueue(state.syncQueue);
      setPendingChanges(state.syncQueue.length);
    }
  }, [state?.syncQueue, persistQueue]);

  useEffect(() => {
    if (state?.lists && state?.cards) {
      api.initializeServerState({ lists: state.lists, cards: state.cards });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getServerState = useCallback(async () => {
    try {
      return await api.getServerState();
    } catch (error) {
      setLastSyncError(error.message);
      return null;
    }
  }, []);

  const applyServerState = useCallback(
    (serverState) => {
      dispatch({
        type: ACTIONS.APPLY_SERVER_STATE,
        payload: {
          lists: serverState.lists,
          cards: serverState.cards,
          lastSyncedAt: new Date().toISOString(),
        },
      });
    },
    [dispatch]
  );

  return {
    isSyncing,
    isOnline: state?.isOnline ?? navigator.onLine,
    lastSyncError,
    pendingChanges,
    syncQueue: state?.syncQueue || [],
    lastSyncedAt: state?.lastSyncedAt,
    forceSync,
    getServerState,
    applyServerState,
    conflicts: state?.conflicts || [],
  };
};

export default useOfflineSync;