import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useBoardState } from '../hooks/useBoardState';
import { validateCardTitle, validateCardDescription, validateTags } from '../utils/validators';

const CardDetailModal = ({ card, onClose }) => {
  const { updateCard, deleteCard } = useBoardState();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(card.tags || []);
  const [errors, setErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const modalRef = useRef(null);
  const titleInputRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    titleInputRef.current?.focus();
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = useCallback(() => {
    const titleValidation = validateCardTitle(title);
    const descValidation = validateCardDescription(description);
    const tagsValidation = validateTags(tags);

    const newErrors = {};
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.errors[0];
    }
    if (!descValidation.isValid) {
      newErrors.description = descValidation.errors[0];
    }
    if (!tagsValidation.isValid) {
      newErrors.tags = tagsValidation.errors[0];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateCard(card.id, {
      title: titleValidation.sanitized,
      description: descValidation.sanitized,
      tags: tagsValidation.sanitized,
    });
    onClose();
  }, [card.id, title, description, tags, updateCard, onClose]);

  const handleDelete = useCallback(() => {
    if (isDeleting) {
      deleteCard(card.id);
      onClose();
    } else {
      setIsDeleting(true);
    }
  }, [card.id, isDeleting, deleteCard, onClose]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleTagKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const getTagColor = (tag) => {
    // Monochrome / Red-Accent Tag Palette for Dark Theme
    // All tags should look good on a black background
    const colors = [
      'bg-red-900/30 text-red-200 border-red-800/50',
      'bg-neutral-800 text-neutral-300 border-neutral-700',
      'bg-stone-900 text-stone-300 border-stone-800',
      'bg-red-950 text-red-300 border-red-900',
      'bg-neutral-900 text-gray-300 border-gray-800',
    ];

    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-gray-800 rounded-2xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-700/50">
          <div className="flex-1">
            <label htmlFor="card-title" className="sr-only">
              Card Title
            </label>
            <input
              ref={titleInputRef}
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              className={`w-full text-xl font-semibold bg-transparent text-white border-b-2 pb-1 focus:outline-none transition-colors ${errors.title
                ? 'border-red-500'
                : 'border-transparent focus:border-primary'
                }`}
              placeholder="Card title"
              maxLength={200}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-400">
                {errors.title}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="card-description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              className={`w-full h-32 px-3 py-2 bg-neutral-950/50 text-white placeholder-gray-400 border rounded-lg resize-none focus:outline-none focus:ring-1 transition-colors ${errors.description
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-700 focus:border-primary focus:ring-primary'
                }`}
              placeholder="Add a description..."
              maxLength={5000}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="card-tags" className="block text-sm font-medium text-gray-300 mb-2">
              Tags ({tags.length}/10)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full border ${getTagColor(tag)}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white transition-colors"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="card-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 px-3 py-2 bg-neutral-950/50 text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                placeholder="Add a tag..."
                maxLength={20}
                disabled={tags.length >= 10}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
            {errors.tags && (
              <p className="mt-1 text-sm text-red-400">{errors.tags}</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">
              Created: {new Date(card.createdAt).toLocaleString()}
              {card.lastModifiedAt && card.lastModifiedAt !== card.createdAt && (
                <span className="ml-4">
                  Modified: {new Date(card.lastModifiedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-700/50">
          <button
            type="button"
            onClick={handleDelete}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDeleting
              ? 'bg-primary hover:bg-primary-hover text-white'
              : 'text-red-400 hover:text-red-300 hover:bg-gray-700'
              }`}
          >
            {isDeleting ? 'Click to confirm delete' : 'Delete card'}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CardDetailModal);
