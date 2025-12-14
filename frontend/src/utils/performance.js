/**
 * Performance Utilities
 * Helper functions for optimizing React app performance
 */

/**
 * Debounce function
 * Delays execution until after wait milliseconds have elapsed since the last call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Throttle function
 * Ensures function is called at most once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds between calls
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images
 */
export const lazyLoadImages = (selector = "[data-lazy]") => {
  const images = document.querySelectorAll(selector);

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.lazy;
          img.removeAttribute("data-lazy");
          observer.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    images.forEach((img) => {
      img.src = img.dataset.lazy;
      img.removeAttribute("data-lazy");
    });
  }
};

/**
 * Preload critical assets
 * @param {string[]} urls - Array of asset URLs to preload
 * @param {string} type - Asset type ('image', 'script', 'style', 'font')
 */
export const preloadAssets = (urls, type = "image") => {
  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;
    link.as = type;
    if (type === "font") {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  });
};

/**
 * Calculate image dimensions to maintain aspect ratio
 * @param {number} originalWidth
 * @param {number} originalHeight
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{width: number, height: number}}
 */
export const calculateAspectRatio = (
  originalWidth,
  originalHeight,
  maxWidth,
  maxHeight
) => {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: originalWidth * ratio,
    height: originalHeight * ratio,
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Check if device has slow connection
 * @returns {boolean}
 */
export const isSlowConnection = () => {
  if ("connection" in navigator) {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    return (
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"
    );
  }
  return false;
};

/**
 * Prefetch page route for faster navigation
 * @param {string} href - Route to prefetch
 */
export const prefetchRoute = (href) => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Memoize function results for expensive computations
 * @param {Function} fn - Function to memoize
 * @returns {Function} Memoized function
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Get optimized image URL based on device pixel ratio
 * @param {string} baseUrl - Base image URL
 * @param {number} width - Desired width
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (baseUrl, width) => {
  const dpr = window.devicePixelRatio || 1;
  const optimizedWidth = Math.ceil(width * dpr);
  // Assuming Cloudinary or similar CDN with transformation support
  return baseUrl.replace(
    "/upload/",
    `/upload/w_${optimizedWidth},f_auto,q_auto/`
  );
};

/**
 * Wait for all images to load in container
 * @param {HTMLElement} container - Container element
 * @returns {Promise<void>}
 */
export const waitForImages = (container) => {
  const images = container.querySelectorAll("img");
  const promises = Array.from(images).map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.addEventListener("load", resolve);
          img.addEventListener("error", resolve);
        }
      })
  );
  return Promise.all(promises);
};

/**
 * Request idle callback with fallback
 * @param {Function} callback - Function to execute during idle time
 * @param {Object} options - Options for requestIdleCallback
 */
export const requestIdleCallback = (callback, options) => {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  }
  return setTimeout(callback, 1);
};

/**
 * Cancel idle callback with fallback
 * @param {number} id - Callback ID to cancel
 */
export const cancelIdleCallback = (id) => {
  if ("cancelIdleCallback" in window) {
    return window.cancelIdleCallback(id);
  }
  clearTimeout(id);
};

export default {
  debounce,
  throttle,
  lazyLoadImages,
  preloadAssets,
  calculateAspectRatio,
  formatFileSize,
  isSlowConnection,
  prefetchRoute,
  memoize,
  getOptimizedImageUrl,
  waitForImages,
  requestIdleCallback,
  cancelIdleCallback,
};
