// Smart TV Polyfills for older JavaScript engines
// This file ensures compatibility with smart TV browsers that may have limited JS support

// Core ES6+ polyfills
import 'core-js/stable';

// Polyfill for fetch API (if not available)
if (!window.fetch) {
  import('whatwg-fetch');
}

// Polyfill for Promise (if not available)
if (!window.Promise) {
  const { Promise: ES6Promise } = require('es6-promise');
  window.Promise = ES6Promise;
}

// Polyfill for Object.assign
if (!Object.assign) {
  Object.assign = require('object-assign');
}

// Polyfill for Array.from
if (!Array.from) {
  Array.from = (function () {
    const toStr = Object.prototype.toString;
    const isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    const toInteger = function (value) {
      const number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    const maxSafeInteger = Math.pow(2, 53) - 1;
    const toLength = function (value) {
      const len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    return function from(arrayLike, mapFn, thisArg) {
      const C = this;
      const items = Object(arrayLike);
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }
      const mapFunction = arguments.length > 1 ? mapFn : void undefined;
      let T;
      if (typeof mapFunction !== 'undefined') {
        if (!isCallable(mapFunction)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }
        if (arguments.length > 2) {
          T = thisArg;
        }
      }
      const len = toLength(items.length);
      const A = isCallable(C) ? Object(new C(len)) : new Array(len);
      let k = 0;
      let kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFunction) {
          A[k] = typeof T === 'undefined' ? mapFunction(kValue, k) : mapFunction.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }());
}

// Polyfill for parseFloat (ensure it's robust)
if (!window.parseFloat || isNaN(parseFloat('123'))) {
  window.parseFloat = function(str) {
    const num = Number(str);
    return isNaN(num) ? NaN : num;
  };
}

// Polyfill for parseInt (ensure it's robust)
if (!window.parseInt || parseInt('123', 10) !== 123) {
  window.parseInt = function(str, radix) {
    const num = Number(str);
    if (radix && radix !== 10) {
      // Basic radix support
      if (radix === 16 && typeof str === 'string' && str.match(/^0x/i)) {
        return Number(str);
      }
    }
    return Math.floor(num);
  };
}

// Polyfill for console methods (some smart TVs may not have full console support)
if (!window.console) {
  window.console = {};
}
if (!window.console.log) {
  window.console.log = function() {};
}
if (!window.console.error) {
  window.console.error = function() {};
}
if (!window.console.warn) {
  window.console.warn = function() {};
}

// Polyfill for setInterval/setTimeout reliability
const originalSetInterval = window.setInterval;
const originalSetTimeout = window.setTimeout;

// Ensure setInterval/setTimeout work reliably on smart TVs
window.setInterval = function(callback, delay) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function');
  }
  const safeDelay = Math.max(1, parseInt(delay) || 0);
  return originalSetInterval.call(window, callback, safeDelay);
};

window.setTimeout = function(callback, delay) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function');
  }
  const safeDelay = Math.max(1, parseInt(delay) || 0);
  return originalSetTimeout.call(window, callback, safeDelay);
};

// Force synchronous error handling for smart TV compatibility
window.addEventListener('error', function(e) {
  console.error('Global error caught:', e.error || e.message);
}, true);

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault(); // Prevent the error from crashing the app
}, true);

// Export for testing
const polyfillsModule = {};
export default polyfillsModule;
