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
  const validLinks = (optOutLinks || [])
  .map(url => url ? url.trim().replace(/\s+/g, '') : '')
  .filter(url => url && url.startsWith('http'));
  const optOutHtml = validLinks.length > 0 ? `
    <div class="tg-optout-links">
      <div class="tg-optout-title">Opt-Out Links Found</div>
      ${validLinks.map(url => `<a class="tg-optout-link" href="${url}" target="_blank">${url}</a>`).join("")}
    </div>` : "";

  let html = evalWarning;
  let currentTitle = "";
  let currentBody  = [];
  let optOutInserted = false;

  const flush = () => {
    if (currentTitle) {
      const bodyLines = currentBody
        .map(l => l
          .replace(/^•\s*/, "")
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/\|[-\s|]+\|/g, '')
          .replace(/^\|\s*/g, '')
          .replace(/\s*\|$/g, '')
          .replace(/\s*\|\s*/g, ' — ')
          .trim()
        )
        .filter(l => l !== "" && l !== "---" && l !== "—" && !l.match(/^It.s your right to/i) && !l.match(/^[-\s|]+$/));

      const bodyHtml = bodyLines.map(l => `<p style="margin:0 0 6px 0;">${l}</p>`).join("");

      html += `
        <div class="tg-category">
          <span class="tg-category-title">${currentTitle}</span>
          <div class="tg-category-body">${bodyHtml}</div>
        </div>`;

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

  if (!optOutInserted && optOutHtml) {
    html += optOutHtml;
  }

  html += evalBadge;

  // AI disclaimer — required on every result per ESCALATION-005
  html += `<div style="margin-top:12px; padding-top:8px; border-top:1px solid #333; font-size:11px; color:#888; text-align:center;">
    AI analysis may not be 100% accurate. Always review documents yourself for important decisions.
  </div>`;

  return html;
}