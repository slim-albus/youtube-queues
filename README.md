# YouTube Queues

A browser extension for people who open a ridiculous number of YouTube tabs, then wonder why their browser is using so much RAM.

I made this because I had a weird habit of opening every video I wanted to watch in a new tab. It worked for a while, until my browser was full of half-watched videos and using far more memory than it needed to. YouTube Queues turns that habit into something a little more manageable: organized queues without keeping every video actively running.

### Key Features
- **Low RAM usage:** Background YouTube tabs can be put to sleep until you need them.
- **Organized queues:** Group videos into named, color-coded browser Tab Groups.
- **Click-to-queue:** Send videos to a queue without interrupting what you are watching.
- **Side Panel:** Manage queues, tabs, audio, and navigation in one place.

## Installation

### Chrome / Chromium (Brave, Edge, Opera, Vivaldi)
1. Download the latest `youtube-queues-vX.X.X-chrome.zip` from the Releases page.
2. Extract the zip file into a folder on your computer.
3. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`).
4. Enable **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked** in the top-left corner and select the extracted folder.
6. Open YouTube and click the extension icon in your toolbar to open the Side Panel.

### Mozilla Firefox
> Requires Firefox 138 or later for native Tab Group support.
1. Download the latest `youtube-queues-vX.X.X-firefox.zip` from the Releases page.
2. Extract the zip file into a folder.
3. Navigate to `about:debugging#/runtime/this-firefox` in Firefox.
4. Click **Load Temporary Add-on...**.
5. Select the `manifest.json` file inside the extracted folder.

## Building from Source

This extension is built with the Plasmo framework and uses Bun.

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)

### Setup
```bash
bun install
```

### Development
```bash
# For Chrome
bun run dev

# For Firefox
bun run dev:firefox
```
Load the unpacked extension from `build/chrome-mv3-dev` or `build/firefox-mv3-dev`.

### Production Build & Packaging
```bash
# Package for Chrome
bun run package:chrome

# Package for Firefox
bun run package:firefox

# Package for both browsers
bun run package:all
```
The packaged zip files will be created in the `build/` directory:
- `build/chrome-mv3-prod.zip`
- `build/firefox-mv3-prod.zip`
