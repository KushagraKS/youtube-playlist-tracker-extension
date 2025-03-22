// Listen for tab updates to track video progress
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('youtube.com/watch')) {
    // Notify content script that a new video has loaded
    chrome.tabs.sendMessage(tabId, { type: 'VIDEO_LOADED' });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_COMPLETED') {
    // You can add notification logic here if needed
    console.log('Video completed:', message.videoId);
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty playlists object
  chrome.storage.sync.get(['playlists'], (result) => {
    if (!result.playlists) {
      chrome.storage.sync.set({ playlists: {} });
    }
  });
});
