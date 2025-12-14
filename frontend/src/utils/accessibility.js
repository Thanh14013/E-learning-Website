/**
 * Accessibility Utilities
 * Helper functions for improving web accessibility
 */

/**
 * Trap focus within a modal or dialog
 * @param {HTMLElement} element - Container element
 * @returns {Function} Cleanup function
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener("keydown", handleTab);

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleTab);
  };
};

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = "polite") => {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Add skip navigation link
 * @param {string} targetId - ID of main content element
 */
export const addSkipLink = (targetId = "main-content") => {
  const skipLink = document.createElement("a");
  skipLink.href = `#${targetId}`;
  skipLink.className = "skip-link";
  skipLink.textContent = "Skip to main content";
  skipLink.style.cssText = `
    position: absolute;
    left: -9999px;
    z-index: 999;
    padding: 1em;
    background-color: #000;
    color: #fff;
    text-decoration: none;
  `;
  skipLink.addEventListener("focus", () => {
    skipLink.style.left = "0";
  });
  skipLink.addEventListener("blur", () => {
    skipLink.style.left = "-9999px";
  });

  document.body.prepend(skipLink);
};

/**
 * Check if element is keyboard focusable
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export const isKeyboardFocusable = (element) => {
  const tabindex = element.getAttribute("tabindex");
  const nodeName = element.nodeName.toLowerCase();
  const isDisabled = element.hasAttribute("disabled");

  if (isDisabled) return false;
  if (tabindex !== null && parseInt(tabindex) >= 0) return true;

  const focusableElements = ["a", "button", "input", "select", "textarea"];
  return focusableElements.includes(nodeName);
};

/**
 * Get color contrast ratio
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} Contrast ratio
 */
export const getContrastRatio = (foreground, background) => {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/**
 * Check if color combination meets WCAG AA standards
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {boolean} largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {boolean}
 */
export const meetsWCAGAA = (foreground, background, largeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Add ARIA labels to navigation landmarks
 */
export const labelLandmarks = () => {
  const nav = document.querySelector("nav");
  const main = document.querySelector("main");
  const aside = document.querySelector("aside");
  const footer = document.querySelector("footer");

  if (nav && !nav.hasAttribute("aria-label")) {
    nav.setAttribute("aria-label", "Main navigation");
  }
  if (main && !main.hasAttribute("role")) {
    main.setAttribute("role", "main");
  }
  if (aside && !aside.hasAttribute("aria-label")) {
    aside.setAttribute("aria-label", "Sidebar");
  }
  if (footer && !footer.hasAttribute("aria-label")) {
    footer.setAttribute("aria-label", "Footer");
  }
};

/**
 * Ensure images have alt text
 * @param {HTMLElement} container - Container to check
 */
export const ensureImageAltText = (container = document.body) => {
  const images = container.querySelectorAll("img:not([alt])");
  images.forEach((img, index) => {
    console.warn(`Image without alt text found:`, img);
    img.setAttribute("alt", `Image ${index + 1}`);
  });
};

/**
 * Make external links accessible
 * @param {HTMLElement} container - Container to check
 */
export const makeExternalLinksAccessible = (container = document.body) => {
  const externalLinks = container.querySelectorAll(
    'a[href^="http"]:not([href*="' + window.location.hostname + '"])'
  );

  externalLinks.forEach((link) => {
    if (!link.hasAttribute("rel")) {
      link.setAttribute("rel", "noopener noreferrer");
    }
    if (!link.hasAttribute("target")) {
      link.setAttribute("target", "_blank");
    }
    if (!link.getAttribute("aria-label")) {
      const text = link.textContent.trim();
      link.setAttribute("aria-label", `${text} (opens in new tab)`);
    }
  });
};

/**
 * Add keyboard navigation to custom components
 * @param {HTMLElement[]} elements - Array of elements
 * @param {Function} onSelect - Callback when item is selected
 */
export const addKeyboardNavigation = (elements, onSelect) => {
  let currentIndex = 0;

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, elements.length - 1);
        elements[currentIndex].focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        elements[currentIndex].focus();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(elements[currentIndex], currentIndex);
        break;
      case "Home":
        e.preventDefault();
        currentIndex = 0;
        elements[currentIndex].focus();
        break;
      case "End":
        e.preventDefault();
        currentIndex = elements.length - 1;
        elements[currentIndex].focus();
        break;
    }
  };

  elements.forEach((element, index) => {
    element.setAttribute("tabindex", index === 0 ? "0" : "-1");
    element.addEventListener("keydown", handleKeyDown);
    element.addEventListener("focus", () => {
      currentIndex = index;
    });
  });

  return () => {
    elements.forEach((element) => {
      element.removeEventListener("keydown", handleKeyDown);
    });
  };
};

export default {
  trapFocus,
  announceToScreenReader,
  addSkipLink,
  isKeyboardFocusable,
  getContrastRatio,
  meetsWCAGAA,
  labelLandmarks,
  ensureImageAltText,
  makeExternalLinksAccessible,
  addKeyboardNavigation,
};
