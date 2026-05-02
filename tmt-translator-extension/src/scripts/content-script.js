/**
 * Content Script
 * Injects into the web page and handles DOM translation
 * This script runs in the context of the web page
 * 
 * Note: Content scripts cannot use importScripts() or ES6 imports
 * Configuration is embedded directly in this file
 */

// Configuration values (from CONFIG) - embedded for content script compatibility
const CONTENT_SCRIPT_CONFIG = {
  SELECTORS_TO_TRANSLATE: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'li', 'td', 'th',
    'a', 'button', 'label', 'title'
  ],
  SELECTORS_TO_SKIP: [
    'script', 'style', 'code', 'pre',
    '.no-translate', '[data-no-translate]',
    '.notification', '.alert'
  ],
  UI: {
    MAX_ELEMENTS_PER_BATCH: 100
  },
  TRANSLATION: {
    DELAY_BETWEEN_CALLS: 300,
    MAX_CHARS_PER_REQUEST: 500
  }
};

class PageTranslator {
  constructor() {
    this.isTranslating = false;
    this.currentSrcLang = 'en';
    this.currentTgtLang = 'ne';
    this.translatedElements = new Map(); // Store original content
    this.translationQueue = [];
    this.processingQueue = false;
    this.config = CONTENT_SCRIPT_CONFIG;
  }

  /**
   * Initialize the page translator
   */
  init() {
    console.log('[Content Script] PageTranslator initialized');
    this.setupMessageListener();
  }

  /**
   * Setup message listener for commands from popup/background
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[Content Script] Message received:', request.action);

      switch (request.action) {
        case 'START_TRANSLATION':
          this.startTranslation(request.srcLang, request.tgtLang);
          sendResponse({ success: true });
          break;

        case 'STOP_TRANSLATION':
          this.stopTranslation();
          sendResponse({ success: true });
          break;

        case 'RESET_PAGE':
          this.resetPage();
          sendResponse({ success: true });
          break;

        case 'GET_PAGE_STATUS':
          sendResponse({
            isTranslating: this.isTranslating,
            srcLang: this.currentSrcLang,
            tgtLang: this.currentTgtLang,
            elementCount: this.translatedElements.size
          });
          break;

        default:
          console.warn('[Content Script] Unknown action:', request.action);
      }
    });
  }

  /**
   * Start translating the page
   */
  async startTranslation(srcLang, tgtLang) {
    if (this.isTranslating) {
      console.log('[Content Script] Translation already in progress');
      return;
    }

    console.log(`[Content Script] Starting translation: ${srcLang} → ${tgtLang}`);
    this.isTranslating = true;
    this.currentSrcLang = srcLang;
    this.currentTgtLang = tgtLang;

    try {
      // Small delay to ensure service worker is ready
      await this.delay(100);
      
      // Get all translatable elements
      const elements = this.getTranslatableElements();
      console.log(`[Content Script] Found ${elements.length} elements to translate`);

      if (elements.length === 0) {
        console.warn('[Content Script] No translatable elements found');
        this.isTranslating = false;
        return;
      }

      // Process elements in batches
      await this.processElementsInBatches(elements);

      // Update status
      this.updateStatus();
      console.log('[Content Script] Translation completed');
    } catch (error) {
      console.error('[Content Script] Translation error:', error);
      this.isTranslating = false;
    }
  }

  /**
   * Get all translatable elements from the page
   */
  getTranslatableElements() {
    const elements = [];
    const selector = this.config.SELECTORS_TO_TRANSLATE.join(', ');
    const skipSelector = this.config.SELECTORS_TO_SKIP.join(', ');

    try {
      const allElements = document.querySelectorAll(selector);

      for (const element of allElements) {
        // Skip if matches skip selectors
        if (element.closest(skipSelector)) {
          continue;
        }

        // Skip if empty
        if (!element.textContent || element.textContent.trim().length === 0) {
          continue;
        }

        // Only process text nodes (not all descendants)
        if (this.hasDirectTextContent(element)) {
          elements.push(element);
        }
      }
    } catch (error) {
      console.error('[Content Script] Error getting elements:', error);
    }

    return elements;
  }

  /**
   * Check if element has direct text content (not just nested elements)
   */
  hasDirectTextContent(element) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Process elements in batches to avoid overwhelming the API
   */
  async processElementsInBatches(elements) {
    const batchSize = this.config.UI.MAX_ELEMENTS_PER_BATCH;

    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      await this.processBatch(batch);

      // Add delay between batches to respect rate limiting
      if (i + batchSize < elements.length) {
        console.log(`[Content Script] Batch complete, waiting before next batch...`);
        await this.delay(this.config.TRANSLATION.DELAY_BETWEEN_CALLS * 3);
      }
    }
  }

  /**
   * Process a batch of elements sequentially (NOT concurrently) to avoid rate limiting
   */
  async processBatch(elements) {
    for (const element of elements) {
      await this.translateElement(element);
      // Small delay between each element to avoid overwhelming the API
      await this.delay(this.config.TRANSLATION.DELAY_BETWEEN_CALLS);
    }
  }

  /**
   * Translate a single element
   */
  async translateElement(element) {
    try {
      // Store original content if not already stored
      const elementId = this.getElementId(element);
      if (!this.translatedElements.has(elementId)) {
        this.translatedElements.set(elementId, {
          element: element,
          original: element.textContent,
          originalHTML: element.innerHTML
        });
      }

      const originalText = this.translatedElements.get(elementId).original;

      // Skip very long texts to respect API limits
      if (originalText.length > this.config.TRANSLATION.MAX_CHARS_PER_REQUEST) {
        console.warn('[Content Script] Text too long, skipping:', originalText.substring(0, 50));
        return;
      }

      // Send translation request to background script
      const response = await this.sendTranslationRequest(
        originalText,
        this.currentSrcLang,
        this.currentTgtLang
      );

      if (response.success) {
        this.updateElementContent(element, response.translated);
        await this.delay(this.config.TRANSLATION.DELAY_BETWEEN_CALLS);
      } else {
        console.error('[Content Script] Translation failed for element:', response.error);
      }
    } catch (error) {
      console.error('[Content Script] Error translating element:', error);
    }
  }

  /**
   * Send translation request to background script with retry logic
   */
  sendTranslationRequest(text, srcLang, tgtLang, retries = 3) {
    return new Promise((resolve, reject) => {
      const sendRequest = (attemptsLeft) => {
        console.log(`[Content Script] Sending translation request (attempt ${4 - attemptsLeft})...`);
        
        chrome.runtime.sendMessage(
          {
            action: 'TRANSLATE_TEXT',
            text: text,
            srcLang: srcLang,
            tgtLang: tgtLang
          },
          (response) => {
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message;
              console.error('[Content Script] Message error:', errorMsg);
              
              // Retry if service worker not ready
              if (errorMsg.includes('Receiving end does not exist') && attemptsLeft > 0) {
                console.log(`[Content Script] Service worker not ready, retrying in 1 second...`);
                setTimeout(() => sendRequest(attemptsLeft - 1), 1000);
              } else if (attemptsLeft > 0) {
                // Retry on other errors too
                console.log(`[Content Script] Error occurred, retrying in 1 second...`);
                setTimeout(() => sendRequest(attemptsLeft - 1), 1000);
              } else {
                reject(new Error(errorMsg));
              }
            } else if (!response) {
              console.error('[Content Script] No response from background');
              if (attemptsLeft > 0) {
                setTimeout(() => sendRequest(attemptsLeft - 1), 1000);
              } else {
                reject(new Error('No response from background service worker'));
              }
            } else {
              console.log('[Content Script] Translation response received:', response.translated?.substring(0, 50));
              resolve(response);
            }
          }
        );
      };
      
      sendRequest(retries);
    });
  }

  /**
   * Update element content with translated text
   */
  updateElementContent(element, translatedText) {
    // Preserve HTML structure - only replace text nodes
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = translatedText;
        break; // Only update the first text node
      }
    }

    // Add visual indicator
    element.style.borderLeft = '3px solid #4CAF50';
    element.style.paddingLeft = '5px';
  }

  /**
   * Stop translation and revert changes
   */
  stopTranslation() {
    console.log('[Content Script] Stopping translation');
    this.isTranslating = false;
  }

  /**
   * Reset the page to original state
   */
  resetPage() {
    console.log('[Content Script] Resetting page');

    for (const data of this.translatedElements.values()) {
      data.element.textContent = data.original;
      data.element.style.borderLeft = 'none';
      data.element.style.paddingLeft = '0';
    }

    this.translatedElements.clear();
    this.isTranslating = false;
    this.updateStatus();
  }

  /**
   * Get unique ID for an element
   */
  getElementId(element) {
    if (element.id) {
      return element.id;
    }

    // Generate a pseudo-ID based on position and text content hash
    const text = element.textContent.substring(0, 20);
    const hash = this.simpleHash(text);
    return `elem_${hash}`;
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Update status in background script
   */
  updateStatus() {
    const tabId = chrome.runtime.id;
    chrome.runtime.sendMessage({
      action: 'SET_TRANSLATION_STATE',
      tabId: tabId,
      state: {
        isTranslating: this.isTranslating,
        srcLang: this.currentSrcLang,
        tgtLang: this.currentTgtLang,
        elementCount: this.translatedElements.size
      }
    });
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize on page load
const pageTranslator = new PageTranslator();
pageTranslator.init();

// Expose globally for debugging
window.pageTranslator = pageTranslator;

console.log('[Content Script] Loaded and ready');
