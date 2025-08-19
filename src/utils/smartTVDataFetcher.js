// Smart TV compatible data fetching utility
// This provides robust data fetching that works on older JavaScript engines

import { getApiBaseUrl } from '../config/apiConfig';

class SmartTVDataFetcher {
  constructor(baseUrl = getApiBaseUrl()) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.listeners = new Set();
    this.isPolling = false;
    this.pollingInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Robust fetch implementation for smart TVs
  async safeFetch(url, options = {}) {
    // Fallback for browsers without fetch
    if (!window.fetch) {
      return this.legacyXHR(url, options);
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Fetch failed, falling back to XHR:', error);
      return this.legacyXHR(url, options);
    }
  }

  // Legacy XMLHttpRequest for older browsers
  legacyXHR(url, options = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open(options.method || 'GET', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      // Add headers from options
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error'));
      };

      xhr.ontimeout = function() {
        reject(new Error('Request timeout'));
      };

      xhr.timeout = 10000; // 10 second timeout
      xhr.send(options.body || null);
    });
  }

  // Fetch device data with retry logic
  async fetchDeviceData() {
    const url = `${this.baseUrl}/api/device-data`;
    
    try {
      const data = await this.safeFetch(url);
      this.retryCount = 0; // Reset retry count on success
      
      // Cache the data
      this.cache.set('deviceData', {
        data,
        timestamp: Date.now()
      });

      // Notify all listeners
      this.notifyListeners('deviceData', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching device data:', error);
      
      // Return cached data if available
      const cached = this.cache.get('deviceData');
      if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
        console.log('Using cached device data');
        return cached.data;
      }

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying device data fetch (${this.retryCount}/${this.maxRetries})`);
        
        return new Promise((resolve) => {
          window.setTimeout(() => {
            resolve(this.fetchDeviceData());
          }, this.retryDelay);
        });
      }

      throw error;
    }
  }

  // Add a listener for data updates
  addListener(callback) {
    this.listeners.add(callback);
  }

  // Remove a listener
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners of data changes
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in data listener:', error);
      }
    });
  }

  // Start polling for data updates (using native setInterval)
  startPolling(interval = 30000) { // 30 seconds for smart TV stability
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    
    // Fetch immediately
    this.fetchDeviceData().catch(error => {
      console.error('Initial device data fetch failed:', error);
    });

    // Set up polling using native setInterval (avoid any polyfill recursion)
    this.pollingInterval = window.setInterval(() => {
      this.fetchDeviceData().catch(error => {
        console.error('Polling device data fetch failed:', error);
      });
    }, interval);

    console.log(`Started polling device data every ${interval}ms`);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      window.clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Stopped polling device data');
  }

  // Get cached data
  getCachedData(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create a singleton instance
const dataFetcher = new SmartTVDataFetcher();

export default dataFetcher;
