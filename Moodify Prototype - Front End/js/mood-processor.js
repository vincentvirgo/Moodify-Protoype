// Get DOM elements
const moodInput = document.getElementById('moodInput');
const submitButton = document.getElementById('submitMood');
const loadingSpinner = document.getElementById('loadingSpinner');
const moodButtons = document.querySelectorAll('.mood-btn');

// Store user inputs
let userMoods = [];

// Add this at the beginning with other constants
const lastSelectedMood = localStorage.getItem('lastSelectedMood');

// Function to handle loading state
function showLoading() {
    submitButton.classList.add('loading');
    loadingSpinner.classList.add('active');
    moodInput.disabled = true;
    moodButtons.forEach(btn => btn.classList.add('disabled'));
}

function hideLoading() {
    submitButton.classList.remove('loading');
    loadingSpinner.classList.remove('active');
    moodInput.disabled = false;
    moodButtons.forEach(btn => btn.classList.remove('disabled'));
    moodInput.value = '';
}

// Function to process mood
async function processMood(mood, isCustomInput = false) {
    // Normalize the input mood (convert to lowercase for comparison)
    const normalizedMood = mood.toLowerCase();
    let selectedPlaylist;

    // Match the mood with the appropriate playlist
    if (normalizedMood.includes('excited') || normalizedMood.includes('happy')) {
        selectedPlaylist = moodPlaylists["Excited!"];
        localStorage.setItem('lastSelectedMood', "Excited!");
    } else if (normalizedMood.includes('sad')) {
        selectedPlaylist = moodPlaylists["I am feeling kinda sad :("];
        localStorage.setItem('lastSelectedMood', "I am feeling kinda sad :(");
    } else if (normalizedMood.includes('relax')) {
        selectedPlaylist = moodPlaylists["I just need a song to relax..."];
        localStorage.setItem('lastSelectedMood', "I just need a song to relax...");
    } else {
        selectedPlaylist = moodPlaylists["Excited!"];
        localStorage.setItem('lastSelectedMood', "Excited!");
    }

    // If it's from a button, show the text in input first
    if (!isCustomInput) {
        moodInput.value = mood;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    showLoading();
    
    // Store the mood
    userMoods.push({
        mood: mood,
        timestamp: new Date().toISOString(),
        type: isCustomInput ? 'custom' : 'preset'
    });

    localStorage.setItem('userMoods', JSON.stringify(userMoods));
    await new Promise(resolve => setTimeout(resolve, 2000));
    displaySongs(selectedPlaylist);
    hideLoading();
}

// Add this new function to display songs
function displaySongs(songs) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    
    resultsContainer.innerHTML = '';
    
    songs.forEach(song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.innerHTML = `
            <div class="song-thumbnail">
                <img src="${song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}" 
                     alt="${song.title}" 
                     onerror="this.src='https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg'">
            </div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-album">${song.album}</div>
            </div>
            <div class="song-duration">${song.duration}</div>
        `;
        
        songCard.addEventListener('click', () => {
            const songData = encodeURIComponent(JSON.stringify(song));
            window.location.href = `player.html?song=${songData}`;
        });
        
        resultsContainer.appendChild(songCard);
    });
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Event listener for text input submission
submitButton.addEventListener('click', () => {
    const mood = moodInput.value.trim();
    if (mood) {
        processMood(mood, true);
    }
});

// Event listener for enter key
moodInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const mood = moodInput.value.trim();
        if (mood) {
            processMood(mood, true);
        }
    }
});

// Event listeners for mood buttons
moodButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const mood = button.textContent.trim();
        
        // Remove selected class from all buttons
        moodButtons.forEach(btn => btn.classList.remove('selected'));
        // Add selected class to clicked button
        button.classList.add('selected');
        
        button.classList.add('processing');
        await processMood(mood, false);
        button.classList.remove('processing');
    });

    // Add initial selected state if matches last mood
    if (lastSelectedMood && button.textContent.trim() === lastSelectedMood) {
        button.classList.add('selected');
    }
});

// Add this function to restore the last selected mood without loading animation
async function restoreLastMood() {
    if (lastSelectedMood) {
        const moodButtons = document.querySelectorAll('.mood-btn');
        moodButtons.forEach(button => {
            if (button.textContent.trim() === lastSelectedMood) {
                // Get the playlist directly without loading animation
                let selectedPlaylist;
                const normalizedMood = lastSelectedMood.toLowerCase();
                
                if (normalizedMood.includes('excited') || normalizedMood.includes('happy')) {
                    selectedPlaylist = moodPlaylists["Excited!"];
                } else if (normalizedMood.includes('sad')) {
                    selectedPlaylist = moodPlaylists["I am feeling kinda sad :("];
                } else if (normalizedMood.includes('relax')) {
                    selectedPlaylist = moodPlaylists["I just need a song to relax..."];
                } else {
                    selectedPlaylist = moodPlaylists["Excited!"];
                }

                // Display songs immediately without loading
                displaySongs(selectedPlaylist);
                
                // Add selected class to the button
                button.classList.add('selected');
            }
        });
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    const storedMoods = localStorage.getItem('userMoods');
    if (storedMoods) {
        userMoods = JSON.parse(storedMoods);
    }
});