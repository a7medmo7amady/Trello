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
import ListColumn from './ListColumn';
import ConfirmDialog from './ConfirmDialog';

const CardDetailModal = lazy(() => import('./CardDetailModal'));

const Board = () => {
  const {
    state,
    addList,
    moveCard,
    reorderCard,
    archiveList,
  } = useBoardState();

  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const dragGhostRef = useRef(null);
  const newListInputRef = useRef(null);

  const visibleLists = useMemo(() => {
    return (state?.lists || [])
      .filter((list) => !list.archived)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [state?.lists]);

  const getCardsForList = useCallback(
    (listId) => {
      return (state?.cards || [])
        .filter((card) => card.listId === listId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    [state?.cards]
  );

  const handleDragStart = useCallback((e, card, sourceListId) => {
    setDraggedCard({ ...card, sourceListId });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        cardId: card.id,
        sourceListId,
      })
    );

    e.target.classList.add('opacity-50', 'rotate-2');

    if (dragGhostRef.current) {
      dragGhostRef.current.textContent = card.title;
      e.dataTransfer.setDragImage(dragGhostRef.current, 0, 0);
    }
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('opacity-50', 'rotate-2');
    setDraggedCard(null);
    setDragOverListId(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e, listId, cardIndex = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    setDragOverListId(listId);

    if (cardIndex !== null) {
      setDragOverIndex(cardIndex);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverListId(null);
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e, targetListId, targetIndex = null) => {
      e.preventDefault();

      if (!draggedCard) return;

      const { id: cardId, sourceListId } = draggedCard;

      const targetCards = getCardsForList(targetListId);
      const finalIndex =
        targetIndex !== null ? targetIndex : targetCards.length;

      if (sourceListId === targetListId) {
        const currentIndex = targetCards.findIndex((c) => c.id === cardId);
        if (currentIndex !== finalIndex && currentIndex !== finalIndex - 1) {
          reorderCard(cardId, targetListId, finalIndex);
        }
      } else {
        moveCard(cardId, sourceListId, targetListId, finalIndex);
      }

      setDraggedCard(null);
      setDragOverListId(null);
      setDragOverIndex(null);
    },
    [draggedCard, getCardsForList, moveCard, reorderCard]
  );

  const handleStartAddList = useCallback(() => {
    setIsAddingList(true);
    setTimeout(() => {
      newListInputRef.current?.focus();
    }, 0);
  }, []);

  const handleConfirmAddList = useCallback(() => {
    const trimmedTitle = newListTitle.trim();
    if (trimmedTitle) {
      addList(trimmedTitle);
      setNewListTitle('');
      setIsAddingList(false);
    }
  }, [newListTitle, addList]);

  const handleCancelAddList = useCallback(() => {
    setNewListTitle('');
    setIsAddingList(false);
  }, []);

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

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  return (
    <div
      className="board-container flex-1 flex overflow-x-auto overflow-y-hidden p-6 gap-4"
      role="region"
      aria-label="Kanban board"
    >
      <div
        ref={dragGhostRef}
        className="fixed -left-[9999px] bg-gray-800 text-white px-3 py-2 rounded shadow-lg text-sm font-medium max-w-[200px] truncate"
        aria-hidden="true"
      />

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

      <div className="flex-shrink-0 w-72">
        {isAddingList ? (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
            <input
              ref={newListInputRef}
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={handleNewListKeyDown}
              onBlur={handleCancelAddList}
              placeholder="Enter list title..."
              className="w-full bg-gray-900/80 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors text-sm"
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
                className="flex-1 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Add List
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCancelAddList();
                }}
                className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
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
            className="w-full bg-gray-800/40 hover:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30 hover:border-gray-600/50 text-gray-400 hover:text-white transition-all flex items-center gap-2 group"
            aria-label="Add new list"
          >
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-primary-light transition-colors"
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

      {selectedCard && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-neutral-900 border border-gray-800 rounded-xl p-8 shadow-2xl" role="status" aria-label="Loading">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </div>
          }
        >
          <CardDetailModal card={selectedCard} onClose={handleCloseModal} />
        </Suspense>
      )
      }

      {
        confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={confirmDialog.onCancel}
          />
        )
      }
    </div >
  );
};

export default memo(Board);
