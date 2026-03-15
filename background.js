// background.js — kept minimal.
// content.js handles auto-highlighting itself via autoHighlightIfEnabled().
// background.js only handles the edge case where a tab was already open
// before the extension was installed/enabled — in that case content_scripts
// won't have injected yet, so we inject manually on install.

chrome.runtime.onInstalled.addListener(() => {
    // Inject into all already-open tabs on first install
    chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
        for (const tab of tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            }).catch(() => {}); // ignore restricted pages
        }
    });
});
