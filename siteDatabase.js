// TOS Guardian — Site Database
// Standalone file. Loaded into service worker scope via importScripts('siteDatabase.js') in background.js.
//
// PURPOSE:
// Maps known domains to their confirmed ToS and Privacy Policy URLs.
// When the Orchestrator finds a match here, the Fetcher skips all candidate
// URL guessing and hidden tab scanning — it goes straight to the known URLs.
//
// TWO LAYERS:
// 1. STATIC_SITES  — hardcoded, manually verified entries. Never expire.
// 2. Learned sites — discovered at runtime by the Fetcher, saved to
//                    chrome.storage.local with a 15-day expiry (same as Memory Agent).


const CACHE_EXPIRY_DAYS = 15;

// ---------------------------------------------------------------------------
// Static database — hardcoded, never expire
// ---------------------------------------------------------------------------
const STATIC_SITES = {

  // Social / Community
  "reddit.com": {
    tos: "https://www.redditinc.com/policies/user-agreement",
    privacy: "https://www.reddit.com/policies/privacy-policy"
  },
  "twitter.com": {
    tos: "https://twitter.com/en/tos",
    privacy: "https://twitter.com/en/privacy"
  },
  "x.com": {
    tos: "https://twitter.com/en/tos",
    privacy: "https://twitter.com/en/privacy"
  },
  "facebook.com": {
    tos: "https://www.facebook.com/terms.php",
    privacy: "https://www.facebook.com/privacy/policy/"
  },
  "instagram.com": {
    tos: "https://help.instagram.com/581066165581870",
    privacy: "https://privacycenter.instagram.com/policy"
  },
  "linkedin.com": {
    tos: "https://www.linkedin.com/legal/user-agreement",
    privacy: "https://www.linkedin.com/legal/privacy-policy"
  },
  "discord.com": {
    tos: "https://discord.com/terms",
    privacy: "https://discord.com/privacy"
  },
  "tiktok.com": {
    tos: "https://www.tiktok.com/legal/page/us/terms-of-service/en",
    privacy: "https://www.tiktok.com/legal/page/us/privacy-policy/en"
  },

  // Streaming & Music
  "spotify.com": {
    tos: "https://www.spotify.com/us/legal/end-user-agreement/",
    privacy: "https://www.spotify.com/us/legal/privacy-policy/"
  },
  "netflix.com": {
    tos: "https://help.netflix.com/legal/termsofuse",
    privacy: "https://help.netflix.com/legal/privacy"
  },
  "youtube.com": {
    tos: "https://www.youtube.com/t/terms",
    privacy: "https://policies.google.com/privacy"
  },
  "twitch.tv": {
    tos: "https://www.twitch.tv/p/en/legal/terms-of-service/",
    privacy: "https://www.twitch.tv/p/en/legal/privacy-notice/"
  },

  // Shopping
  "amazon.com": {
    tos: "https://www.amazon.com/gp/help/customer/display.html?nodeId=508088",
    privacy: "https://www.amazon.com/gp/help/customer/display.html?nodeId=468496"
  },
  "ebay.com": {
    tos: "https://www.ebay.com/help/policies/member-behaviour-policies/user-agreement",
    privacy: "https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy"
  },
  "etsy.com": {
    tos: "https://www.etsy.com/legal/terms-of-use/",
    privacy: "https://www.etsy.com/legal/privacy/"
  },
  "paypal.com": {
    tos: "https://www.paypal.com/us/legalhub/useragreement-full",
    privacy: "https://www.paypal.com/us/legalhub/privacy-full"
  },

  // Travel
  "airbnb.com": {
    tos: "https://www.airbnb.com/help/article/2908",
    privacy: "https://www.airbnb.com/help/article/2855"
  },
  "uber.com": {
    tos: "https://www.uber.com/legal/en/document/?name=general-terms-of-use&country=united-states&lang=en",
    privacy: "https://www.uber.com/legal/en/document/?name=privacy-notice&country=united-states&lang=en"
  },

  // Tech & Software
  "google.com": {
    tos: "https://policies.google.com/terms",
    privacy: "https://policies.google.com/privacy"
  },
  "apple.com": {
    tos: "https://www.apple.com/legal/internet-services/terms/site.html",
    privacy: "https://www.apple.com/legal/privacy/"
  },
  "microsoft.com": {
    tos: "https://www.microsoft.com/en-us/servicesagreement/",
    privacy: "https://privacy.microsoft.com/en-us/privacystatement"
  },
  "github.com": {
    tos: "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
    privacy: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
  },
  "zoom.us": {
    tos: "https://explore.zoom.us/en/terms/",
    privacy: "https://explore.zoom.us/en/privacy/"
  },
  "slack.com": {
    tos: "https://slack.com/terms-of-service",
    privacy: "https://slack.com/privacy-policy"
  },

  // Gaming
  "steampowered.com": {
    tos: "https://store.steampowered.com/subscriber_agreement/",
    privacy: "https://store.steampowered.com/privacy_agreement/"
  },
  "epicgames.com": {
    tos: "https://www.epicgames.com/tos",
    privacy: "https://www.epicgames.com/privacypolicy"
  }
};

// ---------------------------------------------------------------------------
// lookupSite(pageUrl)
// Called by the Orchestrator before running the Fetcher.
// Returns { tos, privacy } if found, or null if unknown.
// Checks static database first, then learned sites in chrome.storage.local.
// ---------------------------------------------------------------------------
async function lookupSite(pageUrl) {
  try {
    const hostname = new URL(pageUrl).hostname.replace(/^www\./, "");

    // 1. Check static database first — no expiry
    if (STATIC_SITES[hostname]) {
      console.log(`[SiteDB] ✅ Static match: ${hostname}`);
      return STATIC_SITES[hostname];
    }

    // Subdomain fallback — e.g. "store.steampowered.com" → "steampowered.com"
    const parts = hostname.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join(".");
      if (STATIC_SITES[candidate]) {
        console.log(`[SiteDB] ✅ Static match (subdomain): ${hostname} → ${candidate}`);
        return STATIC_SITES[candidate];
      }
    }

    // 2. Check learned sites in chrome.storage.local — subject to 15-day expiry
    const key = "sitedb_" + hostname;
    const result = await browser.storage.local.get(key);
    const learned = result[key];

    if (learned) {
      const ageInDays = (Date.now() - learned.savedAt) / (1000 * 60 * 60 * 24);
      if (ageInDays <= CACHE_EXPIRY_DAYS) {
        console.log(`[SiteDB] ✅ Learned match: ${hostname} (${Math.floor(ageInDays)}d old)`);
        return { tos: learned.tos, privacy: learned.privacy };
      } else {
        console.log(`[SiteDB] ⏰ Learned entry expired for ${hostname} — will re-discover`);
        await browser.storage.local.remove(key);
      }
    }

    console.log(`[SiteDB] ❓ Unknown site: ${hostname} — Fetcher will use candidate URLs`);
    return null;

  } catch (e) {
    console.warn("[SiteDB] lookupSite error:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// learnSite(pageUrl, tosUrl, privacyUrl)
// Called by the Fetcher after it successfully discovers URLs for an unknown site.
// Saves to chrome.storage.local with a timestamp for 15-day expiry.
// ---------------------------------------------------------------------------
async function learnSite(pageUrl, tosUrl, privacyUrl) {
  try {
    const hostname = new URL(pageUrl).hostname.replace(/^www\./, "");

    // Never overwrite static entries
    if (STATIC_SITES[hostname]) return;

    const key = "sitedb_" + hostname;
    await browser.storage.local.set({
      [key]: {
        tos: tosUrl,
        privacy: privacyUrl,
        savedAt: Date.now()
      }
    });
    console.log(`[SiteDB] 📚 Learned and saved: ${hostname}`);
  } catch (e) {
    console.warn("[SiteDB] learnSite error:", e);
  }
}