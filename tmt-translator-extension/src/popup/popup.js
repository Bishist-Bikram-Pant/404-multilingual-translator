/**
 * Popup Script
 * Handles user interactions in the extension popup
 * Note: CONFIG is loaded as a global from config.js script
 */

class PopupController {
  constructor() {
    this.currentTab = null;
    this.isTranslating = false;
    this.elementCache = new Map();
    this.initializeElements();
    this.setupEventListeners();
    this.updateStatus();
  }

  /**
   * Cache DOM elements for frequent access
   */
  initializeElements() {
    this.elements = {
      sourceLang: document.getElementById('sourceLang'),
      targetLang: document.getElementById('targetLang'),
      swapBtn: document.getElementById('swapLangs'),
      translateBtn: document.getElementById('translateBtn'),
      resetBtn: document.getElementById('resetBtn'),
      clearCacheBtn: document.getElementById('clearCacheBtn'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      statusDot: document.querySelector('.status-dot'),
      progressSection: document.getElementById('progressSection'),
      progressFill: document.getElementById('progressFill'),
      progressText: document.getElementById('progressText'),
      elementCount: document.getElementById('elementCount'),
      cacheSize: document.getElementById('cacheSize'),
      errorMessage: document.getElementById('errorMessage'),
      successMessage: document.getElementById('successMessage'),
      enableCache: document.getElementById('enableCache'),
      elementCountSpan: document.querySelector('[data-element-count]')
    };
  }

  /**
   * Setup event listeners for UI interactions
   */
  setupEventListeners() {
    this.elements.translateBtn.addEventListener('click', () => this.handleTranslate());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());
    this.elements.swapBtn.addEventListener('click', () => this.handleSwapLanguages());
    this.elements.clearCacheBtn.addEventListener('click', () => this.handleClearCache());

    // Auto-update on language selection change
    this.elements.sourceLang.addEventListener('change', () => this.validateLanguagePair());
    this.elements.targetLang.addEventListener('change', () => this.validateLanguagePair());

    // Update status periodically
    setInterval(() => this.updateStatus(), 2000);
  }

  /**
   * Validate language pair is supported
   */
  validateLanguagePair() {
    const src = this.elements.sourceLang.value;
    const tgt = this.elements.targetLang.value;

    if (src === tgt) {
      this.showError('Source and target languages must be different');
      this.elements.sourceLang.value = 'en';
      this.elements.targetLang.value = 'ne';
      return false;
    }

    const isValid = CONFIG.TRANSLATION_PAIRS.some(
      pair => pair.from === src && pair.to === tgt
    );

    if (!isValid) {
      this.showError(`Translation pair ${src} → ${tgt} is not supported`);
      this.elements.targetLang.value = 'ne';
      return false;
    }

    return true;
  }

  /**
   * Handle translate button click
   */
  async handleTranslate() {
    if (!this.validateLanguagePair()) {
      return;
    }

    const srcLang = this.elements.sourceLang.value;
    const tgtLang = this.elements.targetLang.value;

    if (this.isTranslating) {
      this.showError('Translation already in progress');
      return;
    }

    this.isTranslating = true;
    this.elements.translateBtn.disabled = true;
    this.showProgress(true);
    this.clearMessages();

    try {
      console.log(`[Popup] Starting translation: ${srcLang} → ${tgtLang}`);

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      // Send translation command to content script
      const response = await this.sendMessage({
        action: 'START_TRANSLATION',
        srcLang: srcLang,
        tgtLang: tgtLang
      });

      if (response.success) {
        this.showSuccess('Page translation started successfully!');
        this.updateStatus();
      } else {
        this.showError('Failed to start translation: ' + response.error);
      }
    } catch (error) {
      console.error('[Popup] Translation error:', error);
      this.showError('Translation error: ' + error.message);
    } finally {
      this.isTranslating = false;
      this.elements.translateBtn.disabled = false;
      this.showProgress(false);
    }
  }

  /**
   * Handle reset button click
   */
  async handleReset() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await this.sendMessage({ action: 'RESET_PAGE' });
      this.showSuccess('Page has been reset to original content');
      this.updateStatus();
    } catch (error) {
      console.error('[Popup] Reset error:', error);
      this.showError('Failed to reset page: ' + error.message);
    }
  }

  /**
   * Handle swap languages button click
   */
  handleSwapLanguages() {
    const src = this.elements.sourceLang.value;
    const tgt = this.elements.targetLang.value;

    this.elements.sourceLang.value = tgt;
    this.elements.targetLang.value = src;

    this.validateLanguagePair();
  }

  /**
   * Handle clear cache button click
   */
  async handleClearCache() {
    try {
      await chrome.runtime.sendMessage({ action: 'CLEAR_CACHE' });
      this.showSuccess('Cache cleared successfully');
      this.updateCacheSize();
    } catch (error) {
      console.error('[Popup] Clear cache error:', error);
      this.showError('Failed to clear cache: ' + error.message);
    }
  }

  /**
   * Send message to content script
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.currentTab || !this.currentTab.id) {
        reject(new Error('No active tab found'));
        return;
      }

      console.log(`[Popup] Sending message to tab ${this.currentTab.id}:`, message.action);
      
      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Tab message error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response) {
          console.error('[Popup] No response from content script');
          reject(new Error('No response from content script'));
        } else {
          console.log('[Popup] Response received:', response);
          resolve(response);
        }
      });
    });
  }

  /**
   * Update status display
   */
  async updateStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      // Get page status from content script
      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_STATUS' }, (response) => {
          resolve(response || { isTranslating: false, elementCount: 0 });
        });
      }).catch(() => ({ isTranslating: false, elementCount: 0 }));

      // Update element count
      this.elements.elementCount.textContent = response.elementCount || 0;

      // Update status indicator
      if (response.isTranslating) {
        this.elements.statusText.textContent = 'Translating...';
        this.elements.statusDot.classList.add('translating');
        this.elements.translateBtn.disabled = true;
      } else {
        this.elements.statusText.textContent = 'Ready';
        this.elements.statusDot.classList.remove('translating');
        this.elements.translateBtn.disabled = false;
      }

      // Update cache size
      this.updateCacheSize();
    } catch (error) {
      console.log('[Popup] Could not get page status (might be restricted page)');
      this.elements.statusText.textContent = 'Restricted page';
      this.elements.statusDot.classList.add('inactive');
      this.elements.translateBtn.disabled = true;
    }
  }

  /**
   * Update cache size display
   */
  async updateCacheSize() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_CACHE_STATS' });
      this.elements.cacheSize.textContent = response.stats.size || 0;
    } catch (error) {
      console.log('[Popup] Could not get cache stats');
    }
  }

  /**
   * Show progress indicator
   */
  showProgress(show) {
    if (show) {
      this.elements.progressSection.style.display = 'block';
      this.elements.progressText.textContent = 'Translating... Please wait';
    } else {
      this.elements.progressSection.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.style.display = 'block';
    this.elements.successMessage.style.display = 'none';

    setTimeout(() => {
      this.elements.errorMessage.style.display = 'none';
    }, 5000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.elements.successMessage.textContent = message;
    this.elements.successMessage.style.display = 'block';
    this.elements.errorMessage.style.display = 'none';

    setTimeout(() => {
      this.elements.successMessage.style.display = 'none';
    }, 5000);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.elements.errorMessage.style.display = 'none';
    this.elements.successMessage.style.display = 'none';
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] Initializing popup controller');
  new PopupController();
});
