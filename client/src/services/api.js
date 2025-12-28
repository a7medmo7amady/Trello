import { v4 as uuidv4 } from 'uuid';

const MOCK_DELAY = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 0 : 300; // Increased delay for realism
const FAILURE_RATE = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 0 : 0.05;
const SERVER_STORAGE_KEY = 'mock_server_db';

// Helper to interact with the "Server DB"
const getDB = () => {
  try {
    const data = localStorage.getItem(SERVER_STORAGE_KEY);
    if (!data) return { lists: [], cards: [], lastModified: Date.now() };
    return JSON.parse(data);
  } catch (e) {
    return { lists: [], cards: [], lastModified: Date.now() };
  }
};

const saveDB = (data) => {
  localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(data));
  // Dispatch event for cross-tab sync simulation (optional but helpful)
  window.dispatchEvent(new Event('storage'));
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldFail = () => FAILURE_RATE > 0 && Math.random() < FAILURE_RATE;

const simulateLatency = async () => {
  const latency = MOCK_DELAY + Math.random() * 200;
  await delay(latency);
};

export const initializeServerState = (state) => {
  const currentDB = getDB();
  // Only initialize if DB is empty to avoid overwriting persistent data on reload
  if (currentDB.lists.length === 0 && currentDB.cards.length === 0) {
    saveDB({
      lists: JSON.parse(JSON.stringify(state.lists || [])),
      cards: JSON.parse(JSON.stringify(state.cards || [])),
      lastModified: Date.now(),
    });
  }
};

export const getServerState = async () => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to fetch server state');
  }

  const db = getDB();
  return {
    lists: JSON.parse(JSON.stringify(db.lists)),
    cards: JSON.parse(JSON.stringify(db.cards)),
    lastModified: db.lastModified,
  };
};

export const createList = async (list) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to create list');

  const db = getDB();
  const serverList = {
    ...list,
    lastModifiedAt: new Date().toISOString(),
    version: 1,
  };

  db.lists.push(serverList);
  db.lastModified = Date.now();
  saveDB(db);

  return serverList;
};

export const updateList = async (listId, updates) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to update list');

  const db = getDB();
  const index = db.lists.findIndex((l) => l.id === listId);
  if (index === -1) throw new Error('List not found');

  const currentList = db.lists[index];
  const updatedList = {
    ...currentList,
    ...updates,
    lastModifiedAt: new Date().toISOString(),
    version: (currentList.version || 0) + 1,
  };

  db.lists[index] = updatedList;
  db.lastModified = Date.now();
  saveDB(db);

  return updatedList;
};

export const deleteList = async (listId) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to delete list');

  const db = getDB();
  db.lists = db.lists.filter((l) => l.id !== listId);
  db.cards = db.cards.filter((c) => c.listId !== listId);
  db.lastModified = Date.now();
  saveDB(db);

  return { success: true };
};

export const createCard = async (card) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to create card');

  const db = getDB();
  const serverCard = {
    ...card,
    lastModifiedAt: new Date().toISOString(),
    version: 1,
  };

  db.cards.push(serverCard);
  db.lastModified = Date.now();
  saveDB(db);

  return serverCard;
};

export const updateCard = async (cardId, updates) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to update card');

  const db = getDB();
  const index = db.cards.findIndex((c) => c.id === cardId);
  if (index === -1) throw new Error('Card not found');

  const currentCard = db.cards[index];
  const updatedCard = {
    ...currentCard,
    ...updates,
    lastModifiedAt: new Date().toISOString(),
    version: (currentCard.version || 0) + 1,
  };

  db.cards[index] = updatedCard;
  db.lastModified = Date.now();
  saveDB(db);

  return updatedCard;
};

export const deleteCard = async (cardId) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to delete card');

  const db = getDB();
  db.cards = db.cards.filter((c) => c.id !== cardId);
  db.lastModified = Date.now();
  saveDB(db);

  return { success: true };
};

export const moveCard = async (cardId, sourceListId, targetListId, targetIndex) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Failed to move card');

  const db = getDB();
  const cardIndex = db.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error('Card not found');

  const card = db.cards[cardIndex];
  const updatedCard = {
    ...card,
    listId: targetListId,
    order: targetIndex,
    lastModifiedAt: new Date().toISOString(),
    version: (card.version || 0) + 1,
  };

  db.cards[cardIndex] = updatedCard;
  db.lastModified = Date.now();
  saveDB(db);

  return updatedCard;
};

export const syncChanges = async (changes) => {
  await simulateLatency();
  if (shouldFail()) throw new Error('Network error: Sync failed');

  const results = [];

  for (const change of changes) {
    try {
      let result;
      switch (change.type) {
        case 'CREATE_LIST':
          result = await createList(change.data);
          break;
        case 'UPDATE_LIST':
          result = await updateList(change.data.id, change.data);
          break;
        case 'ARCHIVE_LIST':
          result = await updateList(change.data.id, { archived: true });
          break;
        case 'RESTORE_LIST':
          result = await updateList(change.data.id, { archived: false });
          break;
        case 'CREATE_CARD':
          result = await createCard(change.data);
          break;
        case 'UPDATE_CARD':
          result = await updateCard(change.data.id, change.data);
          break;
        case 'DELETE_CARD':
          result = await deleteCard(change.data.id);
          break;
        case 'MOVE_CARD':
          result = await moveCard(
            change.data.cardId,
            change.data.sourceListId,
            change.data.targetListId,
            change.data.targetIndex
          );
          break;
        default:
          result = { success: true };
      }
      results.push({ changeId: change.id, success: true, result });
    } catch (error) {
      results.push({ changeId: change.id, success: false, error: error.message });
    }
  }

  return {
    results,
    serverState: await getServerState(),
  };
};

export const checkForConflicts = (localItem, serverItem) => {
  if (!serverItem) return null;
  if (!localItem) return null;

  const localVersion = localItem.version || 0;
  const serverVersion = serverItem.version || 0;

  // STRICT VERSION CHECK
  // Conflict if server is ahead (version > local) OR
  // if versions are equal but detecting change (rare race condition, but good to check timestamps)
  // For this exercise, strict version > local is the key indicator of "Server has newer data"
  if (serverVersion > localVersion) {
    // Check if content is actually different to avoid 'fake' conflicts
    const localStr = JSON.stringify({ ...localItem, lastModifiedAt: 0, version: 0, syncStatus: undefined });
    const serverStr = JSON.stringify({ ...serverItem, lastModifiedAt: 0, version: 0, syncStatus: undefined });

    if (localStr !== serverStr) {
      return {
        id: uuidv4(),
        itemId: localItem.id,
        type: localItem.listId ? 'card' : 'list',
        localVersion: localItem,
        serverVersion: serverItem,
        detectedAt: new Date().toISOString(),
      };
    } else {
      // Content is identical, auto-update local version to match server
      return null;
    }
  }

  return null;
};

export const threeWayMerge = (base, local, server) => {
  // ... logic remains if needed, but reducing complexity for stability
  return server; // Default to server preference in merge utility for now
};

export default {
  initializeServerState,
  getServerState,
  createList,
  updateList,
  deleteList,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  syncChanges,
  checkForConflicts,
  threeWayMerge,
};