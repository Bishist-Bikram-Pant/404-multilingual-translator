# Icon Setup Instructions

The TMT Translator Extension requires icon files to load properly in Chrome. This folder contains scripts to generate them automatically.

## ⚡ Quick Fix (Choose One)

### Option 1: PowerShell (Windows) - ✅ RECOMMENDED FOR YOU

```powershell
cd c:\Users\bishi\6th sem\hackathon\tmt-translator-extension\setup
powershell -ExecutionPolicy Bypass -File generate-icons.ps1
```

**Done!** Icons are now created. Go to Step 3 below.

---

### Option 2: Python (Any OS)

**Prerequisites**: Python 3 + Pillow library

```bash
# Install Pillow if you don't have it
pip install pillow

# Run the script
cd tmt-translator-extension/setup
python generate-icons.py
```

---

### Option 3: Node.js (Any OS)

**Prerequisites**: Node.js + canvas library

```bash
# Install canvas library
npm install canvas

# Run the script
cd tmt-translator-extension/setup
node generate-icons.js
```

---

## 📝 After Generating Icons

Once icons are generated, you should see these files created:
```
src/assets/
├── icon-16.png
├── icon-48.png
└── icon-128.png
```

---

## 🚀 Now Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to: `c:\Users\bishi\6th sem\hackathon\tmt-translator-extension`
5. Click **Select Folder**
6. ✅ Extension loaded!

If you still see an error, try:
- Refreshing the page (`Ctrl+R`)
- Reloading the extension (refresh button on the extension card)
- Checking the browser console for other errors

---

## 🎨 Custom Icons

The generated icons are green placeholders. To use custom icons:

1. Create three PNG images:
   - `icon-16.png` (16×16 pixels)
   - `icon-48.png` (48×48 pixels)
   - `icon-128.png` (128×128 pixels)

2. Place them in: `src/assets/`

3. Reload the extension in Chrome

---

## 📖 Icon Requirements

- **Format**: PNG
- **Sizes**: 16×16, 48×48, 128×128 pixels
- **Quality**: At least 96 DPI
- **Colors**: RGB or RGBA

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not found | Make sure you're in the right directory |
| Permission denied (PowerShell) | Run PowerShell as Administrator |
| Python not found | Install Python from python.org |
| Node not found | Install Node.js from nodejs.org |
| Icons still not loading | Try deleting the extension and reloading |

---

**Need help?** Check the main README.md for more information.
