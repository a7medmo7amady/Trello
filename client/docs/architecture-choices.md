# Architecture Choices

## Overview

This Kanban board application follows a component-based architecture using React with a centralized state management pattern. The design prioritizes offline-first functionality, performance optimization, and maintainability.

## Component Hierarchy

The application is structured with clear separation of concerns:

```
App.jsx
├── BoardProvider (Context wrapper)
│   ├── Header.jsx (Sync status display)
│   ├── Toolbar.jsx (Undo/redo, conflict resolution)
│   └── Board.jsx (Main board container)
│       ├── ListColumn.jsx (Individual list columns)
│       │   ├── Card.jsx (Task cards, memoized)
│       │   └── InlineEditor.jsx (Inline editing)
│       ├── CardDetailModal.jsx (Lazy loaded modal)
│       └── ConfirmDialog.jsx (Confirmation dialogs)
```

This hierarchy was chosen to minimize prop drilling while maintaining component reusability. The `BoardProvider` wraps the entire application, making state accessible through custom hooks like `useBoardState`, `useOfflineSync`, and `useUndoRedo`.

## State Ownership and Data Flow

State is managed using `useReducer` combined with React Context (`src/context/BoardProvider.jsx:22-36`). The reducer (`src/context/boardReducer.js`) handles all state mutations through well-defined action types. This approach provides:

1. **Predictable state updates**: All mutations go through the reducer
2. **Easy debugging**: Actions are logged and can be inspected
3. **Undo/redo support**: History is tracked in the reducer state
4. **Offline queue**: Changes are automatically queued for sync

Data flows unidirectionally: components dispatch actions → reducer processes → new state → components re-render. The `useBoardState` hook (`src/hooks/useBoardState.js:1-118`) wraps common actions with `useCallback` to prevent unnecessary re-renders.

## Folder Structure Rationale

The folder structure separates concerns clearly:

- `components/`: Presentational and container components
- `context/`: State management (BoardProvider, boardReducer)
- `hooks/`: Custom hooks for state access and side effects
- `services/`: API and storage abstractions
- `utils/`: Pure utility functions (validators, helpers)
- `styles/`: Global and component-specific CSS

This structure was chosen based on React best practices and the assignment requirements, enabling easy testing and maintenance. The `services/` layer abstracts storage operations, allowing seamless switching between localStorage and IndexedDB.

## Key Design Decisions

**Memoization Strategy**: Card components are wrapped with `React.memo` and custom comparison functions (`src/components/Card.jsx:163-174`) to prevent re-renders when parent state changes but card data remains the same.

**Lazy Loading**: The CardDetailModal is lazy-loaded (`src/components/Board.jsx:14`) with Suspense to reduce initial bundle size, as it's only needed when users click on cards.

**HTML5 Drag & Drop**: Chose native HTML5 DnD API over libraries to meet assignment requirements and reduce dependencies. Event handlers are memoized with `useCallback` to maintain referential equality.

## Debugging Anecdote

Initially, I implemented state management using only `useState` in the Board component. However, when adding offline sync functionality, I encountered a race condition where rapid card movements would sometimes result in cards appearing in wrong lists. The issue was traced to stale closure values in the async sync handlers (`src/hooks/useOfflineSync.js:45-90`). Switching to `useReducer` with a proper action queue resolved this by ensuring all state updates were atomic and based on the current state, not captured closures.
