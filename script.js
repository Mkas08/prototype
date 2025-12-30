// Global State
let currentTheme = 'light';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Splash Screen Timeout
    setTimeout(() => {
        showScreen('intro-screen');
    }, 3000);

    // Load persisted settings
    loadTheme();
    loadBlockerData();
    loadNotificationState();
});

// App Blocker Persistence
function saveBlockerState(app) {
    const checkbox = document.getElementById(`block-${app}`);
    localStorage.setItem(`block-${app}`, checkbox.checked);
    console.log(`Saved ${app} blocker state: ${checkbox.checked}`);
}

function loadBlockerData() {
    const apps = ['instagram', 'tiktok', 'youtube'];
    apps.forEach(app => {
        const checkbox = document.getElementById(`block-${app}`);
        const savedState = localStorage.getItem(`block-${app}`);

        // Default to checked if no state is saved (strict mode by default!)
        if (savedState === null) {
            checkbox.checked = true;
        } else {
            checkbox.checked = savedState === 'true';
        }
    });
}

// Notifications Persistence
function saveNotificationState() {
    const checkbox = document.getElementById('settings-notifications-toggle');
    localStorage.setItem('notifications-enabled', checkbox.checked);
}

function loadNotificationState() {
    const checkbox = document.getElementById('settings-notifications-toggle');
    if (!checkbox) return; // Guard clause

    const savedState = localStorage.getItem('notifications-enabled');
    // Default to true
    if (savedState === null) {
        checkbox.checked = true;
    } else {
        checkbox.checked = savedState === 'true';
    }
}

// Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
        target.style.display = 'flex';
        setTimeout(() => {
            target.classList.add('active');
        }, 10);
    }

    // Handle Bottom Nav Visibility
    const bottomNav = document.getElementById('bottom-nav');
    // All screens that show the bottom nav
    const mainTabs = ['home-screen', 'quran-screen', 'community-screen', 'messages-screen', 'profile-view-screen'];

    if (mainTabs.includes(screenId)) {
        bottomNav.style.display = 'flex';
        updateActiveNav(screenId);
    } else {
        bottomNav.style.display = 'none';
    }

    // Lazy load Community Feed
    if (screenId === 'community-screen' && typeof renderCommunityFeed === 'function') {
        renderCommunityFeed();
    }

    // Lazy load Leaderboard
    if (screenId === 'leaderboard-screen' && typeof renderLeaderboard === 'function') {
        renderLeaderboard();
    }
}

function updateActiveNav(screenId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    const tabIndex = {
        'home-screen': 0,
        'quran-screen': 1,
        'community-screen': 2,
        'messages-screen': 3,
        'profile-view-screen': 4
    };

    if (tabIndex.hasOwnProperty(screenId)) {
        navItems[tabIndex[screenId]].classList.add('active');
    }
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const settingsToggle = document.getElementById('settings-dark-toggle');

    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        currentTheme = 'dark';
        if (settingsToggle) settingsToggle.checked = true;
    } else {
        html.removeAttribute('data-theme');
        currentTheme = 'light';
        if (settingsToggle) settingsToggle.checked = false;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const settingsToggle = document.getElementById('settings-dark-toggle');

    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        currentTheme = 'light';
        localStorage.setItem('theme', 'light');
        if (settingsToggle) settingsToggle.checked = false;
    } else {
        html.setAttribute('data-theme', 'dark');
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
        if (settingsToggle) settingsToggle.checked = true;
    }
}

// =========================================
// MILESTONE 3: FOCUS TIMER LOGIC (HYBRID READER)
// =========================================

const SURAH_DATA = {
    'kahf': `ٱلْحَمْدُ لِلَّهِ ٱلَّذِىٓ أَنزَلَ عَلَىٰ عَبْدِهِ ٱلْكِتَـٰبَ وَلَمْ يَجْعَل لَّهُۥ عِوَجَا ۜ (١) قَيِّمًۭا لِّيُنذِرَ بَأْسًۭا شَدِيدًۭا مِّن لَّدُنْهُ وَيُبَشِّرَ ٱلْمُؤْمِنِينَ ٱلَّذِينَ يَعْمَلُونَ ٱلصَّـٰلِحَـٰتِ أَنَّ لَهُمْ أَجْرًا حَسَنًۭا (٢) مَّـٰكِثِينَ فِيهِ أَبَدًۭا (٣) وَيُنذِرَ ٱلَّذِينَ قَالُوا۟ ٱتَّخَذَ ٱللَّهُ وَلَدًۭا (٤) مَّا لَهُم بِهِۦ مِنْ عِلْمٍۢ وَلَا لِـَٔابَآئِهِمْ ۚ كَبُرَتْ كَلِمَةًۭ تَخْرُجُ مِنْ أَفْوَٰهِهِمْ ۚ إِن يَقُولُونَ إِلَّا كَذِبًۭا (٥)`,
    'yasin': `يسٓ (١) وَٱلْقُرْءَانِ ٱلْحَكِيمِ (٢) إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ (٣) عَلَىٰ صِرَٰطٍۢ مُّسْتَقِيمٍۢ (٤) تَنزِيلَ ٱلْعَزِيزِ ٱلرَّحِيمِ (٥)`,
    'mulk': `تَبَـٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌ (١) ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًۭا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ (٢)`
};

let timerInterval;
let focusDuration = 20; // Target goal
let secondsRemaining = 0; // Countdown

function updateDurationDisplay(value) {
    focusDuration = parseInt(value);
    document.getElementById('duration-display').innerText = focusDuration;
    document.getElementById('duration-slider').value = focusDuration;
}

function setDuration(minutes) {
    updateDurationDisplay(minutes);
}

function startFocusSession(surahKey) {
    const titleMap = { 'kahf': 'Al-Kahf', 'yasin': 'Yasin', 'mulk': 'Al-Mulk' };
    const title = titleMap[surahKey] || 'Quran Reader';

    // Set Active Screen Data (Text)
    document.getElementById('reader-title').innerText = title;
    document.getElementById('quran-text-area').innerText = SURAH_DATA[surahKey] || "Text not available in prototype.";

    // Initialize Timer (Count DOWN)
    secondsRemaining = focusDuration * 60;
    updateTimerDisplay();

    // Show Screen 7 (Active Focus / Reader)
    showScreen('active-focus-screen');

    // Start Interval (Count DOWN)
    timerInterval = setInterval(() => {
        secondsRemaining--;
        updateTimerDisplay();

        if (secondsRemaining <= 0) {
            endFocusSession(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('reader-timer').innerText = timeString;
}

function endFocusSession(completed) {
    clearInterval(timerInterval);

    // Calculate actual time spent (if quit early) or total goal (if completed)
    let minutesSpent;
    if (completed) {
        minutesSpent = focusDuration;
    } else {
        const secondsSpent = (focusDuration * 60) - secondsRemaining;
        minutesSpent = Math.ceil(secondsSpent / 60);
    }

    if (completed || confirm("Finish reading early? Your progress will be saved.")) {
        // Show Summary (Screen 8)
        document.getElementById('summary-time').innerText = minutesSpent;
        document.getElementById('summary-points').innerText = `+${minutesSpent * 10}`;
        showScreen('focus-summary-screen');
    } else {
        // Resume if cancelled
        timerInterval = setInterval(() => {
            secondsRemaining--;
            updateTimerDisplay();
            if (secondsRemaining <= 0) endFocusSession(true);
        }, 1000);
    }
}

function triggerConfetti() {
    console.log("Confetti Triggered! 🎉");
}

// Auth Interactions
function switchAuthTab(tab) {
    // Update Tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // Update Forms
    const loginForm = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    const title = document.querySelector('#auth-screen h2');
    const subtitle = document.querySelector('#auth-screen p');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.innerText = 'Welcome Back';
        subtitle.innerText = 'Sign in to continue your journey.';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.innerText = 'Join the Ummah';
        subtitle.innerText = 'Create an account to start tracking.';
    }
}

// =========================================
// MILESTONE 4: LEADERBOARD LOGIC
// =========================================

// Mock Data
let LEADERBOARD_DATA = [
    { rank: 4, name: 'You', initial: 'A', points: 1250, isMe: true },
    { rank: 5, name: 'Bilal', initial: 'B', points: 1100, isMe: false },
    { rank: 6, name: 'Fatima', initial: 'F', points: 1050, isMe: false },
    { rank: 7, name: 'Zaynab', initial: 'Z', points: 980, isMe: false },
    { rank: 8, name: 'Usman', initial: 'U', points: 950, isMe: false }
];

function renderLeaderboard() {
    const listContainer = document.getElementById('leaderboard-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    LEADERBOARD_DATA.forEach(user => {
        const highlightStyle = user.isMe ? 'border: 2px solid var(--primary); background: rgba(74, 124, 89, 0.05);' : '';

        const itemHTML = `
            <div class="rank-item" style="${highlightStyle}">
                <div class="rank-number">${user.rank}</div>
                <div class="avatar-circle" style="width: 36px; height: 36px; font-size: 0.9rem; margin-right: 12px; border: 1px solid #eee;">
                    <span>${user.initial}</span>
                </div>
                <div style="font-weight: 600; font-size: 0.95rem;">${user.name}</div>
                <div class="rank-score">${user.points} XP</div>
            </div>
        `;
        listContainer.innerHTML += itemHTML;
    });
}

// Profile Interactions
function selectGender(element, gender) {
    document.querySelectorAll('.gender-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    console.log('Selected gender:', gender);
}

// =========================================
// MILESTONE 4: COMMUNITY LOGIC
// =========================================

// Mock Data
let COMMUNITY_POSTS = [
    {
        id: 1,
        user: 'Yusuf Al-Banjari',
        initial: 'Y',
        time: '2h ago',
        content: 'Just finished reading Surah Al-Kahf. The story of the youth in the cave always inspires me to hold onto my faith.',
        likes: 12,
        likedByMe: false
    },
    {
        id: 2,
        user: 'Sarah M.',
        initial: 'S',
        time: '4h ago',
        content: 'Hit my 7-day streak! Alhamdulilah. Consistency is key.',
        likes: 45,
        likedByMe: true
    },
    {
        id: 3,
        user: 'Abdullah',
        initial: 'A',
        time: 'Just now',
        content: 'Starting my digitalization journey. Bismillah!',
        likes: 0,
        likedByMe: false
    }
];

function renderCommunityFeed() {
    const feedContainer = document.getElementById('community-feed');
    if (!feedContainer) return;

    feedContainer.innerHTML = ''; // Clear current feed

    COMMUNITY_POSTS.forEach(post => {
        const likedClass = post.likedByMe ? 'liked' : '';
        const heartIcon = post.likedByMe ? 'fas' : 'far';

        const postHTML = `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-user">
                        <div class="avatar-circle" style="width: 40px; height: 40px; font-size: 1rem; border:none; background: #e0e0e0; color: #333;">
                            <span>${post.initial}</span>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 0.95rem;">${post.user}</h4>
                            <p style="margin: 0; font-size: 0.75rem; color: var(--text-muted);">${post.time}</p>
                        </div>
                    </div>
                    <i class="fas fa-ellipsis-h" style="color: var(--text-muted);"></i>
                </div>
                
                <p style="margin: 0 0 4px; line-height: 1.5; font-size: 0.95rem;">
                    ${post.content}
                </p>

                <div class="post-actions">
                    <div class="action-btn ${likedClass}" onclick="toggleLike(${post.id})">
                        <i class="${heartIcon} fa-heart"></i>
                        <span>${post.likes}</span>
                    </div>
                    <div class="action-btn">
                        <i class="far fa-comment"></i>
                        <span>Comment</span>
                    </div>
                    <div class="action-btn">
                        <i class="far fa-share-square"></i>
                        <span>Share</span>
                    </div>
                </div>
            </div>
        `;
        feedContainer.innerHTML += postHTML;
    });
}

function toggleLike(postId) {
    const post = COMMUNITY_POSTS.find(p => p.id === postId);
    if (post) {
        if (post.likedByMe) {
            post.likes--;
            post.likedByMe = false;
        } else {
            post.likes++;
            post.likedByMe = true;
        }
        renderCommunityFeed(); // Re-render to show update
    }
}

function handleNewPost() {
    const contentInput = document.getElementById('post-content');
    const content = contentInput.value.trim();

    if (!content) {
        alert("Please write something first!");
        return;
    }

    const newPost = {
        id: Date.now(), // Simple unique ID
        user: 'You',
        initial: 'Y', // Using 'You' logic or fetching from profile
        time: 'Just now',
        content: content,
        likes: 0,
        likedByMe: false
    };

    // Add to top of array
    COMMUNITY_POSTS.unshift(newPost);

    // Clear input
    contentInput.value = '';

    // Return to feed
    showScreen('community-screen');
    // Return to feed
    showScreen('community-screen');
    renderCommunityFeed();
}

// =========================================
// MILESTONE 5: QURURAN READER LOGIC
// =========================================

function openFullReader(surahKey) {
    const titleMap = { 'kahf': 'Al-Kahf', 'yasin': 'Yasin', 'mulk': 'Al-Mulk' };
    const title = titleMap[surahKey] || 'Quran Reader';

    // Set Title
    document.getElementById('full-reader-title').innerText = title;

    // Get Text
    let text = SURAH_DATA[surahKey] || "Text not available.";

    // Hack: Wrap each verse marker in a span to make it clickable for the prototype
    // Replacing end-of-verse markers (digits in brackets) with interactive spans
    // This is a simple regex replacement for the mock data
    // Updated to match Arabic Numerals inside brackets e.g., (١)
    const interactiveText = text.replace(/(\([^\)]+\))/g, '<span class="verse-marker" onclick="openVerseDetail()">$1</span>');

    document.getElementById('full-quran-text').innerHTML = interactiveText;

    showScreen('full-reader-screen');
}

function openVerseDetail() {
    showScreen('verse-detail-screen');
}

// Hook into showScreen to render feed when opened
// End of Script
