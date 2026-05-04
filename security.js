// TOS Guardian — Security Utilities
// Loaded into service worker scope via importScripts() in background.js
// Do not add to manifest.json content_scripts — not needed in page scope

// --- URL VALIDATOR (SECURITY-006) ---
// Blocks private IPs, localhost, loopback, and non-HTTPS URLs
// before the Link Follower opens any hidden tab
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

// --- INPUT SANITIZER (SECURITY-007) ---
// Sanitizes fetched document text before it enters any Claude prompt
// Supporting layer for SECURITY-003 — not a replacement for the system prompt defense
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