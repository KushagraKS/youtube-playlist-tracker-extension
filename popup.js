document.addEventListener('DOMContentLoaded', () => {
  const playlistUrlInput = document.getElementById('playlistUrl');
  const addPlaylistButton = document.getElementById('addPlaylist');
  const playlistsList = document.getElementById('playlistsList');

  // Load existing playlists
  loadPlaylists();

  // Add new playlist
  addPlaylistButton.addEventListener('click', () => {
    const url = playlistUrlInput.value.trim();
    if (isValidPlaylistUrl(url)) {
      addPlaylist(url);
      playlistUrlInput.value = '';
    } else {
      alert('Please enter a valid YouTube playlist URL');
    }
  });

  function isValidPlaylistUrl(url) {
    return url.includes('youtube.com/playlist?list=');
  }

  function addPlaylist(url) {
    chrome.storage.sync.get(['playlists'], (result) => {
      const playlists = result.playlists || {};
      const playlistId = url.split('list=')[1].split('&')[0];
      
      if (!playlists[playlistId]) {
        // Fetch playlist name using YouTube Data API
        fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=YOUR_API_KEY`)
          .then(response => response.json())
          .then(data => {
            const playlistName = data.items[0]?.snippet?.title || 'Unknown Playlist';
            playlists[playlistId] = {
              url: url,
              name: playlistName,
              completedVideos: [],
              totalVideos: 0,
              lastUpdated: new Date().toISOString()
            };
            
            chrome.storage.sync.set({ playlists }, () => {
              loadPlaylists();
            });
          })
          .catch(error => {
            console.error('Error fetching playlist name:', error);
            // Fallback to using ID if API call fails
            playlists[playlistId] = {
              url: url,
              name: `Playlist ${playlistId.slice(0, 8)}...`,
              completedVideos: [],
              totalVideos: 0,
              lastUpdated: new Date().toISOString()
            };
            
            chrome.storage.sync.set({ playlists }, () => {
              loadPlaylists();
            });
          });
      }
    });
  }

  function loadPlaylists() {
    chrome.storage.sync.get(['playlists'], (result) => {
      const playlists = result.playlists || {};
      playlistsList.innerHTML = '';

      if (Object.keys(playlists).length === 0) {
        playlistsList.innerHTML = '<div class="empty-state">No playlists added yet. Add a playlist to get started!</div>';
        return;
      }

      Object.entries(playlists).forEach(([id, playlist]) => {
        const playlistElement = createPlaylistElement(id, playlist);
        playlistsList.appendChild(playlistElement);
      });
    });
  }

  function createPlaylistElement(id, playlist) {
    const div = document.createElement('div');
    div.className = 'playlist-item';
    
    const progress = playlist.totalVideos > 0 
      ? (playlist.completedVideos.length / playlist.totalVideos) * 100 
      : 0;

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">${playlist.name}</h3>
        <button class="remove-playlist" data-id="${id}">Remove</button>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: ${progress}%"></div>
      </div>
      <div class="stats">
        <span>${playlist.completedVideos.length} / ${playlist.totalVideos} videos completed</span>
        <span>${Math.round(progress)}%</span>
      </div>
      <a href="${playlist.url}" target="_blank" style="color: #4CAF50; text-decoration: none; font-size: 14px;">
        Open Playlist
      </a>
    `;

    div.querySelector('.remove-playlist').addEventListener('click', () => {
      removePlaylist(id);
    });

    return div;
  }

  function removePlaylist(id) {
    chrome.storage.sync.get(['playlists'], (result) => {
      const playlists = result.playlists || {};
      delete playlists[id];
      
      chrome.storage.sync.set({ playlists }, () => {
        loadPlaylists();
      });
    });
  }
}); 