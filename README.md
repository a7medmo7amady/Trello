# Trello
I hate UI

## Testing

### Setup

```bash
cd client
npm install
```

### Run Tests

```bash
# Run all unit tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Infrastructure

- **Framework**: [Vitest](https://vitest.dev/) with jsdom environment
- **Libraries**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- **Coverage**: `@vitest/coverage-v8` — output goes to `client/coverage/` (gitignored)
- **Setup file**: [`client/src/tests/setup.js`](client/src/tests/setup.js) — mocks `localStorage`, `indexedDB`, `matchMedia`, `ResizeObserver`, `uuid`, and `navigator.onLine`
- **E2E**: Playwright — `npm run e2e`
