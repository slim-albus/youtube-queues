# YouTube Queues

A Chrome extension designed for users who open dozens of YouTube videos in new tabs but want to save their RAM and keep their browser organized.

## The Problem

When browsing YouTube, it is common to middle-click or right-click multiple videos you want to watch later. This causes a few problems:
1. Browser tabs pile up infinitely and clutter your workspace.
2. Opening a new video tab often loads the page in the background, consuming large amounts of RAM and CPU, which can lag the video you are currently watching.
3. Managing which videos belong to which watch session becomes difficult.

## The Solution

YouTube Queues solves this by fundamentally changing how YouTube links behave and adding a native Side Panel UI for organization. 

### Key Features
- **Aggressive RAM Management:** When you open a YouTube link in the background, this extension intercepts it. It waits for the tab to fetch the video title and then immediately suspends the tab (puts it to sleep). The video will not load, autoplay, or consume any RAM until you explicitly switch to it.
- **Background Queuing:** Left-clicking a video thumbnail can be configured to silently queue it in the background rather than interrupting your current video. 
- **Native Tab Groups:** The extension uses Chrome's native Tab Groups to organize videos. You can create multiple queues (e.g., "Music", "Tutorials", "Watch Later").
- **Side Panel Interface:** A dedicated Chrome Side Panel provides a clean, YouTube-themed interface to drag and drop videos between queues, see exactly how many tabs are loaded in memory, and easily manage your watch sessions.

## Configuration

You can customize the extension behavior by clicking the Settings icon in the Side Panel:
- Set normal click and Ctrl+Click behaviors independently (Open in background, open in new active tab, open in current tab).
- Toggle aggressive instant background unloading.
- Set a hard limit on maximum active (loaded) YouTube tabs. If the limit is exceeded, the oldest unused tabs are automatically put to sleep.

## Development

This is a Plasmo extension project.

To run the development server:
```bash
npm run dev
# or
pnpm run dev
```

Load the unpacked extension from `build/chrome-mv3-dev` in your browser.

To create a production build:
```bash
npm run build
# or
pnpm run build
```
