import { useContext, useCallback } from 'react';
import { BoardStateContext, BoardDispatchContext, ACTIONS } from '../context/BoardProvider';

export const useBoardState = () => {
  const state = useContext(BoardStateContext);
  const dispatch = useContext(BoardDispatchContext);

  if (state === null || dispatch === null) {
    throw new Error('useBoardState must be used within a BoardProvider');
  }

  const pushHistory = useCallback(() => {
    dispatch({ type: ACTIONS.PUSH_HISTORY });
  }, [dispatch]);

  const addList = useCallback(
    (title) => {
      pushHistory();
      dispatch({ type: ACTIONS.ADD_LIST, payload: { title } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const renameList = useCallback(
    (listId, title) => {
      pushHistory();
      dispatch({ type: ACTIONS.RENAME_LIST, payload: { listId, title } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const archiveList = useCallback(
    (listId) => {
      pushHistory();
      dispatch({ type: ACTIONS.ARCHIVE_LIST, payload: { listId } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const restoreList = useCallback(
    (listId) => {
      pushHistory();
      dispatch({ type: ACTIONS.RESTORE_LIST, payload: { listId } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const reorderLists = useCallback(
    (listIds) => {
      pushHistory();
      dispatch({ type: ACTIONS.REORDER_LISTS, payload: { listIds } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const addCard = useCallback(
    (listId, title, description = '', tags = []) => {
      pushHistory();
      dispatch({ type: ACTIONS.ADD_CARD, payload: { listId, title, description, tags } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const updateCard = useCallback(
    (cardId, updates) => {
      pushHistory();
      dispatch({ type: ACTIONS.UPDATE_CARD, payload: { cardId, updates } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const deleteCard = useCallback(
    (cardId) => {
      pushHistory();
      dispatch({ type: ACTIONS.DELETE_CARD, payload: { cardId } });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const moveCard = useCallback(
    (cardId, sourceListId, targetListId, targetIndex) => {
      pushHistory();
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: { cardId, sourceListId, targetListId, targetIndex },
      });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const reorderCard = useCallback(
    (cardId, listId, newIndex) => {
      pushHistory();
      dispatch({
        type: ACTIONS.REORDER_CARD,
        payload: { cardId, listId, newIndex },
      });
      pushHistory();
    },
    [dispatch, pushHistory]
  );

  const setBoard = useCallback(
    (lists, cards) => {
      dispatch({ type: ACTIONS.SET_BOARD, payload: { lists, cards } });
    },
    [dispatch]
  );

  const clearBoard = useCallback(() => {
    pushHistory();
    dispatch({ type: ACTIONS.CLEAR_BOARD });
    pushHistory();
  }, [dispatch, pushHistory]);

  const resolveConflict = useCallback(
    (conflictId, resolution) => {
      dispatch({ type: ACTIONS.RESOLVE_CONFLICT, payload: { conflictId, resolution } });
    },
    [dispatch]
  );

  return {
    state,
    dispatch,
    addList,
    renameList,
    archiveList,
    restoreList,
    reorderLists,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
    setBoard,
    clearBoard,
    resolveConflict,
  };
};

export default useBoardState;
