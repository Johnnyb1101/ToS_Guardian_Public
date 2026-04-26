// TOS Guardian — Shared Utilities

function formatSummary(raw, optOutLinks = []) {
  if (!raw) return "";

  let evalWarning = "";
  let evalBadge = "";

  const warningMatch = raw.match(/<div class="tg-eval-warning"[^>]*>.*?<\/div>/s);
  const badgeMatch   = raw.match(/<div class="tg-eval-badge[^>]*>.*?<\/div>/s);

  if (warningMatch) { evalWarning = warningMatch[0]; raw = raw.replace(warningMatch[0], ""); }
  if (badgeMatch)   { evalBadge   = badgeMatch[0];   raw = raw.replace(badgeMatch[0], ""); }

  const categoryMarkers = ["🔴", "📋", "🟡", "🟢"];
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l !== "" && l !== "•");

  // Build opt-out links HTML once
  const optOutHtml = optOutLinks && optOutLinks.length > 0 ? `
    <div class="tg-optout-links">
      <div class="tg-optout-title">Opt-Out Links Found</div>
      ${optOutLinks.map(url => `<a class="tg-optout-link" href="${url}" target="_blank">${url}</a>`).join("")}
    </div>` : "";

  let html = evalWarning;
  let currentTitle = "";
  let currentBody  = [];
  let optOutInserted = false;

  const flush = () => {
    if (currentTitle) {
      // Clean each line — strip leading bullets and markdown bold markers
      const bodyLines = currentBody
        .map(l => l.replace(/^•\s*/, "").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").trim())
        .filter(l => l !== "");

      const bodyHtml = bodyLines.map(l => `<p style="margin:0 0 6px 0;">${l}</p>`).join("");

      html += `
        <div class="tg-category">
          <span class="tg-category-title">${currentTitle}</span>
          <div class="tg-category-body">${bodyHtml}</div>
        </div>`;

      // Insert opt-out links after the Opt-Out Rights section (🔴 OPT-OUT RIGHTS)
      if (!optOutInserted && currentTitle.includes("OPT-OUT RIGHTS") && optOutHtml) {
        html += optOutHtml;
        optOutInserted = true;
      }

      currentBody = [];
      currentTitle = "";
    }
  };

  for (const line of lines) {
    if (categoryMarkers.some(m => line.startsWith(m))) { flush(); currentTitle = line; }
    else { currentBody.push(line); }
  }
  flush();

  // Fallback — if opt-out links weren't inserted at the right section, append before badge
  if (!optOutInserted && optOutHtml) {
    html += optOutHtml;
  }

  html += evalBadge;
  return html;
}

// Call this from popup.js after analysis returns.
// riskLevel: "high" | "medium" | "low"
function setPopupHeader(domain, riskLevel) {
  const domainEl = document.getElementById("tg-domain");
  const pillEl   = document.getElementById("tg-risk-pill");
  if (domainEl && domain) domainEl.textContent = domain;
  if (pillEl && riskLevel) {
    const labels = { high: "High risk", medium: "Medium risk", low: "Low risk" };
    pillEl.textContent = labels[riskLevel] || "";
    pillEl.className = `tg-risk-pill tg-risk-${riskLevel} visible`;
  }
}