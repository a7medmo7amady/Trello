import { memo, useCallback } from 'react';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useBoardState } from '../hooks/useBoardState';

const Toolbar = () => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { forceSync, isOnline, isSyncing, foundConflicts, resolveConflict } = useOfflineSync();
  const { state } = useBoardState();

  const handleUndo = useCallback(() => {
    if (canUndo) undo();
  }, [undo, canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) redo();
  }, [redo, canRedo]);

  const handleSync = useCallback(async () => {
    if (isOnline) await forceSync();
  }, [forceSync, isOnline]);

  const handleChooseLocal = useCallback((id) => {
    resolveConflict(id, 'local');
  }, [resolveConflict]);

  const handleChooseServer = useCallback((id) => {
    resolveConflict(id, 'server');
  }, [resolveConflict]);

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-2 bg-neutral-900/90 border-b border-gray-700/30"
        role="toolbar"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
            <span className="hidden sm:inline">Redo</span>
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          <button
            type="button"
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {state.lists.filter((l) => !l.archived).length} lists | {state.cards.length} cards
        </div>
      </div>

      {/* Conflict Modal - Simple inline */}
      {foundConflicts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div
            className="w-full max-w-2xl bg-neutral-900 border border-amber-500 rounded-xl p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="conflict-modal-title"
          >
            <h2 id="conflict-modal-title" className="text-xl font-bold text-white mb-4">
              Conflict Found ({foundConflicts.length})
            </h2>

            {foundConflicts.map((conflict) => (
              <div key={conflict.id} className="mb-6 p-4 bg-neutral-800 rounded-lg">
                <p className="text-amber-400 text-sm mb-3">
                  {conflict.type === 'card' ? 'Card' : 'List'}: {conflict.local.title}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                    <p className="text-green-400 text-xs mb-2 font-bold">YOUR LOCAL</p>
                    <p className="text-white font-medium">{conflict.local.title}</p>
                    {conflict.type === 'card' && (
                      <p className="text-gray-400 text-sm mt-1">{conflict.local.description || '(no description)'}</p>
                    )}
                  </div>

                  <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                    <p className="text-blue-400 text-xs mb-2 font-bold">SERVER</p>
                    <p className="text-white font-medium">{conflict.server.title}</p>
                    {conflict.type === 'card' && (
                      <p className="text-gray-400 text-sm mt-1">{conflict.server.description || '(no description)'}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleChooseLocal(conflict.id)}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
                  >
                    Keep My Local
                  </button>
                  <button
                    onClick={() => handleChooseServer(conflict.id)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    Use Server
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Toolbar);
