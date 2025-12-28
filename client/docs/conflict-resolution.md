# Conflict Resolution Approach

## Overview

Conflict resolution is essential for collaborative applications where multiple users (or the same user on different devices) may modify the same data simultaneously. This document details our three-way merge implementation and conflict resolution UI.

## Three-Way Merge Method

The three-way merge algorithm compares three versions of each item:
1. **Base**: The original version before any modifications
2. **Local**: The user's offline modifications
3. **Server**: The current server version

The merge logic is implemented in `src/services/api.js:225-262`:

```javascript
export const threeWayMerge = (base, local, server) => {
  if (!base) {
    return server || local;
  }

  const merged = { ...base };
  const allKeys = new Set([
    ...Object.keys(base),
    ...Object.keys(local || {}),
    ...Object.keys(server || {}),
  ]);

  for (const key of allKeys) {
    if (key === 'version' || key === 'lastModifiedAt') continue;

    const baseVal = base[key];
    const localVal = local?.[key];
    const serverVal = server?.[key];

    // If local unchanged, take server
    if (JSON.stringify(localVal) === JSON.stringify(baseVal)) {
      merged[key] = serverVal;
    }
    // If server unchanged, take local
    else if (JSON.stringify(serverVal) === JSON.stringify(baseVal)) {
      merged[key] = localVal;
    }
    // If both changed to same value, use it
    else if (JSON.stringify(localVal) === JSON.stringify(serverVal)) {
      merged[key] = localVal;
    }
    // Conflict - cannot auto-merge
    else {
      return null;
    }
  }

  return merged;
};
```

## Conflict Detection

Conflicts are detected during sync by comparing versions and timestamps (`src/services/api.js:198-222`):

```javascript
export const checkForConflicts = (localItem, serverItem) => {
  const localVersion = localItem.version || 0;
  const serverVersion = serverItem.version || 0;
  const localModified = new Date(localItem.lastModifiedAt || 0).getTime();
  const serverModified = new Date(serverItem.lastModifiedAt || 0).getTime();

  if (serverVersion > localVersion && serverModified > localModified) {
    return {
      id: uuidv4(),
      itemId: localItem.id,
      type: localItem.listId ? 'card' : 'list',
      localVersion: localItem,
      serverVersion: serverItem,
      detectedAt: new Date().toISOString(),
    };
  }
  return null;
};
```

## Resolution UI

When automatic merge fails, the conflict is added to `state.conflicts` via the `MERGE_CONFLICT` action (`src/context/boardReducer.js:312-318`). The Toolbar component displays a warning button when conflicts exist:

```javascript
// src/components/Toolbar.jsx:62-73
{conflicts.length > 0 && (
  <button onClick={handleOpenConflicts}>
    {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
  </button>
)}
```

Users are presented with a dialog showing both versions and can choose:
- **Keep Local**: Preserves the user's changes
- **Use Server**: Adopts the server version

The resolution is handled by the `RESOLVE_CONFLICT` action (`src/context/boardReducer.js:320-340`):

```javascript
case ACTIONS.RESOLVE_CONFLICT: {
  const { conflictId, resolution } = action.payload;
  const conflict = state.conflicts.find((c) => c.id === conflictId);

  if (resolution === 'server') {
    // Apply server version to state
    if (conflict.type === 'card') {
      newState.cards = newState.cards.map((card) =>
        card.id === conflict.itemId ? conflict.serverVersion : card
      );
    }
  }

  return {
    ...newState,
    conflicts: newState.conflicts.filter((c) => c.id !== conflictId),
  };
}
```

## Version Tracking

Each list and card maintains `version` and `lastModifiedAt` fields, incremented by the `touchItem` helper (`src/context/boardReducer.js:64-68`):

```javascript
const touchItem = (item) => ({
  ...item,
  lastModifiedAt: new Date().toISOString(),
  version: (item.version || 0) + 1,
});
```

This enables precise conflict detection and ensures that merged items have appropriate version numbers for future comparisons.

## Debugging Anecdote

During development, I encountered an issue where conflicts were being detected incorrectly for items that hadn't actually changed on the server. The root cause was that the initial seed data didn't have version fields set, causing `undefined + 1` to produce `NaN`. This was fixed by adding default value handling in `touchItem` and ensuring all seed data includes proper version numbers (`src/context/BoardProvider.jsx:17-20`).
