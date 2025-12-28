import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BoardProvider } from '../context/BoardProvider';
import { useBoardState } from '../hooks/useBoardState';

const wrapper = ({ children }) => <BoardProvider>{children}</BoardProvider>;

describe('useBoardState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide state', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });
    expect(result.current.state).toBeDefined();
    expect(result.current.state.lists).toBeDefined();
    expect(result.current.state.cards).toBeDefined();
  });

  it('should add a list', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('New List');
    });

    const newList = result.current.state.lists.find((l) => l.title === 'New List');
    expect(newList).toBeDefined();
  });

  it('should rename a list', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('Original');
    });

    const list = result.current.state.lists.find((l) => l.title === 'Original');

    act(() => {
      result.current.renameList(list.id, 'Renamed');
    });

    const renamed = result.current.state.lists.find((l) => l.id === list.id);
    expect(renamed.title).toBe('Renamed');
  });

  it('should archive a list', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('To Archive');
    });

    const list = result.current.state.lists.find((l) => l.title === 'To Archive');

    act(() => {
      result.current.archiveList(list.id);
    });

    const archived = result.current.state.lists.find((l) => l.id === list.id);
    expect(archived.archived).toBe(true);
  });

  it('should add a card', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('Test List');
    });

    const list = result.current.state.lists.find((l) => l.title === 'Test List');

    act(() => {
      result.current.addCard(list.id, 'New Card', 'Description');
    });

    const card = result.current.state.cards.find((c) => c.title === 'New Card');
    expect(card).toBeDefined();
    expect(card.description).toBe('Description');
  });

  it('should update a card', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('Test List');
    });

    const list = result.current.state.lists.find((l) => l.title === 'Test List');

    act(() => {
      result.current.addCard(list.id, 'Original');
    });

    const card = result.current.state.cards.find((c) => c.title === 'Original');

    act(() => {
      result.current.updateCard(card.id, { title: 'Updated', tags: ['tag1'] });
    });

    const updated = result.current.state.cards.find((c) => c.id === card.id);
    expect(updated.title).toBe('Updated');
    expect(updated.tags).toContain('tag1');
  });

  it('should delete a card', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('Test List');
    });

    const list = result.current.state.lists.find((l) => l.title === 'Test List');

    act(() => {
      result.current.addCard(list.id, 'To Delete');
    });

    const card = result.current.state.cards.find((c) => c.title === 'To Delete');
    const cardId = card.id;

    act(() => {
      result.current.deleteCard(cardId);
    });

    const deleted = result.current.state.cards.find((c) => c.id === cardId);
    expect(deleted).toBeUndefined();
  });

  it('should move a card between lists', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper });

    act(() => {
      result.current.addList('List 1');
      result.current.addList('List 2');
    });

    const list1 = result.current.state.lists.find((l) => l.title === 'List 1');
    const list2 = result.current.state.lists.find((l) => l.title === 'List 2');

    act(() => {
      result.current.addCard(list1.id, 'Moving Card');
    });

    const card = result.current.state.cards.find((c) => c.title === 'Moving Card');

    act(() => {
      result.current.moveCard(card.id, list1.id, list2.id, 0);
    });

    const moved = result.current.state.cards.find((c) => c.id === card.id);
    expect(moved.listId).toBe(list2.id);
  });
});
