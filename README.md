# YouTube Queues

A browser extension for users who open dozens of YouTube videos in new tabs but want to save RAM and keep their browser organized.

## The Problem

When browsing YouTube, it is common to middle-click or right-click multiple videos to watch later. This causes several issues:
1. Browser tabs pile up infinitely and clutter your workspace.
2. Opening a new video tab often loads the page in the background, consuming hundreds of megabytes of RAM and CPU, which can lag the video you are currently watching.
3. Managing which videos belong to which watch session becomes difficult.

## The Solution

YouTube Queues solves this by organizing links into categorized, color-coded queues using browser Tab Groups and providing an active Side Panel interface with smart memory hibernation.

### Key Features
- **Smart RAM Hibernation:** Background video tabs fetch their title and are immediately put to sleep (0 MB active RAM). Videos do not autoplay or consume system memory until you switch to them.
- **Configurable Click Queuing:** Left-clicking video cards, thumbnails, Mixes, or channel uploads can be configured to queue in the background without interrupting your current video.
- **Native Tab Groups:** Integrates with native browser Tab Groups. You can create multiple queues (e.g. Music, Tutorials, Watch Later) with custom names and colors.
- **Real RAM Inspection:** Hover over any tab in the Side Panel to see live JavaScript heap memory usage or sleeping status.
- **Glowing Queue Headers:** Clean dark-mode queue cards with customizable outline styling (ambient glow gradient, solid border, or off).
- **Side Panel Interface:** A dedicated Side Panel provides drag-and-drop queue management, quick unloading, audio mute toggling, and quick navigation.

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
