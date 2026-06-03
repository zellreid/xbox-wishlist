# Xbox Wishlist Browser Extension - Visual Studio Setup Guide

## Overview

This guide walks you through setting up the Xbox Wishlist userscript as a **Chrome/Edge browser extension** using Visual Studio.

**Current Status**: v1.4.26056.5 (userscript) → Converting to extension
**Tools**: Visual Studio 2022 Community (free), Node.js, npm

---

## Option A: Lightweight Setup (Recommended First)

This is the fastest path - takes 30 minutes.

### Step 1: Create a Folder Structure

Create this directory structure on disk:

```
C:\Dev\zellreid\XBOX\xbox-wishlist-extension\
├── src\
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── styles.css
│   └── icons\
│       ├── icon-16.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── icon-192.png
├── dist\                          (build output - empty for now)
├── docs\                          (copy from existing xbox-wishlist)
├── .gitignore
├── README.md
└── .git\                          (initialize git)
```

### Step 2: Open as a Folder in Visual Studio

1. Open **Visual Studio 2022**
2. Click **File** → **Open** → **Folder**
3. Navigate to `C:\Dev\zellreid\XBOX\xbox-wishlist-extension`
4. Click **Select Folder**

Visual Studio opens the folder structure on the left side. You can now edit files directly.

### Step 3: Create manifest.json

In the `src` folder, create `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Xbox Wishlist Manager",
  "version": "1.4.0",
  "description": "Advanced filtering, sorting, and price tracking for Xbox wishlists",
  "author": "ZellReid",
  "homepage_url": "https://github.com/zellreid/xbox-wishlist",

  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
    "192": "icons/icon-192.png"
  },

  "permissions": [
    "storage",
    "scripting"
  ],

  "host_permissions": [
    "https://www.xbox.com/*/wishlist*"
  ],

  "content_scripts": [
    {
      "matches": ["https://www.xbox.com/*/wishlist*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_body"
    }
  ],

  "background": {
    "service_worker": "background.js"
  },

  "action": {
    "default_popup": "popup.html",
    "default_title": "Xbox Wishlist Manager"
  }
}
```

### Step 4: Create content.js

Copy your existing `xbox-wishlist.user.js` and rename it to `content.js` in the `src` folder.

**Remove the header** (everything from `// ==UserScript==` to `// ==/UserScript==`).

**Replace all occurrences of** `GM_getResourceURL` with `chrome.runtime.getURL`:

**Before:**
```javascript
const filterIconUrl = GM_getResourceURL('IMGFilter');
```

**After:**
```javascript
const filterIconUrl = chrome.runtime.getURL('icons/filter.svg');
```

Everything else stays the same.

### Step 5: Create background.js

Create a new file `src/background.js`:

```javascript
// background.js - Service Worker for extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Xbox Wishlist extension installed');
});

// Message handler for popup ↔ content communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    sendResponse({ status: 'background ready' });
  }
});
```

### Step 6: Create popup.html

Create `src/popup.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      width: 320px;
      font-family: Segoe UI, sans-serif;
      padding: 16px;
      background: #1a1a1a;
      color: #f5f5f5;
      margin: 0;
    }
    h2 {
      font-size: 14px;
      margin: 12px 0 8px 0;
      font-weight: 600;
    }
    .button {
      display: block;
      width: 100%;
      padding: 10px;
      margin: 6px 0;
      background: #107c10;
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;
    }
    .button:hover {
      background: #0a5a0a;
    }
    .setting {
      margin: 10px 0;
      font-size: 13px;
    }
    label {
      display: flex;
      align-items: center;
      cursor: pointer;
      gap: 8px;
    }
    input[type="checkbox"] {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h2>Quick Filters</h2>
  <button class="button" onclick="applyFilter('owned')">Show Owned Only</button>
  <button class="button" onclick="applyFilter('notowned')">Show Not Owned</button>
  <button class="button" onclick="applyFilter('discounted')">Show Discounted</button>
  <button class="button" onclick="applyFilter('under20')">Under $20</button>

  <h2>Settings</h2>
  <div class="setting">
    <label>
      <input type="checkbox" id="persist-state">
      Remember filters
    </label>
  </div>

  <h2>About</h2>
  <div style="font-size: 12px; line-height: 1.5; color: #ccc;">
    <p>Xbox Wishlist v1.4.0</p>
    <p><a href="https://github.com/zellreid/xbox-wishlist" target="_blank" style="color: #107c10;">GitHub</a></p>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### Step 7: Create popup.js

Create `src/popup.js`:

```javascript
// popup.js - Popup UI logic

function applyFilter(preset) {
  // Send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'applyFilter',
      preset: preset
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready yet');
      }
    });
  });
  window.close();
}

// Save settings
document.getElementById('persist-state').addEventListener('change', (e) => {
  chrome.storage.sync.set({
    persistFilters: e.target.checked
  });
});

// Load saved settings
chrome.storage.sync.get(['persistFilters'], (result) => {
  document.getElementById('persist-state').checked = result.persistFilters || false;
});
```

### Step 8: Copy your styles.css

Copy your existing `xbox-wishlist.user.css` file to `src/styles.css` - no changes needed.

### Step 9: Create Icons

You need 4 icon sizes. **Quick temporary solution:**

Use a simple approach - create placeholder PNGs or use this Python snippet to generate them:

```python
from PIL import Image, ImageDraw

sizes = [16, 48, 128, 192]
for size in sizes:
    # Create green Xbox-colored square
    img = Image.new('RGB', (size, size), color='#107c10')
    draw = ImageDraw.Draw(img)
    # Add white border
    draw.rectangle(
        [(2, 2), (size-2, size-2)],
        outline='white',
        width=2
    )
    img.save(f'src/icons/icon-{size}.png')
    print(f'Created icon-{size}.png')
```

Or download icons from https://www.icoconvert.com/ or Figma.

### Step 10: Test the Extension

1. Open **Chrome** (or Edge)
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select your `C:\Dev\zellreid\XBOX\xbox-wishlist-extension\src` folder
6. Your extension appears in the list

**To test:**
1. Visit `https://www.xbox.com/en-ZA/wishlist`
2. Click the extension icon (puzzle piece icon top right)
3. You should see your popup
4. Verify that the filter UI loads on the page

---

## Option B: Full Visual Studio Project (Long-term)

This adds TypeScript, webpack bundling, and proper project structure. Takes 1-2 hours to set up.

### Step 1: Initialize Node.js Project

Open terminal in `C:\Dev\zellreid\XBOX\xbox-wishlist-extension`:

```bash
npm init -y
npm install --save-dev webpack webpack-cli typescript ts-loader copy-webpack-plugin
```

### Step 2: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 3: Create webpack.config.js

```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    content: './src/content.ts',
    background: './src/background.ts',
    popup: './src/popup.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup.html', to: 'popup.html' },
        { from: 'src/styles.css', to: 'styles.css' },
        { from: 'src/icons', to: 'icons' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
};
```

### Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "build": "webpack",
    "watch": "webpack --watch",
    "dev": "webpack --mode development --watch"
  }
}
```

### Step 5: Rename .js files to .ts

Rename `src/content.js` → `src/content.ts`, etc.

### Step 6: Build

```bash
npm run build
```

Output appears in `dist/` folder.

### Step 7: Load in Chrome

Go to `chrome://extensions` and load `dist` folder instead of `src`.

---

## Visual Studio Extensions (Optional)

Install these in VS 2022 to improve your workflow:

1. **ES7+ React/Redux/React-Native snippets** - Quick code generation
2. **JavaScript Debugger** - Debug in VS
3. **Prettier** - Code formatter
4. **ES Lint** - Linting

Search in **Extensions** → **Manage Extensions** → **Online**.

---

## Project Structure Summary

### Option A (Lightweight)
```
xbox-wishlist-extension/
├── src/
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── styles.css
│   └── icons/
├── docs/
├── README.md
└── .gitignore
```

### Option B (Full)
```
xbox-wishlist-extension/
├── src/
│   ├── manifest.json
│   ├── content.ts
│   ├── background.ts
│   ├── popup.tsx (optional React)
│   ├── popup.html
│   ├── styles.scss
│   └── icons/
├── dist/                    (generated by webpack)
├── webpack.config.js
├── tsconfig.json
├── package.json
├── docs/
└── .gitignore
```

---

## Next Steps

1. **Option A first** - Get it working in 30 mins
2. **Test on Chrome/Edge** - Verify popup and filter UI
3. **Push to GitHub** - Create `xbox-wishlist-extension` branch
4. **Option B later** - Upgrade to TypeScript when ready for Chrome Web Store

---

## Troubleshooting

**Extension doesn't load:**
- Check `chrome://extensions` for error messages
- Make sure `manifest.json` is valid JSON (no trailing commas)

**Content script not running:**
- Refresh the Xbox page after loading extension
- Check DevTools Console (F12) for errors
- Verify `@match` pattern in manifest

**Popup doesn't appear:**
- Make sure `popup.html` exists
- Check background service worker in DevTools

**Icons not showing:**
- Verify icon files exist at correct paths
- Ensure paths in manifest.json are relative to `src/` folder

---

## Publishing to Chrome Web Store (Later)

Once v1.4 is stable:

1. Create Chrome Developer account ($5 one-time)
2. Create app entry in Web Store
3. Upload extension .zip from dist/
4. Add screenshots and description
5. Submit for review (~1-2 hours)
6. Published = automatic updates for all users!

---

**Created**: May 2026
**Version**: 1.4 Extension Setup
**Last Updated**: [Today]
