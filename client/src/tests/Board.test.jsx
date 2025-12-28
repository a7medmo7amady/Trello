import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoardProvider } from '../context/BoardProvider';
import Board from '../components/Board';

const renderWithProvider = (ui) => {
  return render(<BoardProvider>{ui}</BoardProvider>);
};

describe('Board', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render the board', () => {
    renderWithProvider(<Board />);
    expect(screen.getByRole('region', { name: /kanban board/i })).toBeInTheDocument();
  });

  it('should display add list button', () => {
    renderWithProvider(<Board />);
    expect(screen.getByText(/add.*list/i)).toBeInTheDocument();
  });

  it('should render existing lists from seed data', () => {
    renderWithProvider(<Board />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('should show add list form when clicking add button', () => {
    renderWithProvider(<Board />);
    const addButton = screen.getByText(/add.*list/i);
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText(/enter list title/i)).toBeInTheDocument();
  });

  it('should add a new list', async () => {
    renderWithProvider(<Board />);

    const addButton = screen.getByText(/add.*list/i);
    fireEvent.click(addButton);

    const input = screen.getByPlaceholderText(/enter list title/i);
    fireEvent.change(input, { target: { value: 'New Test List' } });

    // Submit by pressing Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('New Test List')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should cancel adding list on escape', () => {
    renderWithProvider(<Board />);

    const addButton = screen.getByText(/add.*list/i);
    fireEvent.click(addButton);

    const input = screen.getByPlaceholderText(/enter list title/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProvider(<Board />);

    const board = screen.getByRole('region', { name: /kanban board/i });
    expect(board).toHaveAttribute('aria-label');
  });

  it('should display list count badge', () => {
    renderWithProvider(<Board />);
    // Seed data has lists with cards - check for card count badges
    const badges = screen.getAllByText(/\d+/);
    expect(badges.length).toBeGreaterThan(0);
  });
});
