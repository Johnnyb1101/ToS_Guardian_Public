// TOS Guardian — Shared Utilities
// Loaded via manifest.json content_scripts (before content.js),
// popup.html <script> tag (before popup.js),
// and background.js importScripts()

function formatSummary(raw, optOutLinks = []) {
  if (!raw) return "";

  let injectionWarning = "";
  const injectionPattern = /⚠️\s*Possible injection attempt detected[^\n]*/i;
  const injectionMatch = raw.match(injectionPattern);
  if (injectionMatch) {
    injectionWarning = `
      <div style="margin-bottom:10px; padding:8px 10px; background:#3a1a00;
                  border-left:3px solid #ff6600; border-radius:4px;
                  font-size:12px; color:#ffaa55;">
        🚨 ${injectionMatch[0].replace(/^⚠️\s*/i, "").trim()}
      </div>`;
    raw = raw.replace(injectionMatch[0], "").trim();
  }

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

  let html = injectionWarning + evalWarning;
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
        .filter(l => l !== "" && l !== "---" && l !== "—"
          && !l.match(/^It.s your right to/i)
          && !l.match(/^[-\s|]+$/));

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
  html += `<div style="margin-top:12px; padding-top:8px; border-top:1px solid #333;
              font-size:11px; color:#888; text-align:center;">
    AI analysis may not be 100% accurate. Always review documents yourself for important decisions.
  </div>`;

  return html;
}

function validateLinkFollowerUrl(url) {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      console.warn("[LinkFollower] Blocked non-HTTPS URL:", url);
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      console.warn("[LinkFollower] Blocked loopback URL:", url);
      return false;
    }

    const privateIp = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/;
    if (privateIp.test(hostname)) {
      console.warn("[LinkFollower] Blocked private IP URL:", url);
      return false;
    }

    if (!hostname || hostname.length < 4) {
      console.warn("[LinkFollower] Blocked invalid hostname:", url);
      return false;
    }

    return true;
  } catch (e) {
    console.warn("[LinkFollower] Blocked malformed URL:", url);
    return false;
  }
}

function sanitizeForPrompt(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map(line => line.trim().length > 2000 ? line.trim().slice(0, 2000) : line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .trim();
}

function scanForInjection(text) {
  if (!text || typeof text !== 'string') return { clean: true, strippedText: text, pattern: null };

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    /system\s*:\s*(override|prompt|message|instruction)/i,
    /system\s+override/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /forget\s+(everything|all|your|prior)/i,
    /new\s+instructions?\s*:/i,
    /\[INST\]/i,
    /<\|system\|>/i,
    /<\|im_start\|>/i,
    /###\s*instruction/i,
    /---\s*system\s*---/i,
    /act\s+as\s+if\s+you\s+(are|have|were)/i,
    /disregard\s+(your|all|any|previous)/i,
    /override\s+(your|all|previous|prior)\s+(instructions?|rules?|guidelines?)/i,
    /you\s+must\s+(now\s+)?(ignore|disregard|forget)/i
  ];

  let strippedText = text;
  let detectedPattern = null;

  const lines = text.split('\n');
  const cleanedLines = lines.filter(line => {
    for (const pattern of injectionPatterns) {
      if (pattern.test(line)) {
        if (!detectedPattern) detectedPattern = line.trim().slice(0, 80);
        console.warn('[Scanner] Injection pattern detected and stripped:', line.trim().slice(0, 80));
        return false;
      }
    }
    return true;
  });

  strippedText = cleanedLines.join('\n');
  const clean = detectedPattern === null;

  return { clean, strippedText, pattern: detectedPattern };
}