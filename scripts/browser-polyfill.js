/**
 * Browser API Polyfill for Cross-Browser Compatibility
 * 
 * Provides a unified API that works across Chrome, Edge, and Firefox.
 * Handles differences in:
 * - chrome vs browser namespace
 * - callback-based vs promise-based APIs
 * - chrome.storage.session (Chrome-only) fallback to local storage
 */

// Detect browser environment
const isFirefox = typeof browser !== 'undefined' && browser.runtime;
const isChrome = typeof chrome !== 'undefined' && chrome.runtime;

/**
 * Unified browser API that works across Chrome and Firefox
 * Uses browser namespace if available (Firefox), otherwise chrome namespace
 */
const browserAPI = (() => {
  // Firefox has native 'browser' namespace with promises
  if (isFirefox) {
    return browser;
  }
  
  // Chrome uses 'chrome' namespace - we'll wrap it where needed
  if (isChrome) {
    return chrome;
  }
  
  // Fallback if neither is available (testing environment)
  return {};
})();

/**
 * Storage API wrapper with session storage fallback for Firefox
 * 
 * Firefox doesn't support chrome.storage.session in MV3 yet,
 * so we use chrome.storage.local with a special prefix for session-like data
 */
const storageAPI = {
  local: {
    get: (keys) => {
      if (isFirefox) {
        // Firefox browser.storage.local returns promises natively
        return browserAPI.storage.local.get(keys);
      }
      // Chrome uses callbacks, wrap in promise
      return new Promise((resolve, reject) => {
        browserAPI.storage.local.get(keys, (result) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    },
    
    set: (items) => {
      if (isFirefox) {
        return browserAPI.storage.local.set(items);
      }
      return new Promise((resolve, reject) => {
        browserAPI.storage.local.set(items, () => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    },
    
    remove: (keys) => {
      if (isFirefox) {
        return browserAPI.storage.local.remove(keys);
      }
      return new Promise((resolve, reject) => {
        browserAPI.storage.local.remove(keys, () => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    },
    
    clear: () => {
      if (isFirefox) {
        return browserAPI.storage.local.clear();
      }
      return new Promise((resolve, reject) => {
        browserAPI.storage.local.clear(() => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }
  },
  
  session: {
    // Session storage fallback for Firefox
    // Uses local storage with __session__ prefix and in-memory cleanup
    _sessionPrefix: '__session__',
    _sessionKeys: new Set(),
    
    get: async (keys) => {
      // Chrome has native session storage
      if (isChrome && browserAPI.storage.session) {
        return new Promise((resolve, reject) => {
          browserAPI.storage.session.get(keys, (result) => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      }
      
      // Firefox fallback: use local storage with session prefix
      const prefixedKeys = Array.isArray(keys) 
        ? keys.map(k => this._sessionPrefix + k)
        : (typeof keys === 'string' ? this._sessionPrefix + keys : null);
      
      if (prefixedKeys === null) {
        // Get all session keys
        const allKeys = Array.from(this._sessionKeys);
        const result = await storageAPI.local.get(allKeys);
        const unprefixed = {};
        for (const [key, value] of Object.entries(result)) {
          unprefixed[key.replace(this._sessionPrefix, '')] = value;
        }
        return unprefixed;
      }
      
      const result = await storageAPI.local.get(prefixedKeys);
      const unprefixed = {};
      
      if (Array.isArray(prefixedKeys)) {
        for (const prefixedKey of prefixedKeys) {
          const originalKey = prefixedKey.replace(this._sessionPrefix, '');
          if (prefixedKey in result) {
            unprefixed[originalKey] = result[prefixedKey];
          }
        }
      } else {
        const originalKey = prefixedKeys.replace(this._sessionPrefix, '');
        if (prefixedKeys in result) {
          unprefixed[originalKey] = result[prefixedKeys];
        }
      }
      
      return unprefixed;
    },
    
    set: async (items) => {
      // Chrome has native session storage
      if (isChrome && browserAPI.storage.session) {
        return new Promise((resolve, reject) => {
          browserAPI.storage.session.set(items, () => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      }
      
      // Firefox fallback: prefix keys and track them
      const prefixed = {};
      for (const [key, value] of Object.entries(items)) {
        const prefixedKey = this._sessionPrefix + key;
        prefixed[prefixedKey] = value;
        this._sessionKeys.add(prefixedKey);
      }
      
      return storageAPI.local.set(prefixed);
    },
    
    remove: async (keys) => {
      // Chrome has native session storage
      if (isChrome && browserAPI.storage.session) {
        return new Promise((resolve, reject) => {
          browserAPI.storage.session.remove(keys, () => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      }
      
      // Firefox fallback: prefix keys and remove
      const keysArray = Array.isArray(keys) ? keys : [keys];
      const prefixedKeys = keysArray.map(k => this._sessionPrefix + k);
      
      prefixedKeys.forEach(k => this._sessionKeys.delete(k));
      
      return storageAPI.local.remove(prefixedKeys);
    },
    
    // Initialize session cleanup on startup (Firefox only)
    _initCleanup: async () => {
      if (isFirefox) {
        // Clear all session data on startup
        const allData = await storageAPI.local.get(null);
        const sessionKeys = Object.keys(allData).filter(k => k.startsWith(storageAPI.session._sessionPrefix));
        if (sessionKeys.length > 0) {
          await storageAPI.local.remove(sessionKeys);
        }
        storageAPI.session._sessionKeys.clear();
      }
    }
  },
  
  managed: {
    get: (keys) => {
      if (isFirefox) {
        return browserAPI.storage.managed.get(keys);
      }
      return new Promise((resolve, reject) => {
        browserAPI.storage.managed.get(keys, (result) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    }
  },
  
  onChanged: browserAPI.storage?.onChanged
};

// Initialize session cleanup on load (Firefox only)
if (isFirefox && browserAPI.storage) {
  storageAPI.session._initCleanup().catch((err) => {
    // Log cleanup errors to the console in development for easier debugging.
    // In production, you may want to suppress this or handle differently.
    if (typeof console !== 'undefined') {
      console.error('Session cleanup initialization failed:', err);
    }
  });
}

/**
 * Export unified API
 */
export {
  browserAPI as chrome,
  storageAPI as storage,
  isFirefox,
  isChrome
};

// Also export as default for convenience
export default {
  chrome: browserAPI,
  storage: storageAPI,
  isFirefox,
  isChrome
};
