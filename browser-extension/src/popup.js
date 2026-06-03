// Add event listeners to filter buttons
document.querySelectorAll('.preset').forEach(button => {
    button.addEventListener('click', function() {
        const preset = this.getAttribute('data-filter');
        applyFilter(preset);
    });
});

function applyFilter(preset) {
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'applyFilter',
            preset: preset
        });
    });
    window.close();
}

document.getElementById('persist-state').addEventListener('change', (e) => {
    chrome.storage.sync.set({
        persistFilters: e.target.checked
    });
});

// Load saved setting
chrome.storage.sync.get(['persistFilters'], (result) => {
    document.getElementById('persist-state').checked = result.persistFilters || false;
});