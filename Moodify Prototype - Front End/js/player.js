class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentSongIndex = 0;
        this.playlist = [];
        this.currentSong = null;
        this.isLooping = false;
        
        // Get DOM elements
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.progressBar = document.querySelector('.progress-bar');
        this.volumeSlider = document.querySelector('.volume-slider');
        this.currentTimeSpan = document.getElementById('currentTime');
        this.durationSpan = document.getElementById('duration');
        this.progressContainer = document.querySelector('.progress');
        this.volumeValue = document.querySelector('.volume-value');
        this.loopBtn = document.getElementById('loopBtn');
        this.lyricsToggleBtn = document.getElementById('lyricsToggleBtn');
        this.lyricsContainer = document.getElementById('lyricsContainer');
        this.isLyricsVisible = false;
        
        // Set initial volume to 30%
        this.audio.volume = 0.3;
        this.volumeSlider.value = "30";
        this.volumeValue.textContent = "30";
        
        this.initializePlayer();
    }

    initializePlayer() {
        // Get song data from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const songData = JSON.parse(decodeURIComponent(urlParams.get('song')));
        
        // Set initial colors
        this.updateBackgroundColors(songData.colors);
        
        // Set song info
        document.getElementById('songTitle').textContent = songData.title;
        document.getElementById('albumName').textContent = songData.album;
        document.getElementById('albumArt').src = songData.thumbnail;
        
        // Set up audio source
        this.audio.src = songData.audioFile;
        
        // Event listeners
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => {
            if (!this.prevBtn.disabled) {
                this.playPrevious();
            }
        });
        this.nextBtn.addEventListener('click', () => {
            if (!this.nextBtn.disabled) {
                this.playNext();
            }
        });
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.setVolume(value);
            this.volumeValue.textContent = value;
        });
        this.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.lyricsToggleBtn.addEventListener('click', () => this.toggleLyrics());
        
        // Progress bar click handling
        this.progressContainer.addEventListener('click', (e) => this.seek(e));
        
        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => {
            if (this.isLooping) {
                this.audio.currentTime = 0;
                this.audio.play();
            } else {
                this.playNext();
            }
        });
        
        // Load the initial playlist
        this.loadPlaylist(songData);
    }

    loadPlaylist(currentSong) {
        // Get the mood from the current song and load its playlist
        const mood = this.getMoodFromSong(currentSong);
        this.playlist = moodPlaylists[mood];
        this.currentSongIndex = this.playlist.findIndex(song => song.title === currentSong.title);
    }

    getMoodFromSong(song) {
        // Find which mood playlist contains this song
        for (const [mood, songs] of Object.entries(moodPlaylists)) {
            if (songs.some(s => s.title === song.title)) {
                return mood;
            }
        }
        return "Excited!"; // Default mood
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.playBtn.innerHTML = '<i class="bi bi-play-circle-fill"></i>';
        } else {
            this.audio.play();
            this.playBtn.innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
        }
        this.isPlaying = !this.isPlaying;
    }

    playPrevious() {
        if (this.currentSongIndex > 0) {
            this.currentSongIndex--;
            this.loadSong(this.playlist[this.currentSongIndex]);
        }
    }

    playNext() {
        if (this.currentSongIndex < this.playlist.length - 1) {
            this.currentSongIndex++;
            this.loadSong(this.playlist[this.currentSongIndex]);
        }
    }

    loadSong(song) {
        this.currentSong = song;
        
        // Update UI
        document.getElementById('songTitle').textContent = song.title;
        document.getElementById('albumName').textContent = song.album;
        document.getElementById('albumArt').src = song.thumbnail;
        
        // Update lyrics while maintaining visibility
        const lyricsContainer = document.getElementById('lyrics');
        if (song.lyrics) {
            lyricsContainer.innerHTML = this.formatLyrics(song.lyrics);
            this.initializeLyricsSync();
            if (this.isLyricsVisible) {
                this.lyricsContainer.style.display = 'block';
                this.lyricsContainer.classList.add('show');
            }
        } else {
            lyricsContainer.innerHTML = '<p class="no-lyrics">Lyrics not available</p>';
        }
        
        // Update audio
        this.audio.src = song.audioFile;
        this.audio.load();
        
        // Update background colors
        this.updateBackgroundColors(song.colors);
        
        // Update navigation state
        this.updateNavigationState();
        
        if (this.isPlaying) {
            this.audio.play();
        }
    }

    updateNavigationState() {
        // Previous button
        const isFirst = this.currentSongIndex === 0;
        this.prevBtn.disabled = isFirst;
        this.prevBtn.style.opacity = isFirst ? "0.3" : "1";
        this.prevBtn.style.cursor = isFirst ? "not-allowed" : "pointer";

        // Next button
        const isLast = this.currentSongIndex === this.playlist.length - 1;
        this.nextBtn.disabled = isLast;
        this.nextBtn.style.opacity = isLast ? "0.3" : "1";
        this.nextBtn.style.cursor = isLast ? "not-allowed" : "pointer";
    }

    formatLyrics(lyrics) {
        return lyrics.split('\n').map(line => {
            if (line.trim().startsWith('[')) {
                return `<span class="lyrics-tag">${line}</span>`;
            }
            return `<span class="lyrics-line">${line}</span>`;
        }).join('\n');
    }

    initializeLyricsSync() {
        if (!this.currentSong.lyrics) {
            document.getElementById('lyrics').innerHTML = '<p class="no-lyrics">Lyrics not available</p>';
            return;
        }

        const lyricsContainer = document.getElementById('lyrics');
        lyricsContainer.innerHTML = this.currentSong.lyrics
            .map(line => `<div class="lyrics-line" data-time="${line.time}">${line.text}</div>`)
            .join('');

        this.audio.addEventListener('timeupdate', () => {
            const currentTime = this.audio.currentTime;
            const lines = document.querySelectorAll('.lyrics-line');
            
            lines.forEach(line => {
                const lineTime = parseFloat(line.dataset.time);
                if (currentTime >= lineTime) {
                    line.classList.add('active');
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    line.classList.remove('active');
                }
            });
        });
    }

    generateTimestamps(numberOfLines) {
        const songDuration = this.audio.duration;
        const interval = songDuration / numberOfLines;
        return Array.from({length: numberOfLines}, (_, i) => interval * (i + 1));
    }

    updateBackgroundColors(colors) {
        document.body.style.background = `
            linear-gradient(135deg, 
                ${colors.primary} 0%, 
                ${colors.secondary} 100%
            )
        `;

        // Update the radial gradients in the background
        document.body.style.setProperty('--primary-glow', colors.primary);
        document.body.style.setProperty('--secondary-glow', colors.secondary);
    }

    seek(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.currentTimeSpan.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.durationSpan.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    setVolume(value) {
        this.audio.volume = value / 100;
        this.volumeValue.textContent = value;
    }

    toggleShuffle() {
        this.shuffleBtn.classList.toggle('active');
        // Implement shuffle logic here
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        
        // Remove existing animation classes
        this.loopBtn.classList.remove('animate');
        
        // Trigger reflow to restart animation
        void this.loopBtn.offsetWidth;
        
        // Add animation classes
        this.loopBtn.classList.toggle('active');
        this.loopBtn.classList.add('animate');
        
        // Visual feedback with smooth transition
        if (this.isLooping) {
            this.loopBtn.style.color = '#6968D4';
            this.loopBtn.setAttribute('title', 'Loop is ON');
        } else {
            this.loopBtn.style.color = '';
            this.loopBtn.setAttribute('title', 'Loop is OFF');
        }
    }

    toggleLyrics() {
        this.isLyricsVisible = !this.isLyricsVisible;
        this.lyricsToggleBtn.classList.toggle('active');
        
        if (this.isLyricsVisible) {
            this.lyricsContainer.style.display = 'block';
            // Use setTimeout to allow display:block to take effect before adding show class
            setTimeout(() => {
                this.lyricsContainer.classList.add('show');
            }, 10);
            this.lyricsToggleBtn.setAttribute('title', 'Hide Lyrics');
        } else {
            this.lyricsContainer.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                this.lyricsContainer.style.display = 'none';
            }, 300);
            this.lyricsToggleBtn.setAttribute('title', 'Show Lyrics');
        }
    }
}

// Initialize player when page loads
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
}); 