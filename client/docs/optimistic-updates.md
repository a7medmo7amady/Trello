# Optimistic Updates

## Overview

Optimistic updates provide instant UI feedback while asynchronously syncing with the server. This document details the implementation flow from user action to sync resolution.

## Event Sequence

### 1. User Action
When a user performs an action (e.g., adding a card), the handler in `Board.jsx` or `ListColumn.jsx` calls a function from `useBoardState`:

```javascript
// src/components/ListColumn.jsx:71-77
const handleConfirmAddCard = useCallback(() => {
  const trimmedTitle = newCardTitle.trim();
  if (trimmedTitle) {
    addCard(list.id, trimmedTitle);
    setNewCardTitle('');
  }
}, [newCardTitle, list.id, addCard]);
```

### 2. Immediate UI Update
The `addCard` function in `useBoardState` (`src/hooks/useBoardState.js:53-56`) dispatches an action that immediately updates the local state:

```javascript
const addCard = useCallback(
  (listId, title, description = '', tags = []) => {
    pushHistory(); // Save for undo
    dispatch({ type: ACTIONS.ADD_CARD, payload: { listId, title, description, tags } });
  },
  [dispatch, pushHistory]
);
```

The reducer (`src/context/boardReducer.js:158-172`) creates the card and adds it to both the cards array and the sync queue:

```javascript
case ACTIONS.ADD_CARD: {
  const newCard = { ...createCard(listId, title, maxOrder + 1), description, tags };
  return {
    ...state,
    cards: [...state.cards, newCard],
    syncQueue: [
      ...state.syncQueue,
      { type: 'CREATE_CARD', data: newCard, timestamp: Date.now(), id: uuidv4() },
    ],
  };
}
```

### 3. Local Queueing
Changes are queued in `state.syncQueue` with unique IDs and timestamps. The `useOfflineSync` hook (`src/hooks/useOfflineSync.js:28-32`) persists this queue to localStorage for resilience across page reloads:

```javascript
const persistQueue = useCallback((queue) => {
  saveToStorage(SYNC_QUEUE_KEY, queue);
}, []);
```

### 4. Server Sync
The sync process is triggered by:
- Online event listener (`src/hooks/useOfflineSync.js:102-111`)
- Periodic timer every 30 seconds (`src/hooks/useOfflineSync.js:113-123`)

The `processQueue` function (`src/hooks/useOfflineSync.js:37-98`) sends queued changes to the mock server:

```javascript
const result = await api.syncChanges(queueToProcess);
```

### 5. Success Handling
On successful sync, items are removed from the queue (`src/hooks/useOfflineSync.js:72-75`):

```javascript
for (const id of successfulIds) {
  dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: { queueId: id } });
}
```

The `lastSyncedAt` timestamp is updated to indicate successful synchronization.

### 6. Failure Handling
If sync fails, the error is captured and retry logic kicks in (`src/hooks/useOfflineSync.js:89-97`):

```javascript
retryCountRef.current += 1;
if (retryCountRef.current < MAX_RETRIES) {
  setTimeout(() => {
    if (isMountedRef.current && navigator.onLine) {
      processQueue();
    }
  }, RETRY_DELAY * retryCountRef.current);
}
```

The UI displays an error message via `lastSyncError` state, but the local changes remain in place. Users can continue working, and the changes will be retried.

## Rollback Mechanism

For critical failures where server rejects the change, the application can revert using the undo system (`src/hooks/useUndoRedo.js`). Each action pushes the previous state to history before making changes, allowing users to undo failed operations.

## Visual Feedback

The Header component (`src/components/Header.jsx:9-22`) displays sync status:
- Green "Synced" when queue is empty
- Amber "X pending" when changes are queued
- Red "Offline" when disconnected
- Spinner animation during active sync

This provides users with confidence that their changes are being saved, even when network conditions are poor.
