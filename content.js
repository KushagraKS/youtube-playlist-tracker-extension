// Track video progress
let videoProgress = 0;
let lastUpdateTime = Date.now();
let isVideoCompleted = false;

// Function to check if current page is a playlist
function isPlaylistPage() {
  return window.location.pathname === '/playlist';
}

// Function to get current video ID
function getCurrentVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Function to get current playlist ID
function getCurrentPlaylistId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('list');
}

// Function to check if video is completed (watched for at least 90%)
function checkVideoCompletion() {
  const video = document.querySelector('video');
  if (!video) return;

  const duration = video.duration;
  const currentTime = video.currentTime;
  const progress = (currentTime / duration) * 100;

  // Update progress every 5 seconds
  if (Date.now() - lastUpdateTime > 5000) {
    videoProgress = progress;
    lastUpdateTime = Date.now();
  }

  // Mark as completed if watched for at least 90%
  if (progress >= 90 && !isVideoCompleted) {
    isVideoCompleted = true;
    const videoId = getCurrentVideoId();
    const playlistId = getCurrentPlaylistId();

    if (videoId && playlistId) {
      chrome.storage.sync.get(['playlists'], (result) => {
        const playlists = result.playlists || {};
        if (playlists[playlistId]) {
          if (!playlists[playlistId].completedVideos.includes(videoId)) {
            playlists[playlistId].completedVideos.push(videoId);
            chrome.storage.sync.set({ playlists });
          }
        }
      });
    }
  }
}

// Function to get total videos in playlist
function getPlaylistTotalVideos() {
  const playlistItems = document.querySelectorAll('ytd-playlist-video-renderer');
  return playlistItems.length;
}

// Update playlist total videos count
function updatePlaylistTotalVideos() {
  if (isPlaylistPage()) {
    const playlistId = getCurrentPlaylistId();
    if (playlistId) {
      const totalVideos = getPlaylistTotalVideos();
      chrome.storage.sync.get(['playlists'], (result) => {
        const playlists = result.playlists || {};
        if (playlists[playlistId]) {
          playlists[playlistId].totalVideos = totalVideos;
          chrome.storage.sync.set({ playlists });
        }
      });
    }
  }
}

// Initialize video tracking
function initializeVideoTracking() {
  const video = document.querySelector('video');
  if (video) {
    video.addEventListener('timeupdate', checkVideoCompletion);
  }
}

// Initialize playlist tracking
function initializePlaylistTracking() {
  if (isPlaylistPage()) {
    updatePlaylistTotalVideos();
  }
}

// Start tracking when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeVideoTracking();
  initializePlaylistTracking();
});

// Handle dynamic page changes (YouTube is a SPA)
const observer = new MutationObserver(() => {
  initializeVideoTracking();
  initializePlaylistTracking();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
