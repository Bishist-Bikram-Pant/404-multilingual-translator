# Quick Start Guide - Google TMT Translator Extension

## ⚡ 5-Minute Setup

### Step 1: Add Your API Key (1 minute)

Open `src/scripts/config.js` and find this line:
```javascript
API_KEY: 'team_xxxxxxxxxxxxxxxx',
```

Replace it with your actual API key:
```javascript
API_KEY: 'team_YOUR_ACTUAL_KEY_FROM_HACKATHON',
```

**Save the file.**

### Step 2: Load in Chrome (2 minutes)

1. Open Chrome
2. Navigate to: `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `tmt-translator-extension` folder
6. ✅ Extension is now installed!

### Step 3: Test It (2 minutes)

1. Go to any website with English text (e.g., example.com)
2. Click the extension icon in your toolbar
3. Leave defaults: **English → Nepali**
4. Click **🚀 Translate Page**
5. Watch the magic happen! 🎉

## 🎛️ One-Minute Configuration

### Want to change settings?

Open `src/scripts/config.js` and modify:

```javascript
// How many elements to process at once
MAX_ELEMENTS_PER_BATCH: 100,

// Wait time between API calls (in milliseconds)
DELAY_BETWEEN_CALLS: 300,

// How long to keep translations cached (in minutes)
CACHE_EXPIRY: 60,

// Elements to translate (add more as needed)
SELECTORS_TO_TRANSLATE: [
  'p', 'h1', 'h2', 'span', 'li', 'a', 'button'
],

// Elements to skip
SELECTORS_TO_SKIP: [
  'script', 'style', 'code', '.no-translate'
]
```

Then reload the extension in `chrome://extensions`.

## 🔧 Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| "Invalid API token" | Check API key in config.js is correct |
| Extension not showing | Click Extensions menu → find it → pin it |
| Not translating | Reload extension, check API key, try a different page |
| Slow translations | Lower MAX_ELEMENTS_PER_BATCH, clear cache |
| Some text not translating | Text is likely in images or code blocks (not supported) |

## 📖 What's Happening?

```
You click "Translate Page"
         ↓
Extension finds all text elements on page
         ↓
Sends each sentence to Google TMT API
         ↓
API translates and returns result
         ↓
Extension updates the webpage with translations
         ↓
You see the translated page! 🌍
```

## 🎯 Key Features to Try

- **Swap Languages**: Click ⇄ button
- **Reset Page**: Click ↺ to go back to original
- **Clear Cache**: Expand Settings, click Clear Cache
- **Check Stats**: View elements translated and cache size

## 🚀 Ready to Go!

You're all set! The extension is ready to translate web pages. Try it on different websites and languages to see it in action.

## 📚 Want to Know More?

- **Detailed Architecture**: See `LOGIC_EXPLANATION.md`
- **Full Documentation**: See `README.md`
- **Code Comments**: Check individual files for inline documentation

## 💡 Pro Tips

1. **Keyboard Shortcut** (Optional): You can set custom keyboard shortcuts in Chrome
2. **Batch Processing**: The extension processes elements in batches to avoid overwhelming the API
3. **Smart Caching**: Same text translations are cached, so second time is instant!
4. **HTML Preserved**: The extension only changes text, so page layout stays the same

---

**Happy Translating! 🌐**
