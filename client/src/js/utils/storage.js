/**
 * Storage Utility
 * Provides a simple interface for IndexedDB operations
 */

class StorageManager {
  constructor() {
    this.dbName = 'PandoraBoxDB'
    this.dbVersion = 1
    this.db = null
  }

  /**
   * Initialize IndexedDB
   * @returns {Promise<void>}
   */
  async init() {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object stores
        if (!db.objectStoreNames.contains('auth')) {
          const authStore = db.createObjectStore('auth', { keyPath: 'key' })
          authStore.createIndex('key', 'key', { unique: true })
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
          cacheStore.createIndex('key', 'key', { unique: true })
          cacheStore.createIndex('expires', 'expires', { unique: false })
        }

        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' })
          settingsStore.createIndex('key', 'key', { unique: true })
        }

        console.log('IndexedDB schema updated')
      }
    })
  }

  /**
   * Store data in IndexedDB
   * @param {string} storeName 
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async set(storeName, key, value, ttl = null) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      const data = {
        key,
        value,
        timestamp: Date.now(),
        expires: ttl ? Date.now() + ttl : null
      }

      const request = store.put(data)

      request.onerror = () => {
        console.error('IndexedDB set error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get data from IndexedDB
   * @param {string} storeName 
   * @param {string} key 
   * @returns {Promise<any>}
   */
  async get(storeName, key) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        const result = request.result

        if (!result) {
          resolve(null)
          return
        }

        // Check if data has expired
        if (result.expires && Date.now() > result.expires) {
          // Data has expired, remove it
          this.remove(storeName, key)
          resolve(null)
          return
        }

        resolve(result.value)
      }
    })
  }

  /**
   * Remove data from IndexedDB
   * @param {string} storeName 
   * @param {string} key 
   * @returns {Promise<void>}
   */
  async remove(storeName, key) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => {
        console.error('IndexedDB remove error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Clear all data from a store
   * @param {string} storeName 
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => {
        console.error('IndexedDB clear error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get all keys from a store
   * @param {string} storeName 
   * @returns {Promise<string[]>}
   */
  async keys(storeName) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAllKeys()

      request.onerror = () => {
        console.error('IndexedDB keys error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  }

  /**
   * Clean up expired cache entries
   * @returns {Promise<number>} Number of entries removed
   */
  async cleanupExpired() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const index = store.index('expires')
      
      const now = Date.now()
      const range = IDBKeyRange.upperBound(now)
      const request = index.openCursor(range)
      
      let removedCount = 0

      request.onerror = () => {
        console.error('IndexedDB cleanup error:', request.error)
        reject(request.error)
      }

      request.onsuccess = (event) => {
        const cursor = event.target.result
        
        if (cursor) {
          // Only delete if expires is not null and is in the past
          if (cursor.value.expires && cursor.value.expires < now) {
            cursor.delete()
            removedCount++
          }
          cursor.continue()
        } else {
          console.log(`Cleaned up ${removedCount} expired cache entries`)
          resolve(removedCount)
        }
      }
    })
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    await this.init()

    const stats = {
      auth: 0,
      cache: 0,
      settings: 0,
      total: 0
    }

    const storeNames = ['auth', 'cache', 'settings']
    
    for (const storeName of storeNames) {
      try {
        const keys = await this.keys(storeName)
        stats[storeName] = keys.length
        stats.total += keys.length
      } catch (error) {
        console.error(`Error getting stats for ${storeName}:`, error)
      }
    }

    return stats
  }

  /**
   * Authentication storage helpers
   */
  async setAuthToken(token, ttl = null) {
    return this.set('auth', 'token', token, ttl)
  }

  async getAuthToken() {
    return this.get('auth', 'token')
  }

  async removeAuthToken() {
    return this.remove('auth', 'token')
  }

  async setUserData(userData) {
    return this.set('auth', 'user', userData)
  }

  async getUserData() {
    return this.get('auth', 'user')
  }

  async removeUserData() {
    return this.remove('auth', 'user')
  }

  async clearAuth() {
    return this.clear('auth')
  }

  /**
   * Cache storage helpers
   */
  async setCache(key, data, ttl = 3600000) { // Default 1 hour TTL
    return this.set('cache', key, data, ttl)
  }

  async getCache(key) {
    return this.get('cache', key)
  }

  async removeCache(key) {
    return this.remove('cache', key)
  }

  async clearCache() {
    return this.clear('cache')
  }

  /**
   * Settings storage helpers
   */
  async setSetting(key, value) {
    return this.set('settings', key, value)
  }

  async getSetting(key) {
    return this.get('settings', key)
  }

  async removeSetting(key) {
    return this.remove('settings', key)
  }

  async clearSettings() {
    return this.clear('settings')
  }
}

// Create singleton instance
const storage = new StorageManager()

export default storage