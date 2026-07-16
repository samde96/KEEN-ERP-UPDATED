const DB_NAME = 'keen-offline-runtime';
const DB_VERSION = 1;
const QUEUE_STORE = 'requestQueue';
const CACHE_STORE = 'responseCache';

let databasePromise;

function openDatabase() {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        const queue = database.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queue.createIndex('createdAt', 'createdAt');
        queue.createIndex('status', 'status');
      }

      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        const cache = database.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        cache.createIndex('updatedAt', 'updatedAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
}

function storeTransaction(storeName, mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function readonlyAll(storeName) {
  return storeTransaction(storeName, 'readonly', (store) => store.getAll());
}

export function createOfflineId(prefix = 'offline') {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export async function enqueueRequest(entry) {
  await storeTransaction(QUEUE_STORE, 'readwrite', (store) => store.put(entry));
  return entry;
}

export async function removeQueuedRequest(id) {
  await storeTransaction(QUEUE_STORE, 'readwrite', (store) => store.delete(id));
}

export async function updateQueuedRequest(id, changes) {
  const current = await getQueuedRequest(id);
  if (!current) {
    return null;
  }

  const next = { ...current, ...changes, updatedAt: new Date().toISOString() };
  await enqueueRequest(next);
  return next;
}

export async function getQueuedRequest(id) {
  return storeTransaction(QUEUE_STORE, 'readonly', (store) => store.get(id));
}

export async function queuedRequests() {
  const rows = await readonlyAll(QUEUE_STORE);
  return rows.sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

export async function queuedRequestCount() {
  return storeTransaction(QUEUE_STORE, 'readonly', (store) => store.count());
}

export async function cacheResponse(entry) {
  await storeTransaction(CACHE_STORE, 'readwrite', (store) => store.put({
    ...entry,
    updatedAt: new Date().toISOString()
  }));
}

export async function cachedResponse(key) {
  return storeTransaction(CACHE_STORE, 'readonly', (store) => store.get(key));
}
