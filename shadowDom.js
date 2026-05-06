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
    const isButtonLike = tag === 'button' ||
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

function hookShadowForms(root) {
  walkShadowDOM(root, (el) => {
    if (el.tagName?.toLowerCase() !== 'form') return;
    if (hookedForms.has(el)) return;
    hookedForms.add(el);

    el.addEventListener('submit', function(event) {
      const submitButtons = el.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
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

    console.log('[ShadowDOM] Hooked form inside shadow root:', el);
  });
}