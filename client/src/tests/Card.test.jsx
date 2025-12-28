import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '../components/Card';

describe('Card', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    tags: ['feature', 'urgent'],
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    version: 1,
  };

  const mockProps = {
    card: mockCard,
    listId: 'list-1',
    isDragging: false,
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onClick: vi.fn(),
  };

  it('should render card title', () => {
    render(<Card {...mockProps} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should render card description', () => {
    render(<Card {...mockProps} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(<Card {...mockProps} />);
    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('should limit displayed tags to 3', () => {
    const cardWithManyTags = {
      ...mockCard,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };
    render(<Card {...mockProps} card={cardWithManyTags} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    render(<Card {...mockProps} />);
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(mockProps.onClick).toHaveBeenCalledWith(mockCard);
  });

  it('should be keyboard accessible', () => {
    render(<Card {...mockProps} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(mockProps.onClick).toHaveBeenCalled();
  });

  it('should have correct aria-label', () => {
    render(<Card {...mockProps} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Card: Test Card. Press Enter to edit.');
  });

  it('should be draggable', () => {
    render(<Card {...mockProps} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('draggable', 'true');
  });

  it('should call onDragStart when drag starts', () => {
    render(<Card {...mockProps} />);
    const card = screen.getByRole('button');
    fireEvent.dragStart(card, {
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn(),
        setDragImage: vi.fn(),
      },
    });
    expect(mockProps.onDragStart).toHaveBeenCalled();
  });

  it('should apply dragging styles when isDragging is true', () => {
    render(<Card {...mockProps} isDragging={true} />);
    const card = screen.getByRole('button');
    expect(card.className).toContain('opacity-50');
  });
});
