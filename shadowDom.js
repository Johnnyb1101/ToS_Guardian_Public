// shadowDom.js — Shadow DOM traversal utility
// Recursively walks shadow roots to find and hook agree buttons
// that are invisible to standard querySelectorAll

function walkShadowDOM(root, callback) {
  // Get all elements inside this root (normal DOM or shadow root)
  const elements = root.querySelectorAll('*');

  elements.forEach(el => {
    // Run the callback on every element (e.g. check if it's an agree button)
    callback(el);

    // If this element has a shadow root, step inside and keep searching
    if (el.shadowRoot) {
      walkShadowDOM(el.shadowRoot, callback);
    }
  });
}

function hookShadowButtons(root) {
  walkShadowDOM(root, (el) => {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    const isButtonLike = tag === 'button' || tag === 'a' ||
      (tag === 'input' && (el.type === 'submit' || el.type === 'button')) ||
      el.getAttribute('role') === 'button';

    if (!isButtonLike) return;
    if (hookedButtons.has(el)) return;

    if (typeof isAgreeButton === 'function' && isAgreeButton(el)) {
      hookedButtons.add(el);
      el.dataset.tgHooked = 'true'; // DOM hint only — not authoritative
      el.addEventListener('click', showGuardianOverlay, true);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
          showGuardianOverlay(e);
        }
      }, true);
      console.log('[ShadowDOM] Hooked agree button inside shadow root:', el);
    }
  });
}