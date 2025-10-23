let playlist = []; // Will store the fetched songs from the API
let currentTrackIndex = 0;
let isPlaying = false;

// --- DOM Elements Mapped to Existing HTML ---
const currentSong = new Audio();
const playPauseBtn = document.getElementById('play');
const prevBtn = document.getElementById('previous');
const nextBtn = document.getElementById('next');
const seekbar = document.querySelector('.seekbar');
const circle = document.querySelector('.circle');
const songTimeEl = document.querySelector('.songtime'); // For "00:00 / 00:00"
const trackInfoEl = document.querySelector('.songinfo'); // For the song title/artist
const volumeSlider = document.querySelector('.range input[type="range"]'); // Use selector since it has no ID
const volumeImg = document.getElementById('volumeImg');
const songUl = document.querySelector(".songList ul");
const cardContainer=document.getElementById('cardContainer');

// --- Utility Functions ---

// Format time (from second JS)
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Function to update the song list in the left library
function updateSongListUI() {
    songUl.innerHTML = "";
    if (playlist.length === 0) {
        songUl.innerHTML = `<li class="info" style="color:white; opacity:0.7;">No songs loaded. Try searching!</li>`;
        return;
    }
    
    playlist.forEach((track, index) => {
        // Use a data attribute to store the index for easy lookup on click
        cardContainer.innerHTML +=`
        
                    <div class="card" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50" class="play">
                            <!-- Green Circle -->
                            <circle cx="12" cy="12" r="11" fill=" #1ed760" />

                            <!-- Play Button (Path) -->
                            <path d="M10 7.5v9l5-4.5-5-4.5z" stroke="black" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                        <img src="images/playlist1.jpg" alt="">
                        <h2>${track.title.substring(0,20)}</h2>
                        <p>${track.artist} - ${track.title.substring(0,50)}</p>
                    </div>

        `


        songUl.innerHTML += `
            <li data-index="${index}" class="track-item" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 10px 0;">
                <img src="images/music.svg" alt="" class="invert" style="margin-right: 15px;">
                <div class="info" style="flex-grow: 1;">
                    <div class="track-title">${track.title.substring(0, 20)}...</div>
                    <div class="track-artist" style="font-size:0.8em; opacity:0.7;">${track.artist}</div>
                </div>
                <img src="images/play.svg" alt="" class="invert play-icon" style="width: 20px;">
            </li>
        `;
    });

    // Attach click listeners to the new list items
    Array.from(songUl.querySelectorAll(".track-item")).forEach((e) => {
        e.addEventListener("click", () => {
            const index = parseInt(e.getAttribute('data-index'));
            loadTrack(index);
            togglePlayPause(true); // Automatically play on selection
        });
    });
}

// --- Player Logic ---

// Fetch songs from iTunes API (No HTML input, so search is triggered via console or hardcoded)
async function searchSongs(query) {
    if (!query) {
        console.error("Search query is empty.");
        trackInfoEl.textContent = 'Enter a search term in console or refresh.';
        return;
    }

    trackInfoEl.textContent = `Searching for "${query}"...`;

    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            playlist = data.results.filter(track => track.previewUrl).map(track => ({
                title: track.trackName,
                artist: track.artistName,
                url: track.previewUrl,
                artwork: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '600x600') : 'images/playlist1.jpg'
            }));

            if (playlist.length > 0) {
                currentTrackIndex = 0;
                updateSongListUI();
                loadTrack(0);
                togglePlayPause(false); // Load paused
                console.log(`Successfully loaded ${playlist.length} songs for "${query}".`);
            } else {
                playlist = [];
                updateSongListUI();
                trackInfoEl.textContent = 'No playable songs found. Try another search.';
            }
        } else {
            playlist = [];
            updateSongListUI();
            trackInfoEl.textContent = `No songs found for "${query}".`;
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        trackInfoEl.textContent = 'Error loading songs. Check console.';
    }
}

// Load track
function loadTrack(index) {
    if (playlist.length === 0) return;

    const track = playlist[index];
    currentTrackIndex = index;
    currentSong.src = track.url;

    // Update song info in the playbar
    trackInfoEl.innerHTML = `<div>${track.title.substring(0, 25)}...</div><div style="font-size:0.8em; opacity:0.7;">${track.artist}</div>`;

    // Reset progress
    circle.style.left = '0%';
    songTimeEl.textContent = '00:00 / 00:00';
}

// Play/Pause
function togglePlayPause(forcePlay = false) {
    if (playlist.length === 0) return;

    if (isPlaying && !forcePlay) {
        currentSong.pause();
        playPauseBtn.src = 'images/play.svg';
        isPlaying = false;
    } else {
        currentSong.play().catch(err => {
            console.error('Playback error:', err);
        });
        playPauseBtn.src = 'images/pause.svg';
        isPlaying = true;
    }
}

// Previous track
function playPrevious() {
    if (playlist.length === 0) return;

    currentSong.pause();
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    togglePlayPause(true);
}

// Next track
function playNext() {
    if (playlist.length === 0) return;

    currentSong.pause();
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    togglePlayPause(true);
}

// Update progress bar
function updateProgress() {
    const { currentTime, duration } = currentSong;
    
    if (duration && !isNaN(duration)) {
        const progressPercent = (currentTime / duration) * 100;
        circle.style.left = `${progressPercent}%`;

        // Update time displays
        songTimeEl.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
}

// Seek
function seek(e) {
    if (playlist.length === 0 || currentSong.duration === 0 || isNaN(currentSong.duration)) return;

    const width = seekbar.clientWidth;
    const clickX = e.offsetX;
    const duration = currentSong.duration;
    currentSong.currentTime = (clickX / width) * duration;
}

// Update volume
function updateVolume(e) {
    const volumeValue = parseInt(e.target.value);
    currentSong.volume = volumeValue / 100;

    if (volumeValue === 0) {
        volumeImg.src = "images/volumeMute.svg"; // Assuming you have a mute icon
    } else if (volumeValue < 50) {
        volumeImg.src = "images/volumeLow.svg"; // Assuming you have a low volume icon
    } else {
        volumeImg.src = "images/volumeHigh.svg";
    }
}

// --- Main Initialization and Event Listeners ---

function main() {
    // Player controls
    playPauseBtn.addEventListener('click', () => togglePlayPause());
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    currentSong.addEventListener('timeupdate', updateProgress);
    currentSong.addEventListener('ended', playNext);
    seekbar.addEventListener('click', seek);

    // Volume control
    volumeSlider.addEventListener('input', updateVolume);
    currentSong.volume = parseInt(volumeSlider.value) / 100;

    // Mobile/Sidebar controls
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".logo").getElementsByTagName("img")[1].addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Initial load: Search for a default term to populate the playlist
    searchSongs('Arijit Singh');
    
    // Provide instructions for searching via console since no search bar exists
    console.log("To search for new songs, call searchSongs('your artist name') in the console!");
}

main();