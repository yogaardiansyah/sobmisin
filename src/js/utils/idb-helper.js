import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const STORY_STORE_NAME = 'stories';

const openStoryDb = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      console.log(`Upgrading database from version ${db.oldVersion} to ${DB_VERSION}`);
      if (!db.objectStoreNames.contains(STORY_STORE_NAME)) {
        const store = db.createObjectStore(STORY_STORE_NAME, { keyPath: 'id' });
        console.log(`Object store "${STORY_STORE_NAME}" created.`);
      }
    },
  });
};

const addStoriesToDb = async (stories) => {
  if (!Array.isArray(stories)) {
      console.error("addStoriesToDb requires an array.");
      return;
  }
  const db = await openStoryDb();
  const tx = db.transaction(STORY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORY_STORE_NAME);
  try {
      await Promise.all(stories.map(story => store.put(story)));
      await tx.done;
      console.log(`${stories.length} stories added/updated in IndexedDB.`);
  } catch (error) {
      console.error('Failed to add stories to DB:', error);
      tx.abort();
      throw error;
  }
};

const getStoriesFromDb = async () => {
  try {
      const db = await openStoryDb();
      const stories = await db.getAll(STORY_STORE_NAME);
      console.log(`Retrieved ${stories.length} stories from IndexedDB.`);
      return stories;
  } catch (error) {
      console.error('Failed to get stories from DB:', error);
      return [];
  }
};

const getStoryByIdFromDb = async (id) => {
    if (!id) return null;
    try {
        const db = await openStoryDb();
        const story = await db.get(STORY_STORE_NAME, id);
        console.log(story ? `Story ${id} found in IndexedDB.` : `Story ${id} not found in IndexedDB.`);
        return story;
    } catch (error) {
        console.error(`Failed to get story ${id} from DB:`, error);
        return null;
    }
};

const clearStoriesFromDb = async () => {
  try {
      const db = await openStoryDb();
      const tx = db.transaction(STORY_STORE_NAME, 'readwrite');
      await tx.objectStore(STORY_STORE_NAME).clear();
      await tx.done;
      console.log('All stories cleared from IndexedDB.');
  } catch (error) {
      console.error('Failed to clear stories from DB:', error);
      throw error;
  }
};

export { openStoryDb, addStoriesToDb, getStoriesFromDb, clearStoriesFromDb, getStoryByIdFromDb };
