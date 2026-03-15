// --- State ---
let keywords = [];
const STORAGE_KEY = "sponsorshipKeywords";

saveDefaultSponsorshipPhrases();

// --- DOM ---
const input = document.getElementById('keywordInput');
const addBtn = document.getElementById('addBtn');
const tagsContainer = document.getElementById('tagsContainer');
const emptyMsg = document.getElementById('emptyMsg');
const removeAllBtn = document.getElementById('removeAllBtn');
const highlightBtn = document.getElementById('highlightBtn');
const clearBtn = document.getElementById('clearBtn');
const keywordCount = document.getElementById('keywordCount');
const statusDot = document.getElementById('statusDot');
const matchInfo = document.getElementById('matchInfo');
const toast = document.getElementById('toast');
const autoHighlightToggle = document.getElementById('autoHighlightToggle');

// Sponsorship modal
const addSponsorshipBtn = document.getElementById("addSponsorship");
const modal = document.getElementById("sponsorshipModal");
const closeModalBtn = document.getElementById("closeModal");
const positiveInput = document.getElementById("positiveInput");
const addPositiveBtn = document.getElementById("addPositiveBtn");
const negativeInput = document.getElementById("negativeInput");
const addNegativeBtn = document.getElementById("addNegativeBtn");
const positiveList = document.getElementById("positiveList");
const negativeList = document.getElementById("negativeList");

// --- Sponsorship storage ---
function getSponsorshipPhrasesFromStorage(callback) {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY] || { positive: [], negative: [] };
        callback(data);
    });
}

function saveSponsorshipPhrases(data, callback) {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, callback);
}

// --- Save default sponsorship phrases (only on first run) ---
function saveDefaultSponsorshipPhrases(callback) {
    const negative = [
        "sponsorship not available", "visa sponsorship not available",
        "no visa sponsorship", "no sponsorship available",
        "sponsorship is not provided", "visa sponsorship is not provided",
        "this role does not offer sponsorship", "this position does not offer sponsorship",
        "this role is not eligible for visa sponsorship",
        "this position is not eligible for sponsorship",
        "not eligible for visa sponsorship", "unable to sponsor",
        "will not sponsor", "cannot sponsor",
        "we do not sponsor visas", "we do not provide visa sponsorship",
        "company will not sponsor visa", "cannot provide immigration sponsorship",
        "must be authorized to work in the united states",
        "must be legally authorized to work in the us",
        "must be legally authorized to work in the united states",
        "must have authorization to work in the us",
        "must have valid work authorization", "must have unrestricted work authorization",
        "must have permanent work authorization", "must already be authorized to work",
        "must be eligible to work in the us",
        "must have the legal right to work in the us",
        "must be authorized to work for any employer in the us",
        "must be authorized to work in the us without sponsorship",
        "without sponsorship", "without visa sponsorship",
        "authorized to work without sponsorship",
        "authorized to work without visa sponsorship",
        "authorized to work in the us without sponsorship",
        "authorized to work in the us without visa sponsorship",
        "no h1b sponsorship", "no h1b sponsorship available",
        "h1b sponsorship not available", "h1b sponsorship unavailable",
        "no h1b visa sponsorship", "unable to provide H1B visa sponsorship",
        "h1b visa sponsorship not provided", "h1b transfer not supported",
        "no visa transfer", "visa transfer not supported",
        "no opt", "no opt candidates", "no cpt", "opt not supported",
        "cpt not supported", "no stem opt", "opt candidates not accepted",
        "cpt candidates not accepted", "f1 visa not supported",
        "green card required", "green card holders only",
        "gc required", "gc ead required", "permanent resident required",
        "must be permanent resident", "must be green card holder",
        "us permanent resident only", "us citizens only",
        "us citizens or green card holders only", "must be us citizen",
        "must be a us citizen", "us citizenship required", "citizenship required",
        "requires us citizenship", "must be us citizen or permanent resident",
        "due to government contract must be us citizen",
        "must be us citizen due to government contract",
        "security clearance required", "must be eligible for security clearance",
        "requires active security clearance"
    ];

    const positive = [
        "visa sponsorship available", "sponsorship available",
        "sponsorship provided", "visa sponsorship provided",
        "visa sponsorship offered", "sponsorship offered",
        "h1b sponsorship available", "h1b visa sponsorship available",
        "offer h1b visa sponsorship", "offers h1b visa sponsorship",
        "we sponsor h1b", "we sponsor h1b visas",
        "h1b transfer supported", "h1b transfer available",
        "h1b visa transfer supported", "immigration sponsorship available",
        "immigration sponsorship provided", "employment visa sponsorship available",
        "green card sponsorship available", "green card sponsorship provided",
        "gc sponsorship available", "opt accepted", "opt candidates welcome",
        "cpt accepted", "stem opt accepted", "f1 visa candidates welcome",
        "visa support available", "relocation and visa sponsorship available",
        "company will sponsor visa", "employer will sponsor visa",
        "visa assistance provided"
    ];

    chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) { if (callback) callback(); return; }
        chrome.storage.local.set({ [STORAGE_KEY]: { positive, negative } }, () => {
            if (callback) callback();
        });
    });
}

// --- Add positive keyword ---
function addPositiveKeyword() {
    const val = positiveInput.value.trim();
    if (!val) return;
    getSponsorshipPhrasesFromStorage((data) => {
        let kws = data.positive || [];
        if (kws.some(k => k.toLowerCase() === val.toLowerCase())) {
            showToast('Phrase already exists', 'error'); return;
        }
        kws.unshift(val);
        data.positive = kws;
        saveSponsorshipPhrases(data, () => { positiveInput.value = ""; renderPositiveTags(); });
    });
}

// --- Add negative keyword ---
function addNegativeKeyword() {
    const val = negativeInput.value.trim();
    if (!val) return;
    getSponsorshipPhrasesFromStorage((data) => {
        let kws = data.negative || [];
        if (kws.some(k => k.toLowerCase() === val.toLowerCase())) {
            showToast('Phrase already exists', 'error'); return;
        }
        kws.unshift(val);
        data.negative = kws;
        saveSponsorshipPhrases(data, () => { negativeInput.value = ""; renderNegativeTags(); });
    });
}

// --- Render positive list ---
function renderPositiveTags() {
    getSponsorshipPhrasesFromStorage((data) => {
        positiveList.innerHTML = "";
        (data.positive || []).forEach((kw, idx) => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${escapeHtml(kw)}</span><button class="tag-remove" data-type="positive" data-idx="${idx}">✕</button>`;
            positiveList.appendChild(li);
        });
    });
}

// --- Render negative list ---
function renderNegativeTags() {
    getSponsorshipPhrasesFromStorage((data) => {
        negativeList.innerHTML = "";
        (data.negative || []).forEach((kw, idx) => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${escapeHtml(kw)}</span><button class="tag-remove" data-type="negative" data-idx="${idx}">✕</button>`;
            negativeList.appendChild(li);
        });
    });
}

// --- Remove from sponsorship lists ---
document.addEventListener("click", function (e) {
    if (!e.target.classList.contains("tag-remove")) return;
    const type = e.target.dataset.type;
    if (!type) return;
    const idx = parseInt(e.target.dataset.idx);
    getSponsorshipPhrasesFromStorage((data) => {
        data[type].splice(idx, 1);
        saveSponsorshipPhrases(data, () => { renderPositiveTags(); renderNegativeTags(); });
    });
});

// --- Show / Hide modal ---
addSponsorshipBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("show"), 10);
    saveDefaultSponsorshipPhrases(() => { renderPositiveTags(); renderNegativeTags(); });
});

closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 300);
});

addPositiveBtn.addEventListener("click", addPositiveKeyword);
positiveInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addPositiveKeyword(); });
addNegativeBtn.addEventListener("click", addNegativeKeyword);
negativeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addNegativeKeyword(); });

// --- Toast ---
let toastTimer;
function showToast(msg, type = 'info') {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2200);
}

// --- Render keyword tags ---
function renderTags() {
    Array.from(tagsContainer.children).forEach(child => {
        if (child.id !== 'emptyMsg') child.remove();
    });
    if (keywords.length === 0) {
        emptyMsg.style.display = 'flex';
        keywordCount.textContent = '0 saved';
        return;
    }
    emptyMsg.style.display = 'none';
    keywordCount.textContent = `${keywords.length}`;
    keywords.forEach((kw, idx) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `<span>${escapeHtml(kw)}</span><button class="tag-remove" title="Remove" data-idx="${idx}">✕</button>`;
        tagsContainer.appendChild(tag);
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function persistKeywords() {
    chrome.storage.local.set({ jobKeywords: keywords });
}

// --- Add keyword ---
function addKeyword() {
    const val = input.value.trim();
    if (!val) return;
    if (keywords.some(k => k.toLowerCase() === val.toLowerCase())) {
        showToast('Keyword already exists', 'error');
        input.select();
        return;
    }
    keywords.push(val);
    input.value = '';
    renderTags();
    persistKeywords();
}

// --- Remove keyword tag ---
tagsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-remove');
    if (!btn) return;
    if (btn.dataset.type) return;
    const idx = parseInt(btn.dataset.idx);
    keywords.splice(idx, 1);
    renderTags();
    persistKeywords();
});

// --- Remove all keywords ---
function removeAllKeywords() {
    if (keywords.length === 0) { showToast('No keywords to remove', 'info'); return; }
    keywords = [];
    renderTags();
    persistKeywords();
    statusDot.classList.remove('active');
    chrome.storage.local.set({ highlightActive: false });
    showToast('All keywords removed', 'info');
}

// --- Load saved keywords + show sponsorship info if already detected ---
function loadKeywords() {
    chrome.storage.local.get(['jobKeywords', 'highlightActive', 'autoHighlight', 'lastHighlightResult'], (result) => {
        if (result.jobKeywords && Array.isArray(result.jobKeywords)) {
            keywords = result.jobKeywords;
            renderTags();
        }
        if (result.highlightActive) statusDot.classList.add('active');
        if (autoHighlightToggle) autoHighlightToggle.checked = !!result.autoHighlight;
    });
}

// --- Auto-highlight toggle ---
if (autoHighlightToggle) {
    autoHighlightToggle.addEventListener('change', () => {
        const enabled = autoHighlightToggle.checked;
        chrome.storage.local.set({ autoHighlight: enabled }, () => {
            if (!enabled) {
                // Clear popup sponsorship panel when toggled off
                const existingInfo = document.getElementById('sponsorshipInfo');
                if (existingInfo) existingInfo.remove();
                matchInfo.textContent = '';
                matchInfo.className = 'match-info';
            }
            showToast(enabled ? '✓ Auto-highlight ON' : 'Auto-highlight OFF', enabled ? 'success' : 'info');
        });
    });
}

// --- Listen for live auto-highlight results pushed from content.js ---
// Fires when content.js finishes highlighting after page load or SPA nav,
// so the popup panel updates without needing a manual click.
chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'autoHighlightResult') return;
    if (!message.sponsorship) {
        const existingInfo = document.getElementById('sponsorshipInfo');
        if (existingInfo) existingInfo.remove();
        matchInfo.textContent = '';
        matchInfo.className = 'match-info';
        statusDot.classList.remove('active');
        return;
    }
    renderMatchCountInfo({ count: message.count, sponsorship: message.sponsorship });
});

// --- Highlight on active tab ---
function runHighlight() {
    if (keywords.length === 0) { showToast('Add some keywords first!', 'error'); return; }
    getSponsorshipPhrasesFromStorage((sponsorshipData) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, () => {
                chrome.tabs.sendMessage(tabId, {
                    action: 'highlight',
                    keywords: keywords,
                    sponsorshipPhrases: sponsorshipData
                }, (response) => {
                    if (chrome.runtime.lastError) { showToast('Cannot highlight this page', 'error'); return; }
                });
            });
        });
    });
}

// --- Render sponsorship info block in popup ---
function renderMatchCountInfo(response) {
    if (response && response.count !== undefined) {
        const c = response.count;
        if (c > 0) {
            matchInfo.textContent = `✓ ${c} match${c !== 1 ? 'es' : ''} found`;
            matchInfo.className = 'match-info found';
            showToast(`${c} match${c !== 1 ? 'es' : ''} highlighted!`, 'success');
            statusDot.classList.add('active');
            chrome.storage.local.set({ highlightActive: true });
        } else {
            matchInfo.textContent = 'No keyword matches found on this page';
            matchInfo.className = 'match-info';
            showToast('No keyword matches on this page', 'info');
        }
    }
}

// --- Clear highlights ---
function clearHighlights() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, () => {
            chrome.tabs.sendMessage(tabId, { action: 'clear' }, (response) => {
                if (chrome.runtime.lastError) return;
                matchInfo.textContent = '';
                matchInfo.className = 'match-info';
                const existingInfo = document.getElementById('sponsorshipInfo');
                if (existingInfo) existingInfo.remove();
                statusDot.classList.remove('active');
                chrome.storage.local.set({ highlightActive: false });
                chrome.storage.local.remove('lastHighlightResult');
                showToast('Highlights cleared', 'info');
            });
        });
    });
}

// --- Event Listeners ---
addBtn.addEventListener('click', addKeyword);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addKeyword(); });
removeAllBtn.addEventListener('click', removeAllKeywords);
highlightBtn.addEventListener('click', runHighlight);
clearBtn.addEventListener('click', clearHighlights);

// --- Init ---
loadKeywords();
