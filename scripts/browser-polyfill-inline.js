/**
 * Browser API Polyfill (Non-Module Version)
 * For use in content scripts, popup, and options pages
 * 
 * This provides Firefox compatibility by wrapping chrome.* APIs
 * and handling chrome.storage.session fallback for Firefox.
 */

(function() {
  'use strict';
  
  // Detect browser environment
  const isFirefox = typeof browser !== 'undefined' && browser.runtime;
  const isChrome = typeof chrome !== 'undefined' && chrome.runtime;
  
  // Use browser namespace if available (Firefox), otherwise chrome namespace
  const browserAPI = isFirefox ? browser : (isChrome ? chrome : {});
  
  // Only set up polyfill if we're not already using the native browser API
  if (isChrome && !isFirefox) {
    // Chrome-specific polyfills for storage.session fallback
    
    // Session storage fallback using local storage with prefix
    const sessionPrefix = '__session__';
    const sessionKeys = new Set();
    
    // Wrap chrome.storage.session if it doesn't exist or for Firefox
    if (!chrome.storage.session || isFirefox) {
      // Create session storage polyfill using local storage
      const originalSessionStorage = chrome.storage.session || {};
      
      chrome.storage.session = {
        get: function(keys, callback) {
          const prefixedKeys = Array.isArray(keys)
            ? keys.map(k => sessionPrefix + k)
            : (typeof keys === 'string' ? sessionPrefix + keys : null);
          
          chrome.storage.local.get(prefixedKeys, function(result) {
            if (chrome.runtime.lastError) {
              callback && callback({});
              return;
            }
            
            const unprefixed = {};
            if (Array.isArray(prefixedKeys)) {
              for (const prefixedKey of prefixedKeys) {
                const originalKey = prefixedKey.replace(sessionPrefix, '');
                if (prefixedKey in result) {
                  unprefixed[originalKey] = result[prefixedKey];
                }
              }
            } else if (prefixedKeys) {
              const originalKey = prefixedKeys.replace(sessionPrefix, '');
              if (prefixedKeys in result) {
                unprefixed[originalKey] = result[prefixedKeys];
              }
            } else {
              // Get all session keys
              for (const [key, value] of Object.entries(result)) {
                if (key.startsWith(sessionPrefix)) {
                  unprefixed[key.replace(sessionPrefix, '')] = value;
                }
              }
            }
            
            callback && callback(unprefixed);
          });
        },
        
        set: function(items, callback) {
          const prefixed = {};
          for (const [key, value] of Object.entries(items)) {
            const prefixedKey = sessionPrefix + key;
            prefixed[prefixedKey] = value;
            sessionKeys.add(prefixedKey);
          }
          
          chrome.storage.local.set(prefixed, callback);
        },
        
        remove: function(keys, callback) {
          const keysArray = Array.isArray(keys) ? keys : [keys];
          const prefixedKeys = keysArray.map(k => sessionPrefix + k);
          
          prefixedKeys.forEach(k => sessionKeys.delete(k));
          
          chrome.storage.local.remove(prefixedKeys, callback);
        }
      };
    }
  }
  
  // Firefox uses browser.* API natively, but we can ensure chrome.* is available as an alias
  if (isFirefox && !window.chrome) {
    window.chrome = browser;
  }
  
  // Expose helper flags
  window.__browserPolyfill = {
    isFirefox: isFirefox,
    isChrome: isChrome,
    browserAPI: browserAPI
  };
})();
