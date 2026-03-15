// JobSearch Content Script — Keyword Highlighter
const STORAGE_KEY = "sponsorshipKeywords";

(function () {
  const MARK_CLASS = 'jobspot-highlight';
  const STYLE_ID = 'jobspot-styles';
  const BANNER_ID = 'jobspot-sponsorship-banner';

  // ── Styles ───────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${MARK_CLASS} {
        background: #f0c040 !important;
        color: #0d0f14 !important;
        border-radius: 3px !important;
        padding: 1px 2px !important;
        font-weight: 600 !important;
        box-shadow: 0 0 0 2px rgba(240,192,64,0.35) !important;
      }

      #${BANNER_ID} {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483647;
        max-width: 340px;
        background: #1a1c23;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        color: #e8eaf0;
        overflow: hidden;
        animation: jobspot-slide-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      @keyframes jobspot-slide-in {
        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
        to   { opacity: 1; transform: translateY(0)   scale(1);    }
      }

      #${BANNER_ID} .jb-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px 8px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #9da3b4;
      }

      #${BANNER_ID} .jb-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #9da3b4;
        font-size: 16px;
        line-height: 1;
        padding: 0 2px;
        transition: color 0.15s;
      }
      #${BANNER_ID} .jb-close:hover { color: #fff; }

      #${BANNER_ID} .jb-section {
        padding: 10px 14px;
      }
      #${BANNER_ID} .jb-section + .jb-section {
        border-top: 1px solid rgba(255,255,255,0.07);
      }

      #${BANNER_ID} .jb-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 12px;
        margin-bottom: 6px;
      }

      #${BANNER_ID} .jb-label.positive { color: #4caf7d; }
      #${BANNER_ID} .jb-label.negative { color: #e05c5c; }

      #${BANNER_ID} ul {
        margin: 0;
        padding: 0 0 0 4px;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      #${BANNER_ID} ul li {
        font-size: 12px;
        color: #c8cad4;
        padding: 3px 8px;
        background: rgba(255,255,255,0.05);
        border-radius: 5px;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Clear all highlights ──────────────────────────────────────────────────
  function clearHighlights() {
    document.querySelectorAll(`.${MARK_CLASS}`).forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  // ── Inject sponsorship banner onto the page ───────────────────────────────
  function showSponsorshipBanner(sponsorship) {
    // Remove existing banner
    const existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();

    const positive = sponsorship?.positive || [];
    const negative = sponsorship?.negative || [];

    // Nothing to show
    if (positive.length === 0 && negative.length === 0) return;

    const banner = document.createElement('div');
    banner.id = BANNER_ID;

    // Header
    const header = document.createElement('div');
    header.className = 'jb-header';
    header.innerHTML = `<span>🔍 Sponsorship Detected</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'jb-close';
    closeBtn.title = 'Dismiss';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => banner.remove());
    header.appendChild(closeBtn);
    banner.appendChild(header);

    // Positive section
    if (positive.length > 0) {
      const section = document.createElement('div');
      section.className = 'jb-section';
      const label = document.createElement('div');
      label.className = 'jb-label positive';
      label.innerHTML = `<span>✅</span> Sponsorship Available`;
      const ul = document.createElement('ul');
      positive.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        ul.appendChild(li);
      });
      section.appendChild(label);
      section.appendChild(ul);
      banner.appendChild(section);
    }

    // Negative section
    if (negative.length > 0) {
      const section = document.createElement('div');
      section.className = 'jb-section';
      const label = document.createElement('div');
      label.className = 'jb-label negative';
      label.innerHTML = `<span>🚫</span> Sponsorship Restrictions`;
      const ul = document.createElement('ul');
      negative.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        ul.appendChild(li);
      });
      section.appendChild(label);
      section.appendChild(ul);
      banner.appendChild(section);
    }

    document.body.appendChild(banner);
  }

  // ── Remove banner from page ───────────────────────────────────────────────
  function removeSponsorshipBanner() {
    const existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();
  }

  // ── Save result to storage + notify popup if open ─────────────────────────
  function publishResult(data) {
    chrome.storage.local.set({ lastHighlightResult: data });
    chrome.runtime.sendMessage({ action: 'autoHighlightResult', ...data })
        .catch(() => {});
  }

  // ── Auto-highlight: reads storage and runs if enabled ─────────────────────
  // Sponsorship detection ALWAYS runs on every page load — no toggle or
  // keyword requirement. The auto-highlight toggle only gates keyword highlighting.
  function autoHighlightIfEnabled() {
    chrome.storage.local.get(['jobKeywords', 'autoHighlight'], (result) => {
      const hasKeywords = result.jobKeywords && result.jobKeywords.length > 0;

      if (result.autoHighlight && hasKeywords) {
        // Toggle ON + keywords present: highlight keywords AND detect sponsorship
        injectStyles();
        clearHighlights();
        highlightKeywords(result.jobKeywords).then(data => {
          publishResult(data);
          showSponsorshipBanner(data.sponsorship);
        });
      } else {
        // No toggle or no keywords — always still scan for sponsorship phrases
        detectSponsorshipOnly().then(sponsorship => {
          const data = { count: 0, sponsorship };
          publishResult(data);
          showSponsorshipBanner(sponsorship);
        });
      }
    });
  }

  // ── Sponsorship-only detection (no keyword highlighting) ─────────────────
  async function detectSponsorshipOnly() {
    const bodyText = document.body.innerText.toLowerCase();
    const patterns = await getSponsorshipPhrases();
    const positive = [];
    const negative = [];
    for (const phrase of patterns.positive) {
      if (new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(bodyText)) positive.push(phrase);
    }
    for (const phrase of patterns.negative) {
      if (new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(bodyText)) negative.push(phrase);
    }
    return { positive, negative };
  }

  // ── React to storage changes in real time ─────────────────────────────────
  if (!window.__jobspotStorageListenerAttached) {
    window.__jobspotStorageListenerAttached = true;

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      if ('jobKeywords' in changes || 'autoHighlight' in changes) {
        chrome.storage.local.get(['jobKeywords', 'autoHighlight'], (result) => {
          if (!result.autoHighlight) {
            clearHighlights();
            removeSponsorshipBanner();
            chrome.storage.local.remove('lastHighlightResult');
            chrome.runtime.sendMessage({ action: 'autoHighlightResult', count: 0, sponsorship: null })
                .catch(() => {});
            return;
          }
          const hasKeywords = result.jobKeywords && result.jobKeywords.length > 0;

          if (hasKeywords) {
            injectStyles();
            clearHighlights();
            highlightKeywords(result.jobKeywords).then(data => {
              publishResult(data);
              showSponsorshipBanner(data.sponsorship);
            });
          } else {
            // No keywords — still detect and show sponsorship banner
            detectSponsorshipOnly().then(sponsorship => {
              const data = { count: 0, sponsorship };
              publishResult(data);
              showSponsorshipBanner(sponsorship);
            });
          }
        });
      }
    });
  }

  // ── SPA detection — patch history API ────────────────────────────────────
  if (!window.__jobspotSpaPatched) {
    window.__jobspotSpaPatched = true;

    const _push = history.pushState.bind(history);
    history.pushState = function (...args) {
      _push(...args);
      window.dispatchEvent(new Event('jobspot:nav'));
    };

    const _replace = history.replaceState.bind(history);
    history.replaceState = function (...args) {
      _replace(...args);
      window.dispatchEvent(new Event('jobspot:nav'));
    };

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('jobspot:nav'));
    });
  }

  let navTimer = null;
  window.addEventListener('jobspot:nav', () => {
    clearTimeout(navTimer);
    navTimer = setTimeout(autoHighlightIfEnabled, 700);
  });

  let mutationTimer = null;
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(autoHighlightIfEnabled, 700);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // ── Message listener ──────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'highlight') {
      injectStyles();
      clearHighlights();
      highlightKeywords(message.keywords).then(result => {
        publishResult(result);
        showSponsorshipBanner(result.sponsorship);
        sendResponse({ count: result.count, sponsorship: result.sponsorship });
      }).catch(() => {
        sendResponse({ count: 0, sponsorship: { positive: [], negative: [] } });
      });
      return true;
    }

    if (message.action === 'clear') {
      clearHighlights();
      removeSponsorshipBanner();
      chrome.storage.local.remove('lastHighlightResult');
      sendResponse({ cleared: true });
    }
  });

  // ── Run on page load ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoHighlightIfEnabled);
  } else {
    autoHighlightIfEnabled();
  }

})();

// ── Core highlight engine ─────────────────────────────────────────────────────
async function highlightKeywords(keywords) {
  if (!keywords || keywords.length === 0) return { count: 0, sponsorship: null };

  const bodyText = document.body.innerText.toLowerCase();
  const sponsorshipPatterns = await getSponsorshipPhrases();

  const positiveSponsorship = [];
  const negativeSponsorship = [];

  for (const phrase of sponsorshipPatterns.positive) {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');
    if (regex.test(bodyText)) positiveSponsorship.push(phrase);
  }
  for (const phrase of sponsorshipPatterns.negative) {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');
    if (regex.test(bodyText)) negativeSponsorship.push(phrase);
  }

  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  let count = 0;

  const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = (parent.tagName || '').toLowerCase();
          if (['script', 'style', 'textarea', 'input', 'select', 'noscript'].includes(tag))
            return NodeFilter.FILTER_REJECT;
          if (parent.classList?.contains('jobspot-highlight'))
            return NodeFilter.FILTER_REJECT;
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
  );

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  nodes.forEach(textNode => {
    const text = textNode.textContent;
    const pattern = new RegExp(`\\b(${sorted.map(escapeRegex).join('|')})\\b`, 'gi');
    if (!pattern.test(text)) return;
    pattern.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex)
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'jobspot-highlight';
      mark.textContent = match[0];
      fragment.appendChild(mark);
      count++;
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length)
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

    textNode.parentNode.replaceChild(fragment, textNode);
  });

  return { count, sponsorship: { positive: positiveSponsorship, negative: negativeSponsorship } };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSponsorshipPhrases() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY], result => {
      resolve(result[STORAGE_KEY] || { positive: [], negative: [] });
    });
  });
}
