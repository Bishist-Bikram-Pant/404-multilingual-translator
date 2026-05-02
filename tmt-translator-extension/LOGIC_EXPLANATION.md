# Google TMT Translator Extension - Logic & Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Translation Process](#translation-process)
6. [Key Features](#key-features)
7. [Technical Decisions](#technical-decisions)

---

## Overview

**Google TMT Translator** is a browser extension that enables real-time translation of web page content using the Google Trilingual Machine Translation (TMT) API. It supports bidirectional translation between English, Nepali, and Tamang languages.

### Supported Translation Pairs
- English ↔ Nepali (EN ↔ NE)
- English ↔ Tamang (EN ↔ TMG)
- Nepali ↔ Tamang (NE ↔ TMG)

---

## Architecture

The extension follows a **modular, service-oriented architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER EXTENSION                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │   POPUP UI   │  │   CONTENT    │  │BACKGROUND│  │
│  │              │  │   SCRIPT     │  │  WORKER  │  │
│  │ popup.html   │  │  Runs on     │  │          │  │
│  │ popup.css    │  │  webpage     │  │ Handles  │  │
│  │ popup.js     │  │              │  │ API calls│  │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │
│         │                 │                │        │
│         └─────────────────┼────────────────┘        │
│                           │                         │
│              Message Passing (chrome.runtime)       │
│                           │                         │
│  ┌────────────────────────▼───────────────────┐    │
│  │         Translation Service Module         │    │
│  │     (translation-service.js)              │    │
│  │  • API Communication                      │    │
│  │  • Caching Logic                          │    │
│  │  • Language Detection                     │    │
│  └────────────────────────────────────────────┘    │
│                           │                         │
│  ┌────────────────────────▼───────────────────┐    │
│  │        Config Module (config.js)          │    │
│  │  • API Settings                           │    │
│  │  • Language Mappings                      │    │
│  │  • Translation Pairs                      │    │
│  │  • DOM Selectors                          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │        External TMT API                    │    │
│  │  https://tmt.ilprl.ku.edu.np/lang-translate   │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Core Components

#### 1. **manifest.json** - Extension Configuration
- Declares extension metadata and permissions
- Defines popup UI
- Registers background service worker
- Configures content scripts for all URLs
- Sets required permissions and host permissions

#### 2. **config.js** - Configuration Module
- Centralized configuration for API, languages, and UI settings
- Stores API endpoint and placeholder for API key
- Defines supported language pairs
- Contains DOM selector rules for translation
- Configurable cache settings and batch sizes

#### 3. **translation-service.js** - Core Translation Logic
- Handles all communication with TMT API
- Implements caching to reduce API calls
- Language pair validation
- Request/response handling with error management
- Language detection using script analysis

#### 4. **background.js** - Service Worker
- Acts as the messaging hub between popup and content scripts
- Translates messages from popup to content script
- Handles background translation requests
- Maintains translation state per tab
- Updates extension badge based on translation status
- Cleans up when tabs are closed

#### 5. **content-script.js** - Page Translator
- Injected into every webpage
- Finds translatable elements on the page
- Sends translation requests to background worker
- Updates DOM with translated content
- Maintains mapping of original and translated content
- Enables page reset to original state

#### 6. **popup.html/css/js** - User Interface
- Simple, intuitive UI for language selection
- Buttons for translate, reset, and swap languages
- Progress indicator and status display
- Statistics showing elements translated and cache size
- Error/success message notifications
- Settings for cache management

---

## Component Details

### 1. Translation Service (translation-service.js)

**Purpose**: Handles all translation API operations

**Key Methods**:

```
translate(text, srcLang, tgtLang)
├─ Input: Text, source language, target language
├─ Check cache first
├─ Validate language pair
├─ Make API call
├─ Cache result
└─ Return translated text

makeAPICall(text, srcLang, tgtLang)
├─ Create payload with text and language codes
├─ Set Authorization header with API key
├─ POST to TMT endpoint
├─ Handle timeout
├─ Check response.message_type === 'SUCCESS'
└─ Return translated output

isValidLanguagePair(srcLang, tgtLang)
├─ Ensure src !== tgt
├─ Check against CONFIG.TRANSLATION_PAIRS
└─ Return boolean

getCachedTranslation(text, srcLang, tgtLang)
├─ Generate cache key from text hash
├─ Check if cache entry exists
├─ Verify cache not expired
└─ Return cached translation or null

detectLanguage(text)
├─ Scan for Devanagari script (Nepali/Tamang)
├─ Scan for Latin script (English)
├─ Calculate ratio and determine language
└─ Return language code
```

**Caching Strategy**:
- Uses `Map` for in-memory caching
- Cache key: hash of text + language pair
- Expires after configurable time (default 60 minutes)
- Prevents redundant API calls for same content

**Error Handling**:
- Timeout management (10 seconds default)
- Validates API response `message_type` field
- Retry logic available (configurable)
- Graceful fallback if translation fails

### 2. Content Script (content-script.js)

**Purpose**: Modifies web page content in real-time

**Key Flow**:

```
Page Load
    ↓
Content Script Initialized
    ↓
Message Listener Ready
    ↓
User clicks "Translate" in popup
    ↓
Message: START_TRANSLATION {srcLang, tgtLang}
    ↓
Get all translatable elements
    ├─ Select by CONFIG.SELECTORS_TO_TRANSLATE
    ├─ Filter out CONFIG.SELECTORS_TO_SKIP
    └─ Filter out empty elements
    ↓
Process in batches
    ├─ Batch size: CONFIG.UI.MAX_ELEMENTS_PER_BATCH
    ├─ For each batch:
    │   ├─ Store original content
    │   ├─ Request translation from background
    │   ├─ Update DOM with translated text
    │   └─ Add visual indicator (green left border)
    └─ Wait between batches (respect rate limits)
    ↓
Translation Complete
    └─ Update status in background
```

**Element Selection Strategy**:
- Targets semantic HTML elements (p, h1-h6, span, div, li, a, button, label)
- Skips script, style, code blocks
- Skips elements with `.no-translate` class or `data-no-translate` attribute
- Processes only elements with direct text content (not just nested elements)

**Original Content Storage**:
```javascript
translatedElements.Map = {
  elementId_1: {
    element: DOMElement,
    original: "Original text",
    originalHTML: "<p>Original <strong>text</strong></p>"
  },
  elementId_2: { ... }
}
```

**Reset Capability**:
- Stores all original content before translation
- Allows one-click reset to original state
- Removes visual indicators on reset

### 3. Background Service Worker (background.js)

**Purpose**: Central hub for message routing and state management

**Message Handling**:
```
Popup ──┐
        ├─> Background Worker ──> Translation Service ──> TMT API
Content ┘                  │
        ┌────────────────────
        │
    Updates Tab State
    (translation status, element count)
```

**Supported Messages**:
- `TRANSLATE_TEXT`: Routes translation request to service
- `GET_TRANSLATION_STATE`: Returns translation state for tab
- `SET_TRANSLATION_STATE`: Updates translation state, updates badge
- `GET_CACHE_STATS`: Returns cache statistics
- `CLEAR_CACHE`: Clears translation cache
- `DETECT_LANGUAGE`: Detects page language

**State Management**:
```javascript
translationState.Map = {
  tabId_1: {
    isTranslating: boolean,
    srcLang: "en",
    tgtLang: "ne",
    elementCount: number
  }
}
```

### 4. Popup Interface (popup.js)

**Purpose**: User interface for translation controls

**UI Components**:
1. **Language Selection**: Dropdown for source and target languages
2. **Swap Button**: Quick language swap
3. **Translate Button**: Initiates page translation
4. **Reset Button**: Reverts page to original
5. **Progress Indicator**: Shows translation in progress
6. **Statistics**: Shows elements translated and cache size
7. **Settings**: Cache management options
8. **Messages**: Error and success notifications

**Validation Logic**:
```
User selects languages
    ↓
validateLanguagePair()
├─ Check src !== tgt
├─ Check pair in CONFIG.TRANSLATION_PAIRS
└─ Show error if invalid
    ↓
Enable/disable translate button
```

---

## Data Flow

### Translation Request Flow

```
┌─ User clicks "Translate"
│
├─> popup.js: handleTranslate()
│   └─> validate language pair
│
├─> popup.js: sendMessage({action: START_TRANSLATION, srcLang, tgtLang})
│   └─> chrome.tabs.sendMessage() to content script
│
├─> content-script.js: Receive message
│   └─> startTranslation(srcLang, tgtLang)
│       └─> getTranslatableElements()
│
├─> For each element:
│   └─> sendTranslationRequest(text, srcLang, tgtLang)
│       └─> chrome.runtime.sendMessage() to background worker
│
├─> background.js: Receive TRANSLATE_TEXT message
│   └─> translationService.translate(text, srcLang, tgtLang)
│       ├─> Check cache
│       ├─> If miss: makeAPICall()
│       │   └─> POST to https://tmt.ilprl.ku.edu.np/lang-translate
│       │       ├─ Headers: {Authorization: "Bearer API_KEY"}
│       │       └─ Body: {text, src_lang, tgt_lang}
│       └─> Return result
│
├─> background.js: sendResponse({success, translated})
│
├─> content-script.js: Receive response
│   └─> updateElementContent(element, translatedText)
│       ├─> Update DOM
│       └─> Add visual indicator
│
└─ Translation Complete
```

### API Communication Detail

**Request Format**:
```json
{
  "text": "Hello, how are you?",
  "src_lang": "en",
  "tgt_lang": "ne"
}
```

**Response Format**:
```json
{
  "message_type": "SUCCESS",
  "message": "Translation successful",
  "src_lang": "English",
  "input": "Hello, how are you?",
  "target_lang": "Nepali",
  "output": "नमस्ते, कस्तो छ?",
  "timestamp": "2026-04-25T10:32:00Z"
}
```

**Error Response**:
```json
{
  "message_type": "FAIL",
  "message": "Invalid API token"
}
```

---

## Translation Process

### Step-by-Step Translation Process

#### Phase 1: Initialization
1. User opens extension popup
2. Popup loads `config.js` and displays supported language pairs
3. User selects source and target languages
4. Validation ensures valid pair is selected

#### Phase 2: Element Discovery
1. User clicks "Translate Page"
2. Content script queries DOM using selectors from `CONFIG.SELECTORS_TO_TRANSLATE`
3. Filters out elements matching `CONFIG.SELECTORS_TO_SKIP`
4. Collects only elements with direct text content
5. Creates unique ID for each element
6. Stores original content in `translatedElements` Map

#### Phase 3: Translation Batch Processing
1. Elements divided into batches (default: 100 per batch)
2. For each batch:
   - Iterate through elements
   - Extract text content
   - Check cache for existing translation
   - If not cached, send to background worker
   - Background worker calls TMT API
   - Store result in cache
   - Update DOM with translated text
   - Add visual indicator (green border)
3. Wait between batches to respect rate limiting (300ms default)

#### Phase 4: Completion
1. All elements translated
2. UI shows completion status
3. Update statistics (elements translated, cache size)
4. User can reset or translate to different language

### Caching Mechanism

**Why Cache?**
- Reduces API calls and costs
- Improves performance for repeated content
- Prevents rate limiting issues

**How Caching Works**:
```
First request: "Hello" EN→NE
    ├─ Generate key: hash("Hello") + "_en_ne"
    ├─ Not in cache
    ├─ Call API
    ├─ Receive: "नमस्ते"
    ├─ Store in Map: {key: {translation: "नमस्ते", timestamp}}
    └─ Return "नमस्ते"

Second request: "Hello" EN→NE
    ├─ Generate key: hash("Hello") + "_en_ne"
    ├─ Found in cache
    ├─ Check expiry (60 min default)
    ├─ Not expired
    └─ Return cached "नमस्ते" (NO API CALL)
```

**Cache Storage**:
- In-memory Map in `translation-service.js`
- Not persisted to localStorage (improves privacy)
- Cleared on browser restart or user request
- Configurable expiry time

---

## Key Features

### 1. **Real-Time Translation**
- Translates visible page content without page reload
- Updates DOM in real-time as user reads
- Preserves page layout and structure

### 2. **Bidirectional Translation**
- Supports all 6 translation pairs (EN↔NE, EN↔TMG, NE↔TMG)
- Swap button for quick language switching
- Independent control of source and target languages

### 3. **Intelligent Element Selection**
- Targets semantic content elements
- Skips scripts, styles, and code blocks
- Avoids translating irrelevant content
- Preserves HTML structure

### 4. **Smart Caching**
- Reduces redundant API calls
- Improves translation speed
- Configurable cache expiry
- Cache management UI in settings

### 5. **Batch Processing**
- Prevents API overload
- Respects rate limiting
- Configurable batch size
- Progress indication

### 6. **Language Detection**
- Detects if page is in English, Nepali, or Tamang
- Uses script detection (Devanagari vs Latin)
- Can auto-suggest target language

### 7. **Full Reset Capability**
- One-click restore to original content
- Stores original HTML for all translated elements
- Clean page state after reset

### 8. **User Feedback**
- Loading indicators during translation
- Success/error notifications
- Statistics (elements translated, cache size)
- Status indicator badge on extension icon

---

## Technical Decisions

### 1. **Why Service Worker for Background?**
- Modern Chrome requires Service Workers (not background pages)
- More efficient resource usage
- Better integration with new APIs
- Automatic cleanup on disuse

### 2. **Why Message Passing?**
- Content scripts can't directly access popup
- Service worker isolates API key (security)
- Decoupled, testable architecture
- Follows Chrome extension best practices

### 3. **Why In-Memory Caching?**
- Faster than localStorage
- Privacy-preserving (no persistent data)
- Automatic cleanup
- Good for temporary translations

### 4. **Why Batch Processing?**
- Prevents overwhelming the API
- Respects rate limiting
- Better user experience (shows progress)
- Configurable for different scenarios

### 5. **Why Element ID Generation?**
- Handles dynamically added content
- Works with elements without IDs
- Allows re-translation with same element reference

### 6. **Selectors Strategy**:
- Whitelist approach for translation targets (safe)
- Blacklist approach for exclusions (flexible)
- Balances completeness with accuracy

### 7. **Error Handling Philosophy**:
- Graceful degradation (fail silently if API unavailable)
- User notifications for errors
- Retry logic built-in
- Detailed console logging for debugging

---

## Setup Instructions

### 1. Install Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder

### 2. Add API Key
1. Open `src/scripts/config.js`
2. Replace `team_xxxxxxxxxxxxxxxx` with your actual API key
3. Save the file
4. Reload extension in Chrome

### 3. Test Translation
1. Navigate to any English webpage
2. Click extension icon
3. Select languages (default: English → Nepali)
4. Click "Translate Page"
5. Observe real-time translation

---

## Configuration & Customization

### Modify Batch Size
```javascript
// config.js
UI: {
  MAX_ELEMENTS_PER_BATCH: 100  // Change this value
}
```

### Change Cache Expiry
```javascript
// config.js
TRANSLATION: {
  CACHE_EXPIRY: 60  // Minutes
}
```

### Add Elements to Translate
```javascript
// config.js
SELECTORS_TO_TRANSLATE: [
  // Add selectors here
  'p', 'h1', 'span', /* ... */
]
```

### Skip Specific Elements
```javascript
// config.js
SELECTORS_TO_SKIP: [
  'script', '.no-translate', '[data-no-translate]'
]
```

---

## Debugging

### Console Logs
All components include detailed console logging with prefixes:
- `[Translation Service]` - API and cache operations
- `[Content Script]` - DOM translations
- `[Background]` - Message handling
- `[Popup]` - UI interactions

### Monitor Extension
1. Open `chrome://extensions/`
2. Find extension and click "Details"
3. View: Service Worker console, Content script logs

### Check API Communication
1. Open DevTools → Network tab
2. Translate page
3. Look for POST requests to `tmt.ilprl.ku.edu.np`
4. Inspect request/response payloads

---

## Security Considerations

### API Key Protection
- ⚠️ Do NOT commit API key to public repositories
- Use environment variables in production
- Consider server-side proxy for enterprise use

### Content Security Policy
- Extension has minimal CSP violations
- Respects same-origin policy for API calls
- No eval() or dynamic script injection

### Data Privacy
- Translations stored only in memory (temporary)
- Original content never sent to external services
- Cache cleared on browser restart
- User has full control via reset button

---

## Performance Optimization

### API Call Reduction
- Caching eliminates redundant calls
- Batch processing reduces overhead
- Request deduplication possible with same content

### DOM Operations
- Minimal DOM queries
- Direct text node updates
- Batched processing prevents layout thrashing

### Memory Usage
- Stores only necessary element references
- Map cleanup on page reset
- Automatic tab state cleanup on close

---

## Future Enhancements

1. **Persistent Cache**: Store in IndexedDB for cross-session usage
2. **Context Menu**: Right-click to translate selected text
3. **Dictionary**: Inline translation hints on hover
4. **Keyboard Shortcuts**: Quick translation with hotkeys
5. **Language Auto-Detection**: Automatic source language detection
6. **Statistics**: Analytics on translation patterns
7. **Offline Support**: Service Worker caching for offline mode
8. **File Translation**: Support Track 2 - File translation tool

---

## License
This extension is built for the Google TMT Hackathon 2026 and must follow the MIT License as per hackathon requirements.

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Hackathon**: Google TMT Hackathon 2026
