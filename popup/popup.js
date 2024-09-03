let timerState = {
    timeLeft: 10, // Initialize to 10 seconds for testing
    isRunning: false,
    currentSession: 1,
    totalSessions: 4,
    totalTime: 0,
    isBreak: false
};

const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionCountDisplay = document.getElementById('sessionCount');
const totalTimeDisplay = document.getElementById('totalTime');

let audio = new Audio(chrome.runtime.getURL('assets/sounds/notification.mp3'));

function updateTimerDisplay() {
    if (timerState && timerState.timeLeft !== undefined) {
        const minutes = Math.floor(timerState.timeLeft / 60);
        const seconds = timerState.timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateSessionInfo() {
    if (timerState) {
        sessionCountDisplay.textContent = `Session: ${timerState.currentSession}/${timerState.totalSessions}`;
        const totalMinutes = Math.floor(timerState.totalTime / 60);
        const totalSeconds = timerState.totalTime % 60;
        totalTimeDisplay.textContent = `Total: ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
    }
}

function updateUI() {
    updateTimerDisplay();
    updateSessionInfo();
    statusDisplay.textContent = timerState.isRunning 
        ? (timerState.isBreak ? 'Break time!' : 'Focus time!') 
        : 'Paused';
}

// Add this function to play the sound
function playNotificationSound() {
    audio.play().catch(error => console.error('Error playing sound:', error));
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateTimer') {
        timerState = request.timerState;
        updateUI();
    }
    if (request.action === 'playSound') {
        playNotificationSound();
    }
});

// Request initial state from background script
chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (chrome.runtime.lastError) {
        console.log("Error getting initial state:", chrome.runtime.lastError);
    } else if (response && response.timerState) {
        timerState = response.timerState;
        updateUI();
    }
});

function sendMessageToBackground(message) {
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            console.log("Error sending message to background script:", chrome.runtime.lastError);
        }
    });
}

// Replace direct chrome.runtime.sendMessage calls with this function
startBtn.addEventListener('click', () => {
    sendMessageToBackground({ action: 'startTimer' });
});

pauseBtn.addEventListener('click', () => {
    sendMessageToBackground({ action: 'pauseTimer' });
});

resetBtn.addEventListener('click', () => {
    sendMessageToBackground({ action: 'resetTimer' });
});

// Initial UI update
updateUI();
