

import { v4 as uuidv4 } from 'uuid';
import { writeFileSync } from 'fs';

const generateSeedData = (numCards = 500) => {
  const lists = [
    { id: uuidv4(), title: 'Backlog', order: 0, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: uuidv4(), title: 'To Do', order: 1, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: uuidv4(), title: 'In Progress', order: 2, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: uuidv4(), title: 'Review', order: 3, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
    { id: uuidv4(), title: 'Done', order: 4, archived: false, createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString(), version: 1 },
  ];

  const tags = ['feature', 'bug', 'enhancement', 'documentation', 'testing', 'urgent', 'low-priority', 'refactor', 'design', 'backend'];
  const adjectives = ['Important', 'Critical', 'Minor', 'Major', 'Complex', 'Simple','Optional','Required'];
  const nouns = ['Task', 'Feature', 'Bug', 'Update', 'Fix', 'Enhancement', 'Issue', 'Story', 'Epic', 'Spike'];
  const descriptions = [
    'This task requires immediate attention and should be prioritized.',
    'Implement the new feature according to the specifications.',
    'Fix the reported bug in the user interface.',
    'Update the documentation to reflect recent changes.',
    'Refactor the code for better maintainability.',
    'Add unit tests for the new functionality.',
    'Review and approve the pull request.',
    'Design the new component layout.',
    'Integrate with the external API.',
    'Optimize database queries for performance.',
  ];

  const cards = [];

  for (let i = 0; i < numCards; i++) {
    const listIndex = i % lists.length;
    const listId = lists[listIndex].id;
    const orderInList = Math.floor(i / lists.length);

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const title = `${adj} ${noun} #${i + 1}`;

    const numTags = Math.floor(Math.random() * 4);
    const cardTags = [];
    for (let j = 0; j < numTags; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)];
      if (!cardTags.includes(tag)) {
        cardTags.push(tag);
      }
    }

    const hasDescription = Math.random() > 0.3;
    const description = hasDescription
      ? descriptions[Math.floor(Math.random() * descriptions.length)]
      : '';

    cards.push({
      id: uuidv4(),
      listId,
      title,
      description,
      tags: cardTags,
      order: orderInList,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      version: 1,
    });
  }

  return { lists, cards };
};

const data = generateSeedData(500);

const storageData = {
  lists: data.lists,
  cards: data.cards,
  syncQueue: [],
  lastSyncedAt: new Date().toISOString(),
};

writeFileSync('scripts/seedData.json', JSON.stringify(storageData, null, 2));

// eslint-disable-next-line no-console
console.log(`Generated seed data with ${data.lists.length} lists and ${data.cards.length} cards.
Data saved to scripts/seedData.json.
To use in browser, paste the JSON content into:
localStorage.setItem('kanban-board-state', JSON.stringify(data)); location.reload();`);

export { generateSeedData };
export default generateSeedData;
