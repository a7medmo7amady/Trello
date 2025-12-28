import { memo, useState, useCallback, useRef } from 'react';
import Card from './Card';
import InlineEditor from './InlineEditor';
import { useBoardState } from '../hooks/useBoardState';

const ListColumn = ({
  list,
  cards,
  index: _index,
  isDragOver,
  dragOverIndex,
  draggedCardId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
  onArchiveList,
}) => {
  const { addCard, renameList } = useBoardState();

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const newCardInputRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);

  const sortedCards = [...cards].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleStartAddCard = useCallback(() => {
    setIsAddingCard(true);
    setTimeout(() => {
      newCardInputRef.current?.focus();
    }, 0);
  }, []);

  const handleConfirmAddCard = useCallback(() => {
    const trimmedTitle = newCardTitle.trim();
    if (trimmedTitle) {
      addCard(list.id, trimmedTitle);
      setNewCardTitle('');
      newCardInputRef.current?.focus();
    }
  }, [newCardTitle, list.id, addCard]);

  const handleCancelAddCard = useCallback(() => {
    setNewCardTitle('');
    setIsAddingCard(false);
  }, []);

  const handleNewCardKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirmAddCard();
      } else if (e.key === 'Escape') {
        handleCancelAddCard();
      }
    },
    [handleConfirmAddCard, handleCancelAddCard]
  );

  const handleTitleSave = useCallback(
    (newTitle) => {
      if (newTitle.trim() && newTitle !== list.title) {
        renameList(list.id, newTitle);
      }
      setIsEditingTitle(false);
    },
    [list.id, list.title, renameList]
  );

  const handleTitleCancel = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleToggleMenu = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  const handleArchive = useCallback(() => {
    setShowMenu(false);
    onArchiveList(list.id, list.title);
  }, [list.id, list.title, onArchiveList]);

  const handleListDragOver = useCallback(
    (e) => {
      e.preventDefault();
      onDragOver(e, list.id);
    },
    [list.id, onDragOver]
  );

  const handleListDrop = useCallback(
    (e) => {
      e.preventDefault();
      onDrop(e, list.id, sortedCards.length);
    },
    [list.id, sortedCards.length, onDrop]
  );

  const handleCardDragOver = useCallback(
    (e, cardIndex) => {
      e.preventDefault();
      e.stopPropagation();
      onDragOver(e, list.id, cardIndex);
    },
    [list.id, onDragOver]
  );

  const handleCardDrop = useCallback(
    (e, cardIndex) => {
      e.preventDefault();
      e.stopPropagation();
      onDrop(e, list.id, cardIndex);
    },
    [list.id, onDrop]
  );

  return (
    <div
      ref={listRef}
      className={`
        list-column flex-shrink-0 w-72 flex flex-col max-h-full
        bg-gray-800/60 backdrop-blur-sm rounded-xl
        border transition-all duration-200
        ${isDragOver ? 'border-primary/50 bg-gray-800/80' : 'border-gray-700/50'}
      `}
      onDragOver={handleListDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleListDrop}
      role="region"
      aria-label={`${list.title} list with ${sortedCards.length} cards`}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        {isEditingTitle ? (
          <InlineEditor
            initialValue={list.title}
            onSave={handleTitleSave}
            onCancel={handleTitleCancel}
            className="flex-1"
            maxLength={50}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-left font-semibold text-white hover:text-red-400 transition-colors truncate"
            aria-label={`Edit ${list.title} title`}
          >
            {list.title}
          </button>
        )}

        <span className="mx-2 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-700/50 rounded-full">
          {sortedCards.length}
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={handleToggleMenu}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            aria-label="List options"
            aria-expanded={showMenu}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
                onKeyDown={(e) => e.key === 'Escape' && setShowMenu(false)}
                role="button"
                tabIndex={0}
                aria-label="Close menu"
              />
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTitle(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  role="menuitem"
                >
                  Rename list
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                  role="menuitem"
                >
                  Archive list
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
        role="list"
        aria-label={`Cards in ${list.title}`}
      >
        {sortedCards.map((card, cardIndex) => (
          <div
            key={card.id}
            role="listitem"
            onDragOver={(e) => handleCardDragOver(e, cardIndex)}
            onDrop={(e) => handleCardDrop(e, cardIndex)}
          >
            {isDragOver && dragOverIndex === cardIndex && draggedCardId !== card.id && (
              <div className="h-1 bg-primary rounded-full mb-2 animate-pulse" />
            )}
            <Card
              card={card}
              listId={list.id}
              isDragging={draggedCardId === card.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onCardClick}
            />
          </div>
        ))}

        {isDragOver && dragOverIndex === sortedCards.length && (
          <div className="h-1 bg-primary rounded-full animate-pulse" />
        )}

        {sortedCards.length === 0 && !isDragOver && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No cards yet
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-700/50">
        {isAddingCard ? (
          <div className="space-y-2">
            <textarea
              ref={newCardInputRef}
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleNewCardKeyDown}
              placeholder="Enter card title..."
              className="w-full bg-gray-900/50 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors text-sm resize-none"
              rows={2}
              aria-label="New card title"
              maxLength={200}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmAddCard}
                className="flex-1 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={handleCancelAddCard}
                className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
                aria-label="Cancel adding card"
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
            onClick={handleStartAddCard}
            className="w-full text-left px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2 group"
            aria-label={`Add card to ${list.title}`}
          >
            <svg
              className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors"
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
            <span className="text-sm">Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(ListColumn);
