/**
 * Database Utility for Pandora Box PWA
 * Handles IndexedDB operations
 */

class DBManager {
  constructor(dbName = 'pandoraBoxDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the database
   */
  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createStores(db);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log(`IndexedDB '${this.dbName}' initialized successfully`);
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error initializing IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Create object stores during database initialization
   */
  createStores(db) {
    // Auth store - for authentication tokens
    if (!db.objectStoreNames.contains('auth')) {
      db.createObjectStore('auth', { keyPath: 'id' });
    }

    // Settings store - for user preferences
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'id' });
    }

    // Media store - for caching media items
    if (!db.objectStoreNames.contains('media')) {
      const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
      mediaStore.createIndex('type', 'type', { unique: false });
      mediaStore.createIndex('libraryId', 'libraryId', { unique: false });
    }

    // Downloads store - for tracking downloads
    if (!db.objectStoreNames.contains('downloads')) {
      const downloadsStore = db.createObjectStore('downloads', { keyPath: 'id' });
      downloadsStore.createIndex('status', 'status', { unique: false });
    }

    // Offline queue store - for operations that need to be synced when online
    if (!db.objectStoreNames.contains('offlineQueue')) {
      const queueStore = db.createObjectStore('offlineQueue', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      queueStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  /**
   * Get a database transaction
   */
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db.transaction(storeNames, mode);
  }

  /**
   * Get an object store
   */
  getStore(storeName, mode = 'readonly') {
    const transaction = this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Get an item from a store
   */
  async get(storeName, key) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from a store
   */
  async getAll(storeName, query = null, count = 0) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = query ? store.getAll(query, count) : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get items by index
   */
  async getByIndex(storeName, indexName, value) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put an item in a store
   */
  async put(storeName, item) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add an item to a store
   */
  async add(storeName, item) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an item from a store
   */
  async delete(storeName, key) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items from a store
   */
  async clear(storeName) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count items in a store
   */
  async count(storeName, query = null) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = query ? store.count(query) : store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ensure the database is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Add an item to the offline queue
   */
  async addToOfflineQueue(operation) {
    const queueItem = {
      ...operation,
      timestamp: Date.now()
    };
    
    return this.add('offlineQueue', queueItem);
  }

  /**
   * Process the offline queue
   */
  async processOfflineQueue(processFunction) {
    const queue = await this.getAll('offlineQueue');
    
    if (queue.length === 0) return [];
    
    const results = [];
    
    for (const item of queue) {
      try {
        const result = await processFunction(item);
        await this.delete('offlineQueue', item.id);
        results.push({ success: true, item, result });
      } catch (error) {
        results.push({ success: false, item, error });
      }
    }
    
    return results;
  }

  /**
   * Save auth token
   */
  async saveToken(token) {
    return this.put('auth', { id: 'token', value: token });
  }

  /**
   * Get auth token
   */
  async getToken() {
    const tokenObj = await this.get('auth', 'token');
    return tokenObj ? tokenObj.value : null;
  }

  /**
   * Delete auth token
   */
  async deleteToken() {
    return this.delete('auth', 'token');
  }

  /**
   * Save a setting
   */
  async saveSetting(key, value) {
    return this.put('settings', { id: key, value });
  }

  /**
   * Get a setting
   */
  async getSetting(key) {
    const setting = await this.get('settings', key);
    return setting ? setting.value : null;
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    const settings = await this.getAll('settings');
    return settings.reduce((acc, setting) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {});
  }

  /**
   * Cache media items
   */
  async cacheMediaItems(items, libraryId) {
    const transaction = this.getTransaction('media', 'readwrite');
    const store = transaction.objectStore('media');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      items.forEach(item => {
        item.libraryId = libraryId;
        item.cachedAt = Date.now();
        store.put(item);
      });
    });
  }

  /**
   * Get cached media items by library
   */
  async getCachedMediaByLibrary(libraryId) {
    return this.getByIndex('media', 'libraryId', libraryId);
  }

  /**
   * Save download information
   */
  async saveDownload(download) {
    return this.put('downloads', {
      ...download,
      lastUpdated: Date.now()
    });
  }

  /**
   * Get downloads by status
   */
  async getDownloadsByStatus(status) {
    return this.getByIndex('downloads', 'status', status);
  }
}

// Export the database manager
window.DBManager = DBManager;