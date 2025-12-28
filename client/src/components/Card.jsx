import { memo, useCallback } from 'react';

/**
 * Card Component
 *
 * Renders a single task card with drag & drop support.
 * Memoized to prevent unnecessary re-renders in large lists.
 *
 * @param {Object} props
 * @param {Object} props.card - Card data object
 * @param {string} props.listId - Parent list ID
 * @param {boolean} props.isDragging - Whether this card is being dragged
 * @param {Function} props.onDragStart - Drag start handler
 * @param {Function} props.onDragEnd - Drag end handler
 * @param {Function} props.onClick - Click handler to open detail modal
 */
const Card = ({
  card,
  listId,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  
  const handleDragStart = useCallback(
    (e) => {
      onDragStart(e, card, listId);
    },
    [card, listId, onDragStart]
  );

  const handleClick = useCallback(() => {
    onClick(card);
  }, [card, onClick]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(card);
      }
    },
    [card, onClick]
  );

  // ==========================================
  // Tag Colors
  // ==========================================

  const getTagColor = (tag) => {
    // Generate consistent color from tag string
    const colors = [
      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'bg-green-500/20 text-green-300 border-green-500/30',
      'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'bg-red-500/20 text-red-300 border-red-500/30',
    ];

    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Card: ${card.title}. Press Enter to edit.`}
      className={`
        card group cursor-pointer select-none
        bg-slate-900/60 hover:bg-slate-900/80
        border border-slate-700/50 hover:border-slate-600
        rounded-lg p-3 shadow-sm hover:shadow-md
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800
        ${isDragging ? 'opacity-50 rotate-2 scale-105 shadow-xl' : ''}
      `}
    >
      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs font-medium text-slate-400">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-medium text-white leading-snug break-words">
        {card.title}
      </h3>

      {/* Description preview */}
      {card.description && (
        <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/30">
        {/* Description indicator */}
        {card.description && (
          <div className="flex items-center text-slate-500" title="Has description">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
        )}

        {/* Drag handle indicator */}
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Memoize card component - only re-render when card data actually changes
// This is critical for performance with 500+ cards
export default memo(Card, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.title === nextProps.card.title &&
    prevProps.card.description === nextProps.card.description &&
    prevProps.card.version === nextProps.card.version &&
    prevProps.listId === nextProps.listId &&
    prevProps.isDragging === nextProps.isDragging &&
    // Don't compare function references - they're wrapped in useCallback in parent
    JSON.stringify(prevProps.card.tags) === JSON.stringify(nextProps.card.tags)
  );
});
