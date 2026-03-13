// JobSearch Content Script — Keyword Highlighter
// Injected into pages to highlight keywords with whole-word, case-insensitive matching
const STORAGE_KEY = "sponsorshipKeywords";

(function () {
  const MARK_CLASS = 'jobspot-highlight';
  const STYLE_ID = 'jobspot-styles';

  // Inject highlight styles if not present
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
    `;
    document.head.appendChild(style);
  }

  // Remove all existing highlights
  function clearHighlights() {
    const marks = document.querySelectorAll(`.${MARK_CLASS}`);
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  // --- Sponsorship storage (chrome.storage.local) ---
  function getSponsorshipPhrases() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || { positive: [], negative: [] });
      });
    });
  }

  // Highlight all matching keywords in the page
  async function highlightKeywords(keywords) {
    if (!keywords || keywords.length === 0) return { count: 0, sponsorship: null };

    const bodyText = document.body.innerText.toLowerCase();

    // Read sponsorship phrases from chrome.storage.local
    const sponsorshipPatterns = await getSponsorshipPhrases();
    console.log('Sponsorship patterns loaded:', sponsorshipPatterns);

    let positiveSponsorship = [];
    let negativeSponsorship = [];

    for (const phrase of sponsorshipPatterns.positive) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(bodyText)) {
        positiveSponsorship.push(phrase);
      }
    }

    for (const phrase of sponsorshipPatterns.negative) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(bodyText)) {
        negativeSponsorship.push(phrase);
      }
    }

    // Build regex for keywords
    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

    let count = 0;

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;

            const tag = parent.tagName ? parent.tagName.toLowerCase() : '';

            if (['script', 'style', 'textarea', 'input', 'select', 'noscript'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }

            if (parent.classList && parent.classList.contains(MARK_CLASS)) {
              return NodeFilter.FILTER_REJECT;
            }

            if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;

            return NodeFilter.FILTER_ACCEPT;
          }
        }
    );

    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;

      if (!pattern.test(text)) return;

      pattern.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(text)) !== null) {

        if (match.index > lastIndex) {
          fragment.appendChild(
              document.createTextNode(text.slice(lastIndex, match.index))
          );
        }

        const mark = document.createElement('mark');
        mark.className = MARK_CLASS;
        mark.textContent = match[0];
        fragment.appendChild(mark);

        count++;
        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(
            document.createTextNode(text.slice(lastIndex))
        );
      }

      textNode.parentNode.replaceChild(fragment, textNode);
    });

    return { count, sponsorship: { positive: positiveSponsorship, negative: negativeSponsorship } };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === 'highlight') {
      injectStyles();
      clearHighlights();

      // Await the async function, then send response
      highlightKeywords(message.keywords).then(result => {
        sendResponse({
          count: result.count,
          sponsorship: result.sponsorship
        });
      });
    }

    else if (message.action === 'clear') {
      clearHighlights();
      sendResponse({ cleared: true });
    }

    return true; // Keep message channel open for async sendResponse
  });

})();