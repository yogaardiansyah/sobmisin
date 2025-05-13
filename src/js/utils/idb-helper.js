import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 2;
const STORY_STORE_NAME = 'stories';
const FAVORITE_STORE_NAME = 'favorite_stories';

const openStoryDb = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
      if (!db.objectStoreNames.contains(STORY_STORE_NAME)) {
        const storyStore = db.createObjectStore(STORY_STORE_NAME, { keyPath: 'id' });
        console.log(`Object store "${STORY_STORE_NAME}" created.`);
      }
      if (!db.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
        const favoriteStore = db.createObjectStore(FAVORITE_STORE_NAME, { keyPath: 'id' });
        console.log(`Object store "${FAVORITE_STORE_NAME}" created.`);
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
      console.log(`${stories.length} stories added/updated in "${STORY_STORE_NAME}" IndexedDB.`);
  } catch (error) {
      console.error(`Failed to add stories to "${STORY_STORE_NAME}" DB:`, error);
      tx.abort();
      throw error;
  }
};

const getStoriesFromDb = async () => {
  try {
      const db = await openStoryDb();
      const stories = await db.getAll(STORY_STORE_NAME);
      console.log(`Retrieved ${stories.length} stories from "${STORY_STORE_NAME}" IndexedDB.`);
      return stories;
  } catch (error) {
      console.error(`Failed to get stories from "${STORY_STORE_NAME}" DB:`, error);
      return [];
  }
};

const getStoryByIdFromDb = async (id) => {
    if (!id) return null;
    try {
        const db = await openStoryDb();
        const story = await db.get(STORY_STORE_NAME, id);
        console.log(story ? `Story ${id} found in "${STORY_STORE_NAME}" IndexedDB.` : `Story ${id} not found in "${STORY_STORE_NAME}" IndexedDB.`);
        return story;
    } catch (error) {
        console.error(`Failed to get story ${id} from "${STORY_STORE_NAME}" DB:`, error);
        return null;
    }
};

const clearStoriesFromDb = async () => {
  try {
      const db = await openStoryDb();
      const tx = db.transaction(STORY_STORE_NAME, 'readwrite');
      await tx.objectStore(STORY_STORE_NAME).clear();
      await tx.done;
      console.log(`All stories cleared from "${STORY_STORE_NAME}" IndexedDB.`);
  } catch (error) {
      console.error(`Failed to clear stories from "${STORY_STORE_NAME}" DB:`, error);
      throw error;
  }
};

const addFavoriteStoryToDb = async (story) => {
    if (!story || !story.id) {
        console.error("Invalid story object provided to addFavoriteStoryToDb.");
        return;
    }
    const db = await openStoryDb();
    const tx = db.transaction(FAVORITE_STORE_NAME, 'readwrite');
    try {
        await tx.objectStore(FAVORITE_STORE_NAME).put(story);
        await tx.done;
        console.log(`Story "${story.id}" added to favorites in IndexedDB.`);
    } catch (error) {
        console.error('Failed to add favorite story to DB:', error);
        tx.abort();
        throw error;
    }
};

const removeFavoriteStoryFromDb = async (storyId) => {
    if (!storyId) {
        console.error("storyId is required to removeFavoriteStoryFromDb.");
        return;
    }
    const db = await openStoryDb();
    const tx = db.transaction(FAVORITE_STORE_NAME, 'readwrite');
    try {
        await tx.objectStore(FAVORITE_STORE_NAME).delete(storyId);
        await tx.done;
        console.log(`Story "${storyId}" removed from favorites in IndexedDB.`);
    } catch (error) {
        console.error('Failed to remove favorite story from DB:', error);
        tx.abort();
        throw error;
    }
};

const getFavoriteStoriesFromDb = async () => {
    try {
        const db = await openStoryDb();
        const stories = await db.getAll(FAVORITE_STORE_NAME);
        console.log(`Retrieved ${stories.length} favorite stories from IndexedDB.`);
        return stories;
    } catch (error) {
        console.error('Failed to get favorite stories from DB:', error);
        return [];
    }
};

const isStoryFavoriteInDb = async (storyId) => {
    if (!storyId) return false;
    try {
        const db = await openStoryDb();
        const story = await db.get(FAVORITE_STORE_NAME, storyId);
        return !!story;
    } catch (error) {
        console.error(`Failed to check if story ${storyId} is favorite:`, error);
        return false;
    }
};


export {
    openStoryDb,
    addStoriesToDb, getStoriesFromDb, clearStoriesFromDb, getStoryByIdFromDb,
    addFavoriteStoryToDb, removeFavoriteStoryFromDb, getFavoriteStoriesFromDb, isStoryFavoriteInDb
};