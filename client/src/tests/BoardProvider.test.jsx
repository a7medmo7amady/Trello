import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BoardProvider, BoardStateContext, BoardDispatchContext } from '../context/BoardProvider';
import * as storageService from '../services/storage';

vi.mock('../services/storage', () => ({
    loadFromStorage: vi.fn(),
    saveToStorage: vi.fn(),
}));

const TestConsumer = () => {
    const state = React.useContext(BoardStateContext);
    const dispatch = React.useContext(BoardDispatchContext);
    return (
        <div>
            <div data-testid="list-count">{state.lists.length}</div>
            <div data-testid="is-online">{state.isOnline ? 'online' : 'offline'}</div>
            <button onClick={() => dispatch({ type: 'TEST_ACTION' })}>Dispatch</button>
        </div>
    );
};

import React from 'react';

describe('BoardProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with seed data when storage is empty', () => {
        storageService.loadFromStorage.mockReturnValue(null);

        render(
            <BoardProvider>
                <TestConsumer />
            </BoardProvider>
        );

        // Default seed data has 4 lists
        expect(screen.getByTestId('list-count')).toHaveTextContent('4');
    });

    it('initializes with stored data when available', () => {
        const storedData = {
            lists: [{ id: 'l1', title: 'Stored List' }],
            cards: [],
            syncQueue: [],
            lastSyncedAt: null
        };
        storageService.loadFromStorage.mockReturnValue(storedData);

        render(
            <BoardProvider>
                <TestConsumer />
            </BoardProvider>
        );

        expect(screen.getByTestId('list-count')).toHaveTextContent('1');
    });

    it('updates online status based on window events', () => {
        storageService.loadFromStorage.mockReturnValue(null);
        render(
            <BoardProvider>
                <TestConsumer />
            </BoardProvider>
        );

        // Simulate offline
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(screen.getByTestId('is-online')).toHaveTextContent('offline');

        // Simulate online
        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        expect(screen.getByTestId('is-online')).toHaveTextContent('online');
    });
});
