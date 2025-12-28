import { useContext, useCallback, useMemo } from 'react';
import { BoardStateContext, BoardDispatchContext, ACTIONS } from '../context/BoardProvider';

export const useUndoRedo = () => {
  const state = useContext(BoardStateContext);
  const dispatch = useContext(BoardDispatchContext);

  if (state === null || dispatch === null) {
    throw new Error('useUndoRedo must be used within a BoardProvider');
  }

  const canUndo = useMemo(() => {
    return state.historyIndex > 0;
  }, [state.historyIndex]);

  const canRedo = useMemo(() => {
    return state.historyIndex < state.history.length - 1;
  }, [state.historyIndex, state.history.length]);

  const undo = useCallback(() => {
    if (canUndo) {
      dispatch({ type: ACTIONS.UNDO });
    }
  }, [dispatch, canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      dispatch({ type: ACTIONS.REDO });
    }
  }, [dispatch, canRedo]);

  const historyLength = useMemo(() => {
    return state.history.length;
  }, [state.history.length]);

  const currentIndex = useMemo(() => {
    return state.historyIndex;
  }, [state.historyIndex]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
    currentIndex,
  };
};

export default useUndoRedo;