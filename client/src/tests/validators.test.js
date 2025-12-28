import { describe, it, expect } from 'vitest';
import {
  validateListTitle,
  validateCardTitle,
  validateCardDescription,
  validateTag,
  validateTags,
  validateCard,
} from '../utils/validators';

describe('validators', () => {
  describe('validateListTitle', () => {
    it('should validate a valid title', () => {
      const result = validateListTitle('My List');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('My List');
    });

    it('should reject empty title', () => {
      const result = validateListTitle('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should reject title with only whitespace', () => {
      const result = validateListTitle('   ');
      expect(result.isValid).toBe(false);
    });

    it('should reject title longer than 50 characters', () => {
      const result = validateListTitle('a'.repeat(51));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title must be 50 characters or less');
    });

    it('should trim whitespace', () => {
      const result = validateListTitle('  My List  ');
      expect(result.sanitized).toBe('My List');
    });
  });

  describe('validateCardTitle', () => {
    it('should validate a valid title', () => {
      const result = validateCardTitle('My Card');
      expect(result.isValid).toBe(true);
    });

    it('should reject title longer than 200 characters', () => {
      const result = validateCardTitle('a'.repeat(201));
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCardDescription', () => {
    it('should allow empty description', () => {
      const result = validateCardDescription('');
      expect(result.isValid).toBe(true);
    });

    it('should allow null description', () => {
      const result = validateCardDescription(null);
      expect(result.isValid).toBe(true);
    });

    it('should reject description longer than 5000 characters', () => {
      const result = validateCardDescription('a'.repeat(5001));
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateTag', () => {
    it('should validate a valid tag', () => {
      const result = validateTag('feature');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('feature');
    });

    it('should convert to lowercase', () => {
      const result = validateTag('Feature');
      expect(result.sanitized).toBe('feature');
    });

    it('should allow hyphens', () => {
      const result = validateTag('high-priority');
      expect(result.isValid).toBe(true);
    });

    it('should reject special characters', () => {
      const result = validateTag('feature!');
      expect(result.isValid).toBe(false);
    });

    it('should reject tags longer than 20 characters', () => {
      const result = validateTag('a'.repeat(21));
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateTags', () => {
    it('should validate valid tags', () => {
      const result = validateTags(['feature', 'bug']);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toHaveLength(2);
    });

    it('should remove duplicates', () => {
      const result = validateTags(['feature', 'feature']);
      expect(result.sanitized).toHaveLength(1);
    });

    it('should limit to 10 tags', () => {
      const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
      const result = validateTags(tags);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCard', () => {
    it('should validate a valid card', () => {
      const card = {
        title: 'My Card',
        description: 'Description',
        tags: ['feature'],
      };
      const result = validateCard(card);
      expect(result.isValid).toBe(true);
    });

    it('should reject card with invalid title', () => {
      const card = {
        title: '',
        description: 'Description',
        tags: [],
      };
      const result = validateCard(card);
      expect(result.isValid).toBe(false);
    });
  });
});
