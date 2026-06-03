chrome.runtime.onInstalled.addListener(() => {
    console.log('Xbox Wishlist extension installed');
});

// Optional: Handle sync between popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getState') {
        // Background can pass data between popup and content script if needed
        sendResponse({ state: 'ok' });
    }
});