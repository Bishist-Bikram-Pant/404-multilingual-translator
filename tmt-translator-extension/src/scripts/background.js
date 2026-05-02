/**
 * Background Service Worker
 * Handles background tasks and message passing between popup and content scripts
 * 
 * Note: Service workers must load dependencies with importScripts(), not ES6 imports
 */

console.log('[Background] Service Worker starting...');

// Load dependencies for service worker (must use importScripts, not ES6 imports)
try {
  importScripts('./config.js', './translation-service.js');
  console.log('[Background] Dependencies loaded successfully');
} catch (error) {
  console.error('[Background] Failed to load dependencies:', error);
}

// Store active translation state per tab
const translationState = new Map();

// Track if service worker is ready
let isReady = false;

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed/updated');
  isReady = true;
});

console.log('[Background] Initializing message listener...');

/**
 * Listen for messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Message received:', request.action, 'from', sender.url?.substring(0, 50) || 'unknown');
  
  // Ensure we're ready
  if (!isReady) {
    console.warn('[Background] Service worker not yet ready, marking as ready now');
    isReady = true;
  }

  switch (request.action) {
    case 'TRANSLATE_TEXT':
      handleTranslateText(request, sendResponse);
      return true; // Keep the message channel open for async response

    case 'GET_TRANSLATION_STATE':
      handleGetTranslationState(request, sendResponse);
      return true;

    case 'SET_TRANSLATION_STATE':
      handleSetTranslationState(request);
      break;

    case 'GET_CACHE_STATS':
      sendResponse({
        stats: translationService.getCacheStats()
      });
      break;

    case 'CLEAR_CACHE':
      translationService.clearCache();
      sendResponse({ success: true });
      break;

    case 'DETECT_LANGUAGE':
      const detected = translationService.detectLanguage(request.text);
      sendResponse({ language: detected });
      break;

    default:
      console.warn('[Background] Unknown action:', request.action);
  }
});

/**
 * Handle text translation request
 */
async function handleTranslateText(request, sendResponse) {
  try {
    const { text, srcLang, tgtLang } = request;

    if (!text || !srcLang || !tgtLang) {
      console.warn('[Background] Missing required fields in translation request');
      sendResponse({
        success: false,
        error: 'Missing required fields: text, srcLang, tgtLang'
      });
      return;
    }

    console.log(`[Background] Translating: ${srcLang} → ${tgtLang}, text length: ${text.length}`);
    
    if (!translationService) {
      throw new Error('Translation service not initialized');
    }

    const translated = await translationService.translate(text, srcLang, tgtLang);

    console.log(`[Background] Translation successful: "${text.substring(0, 50)}..." → "${translated.substring(0, 50)}..."`);
    
    sendResponse({
      success: true,
      original: text,
      translated: translated,
      srcLang: srcLang,
      tgtLang: tgtLang
    });
  } catch (error) {
    console.error('[Background] Translation error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle getting translation state for a tab
 */
function handleGetTranslationState(request, sendResponse) {
  const tabId = request.tabId;
  const state = translationState.get(tabId) || {
    isTranslating: false,
    srcLang: 'en',
    tgtLang: 'ne',
    elementCount: 0
  };

  sendResponse(state);
}

/**
 * Handle setting translation state for a tab
 */
function handleSetTranslationState(request) {
  const { tabId, state } = request;
  translationState.set(tabId, state);

  // Update badge with translation status
  updateBadge(tabId, state);
}

/**
 * Update extension badge based on translation state
 */
function updateBadge(tabId, state) {
  if (state.isTranslating) {
    chrome.action.setBadgeText({ text: '●', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

/**
 * Clean up when tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  translationState.delete(tabId);
  console.log(`[Background] Cleaned up state for closed tab: ${tabId}`);
});

console.log('[Background] Service worker initialized');
