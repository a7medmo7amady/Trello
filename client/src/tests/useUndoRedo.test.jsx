import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BoardProvider } from '../context/BoardProvider';
import { useBoardState } from '../hooks/useBoardState';
import { useUndoRedo } from '../hooks/useUndoRedo';

const wrapper = ({ children }) => <BoardProvider>{children}</BoardProvider>;

const useCombinedHooks = () => {
  const boardState = useBoardState();
  const undoRedo = useUndoRedo();
  return { boardState, undoRedo };
};

describe('useUndoRedo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with no undo/redo available', () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should enable undo after action', () => {
    const { result } = renderHook(() => useCombinedHooks(), { wrapper });

    act(() => {
      result.current.boardState.addList('Test');
    });

    expect(result.current.undoRedo.canUndo).toBe(true);
  });

  it('should undo last action', () => {
    const { result } = renderHook(() => useCombinedHooks(), { wrapper });

    const initialListCount = result.current.boardState.state.lists.length;

    act(() => {
      result.current.boardState.addList('To Undo');
    });

    expect(result.current.boardState.state.lists.length).toBe(initialListCount + 1);

    act(() => {
      result.current.undoRedo.undo();
    });

    expect(result.current.boardState.state.lists.length).toBe(initialListCount);
  });

  it('should redo after undo', () => {
    const { result } = renderHook(() => useCombinedHooks(), { wrapper });

    const initialListCount = result.current.boardState.state.lists.length;

    act(() => {
      result.current.boardState.addList('To Redo');
    });

    act(() => {
      result.current.undoRedo.undo();
    });

    expect(result.current.boardState.state.lists.length).toBe(initialListCount);
    expect(result.current.undoRedo.canRedo).toBe(true);

    act(() => {
      result.current.undoRedo.redo();
    });

    expect(result.current.boardState.state.lists.length).toBe(initialListCount + 1);
  });

  it('should track history length', () => {
    const { result } = renderHook(() => useCombinedHooks(), { wrapper });

    act(() => {
      result.current.boardState.addList('List 1');
    });

    act(() => {
      result.current.boardState.addList('List 2');
    });

    expect(result.current.undoRedo.historyLength).toBeGreaterThanOrEqual(2);
  });
});
