/**
 * Configuration file for TMT Translator Extension
 * Keep your API key private and do not commit to public repositories
 */

// Define CONFIG globally (not as ES6 export for service worker compatibility)

const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'https://tmt.ilprl.ku.edu.np/lang-translate',
    // API key will be loaded from chrome.storage at runtime
    API_KEY: null,
    REQUEST_TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000 // milliseconds
  },

  // Language Codes and Mappings
  LANGUAGES: {
    ENGLISH: { code: 'en', name: 'English', native: 'English' },
    NEPALI: { code: 'ne', name: 'Nepali', native: 'नेपाली' },
    TAMANG: { code: 'tmg', name: 'Tamang', native: 'तामाङ' }
  },

  // API Language Code Mappings (some APIs use different codes)
  API_LANGUAGE_CODES: {
    'en': 'en',      // English
    'ne': 'ne',      // Nepali (confirmed working)
    'tmg': 'tmg',    // Tamang - use primary code first
    'tam': 'tam',    // Tamang alternative
    'tag': 'tag',    // Tamang alternative
    'tg': 'tg'       // Tamang alternative
  },

  // Supported Translation Pairs
  TRANSLATION_PAIRS: [
    { from: 'en', to: 'ne', label: 'English → Nepali' },
    { from: 'ne', to: 'en', label: 'Nepali → English' },
    { from: 'en', to: 'tmg', label: 'English → Tamang' },
    { from: 'tmg', to: 'en', label: 'Tamang → English' },
    { from: 'ne', to: 'tmg', label: 'Nepali → Tamang' },
    { from: 'tmg', to: 'ne', label: 'Tamang → Nepali' }
  ],

  // Translation options
  TRANSLATION: {
    // Maximum characters to send per API call (to respect API limits)
    MAX_CHARS_PER_REQUEST: 500,
    // Delay between API calls in milliseconds (increased to respect rate limits)
    DELAY_BETWEEN_CALLS: 1000,
    // Store translation cache to avoid redundant API calls
    ENABLE_CACHE: true,
    // Cache expiry time in minutes
    CACHE_EXPIRY: 60
  },

  // UI/UX Configuration
  UI: {
    // Maximum number of elements to translate at once
    MAX_ELEMENTS_PER_BATCH: 50,
    // Show loading indicator
    SHOW_LOADING: true,
    // Enable notifications
    ENABLE_NOTIFICATIONS: true
  },

  // Selectors to translate (customize as needed)
  SELECTORS_TO_TRANSLATE: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'li', 'td', 'th',
    'a', 'button', 'label', 'title'
  ],

  // Selectors to SKIP (do not translate)
  SELECTORS_TO_SKIP: [
    'script', 'style', 'code', 'pre',
    '.no-translate', '[data-no-translate]',
    '.notification', '.alert'
  ]
};

// CONFIG is now globally available for all scripts
// Service workers access it via importScripts('./config.js')
// Popup accesses it as a global variable

/**
 * Initialize API key from chrome.storage
 * Call this in background.js and popup.js at startup
 */
async function initializeAPIKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get('tmt_api_key', (result) => {
      if (result.tmt_api_key) {
        CONFIG.API.API_KEY = result.tmt_api_key;
        console.log('API key loaded from storage');
      } else {
        console.warn('API key not found in storage. Please set it in extension options.');
      }
      resolve(CONFIG.API.API_KEY);
    });
  });
}

/**
 * Set API key in chrome.storage
 * @param {string} apiKey - The API key to store
 */
async function setAPIKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ tmt_api_key: apiKey }, () => {
      CONFIG.API.API_KEY = apiKey;
      console.log('API key saved to storage');
      resolve(true);
    });
  });
}

/**
 * Get current API key
 */
function getAPIKey() {
  return CONFIG.API.API_KEY;
}
