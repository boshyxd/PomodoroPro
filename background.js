importScripts('lib/dayjs.min.js');
importScripts('lib/dayjs-duration.min.js');

dayjs.extend(dayjs_plugin_duration);

// Timer state
let timerState = {
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    currentSession: 1,
    totalSessions: 4,
    totalTime: 0, // Store as seconds
    isBreak: false
};

let timerInterval;

// Load saved state when background script starts
chrome.storage.local.get('timerState', (result) => {
    if (result.timerState) {
        timerState = result.timerState;
        if (timerState.isRunning) {
            startTimer();
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'getState') {
        sendResponse({ timerState: timerState });
    } else if (request.action === 'startTimer') {
        startTimer();
    } else if (request.action === 'pauseTimer') {
        pauseTimer();
    } else if (request.action === 'resetTimer') {
        resetTimer();
    }
    return true; // Indicates that the response will be sent asynchronously
});

function updateTimerState(newState) {
    timerState = { ...timerState, ...newState };
    chrome.storage.local.set({ timerState });
    updatePopup();
}

function startTimer() {
    if (!timerState.isRunning) {
        timerState.isRunning = true;
        timerInterval = setInterval(() => {
            timerState.timeLeft--;
            timerState.totalTime++;
            
            if (timerState.timeLeft <= 0) {
                clearInterval(timerInterval);
                timerState.isRunning = false;
                notifySound();
                
                if (timerState.isBreak) {
                    // Break finished, start next work session
                    timerState.isBreak = false;
                    timerState.timeLeft = 25 * 60; // 25 minutes for work session
                    if (timerState.currentSession < timerState.totalSessions) {
                        timerState.currentSession++;
                    } else {
                        // All sessions completed
                        resetTimer();
                        return;
                    }
                } else {
                    // Work session finished, start break
                    timerState.isBreak = true;
                    timerState.timeLeft = 5 * 60; // 5 minutes for break
                }
                
                startTimer(); // Automatically start the next session or break
            }
            updateTimerState(timerState);
        }, 1000);
    }
}

function pauseTimer() {
    if (timerState.isRunning) {
        clearInterval(timerInterval);
        timerState.isRunning = false;
        updateTimerState(timerState);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerState = {
        timeLeft: 25 * 60, // Reset to 25 minutes
        isRunning: false,
        currentSession: 1,
        totalSessions: 4,
        totalTime: 0,
        isBreak: false
    };
    updateTimerState(timerState);
}

function notifySound() {
    chrome.runtime.sendMessage({ action: 'playSound' });
}

function updatePopup() {
    chrome.runtime.sendMessage(
        { action: 'updateTimer', timerState: timerState },
        (response) => {
            if (chrome.runtime.lastError) {
                // Ignore the error - this just means the popup isn't open
                console.log("Popup not available, ignoring update");
            }
        }
    );
}

console.log('Background script loaded');
