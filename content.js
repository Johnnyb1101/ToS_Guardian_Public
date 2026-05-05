const hookedButtons = new WeakSet();
const hookedForms = new WeakSet();
const browser = globalThis.browser || chrome;

function isAgreeButton(el) {
  const blockedDomains = [
    'linkedin.com', 'facebook.com', 'twitter.com',
    'x.com', 'instagram.com', 'youtube.com'
  ];
  if (blockedDomains.some(d => location.hostname.includes(d))) return false;

  const text = el.innerText?.toLowerCase().trim() || "";
  const pageText = document.body.innerText.toLowerCase();

  const highConfidence = [
  "i agree", "accept all", "i accept",
  "agree & continue", "accept & continue",
  "continue with sso",
  "sign up free"
];

  const lowConfidence = ["sign up", "create account", "register"];

  const agreementContext = [
    "by clicking", "by continuing", "by signing up",
    "you agree", "terms of service", "privacy policy",
    "terms and conditions"
  ];

  if (highConfidence.some(k => text.includes(k))) return true;

  if (text === "continue" || lowConfidence.some(k => text.includes(k))) {
    return agreementContext.some(phrase => pageText.includes(phrase));
  }

  return false;
}

function showGuardianOverlay(event) {
  const clickedButton = event.currentTarget;
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();

  if (document.getElementById("tos-guardian-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "tos-guardian-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.55); z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', system-ui, sans-serif;
  `;

  overlay.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
      #tg-card { background:#fff; border-radius:14px; box-shadow:0 8px 40px rgba(0,0,0,0.18); max-width:620px; width:90%; overflow:hidden; }
      #tg-card-topbar { height:4px; background:#1a1aff; }
      #tg-card-header { display:flex; align-items:center; gap:12px; padding:16px 20px 14px; border-bottom:1px solid #f0f0f0; }
      #tg-card-shield { width:34px; height:34px; background:#1a1aff; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      #tg-card-shield-icon { width:16px; height:18px; background:#fff; clip-path:polygon(50% 0%,100% 25%,100% 70%,50% 100%,0% 70%,0% 25%); }
      #tg-card-title { font-size:14px; font-weight:600; color:#111; }
      #tg-card-subtitle { font-size:12px; color:#aaa; margin-top:1px; }
      #tg-summary { padding:4px 0; max-height:700px; overflow-y:scroll; overscroll-behavior:contain; pointer-events:all; }
      #tg-summary-loading { padding:28px 20px; display:flex; align-items:center; gap:12px; color:#888; font-size:13px; }
      #tg-spinner { width:20px; height:20px; border:2px solid #ebebeb; border-top-color:#1a1aff; border-radius:50%; animation:tg-spin 0.75s linear infinite; flex-shrink:0; }
      @keyframes tg-spin { to { transform:rotate(360deg); } }
      .tg-category { padding:11px 20px; border-bottom:1px solid #f5f5f5; }
      .tg-category-title { font-size:10px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#aaa; margin-bottom:4px; display:block; }
      .tg-category-body { font-size:13px; color:#333; line-height:1.6; }
      .tg-optout-links { margin:10px 20px; padding:10px 12px; background:#f5fff8; border:1px solid #b2dfc0; border-radius:8px; }
      .tg-optout-title { font-size:11px; font-weight:600; color:#1a7a3c; margin-bottom:6px; }
      .tg-optout-link { display:block; font-size:11px; color:#1a1aff; text-decoration:none; word-break:break-all; margin-bottom:3px; }
      .tg-optout-link:hover { text-decoration:underline; }
      .tg-eval-warning { margin:8px 20px 0; padding:8px 12px; background:#fff8ee; border:1px solid #f5dfa0; border-radius:8px; color:#7a5000; font-size:12px; line-height:1.5; }
      .tg-eval-badge { margin:8px 20px 4px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:500; display:inline-block; }
      .tg-eval-strong   { background:#f0fff4; color:#1a7a3c; border:1px solid #b2dfc0; }
      .tg-eval-adequate { background:#fff8ee; color:#b7770d; border:1px solid #f5dfa0; }
      .tg-eval-weak     { background:#fff0f0; color:#c0392b; border:1px solid #f5c6c6; }
      #tg-card-footer { display:flex; gap:10px; padding:14px 20px; border-top:1px solid #f0f0f0; align-items:center; }
      #tg-proceed { flex:1; height:40px; padding:0 10px; background:#e0e0e0; color:#444; border:none; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; }
      #tg-proceed:hover { background:#d4d4d4; }
      #tg-leave { flex:1; height:40px; padding:0 10px; background:#1a1aff; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; }
      #tg-leave:hover { background:#0000dd; }
    </style>

    <div id="tg-card">
      <div id="tg-card-topbar"></div>
      <div id="tg-card-header">
        <div id="tg-card-shield"><div id="tg-card-shield-icon"></div></div>
        <div>
          <div id="tg-card-title">TOS Guardian</div>
          <div id="tg-card-subtitle">Reading the fine print before you agree</div>
        </div>
      </div>
      <div id="tg-summary">
        <div id="tg-summary-loading">
          <div id="tg-spinner"></div>
          Analyzing this agreement - reading the fine print...
        </div>
      </div>
      <div id="tg-card-footer">
        <button id="tg-proceed">I've read it — Proceed</button>
        <button id="tg-leave">Get me out of here</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("tg-summary").addEventListener("wheel", (e) => {
    e.stopPropagation();
  }, { passive: true });

  document.getElementById("tg-proceed").addEventListener("click", () => {
  observerPaused = true;
  overlay.remove();
  clickedButton.removeEventListener("click", showGuardianOverlay, true);
  hookedButtons.delete(clickedButton);
  setTimeout(() => {
    clickedButton.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    setTimeout(() => { observerPaused = false; }, 500);
  }, 100);
});

  document.getElementById("tg-leave").addEventListener("click", () => {
    overlay.remove();
  });

  const fullText = document.body.innerText;
  browser.runtime.sendMessage(
  { 
    action: "analyzeTos", 
    text: fullText, 
    pageUrl: window.location.href,
    pageHtml: document.documentElement.innerHTML 
  },
  (result) => {
    const summaryEl = document.getElementById("tg-summary");
    if (summaryEl) {
      summaryEl.innerHTML = formatSummary(
        result?.summary || "Could not analyze this page.",
        result?.optOutLinks || []
      );
    }
  }
);
}

function attachToButtons() {
  document.querySelectorAll("button, a, [role='button']").forEach(el => {
  if (isAgreeButton(el) && !hookedButtons.has(el)) {
  hookedButtons.add(el);
  el.dataset.tgHooked = "true"; // DOM hint only — not authoritative
      el.addEventListener("click", showGuardianOverlay, true);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
          showGuardianOverlay(e);
        }
      }, true);
    }
  });
  hookShadowButtons(document.body);
}

function attachToForms() {
  document.querySelectorAll('form').forEach(form => {
    if (hookedForms.has(form)) return;
    hookedForms.add(form);

    form.addEventListener('submit', function(event) {
      const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
      let hasAgreeButton = false;
      submitButtons.forEach(btn => { if (isAgreeButton(btn)) hasAgreeButton = true; });

      if (!hasAgreeButton) {
        const pageText = document.body.innerText.toLowerCase();
        const agreementContext = [
          'by clicking', 'by continuing', 'by signing up',
          'you agree', 'terms of service', 'privacy policy'
        ].some(phrase => pageText.includes(phrase));
        if (!agreementContext) return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      showGuardianOverlay(event);
    }, true);
  });
  hookShadowForms(document.body);
}

let observerPaused = false;

function initTosGuardian() {
  attachToButtons();
  attachToForms();
  setTimeout(() => { attachToButtons(); attachToForms(); }, 2000);
  setTimeout(() => { attachToButtons(); attachToForms(); }, 4000);
  const observer = new MutationObserver(() => {
    if (!observerPaused) { attachToButtons(); attachToForms(); }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class'] });
}

if (document.body) { initTosGuardian(); }
else { document.addEventListener('DOMContentLoaded', initTosGuardian); }

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getText") {
    sendResponse({ text: document.body.innerText, html: document.documentElement.innerHTML });
  }
});