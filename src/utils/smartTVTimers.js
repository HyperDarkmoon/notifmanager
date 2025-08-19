// Smart TV Timer Utilities
// This module provides reliable timer functions for smart TV browsers

class SmartTVTimers {
  constructor() {
    this.intervals = new Map();
    this.timeouts = new Map();
    this.nextId = 1;
    this.useAlternativeTimer = this.shouldUseAlternativeTimer();
  }

  // Detect if we need alternative timer implementation
  shouldUseAlternativeTimer() {
    // Check if we're on a smart TV or limited browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isSmartTV = userAgent.includes('smart') || 
                      userAgent.includes('tv') || 
                      userAgent.includes('webos') || 
                      userAgent.includes('tizen') || 
                      userAgent.includes('roku');
    
    // Check if timers are unreliable
    const start = Date.now();
    const testTimer = setTimeout(() => {}, 100);
    clearTimeout(testTimer);
    const elapsed = Date.now() - start;
    
    return isSmartTV || elapsed > 50; // If clearing a timer takes > 50ms, timers are slow
  }

  // Reliable setInterval replacement
  setInterval(callback, delay) {
    if (!this.useAlternativeTimer) {
      const intervalId = setInterval(callback, delay);
      return intervalId;
    }

    const id = this.nextId++;
    const startTime = Date.now();
    let nextExecution = startTime + delay;

    const tick = () => {
      const now = Date.now();
      if (now >= nextExecution) {
        try {
          callback();
        } catch (error) {
          console.error('Error in interval callback:', error);
        }
        nextExecution = now + delay;
      }
      
      if (this.intervals.has(id)) {
        // Use setTimeout for next iteration
        const timeoutId = setTimeout(tick, Math.min(delay / 4, 100)); // Check more frequently
        this.intervals.set(id, timeoutId);
      }
    };

    const timeoutId = setTimeout(tick, delay);
    this.intervals.set(id, timeoutId);
    return id;
  }

  // Reliable clearInterval replacement
  clearInterval(id) {
    if (!this.useAlternativeTimer) {
      clearInterval(id);
      return;
    }

    if (this.intervals.has(id)) {
      const timeoutId = this.intervals.get(id);
      clearTimeout(timeoutId);
      this.intervals.delete(id);
    }
  }

  // Reliable setTimeout replacement
  setTimeout(callback, delay) {
    if (!this.useAlternativeTimer) {
      const timeoutId = setTimeout(callback, delay);
      return timeoutId;
    }

    const id = this.nextId++;
    const startTime = Date.now();
    const targetTime = startTime + delay;

    const tick = () => {
      const now = Date.now();
      if (now >= targetTime) {
        this.timeouts.delete(id);
        try {
          callback();
        } catch (error) {
          console.error('Error in timeout callback:', error);
        }
      } else if (this.timeouts.has(id)) {
        // Check again after a short delay
        const remainingTime = targetTime - now;
        const nextCheck = Math.min(remainingTime, 100);
        const timeoutId = setTimeout(tick, nextCheck);
        this.timeouts.set(id, timeoutId);
      }
    };

    const timeoutId = setTimeout(tick, Math.min(delay, 100));
    this.timeouts.set(id, timeoutId);
    return id;
  }

  // Reliable clearTimeout replacement
  clearTimeout(id) {
    if (!this.useAlternativeTimer) {
      clearTimeout(id);
      return;
    }

    if (this.timeouts.has(id)) {
      const timeoutId = this.timeouts.get(id);
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
  }

  // Clean up all timers
  clearAll() {
    this.intervals.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.timeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.intervals.clear();
    this.timeouts.clear();
  }

  // Get timer stats
  getStats() {
    return {
      activeIntervals: this.intervals.size,
      activeTimeouts: this.timeouts.size,
      usingAlternativeTimer: this.useAlternativeTimer
    };
  }
}

// Create singleton instance
const smartTVTimers = new SmartTVTimers();

// Override global timer functions for smart TV compatibility
const originalSetInterval = window.setInterval;
const originalClearInterval = window.clearInterval;
const originalSetTimeout = window.setTimeout;
const originalClearTimeout = window.clearTimeout;

// Export both the class and override functions
export default smartTVTimers;

export const setSmartInterval = (callback, delay) => smartTVTimers.setInterval(callback, delay);
export const clearSmartInterval = (id) => smartTVTimers.clearInterval(id);
export const setSmartTimeout = (callback, delay) => smartTVTimers.setTimeout(callback, delay);
export const clearSmartTimeout = (id) => smartTVTimers.clearTimeout(id);

// Function to enable global timer overrides
export const enableGlobalTimerOverrides = () => {
  window.setInterval = setSmartInterval;
  window.clearInterval = clearSmartInterval;
  window.setTimeout = setSmartTimeout;
  window.clearTimeout = clearSmartTimeout;
  console.log('Smart TV timer overrides enabled');
};

// Function to disable global timer overrides
export const disableGlobalTimerOverrides = () => {
  window.setInterval = originalSetInterval;
  window.clearInterval = originalClearInterval;
  window.setTimeout = originalSetTimeout;
  window.clearTimeout = originalClearTimeout;
  console.log('Smart TV timer overrides disabled');
};
