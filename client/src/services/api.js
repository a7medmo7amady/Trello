import { v4 as uuidv4 } from 'uuid';

const MOCK_DELAY = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 0 : 300;
const FAILURE_RATE = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 0 : 0.05;

let serverState = {
  lists: [],
  cards: [],
  lastModified: Date.now(),
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldFail = () => FAILURE_RATE > 0 && Math.random() < FAILURE_RATE;

const simulateLatency = async () => {
  const latency = MOCK_DELAY + Math.random() * 200;
  await delay(latency);
};

export const initializeServerState = (state) => {
  serverState = {
    lists: JSON.parse(JSON.stringify(state.lists || [])),
    cards: JSON.parse(JSON.stringify(state.cards || [])),
    lastModified: Date.now(),
  };
};

export const getServerState = async () => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to fetch server state');
  }

  return {
    lists: JSON.parse(JSON.stringify(serverState.lists)),
    cards: JSON.parse(JSON.stringify(serverState.cards)),
    lastModified: serverState.lastModified,
  };
};

export const createList = async (list) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to create list');
  }

  const serverList = {
    ...list,
    lastModifiedAt: new Date().toISOString(),
    version: 1,
  };

  serverState.lists.push(serverList);
  serverState.lastModified = Date.now();

  return serverList;
};

export const updateList = async (listId, updates) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to update list');
  }

  const index = serverState.lists.findIndex((l) => l.id === listId);
  if (index === -1) {
    throw new Error('List not found');
  }

  const currentList = serverState.lists[index];
  const updatedList = {
    ...currentList,
    ...updates,
    lastModifiedAt: new Date().toISOString(),
    version: (currentList.version || 0) + 1,
  };

  serverState.lists[index] = updatedList;
  serverState.lastModified = Date.now();

  return updatedList;
};

export const deleteList = async (listId) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to delete list');
  }

  serverState.lists = serverState.lists.filter((l) => l.id !== listId);
  serverState.cards = serverState.cards.filter((c) => c.listId !== listId);
  serverState.lastModified = Date.now();

  return { success: true };
};

export const createCard = async (card) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to create card');
  }

  const serverCard = {
    ...card,
    lastModifiedAt: new Date().toISOString(),
    version: 1,
  };

  serverState.cards.push(serverCard);
  serverState.lastModified = Date.now();

  return serverCard;
};

export const updateCard = async (cardId, updates) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to update card');
  }

  const index = serverState.cards.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new Error('Card not found');
  }

  const currentCard = serverState.cards[index];
  const updatedCard = {
    ...currentCard,
    ...updates,
    lastModifiedAt: new Date().toISOString(),
    version: (currentCard.version || 0) + 1,
  };

  serverState.cards[index] = updatedCard;
  serverState.lastModified = Date.now();

  return updatedCard;
};

export const deleteCard = async (cardId) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to delete card');
  }

  serverState.cards = serverState.cards.filter((c) => c.id !== cardId);
  serverState.lastModified = Date.now();

  return { success: true };
};

export const moveCard = async (cardId, sourceListId, targetListId, targetIndex) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Failed to move card');
  }

  const cardIndex = serverState.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('Card not found');
  }

  const card = serverState.cards[cardIndex];
  const updatedCard = {
    ...card,
    listId: targetListId,
    order: targetIndex,
    lastModifiedAt: new Date().toISOString(),
    version: (card.version || 0) + 1,
  };

  serverState.cards[cardIndex] = updatedCard;
  serverState.lastModified = Date.now();

  return updatedCard;
};

export const syncChanges = async (changes) => {
  await simulateLatency();

  if (shouldFail()) {
    throw new Error('Network error: Sync failed');
  }

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

    if (JSON.stringify(localVal) === JSON.stringify(baseVal)) {
      merged[key] = serverVal;
    } else if (JSON.stringify(serverVal) === JSON.stringify(baseVal)) {
      merged[key] = localVal;
    } else if (JSON.stringify(localVal) === JSON.stringify(serverVal)) {
      merged[key] = localVal;
    } else {
      return null;
    }
  }

  merged.version = Math.max(local?.version || 0, server?.version || 0) + 1;
  merged.lastModifiedAt = new Date().toISOString();

  return merged;
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