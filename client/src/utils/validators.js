export const validateListTitle = (title) => {
  const errors = [];

  if (!title || typeof title !== 'string') {
    errors.push('Title is required');
    return { isValid: false, errors };
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    errors.push('Title cannot be empty');
  }

  if (trimmed.length > 50) {
    errors.push('Title must be 50 characters or less');
  }

  if (trimmed.length < 1) {
    errors.push('Title must be at least 1 character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

export const validateCardTitle = (title) => {
  const errors = [];

  if (!title || typeof title !== 'string') {
    errors.push('Title is required');
    return { isValid: false, errors };
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    errors.push('Title cannot be empty');
  }

  if (trimmed.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

export const validateCardDescription = (description) => {
  if (!description) {
    return { isValid: true, errors: [], sanitized: '' };
  }

  const errors = [];
  const trimmed = description.trim();

  if (trimmed.length > 5000) {
    errors.push('Description must be 5000 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

export const validateTag = (tag) => {
  const errors = [];

  if (!tag || typeof tag !== 'string') {
    errors.push('Tag is required');
    return { isValid: false, errors };
  }

  const trimmed = tag.trim().toLowerCase();

  if (trimmed.length === 0) {
    errors.push('Tag cannot be empty');
  }

  if (trimmed.length > 20) {
    errors.push('Tag must be 20 characters or less');
  }

  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    errors.push('Tag can only contain letters, numbers, and hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

export const validateTags = (tags) => {
  if (!tags || !Array.isArray(tags)) {
    return { isValid: true, errors: [], sanitized: [] };
  }

  const errors = [];
  const sanitized = [];

  if (tags.length > 10) {
    errors.push('Maximum 10 tags allowed');
  }

  for (const tag of tags.slice(0, 10)) {
    const result = validateTag(tag);
    if (result.isValid) {
      sanitized.push(result.sanitized);
    } else {
      errors.push(...result.errors);
    }
  }

  const uniqueTags = [...new Set(sanitized)];

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: uniqueTags,
  };
};

export const validateCard = (card) => {
  const errors = [];

  const titleResult = validateCardTitle(card.title);
  if (!titleResult.isValid) {
    errors.push(...titleResult.errors);
  }

  const descResult = validateCardDescription(card.description);
  if (!descResult.isValid) {
    errors.push(...descResult.errors);
  }

  const tagsResult = validateTags(card.tags);
  if (!tagsResult.isValid) {
    errors.push(...tagsResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      ...card,
      title: titleResult.sanitized,
      description: descResult.sanitized,
      tags: tagsResult.sanitized,
    },
  };
};

export const validateList = (list) => {
  const errors = [];

  const titleResult = validateListTitle(list.title);
  if (!titleResult.isValid) {
    errors.push(...titleResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      ...list,
      title: titleResult.sanitized,
    },
  };
};

export default {
  validateListTitle,
  validateCardTitle,
  validateCardDescription,
  validateTag,
  validateTags,
  validateCard,
  validateList,
};