/**
 * Photo Storage using IndexedDB
 * Provides larger storage capacity than sessionStorage for photo data
 */

const DB_NAME = "memento-photos";
const DB_VERSION = 1;
const STORE_NAME = "photos";
const PHOTO_KEY = "messageBoardPhoto";

interface StoredPhoto {
  buffer: ArrayBuffer;
  name: string;
  type: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("無法開啟照片儲存空間"));

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Store a photo file in IndexedDB
 */
export async function storePhoto(file: File): Promise<void> {
  // Convert File to ArrayBuffer for reliable serialization
  const buffer = await file.arrayBuffer();

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const data: StoredPhoto = {
      buffer,
      name: file.name,
      type: file.type,
    };

    const request = store.put(data, PHOTO_KEY);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(new Error("無法儲存照片"));
    };
  });
}

/**
 * Retrieve a photo file from IndexedDB
 * Returns null if no photo is stored
 */
export async function retrievePhoto(): Promise<File | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(PHOTO_KEY);

    request.onsuccess = () => {
      db.close();
      const data = request.result as StoredPhoto | undefined;
      if (!data) {
        resolve(null);
        return;
      }

      const file = new File([data.buffer], data.name, { type: data.type });
      resolve(file);
    };

    request.onerror = () => {
      db.close();
      reject(new Error("無法讀取照片"));
    };
  });
}

/**
 * Clear stored photo from IndexedDB
 */
export async function clearPhoto(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(PHOTO_KEY);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(new Error("無法清除照片"));
    };
  });
}
