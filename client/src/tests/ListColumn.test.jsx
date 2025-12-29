import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardProvider } from '../context/BoardProvider';
import ListColumn from '../components/ListColumn';

const mockList = {
  id: 'list-1',
  title: 'Test List',
  order: 0,
  archived: false,
};

const mockCards = [
  { id: 'card-1', listId: 'list-1', title: 'Card 1', order: 0, tags: [] },
  { id: 'card-2', listId: 'list-1', title: 'Card 2', order: 1, tags: [] },
];

const defaultProps = {
  list: mockList,
  cards: mockCards,
  index: 0,
  isDragOver: false,
  dragOverIndex: null,
  draggedCardId: null,
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
  onCardClick: vi.fn(),
  onArchiveList: vi.fn(),
};

const renderWithProvider = (props = {}) => {
  return render(
    <BoardProvider>
      <ListColumn {...defaultProps} {...props} />
    </BoardProvider>
  );
};

describe('ListColumn', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render list title', () => {
    renderWithProvider();
    expect(screen.getByText('Test List')).toBeInTheDocument();
  });

  it('should render card count', () => {
    renderWithProvider();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render cards', () => {
    renderWithProvider();
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('should show add card button', () => {
    renderWithProvider();
    expect(screen.getByText(/add a card/i)).toBeInTheDocument();
  });

  it('should show add card form when clicking add button', () => {
    renderWithProvider();
    const addButton = screen.getByText(/add a card/i);
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText(/enter card title/i)).toBeInTheDocument();
  });

  it('should show menu when clicking menu button', () => {
    renderWithProvider();
    const menuButton = screen.getByLabelText(/list options/i);
    fireEvent.click(menuButton);

    expect(screen.getByText(/rename list/i)).toBeInTheDocument();
    expect(screen.getByText(/archive list/i)).toBeInTheDocument();
  });

  it('should call onArchiveList when archive is clicked', () => {
    const onArchiveList = vi.fn();
    renderWithProvider({ onArchiveList });

    const menuButton = screen.getByLabelText(/list options/i);
    fireEvent.click(menuButton);

    const archiveButton = screen.getByText(/archive list/i);
    fireEvent.click(archiveButton);

    expect(onArchiveList).toHaveBeenCalledWith('list-1', 'Test List');
  });

  it('should show empty state when no cards', () => {
    renderWithProvider({ cards: [] });
    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument();
  });

  it('should have proper accessibility role', () => {
    renderWithProvider();
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should apply drag over styles when isDragOver is true', () => {
    renderWithProvider({ isDragOver: true });
    const region = screen.getByRole('region');
    expect(region.className).toContain('border-primary');
  });

  it('should handle card drag over', () => {
    const onDragOver = vi.fn();
    renderWithProvider({ onDragOver });

    const cards = screen.getAllByRole('listitem');
    fireEvent.dragOver(cards[0]);

    expect(onDragOver).toHaveBeenCalled();
  });
});
