import { describe, it, expect, beforeEach } from 'vitest';
import { boardReducer, initialState, ACTIONS } from '../context/boardReducer';

describe('Conflict Resolution Logic Verification', () => {
    let state;

    beforeEach(() => {
        state = { ...initialState };
        state.lists = [{ id: 'list-1', title: 'Local Title', version: 1 }];
        state.cards = [{ id: 'card-1', listId: 'list-1', title: 'Local Card', version: 1 }];
    });

    it('should overwrite server when KEEPING LOCAL changes', () => {
        // Setup: Conflict where server has v2, local has v1
        const conflict = {
            id: 'c-1',
            itemId: 'card-1',
            type: 'card',
            localVersion: { id: 'card-1', title: 'Local Card', version: 1 },
            serverVersion: { id: 'card-1', title: 'Server Card', version: 2 }
        };

        state.conflicts = [conflict];

        // Action: Resolve keeping 'local'
        const action = {
            type: ACTIONS.RESOLVE_CONFLICT,
            payload: { conflictId: 'c-1', resolution: 'local' }
        };

        const newState = boardReducer(state, action);

        // 1. Conflict should be removed
        expect(newState.conflicts).toHaveLength(0);

        // 2. Local state should persist
        expect(newState.cards[0].title).toBe('Local Card');

        // 3. CRITICAL: Should queue an update to force-overwrite server
        expect(newState.syncQueue).toHaveLength(1);
        expect(newState.syncQueue[0].type).toBe('UPDATE_CARD');
        expect(newState.syncQueue[0].data.title).toBe('Local Card');
        // Version should be server version (2) + 1 = 3 to win
        expect(newState.syncQueue[0].data.version).toBe(3);
    });

    it('should restore server version when USING SERVER', () => {
        const conflict = {
            id: 'c-1',
            itemId: 'card-1',
            type: 'card',
            localVersion: { id: 'card-1', title: 'Local Card', version: 1 },
            serverVersion: { id: 'card-1', title: 'Server Card', version: 2 }
        };

        state.conflicts = [conflict];

        // Action: Resolve using 'server'
        const action = {
            type: ACTIONS.RESOLVE_CONFLICT,
            payload: { conflictId: 'c-1', resolution: 'server' }
        };

        const newState = boardReducer(state, action);

        // 1. Conflict should be removed
        expect(newState.conflicts).toHaveLength(0);

        // 2. Local state should be updated to match server
        expect(newState.cards[0].title).toBe('Server Card');

        // 3. Should NOT have queued any updates (we just accepted server state)
        expect(newState.syncQueue).toHaveLength(0);
    });
});
