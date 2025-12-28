import { describe, it, expect } from 'vitest';
import {
  sortByOrder,
  reorderArray,
  groupBy,
  truncateText,
  getTagColor,
  classNames,
  deepClone,
  isEqual,
  getCardsForList,
  getVisibleLists,
  generateSeedData,
} from '../utils/helpers';

describe('helpers', () => {
  describe('sortByOrder', () => {
    it('should sort items by order', () => {
      const items = [
        { id: 1, order: 2 },
        { id: 2, order: 0 },
        { id: 3, order: 1 },
      ];
      const sorted = sortByOrder(items);
      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(3);
      expect(sorted[2].id).toBe(1);
    });

    it('should handle missing order values', () => {
      const items = [{ id: 1 }, { id: 2, order: 0 }];
      const sorted = sortByOrder(items);
      expect(sorted[0].id).toBe(1);
    });
  });

  describe('reorderArray', () => {
    it('should reorder items', () => {
      const arr = ['a', 'b', 'c', 'd'];
      const result = reorderArray(arr, 0, 2);
      expect(result).toEqual(['b', 'c', 'a', 'd']);
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const grouped = groupBy(items, 'type');
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });

    it('should support function key', () => {
      const items = [{ value: 1 }, { value: 2 }, { value: 3 }];
      const grouped = groupBy(items, (item) => (item.value % 2 === 0 ? 'even' : 'odd'));
      expect(grouped.odd).toHaveLength(2);
      expect(grouped.even).toHaveLength(1);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const result = truncateText('Hello World', 8);
      expect(result).toBe('Hello...');
    });

    it('should not truncate short text', () => {
      const result = truncateText('Hi', 10);
      expect(result).toBe('Hi');
    });

    it('should handle empty text', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });
  });

  describe('getTagColor', () => {
    it('should return a color class', () => {
      const color = getTagColor('feature');
      expect(color).toContain('bg-');
      expect(color).toContain('text-');
    });

    it('should return consistent colors for same tag', () => {
      const color1 = getTagColor('bug');
      const color2 = getTagColor('bug');
      expect(color1).toBe(color2);
    });
  });

  describe('classNames', () => {
    it('should join class names', () => {
      const result = classNames('a', 'b', 'c');
      expect(result).toBe('a b c');
    });

    it('should filter falsy values', () => {
      const result = classNames('a', null, 'b', undefined, false, 'c');
      expect(result).toBe('a b c');
    });
  });

  describe('deepClone', () => {
    it('should create a deep copy', () => {
      const obj = { a: { b: 1 } };
      const clone = deepClone(obj);
      clone.a.b = 2;
      expect(obj.a.b).toBe(1);
    });
  });

  describe('isEqual', () => {
    it('should compare objects', () => {
      expect(isEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });
  });

  describe('getCardsForList', () => {
    it('should filter and sort cards', () => {
      const cards = [
        { id: '1', listId: 'list-1', order: 1 },
        { id: '2', listId: 'list-2', order: 0 },
        { id: '3', listId: 'list-1', order: 0 },
      ];
      const result = getCardsForList(cards, 'list-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('3');
    });
  });

  describe('getVisibleLists', () => {
    it('should filter archived lists', () => {
      const lists = [
        { id: '1', archived: false, order: 1 },
        { id: '2', archived: true, order: 0 },
        { id: '3', archived: false, order: 2 },
      ];
      const result = getVisibleLists(lists);
      expect(result).toHaveLength(2);
    });
  });

  describe('generateSeedData', () => {
    it('should generate specified number of cards', () => {
      const data = generateSeedData(100);
      expect(data.cards).toHaveLength(100);
      expect(data.lists.length).toBeGreaterThan(0);
    });

    it('should distribute cards across lists', () => {
      const data = generateSeedData(50);
      const listIds = [...new Set(data.cards.map((c) => c.listId))];
      expect(listIds.length).toBeGreaterThan(1);
    });
  });
});
