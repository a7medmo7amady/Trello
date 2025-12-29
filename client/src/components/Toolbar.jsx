import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useBoardState } from '../hooks/useBoardState';
import ConfirmDialog from './ConfirmDialog';
import ConflictResolutionModal from './ConflictResolutionModal';

const Toolbar = () => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { forceSync, isOnline, pendingChanges, conflicts } = useOfflineSync();
  const { state, resolveConflict } = useBoardState();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentConflict, setCurrentConflict] = useState(null);
  const prevConflictsLengthRef = useRef(0);

  // Auto-show conflict modal when new conflicts are detected
  useEffect(() => {
    if (conflicts.length > 0 && conflicts.length > prevConflictsLengthRef.current) {
      // New conflict detected - auto show modal
      setCurrentConflict(conflicts[0]);
      setShowConflictModal(true);
    }
    prevConflictsLengthRef.current = conflicts.length;
  }, [conflicts]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [undo, canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
    }
  }, [redo, canRedo]);

  const handleSync = useCallback(async () => {
    if (isOnline) {
      await forceSync();
    }
  }, [forceSync, isOnline]);

  const handleResolveConflict = useCallback((resolution) => {
    if (currentConflict) {
      resolveConflict(currentConflict.id, resolution);
      setCurrentConflict(null);
      setShowConflictModal(false);

      const remaining = conflicts.filter((c) => c.id !== currentConflict.id);
      if (remaining.length > 0) {
        setCurrentConflict(remaining[0]);
        setShowConflictModal(true);
      }
    }
  }, [currentConflict, conflicts, resolveConflict]);

  const handleOpenConflicts = useCallback(() => {
    if (conflicts.length > 0) {
      setCurrentConflict(conflicts[0]);
      setShowConflictModal(true);
    }
  }, [conflicts]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    },
    [handleUndo, handleRedo]
  );

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-2 bg-neutral-900/90 border-b border-gray-700/30"
        role="toolbar"
        aria-label="Board toolbar"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Undo (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Redo (Ctrl+Shift+Z)"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
              />
            </svg>
            <span className="hidden sm:inline">Redo</span>
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" aria-hidden="true" />

          <button
            type="button"
            onClick={handleSync}
            disabled={!isOnline || pendingChanges === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Sync now"
            title="Sync now"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {conflicts.length > 0 && (
            <button
              type="button"
              onClick={handleOpenConflicts}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors"
              aria-label={`${conflicts.length} conflict(s) to resolve`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}</span>
            </button>
          )}

          <div className="text-sm text-gray-500">
            <span className="hidden md:inline">
              {state.lists.filter((l) => !l.archived).length} lists
            </span>
            <span className="mx-2 hidden md:inline">|</span>
            <span>{state.cards.length} cards</span>
          </div>
        </div>
      </div>

      {showConflictModal && currentConflict && (
        <ConflictResolutionModal
          conflict={currentConflict}
          onResolve={handleResolveConflict}
        />
      )}
    </>
  );
};

export default memo(Toolbar);
