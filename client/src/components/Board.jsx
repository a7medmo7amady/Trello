import {
  useCallback,
  useMemo,
  useState,
  useRef,
  Suspense,
  lazy,
  memo,
} from 'react';
import { useBoardState } from '../hooks/useBoardState';
import ListColumn from './ListColoumn';
import ConfirmDialog from './ConfirmDialog';

// Lazy load heavy modal component for code splitting
const CardDetailModal = lazy(() => import('./CardDetailModal'));

/**
 * Board Component
 *
 * Main Kanban board container that renders all list columns and manages
 * drag-and-drop interactions between them. Uses context for state management
 * and implements performance optimizations for handling 500+ cards.
 *
 * Features:
 * - Drag & drop cards within and between lists (HTML5 DnD API)
 * - Add new lists
 * - Keyboard accessible
 * - Memoized callbacks to prevent unnecessary re-renders
 */
const Board = () => {
  const {
    state,
    addList,
    moveCard,
    reorderCard,
    archiveList,
  } = useBoardState();

  // Local UI state
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Refs for drag calculations
  const dragGhostRef = useRef(null);
  const newListInputRef = useRef(null);

  // Filter out archived lists for display
  const visibleLists = useMemo(() => {
    return state.lists.filter((list) => !list.archived);
  }, [state.lists]);

  // Get cards for a specific list - memoized per list
  const getCardsForList = useCallback(
    (listId) => {
      return state.cards.filter((card) => card.listId === listId);
    },
    [state.cards]
  );

  // ============================================
  // Drag & Drop Handlers (HTML5 DnD API)
  // ============================================

  /**
   * Called when drag starts on a card
   * Sets up drag data and visual feedback
   */
  const handleDragStart = useCallback((e, card, sourceListId) => {
    setDraggedCard({ ...card, sourceListId });

    // Set drag data for HTML5 DnD
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        cardId: card.id,
        sourceListId,
      })
    );

    // Add dragging class for visual feedback
    e.target.classList.add('opacity-50', 'rotate-2');

    // Custom drag image (optional enhancement)
    if (dragGhostRef.current) {
      dragGhostRef.current.textContent = card.title;
      e.dataTransfer.setDragImage(dragGhostRef.current, 0, 0);
    }
  }, []);

  /**
   * Called when drag ends (drop or cancel)
   * Cleans up drag state
   */
  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('opacity-50', 'rotate-2');
    setDraggedCard(null);
    setDragOverListId(null);
    setDragOverIndex(null);
  }, []);

  /**
   * Called when dragging over a valid drop target
   * Calculates drop position based on mouse position
   */
  const handleDragOver = useCallback((e, listId, cardIndex = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    setDragOverListId(listId);

    if (cardIndex !== null) {
      setDragOverIndex(cardIndex);
    }
  }, []);

  /**
   * Called when leaving a drop target
   */
  const handleDragLeave = useCallback((e) => {
    // Only clear if leaving the list entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverListId(null);
      setDragOverIndex(null);
    }
  }, []);

  /**
   * Called when card is dropped on a target
   * Handles both reordering within a list and moving between lists
   */
  const handleDrop = useCallback(
    (e, targetListId, targetIndex = null) => {
      e.preventDefault();

      if (!draggedCard) return;

      const { id: cardId, sourceListId } = draggedCard;

      // Calculate final index
      const targetCards = getCardsForList(targetListId);
      const finalIndex =
        targetIndex !== null ? targetIndex : targetCards.length;

      if (sourceListId === targetListId) {
        // Reordering within the same list
        const currentIndex = targetCards.findIndex((c) => c.id === cardId);
        if (currentIndex !== finalIndex && currentIndex !== finalIndex - 1) {
          reorderCard(cardId, targetListId, finalIndex);
        }
      } else {
        // Moving to a different list
        moveCard(cardId, sourceListId, targetListId, finalIndex);
      }

      // Clean up drag state
      setDraggedCard(null);
      setDragOverListId(null);
      setDragOverIndex(null);
    },
    [draggedCard, getCardsForList, moveCard, reorderCard]
  );

  // ============================================
  // List Management Handlers
  // ============================================

  /**
   * Initiates adding a new list
   */
  const handleStartAddList = useCallback(() => {
    setIsAddingList(true);
    // Focus input after render
    setTimeout(() => {
      newListInputRef.current?.focus();
    }, 0);
  }, []);

  /**
   * Confirms adding a new list
   */
  const handleConfirmAddList = useCallback(() => {
    const trimmedTitle = newListTitle.trim();
    if (trimmedTitle) {
      addList(trimmedTitle);
      setNewListTitle('');
      setIsAddingList(false);
    }
  }, [newListTitle, addList]);

  /**
   * Cancels adding a new list
   */
  const handleCancelAddList = useCallback(() => {
    setNewListTitle('');
    setIsAddingList(false);
  }, []);

  /**
   * Handles keyboard events for new list input
   */
  const handleNewListKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmAddList();
      } else if (e.key === 'Escape') {
        handleCancelAddList();
      }
    },
    [handleConfirmAddList, handleCancelAddList]
  );

  /**
   * Shows confirmation dialog before archiving a list
   */
  const handleArchiveList = useCallback((listId, listTitle) => {
    setConfirmDialog({
      title: 'Archive List',
      message: `Are you sure you want to archive "${listTitle}"? Cards in this list will be preserved but hidden.`,
      onConfirm: () => {
        archiveList(listId);
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  }, [archiveList]);

  // ============================================
  // Card Detail Modal Handlers
  // ============================================

  /**
   * Opens card detail modal
   */
  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  /**
   * Closes card detail modal
   */
  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <div
      className="board-container flex-1 flex overflow-x-auto overflow-y-hidden p-6 gap-4"
      role="region"
      aria-label="Kanban board"
    >
      {/* Hidden drag ghost element for custom drag image */}
      <div
        ref={dragGhostRef}
        className="fixed -left-[9999px] bg-slate-800 text-white px-3 py-2 rounded shadow-lg text-sm font-medium max-w-[200px] truncate"
        aria-hidden="true"
      />

      {/* List Columns */}
      {visibleLists.map((list, index) => (
        <ListColumn
          key={list.id}
          list={list}
          cards={getCardsForList(list.id)}
          index={index}
          isDragOver={dragOverListId === list.id}
          dragOverIndex={dragOverListId === list.id ? dragOverIndex : null}
          draggedCardId={draggedCard?.id}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onCardClick={handleCardClick}
          onArchiveList={handleArchiveList}
        />
      ))}

      {/* Add New List */}
      <div className="flex-shrink-0 w-72">
        {isAddingList ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50">
            <input
              ref={newListInputRef}
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={handleNewListKeyDown}
              onBlur={handleCancelAddList}
              placeholder="Enter list title..."
              className="w-full bg-slate-900/50 text-white placeholder-slate-400 px-3 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors text-sm"
              aria-label="New list title"
              maxLength={50}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleConfirmAddList();
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Add List
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCancelAddList();
                }}
                className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
                aria-label="Cancel adding list"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartAddList}
            className="w-full bg-slate-800/30 hover:bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 text-slate-400 hover:text-white transition-all flex items-center gap-2 group"
            aria-label="Add new list"
          >
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm font-medium">Add another list</span>
          </button>
        )}
      </div>

      {/* Card Detail Modal - Lazy loaded */}
      {selectedCard && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-8">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
              </div>
            </div>
          }
        >
          <CardDetailModal card={selectedCard} onClose={handleCloseModal} />
        </Suspense>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
};

// Memoize the entire Board component to prevent unnecessary re-renders
// from parent components (App) that don't affect the board
export default memo(Board);