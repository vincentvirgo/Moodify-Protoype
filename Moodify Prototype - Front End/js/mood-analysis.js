document.addEventListener('DOMContentLoaded', () => {
    // Get mood history from localStorage
    const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    
    // Initialize weekly mood chart
    initializeChart(processMoodData(moodHistory));
    
    // Update mood stats and timeline
    updateMoodStats(moodHistory);
    updateMoodTimeline(moodHistory);
});

function processMoodData(history) {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const dailyScores = last7Days.map(date => {
        const dayMoods = history.filter(m => m.timestamp.startsWith(date));
        return dayMoods.length ? 
            dayMoods.reduce((acc, curr) => acc + curr.score, 0) / dayMoods.length : 
            null;
    });

    return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: dailyScores
    };
}

function initializeChart(data) {
    const ctx = document.getElementById('weeklyMoodChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(105, 104, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(105, 104, 212, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Mood Score',
                data: data.data,
                borderColor: '#6968D4',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });
}

function updateMoodStats(history) {
    if (history.length === 0) return;

    // Calculate most common mood
    const moodCounts = history.reduce((acc, curr) => {
        acc[curr.mood] = (acc[curr.mood] || 0) + 1;
        return acc;
    }, {});
    
    const mostCommonMood = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])[0][0];

    // Calculate improvement rate
    const recentScores = history.slice(-5).map(m => m.score);
    const improvement = ((recentScores[recentScores.length - 1] - recentScores[0]) / recentScores[0]) * 100;

    // Update UI
    document.querySelector('.mood-badge').textContent = mostCommonMood.split('!')[0];
    document.querySelector('.improvement-rate').innerHTML = `
        <i class="bi bi-${improvement >= 0 ? 'arrow-up' : 'arrow-down'}-circle"></i>
        ${Math.abs(improvement).toFixed(0)}%
    `;
}

function updateMoodTimeline(history) {
    const timeline = document.querySelector('.journey-timeline');
    const recentMoods = history.slice(-4).reverse();

    timeline.innerHTML = recentMoods.map((mood, index) => `
        <div class="timeline-item" style="animation-delay: ${index * 0.2}s">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="text-white-50">${formatTimeAgo(new Date(mood.timestamp))}</div>
                <div class="text-white">${mood.mood}</div>
                <div class="text-white-50">${mood.song}</div>
            </div>
        </div>
    `).join('');
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    return 'Just now';
} 