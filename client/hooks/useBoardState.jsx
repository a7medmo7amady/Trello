import { useReducer, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'trello:board:v1';

// Simple id generator
const genId = (prefix = '') =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Seed data for first run
const seededState = {
  lists: [
    { id: 'list-1', title: 'Backlog', archived: false },
    { id: 'list-2', title: 'In Progress', archived: false },
    { id: 'list-3', title: 'Done', archived: false },
  ],
  cards: [
    { id: 'card-1', listId: 'list-1', title: 'Set up project', description: '' },
    { id: 'card-2', listId: 'list-1', title: 'Create components', description: '' },
    { id: 'card-3', listId: 'list-2', title: 'Implement DnD', description: '' },
  ],
};

const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore and fallback to seed
  }
  return seededState;
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_LIST': {
      const newList = {
        id: genId('list-'),
        title: action.title,
        archived: false,
      };
      return { ...state, lists: [...state.lists, newList] };
    }

    case 'ARCHIVE_LIST': {
      const lists = state.lists.map((l) =>
        l.id === action.listId ? { ...l, archived: true } : l
      );
      return { ...state, lists };
    }

    case 'ADD_CARD': {
      const card = {
        id: genId('card-'),
        listId: action.listId,
        title: action.title || 'New card',
        description: action.description || '',
      };
      // append to end of cards
      return { ...state, cards: [...state.cards, card] };
    }

    case 'UPDATE_CARD': {
      const cards = state.cards.map((c) => (c.id === action.card.id ? action.card : c));
      return { ...state, cards };
    }

    case 'DELETE_CARD': {
      const cards = state.cards.filter((c) => c.id !== action.cardId);
      return { ...state, cards };
    }

    case 'MOVE_CARD': {
      const { cardId, targetListId, targetIndex } = action;
      // remove card from array
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) return state;

      const remaining = state.cards.filter((c) => c.id !== cardId);
      // find indices of cards that belong to target list in remaining
      const targetListIndices = remaining
        .map((c, idx) => ({ c, idx }))
        .filter((x) => x.c.listId === targetListId)
        .map((x) => x.idx);

      // Decide absolute insert index into remaining array
      let insertAt;
      if (targetListIndices.length === 0) {
        // no cards in target list -> append to end
        insertAt = remaining.length;
      } else {
        const boundedIndex = Math.max(0, Math.min(targetIndex ?? targetListIndices.length, targetListIndices.length));
        // insert before the card that currently occupies the boundedIndex position among the target list members
        const refIdx = targetListIndices[boundedIndex] ?? (targetListIndices[targetListIndices.length - 1] + 1);
        insertAt = refIdx;
        // If inserting after last, ensure index becomes last + 1
        if (boundedIndex === targetListIndices.length) {
          insertAt = (targetListIndices[targetListIndices.length - 1] ?? -1) + 1;
        }
      }

      const movedCard = { ...card, listId: targetListId };
      const newCards = [...remaining.slice(0, insertAt), movedCard, ...remaining.slice(insertAt)];
      return { ...state, cards: newCards };
    }

    default:
      return state;
  }
}

/**
 * useBoardState hook
 * Exposes: { state, addList, archiveList, addCard, updateCard, deleteCard, moveCard, reorderCard }
 */
export function useBoardState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore storage errors
    }
  }, [state]);

  const addList = useCallback((title) => {
    dispatch({ type: 'ADD_LIST', title });
  }, []);

  const archiveList = useCallback((listId) => {
    dispatch({ type: 'ARCHIVE_LIST', listId });
  }, []);

  const addCard = useCallback((listId, title = 'New card', description = '') => {
    dispatch({ type: 'ADD_CARD', listId, title, description });
  }, []);

  const updateCard = useCallback((card) => {
    dispatch({ type: 'UPDATE_CARD', card });
  }, []);

  const deleteCard = useCallback((cardId) => {
    dispatch({ type: 'DELETE_CARD', cardId });
  }, []);

  /**
   * Move card across lists or within a list.
   * For cross-list moves Board.jsx calls: moveCard(cardId, sourceListId, targetListId, finalIndex)
   */
  const moveCard = useCallback((cardId, _sourceListId, targetListId, targetIndex = null) => {
    dispatch({ type: 'MOVE_CARD', cardId, targetListId, targetIndex });
  }, []);

  /**
   * Convenience wrapper for reordering inside the same list
   * The reducer treats it the same as MOVE_CARD (listId unchanged)
   */
  const reorderCard = useCallback((cardId, listId, targetIndex) => {
    dispatch({ type: 'MOVE_CARD', cardId, targetListId: listId, targetIndex });
  }, []);

  return {
    state,
    addList,
    archiveList,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
  };
}

export default useBoardState;