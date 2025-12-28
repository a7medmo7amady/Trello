import { memo, useState, useEffect, useRef, useCallback } from 'react';

/**
 * InlineEditor Component
 *
 * Inline text editing component with save/cancel functionality.
 * Used for editing list titles and other inline text.
 *
 * @param {Object} props
 * @param {string} props.initialValue - Initial text value
 * @param {Function} props.onSave - Called with new value on save
 * @param {Function} props.onCancel - Called on cancel
 * @param {string} [props.placeholder='Enter text...'] - Placeholder text
 * @param {number} [props.maxLength=100] - Maximum character length
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.multiline=false] - Use textarea instead of input
 */
const InlineEditor = ({
  initialValue,
  onSave,
  onCancel,
  placeholder = 'Enter text...',
  maxLength = 100,
  className = '',
  multiline = false,
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      onSave(trimmedValue);
    } else {
      onCancel();
    }
  }, [value, onSave, onCancel]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSave, onCancel]
  );

  // Handle blur
  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Handle change
  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  // Common props for both input and textarea
  const commonProps = {
    ref: inputRef,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    placeholder,
    maxLength,
    className: `
      w-full bg-slate-900/70 text-white placeholder-slate-400
      px-2 py-1 rounded border border-cyan-500
      focus:outline-none focus:ring-1 focus:ring-cyan-500
      text-sm font-semibold
      ${className}
    `,
    'aria-label': placeholder,
  };

  if (multiline) {
    return (
      <textarea
        {...commonProps}
        rows={3}
        className={`${commonProps.className} resize-none`}
      />
    );
  }

  return <input type="text" {...commonProps} />;
};

export default memo(InlineEditor);
