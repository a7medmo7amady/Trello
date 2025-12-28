import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix = '') => {
  return `${prefix}${uuidv4()}`;
};

export const sortByOrder = (items) => {
  return [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const reorderArray = (array, fromIndex, toIndex) => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

export const moveItemBetweenArrays = (
  sourceArray,
  destArray,
  sourceIndex,
  destIndex
) => {
  const sourceClone = [...sourceArray];
  const destClone = [...destArray];
  const [removed] = sourceClone.splice(sourceIndex, 1);
  destClone.splice(destIndex, 0, removed);

  return {
    source: sourceClone,
    destination: destClone,
    movedItem: removed,
  };
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

export const getTagColor = (tag) => {
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

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const isEqual = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const getCardsForList = (cards, listId) => {
  return sortByOrder(cards.filter((card) => card.listId === listId));
};

export const getVisibleLists = (lists) => {
  return sortByOrder(lists.filter((list) => !list.archived));
};

export const getArchivedLists = (lists) => {
  return sortByOrder(lists.filter((list) => list.archived));
};

export const countCardsInList = (cards, listId) => {
  return cards.filter((card) => card.listId === listId).length;
};

export const generateSeedData = (numCards = 500) => {
  const lists = [
    { id: 'list-1', title: 'Backlog', order: 0, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-2', title: 'To Do', order: 1, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-3', title: 'In Progress', order: 2, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-4', title: 'Review', order: 3, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: 'list-5', title: 'Done', order: 4, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
  ];

  const tags = ['feature', 'bug', 'enhancement', 'documentation', 'testing', 'urgent', 'low-priority'];
  const adjectives = ['Important', 'Critical', 'Minor', 'Major', 'Quick', 'Complex', 'Simple'];
  const nouns = ['Task', 'Feature', 'Bug', 'Update', 'Fix', 'Enhancement', 'Issue'];

  const cards = [];

  for (let i = 0; i < numCards; i++) {
    const listIndex = i % lists.length;
    const listId = lists[listIndex].id;
    const orderInList = Math.floor(i / lists.length);

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const title = `${adj} ${noun} #${i + 1}`;

    const numTags = Math.floor(Math.random() * 3);
    const cardTags = [];
    for (let j = 0; j < numTags; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)];
      if (!cardTags.includes(tag)) {
        cardTags.push(tag);
      }
    }

    cards.push({
      id: `card-${i + 1}`,
      listId,
      title,
      description: Math.random() > 0.5 ? `Description for ${title}. This is sample content for testing performance with many cards.` : '',
      tags: cardTags,
      order: orderInList,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      version: 1,
    });
  }

  return { lists, cards };
};

export default {
  generateId,
  sortByOrder,
  reorderArray,
  moveItemBetweenArrays,
  groupBy,
  debounce,
  throttle,
  formatDate,
  truncateText,
  getTagColor,
  classNames,
  deepClone,
  isEqual,
  getCardsForList,
  getVisibleLists,
  getArchivedLists,
  countCardsInList,
  generateSeedData,
};
