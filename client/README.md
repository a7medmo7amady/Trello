# Kanban Board - React Application

A collaborative Kanban board single-page application built with React, featuring offline support, drag-and-drop functionality, and comprehensive state management.

## Project Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (for e2e tests)
npx playwright install
```

### Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

### Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Testing

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run e2e tests
npm run e2e

# Run e2e tests with UI
npm run e2e:ui
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Performance Testing

Generate 500+ cards for performance testing:

```bash
npm run seed
```

Then copy the generated JSON from `scripts/seedData.json` to localStorage in browser console.

## Architectural Summary

This Kanban board application implements a robust architecture designed for offline-first functionality, performance with large datasets, and maintainability.

### State Management

The application uses React's `useReducer` combined with Context API for centralized state management. The `BoardProvider` component wraps the application, providing state access through custom hooks:

- **useBoardState**: Exposes board operations (addList, moveCard, etc.) with automatic history tracking for undo/redo
- **useOfflineSync**: Manages the sync queue, network status detection, and automatic retry logic
- **useUndoRedo**: Provides undo/redo functionality with multi-level history

All state mutations flow through the reducer, ensuring predictable updates and enabling features like optimistic updates and conflict detection.

### Offline Support

Changes are immediately applied to the UI (optimistic updates) and queued for server synchronization. The sync queue persists to localStorage, surviving page reloads. When the application comes back online, queued changes are automatically synced with exponential backoff retry logic.

### Performance Optimizations

To handle 500+ cards smoothly:
- Card components are memoized with custom comparison functions
- Event handlers are wrapped in useCallback to maintain referential equality
- CardDetailModal is lazy-loaded with React.Suspense
- Virtualization support is built-in for lists exceeding 30 cards

### Component Architecture

```
src/
├── components/       # React components
│   ├── Board.jsx          # Main board container with DnD
│   ├── ListColumn.jsx     # Individual list columns
│   ├── Card.jsx           # Memoized card component
│   ├── CardDetailModal.jsx # Lazy-loaded card editor
│   ├── Header.jsx         # App header with sync status
│   ├── Toolbar.jsx        # Undo/redo and actions
│   ├── ConfirmDialog.jsx  # Accessible confirmation dialog
│   └── InlineEditor.jsx   # Inline text editing
├── context/          # State management
│   ├── BoardProvider.jsx  # Context provider
│   └── boardReducer.js    # Reducer with all actions
├── hooks/            # Custom hooks
│   ├── useBoardState.js   # Board operations hook
│   ├── useOfflineSync.js  # Sync management hook
│   └── useUndoRedo.js     # History navigation hook
├── services/         # External services
│   ├── api.js             # Mock server with sync
│   └── storage.js         # localStorage/IndexedDB
├── utils/            # Utilities
│   ├── validators.js      # Input validation
│   └── helpers.js         # Helper functions
└── styles/           # CSS
    ├── global.css         # Global styles
    └── components.css     # Component styles
```

### Accessibility

The application meets WCAG AA standards with:
- Full keyboard navigation
- Focus trapping in modals
- ARIA labels and roles
- Screen reader support
- High contrast color scheme

## Documentation

See the `docs/` folder for detailed documentation:
- Architecture choices
- Optimistic updates implementation
- Conflict resolution approach
- Performance optimization details
- Accessibility compliance

## Technologies Used

- **React 18**: UI framework with hooks
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **ESLint + Prettier**: Code quality

## Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Create production build |
| `lint` | Run ESLint |
| `test` | Run unit tests |
| `test:coverage` | Run tests with coverage |
| `e2e` | Run end-to-end tests |

## License

This project is for educational purposes as part of the SW302 course assignment.
