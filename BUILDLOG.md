# TOS Guardian — Build Log

Public changelog. Technical architecture details are maintained separately.

## v1.0.0 — Initial Public Release (April 2026)

### Core Features
- Button interception — intercepts agree/accept buttons before click fires
- Shadow DOM traversal — catches buttons inside modern web component frameworks
- Fetcher Agent — hidden tab rendering for JS-heavy legal pages
- Dual document fetch — retrieves both Terms of Service and Privacy Policy in parallel
- Link Follower Agent — follows opt-out and privacy links buried in documents
- Memory Agent — 15-day cache with change detection fingerprinting and integrity verification
- Site Database — 30+ static entries for instant lookup, self-learning for unknown sites
- Analyzer — 6-category structured privacy analysis via AI
- Evaluator Agent — quality scoring with confidence badge before results reach UI
- Orchestrator — full relay chain coordination with retry and graceful fallback

### Security
- API key storage moved to chrome.storage.local — never in code
- Prompt injection defense in system prompt
- Input sanitization before prompt construction
- URL validation blocking private IPs, localhost, and non-HTTPS URLs
- Cache integrity hash verification on every read
- Content Security Policy in manifest
- WeakSet button hook tracking — inaccessible to page scripts
- Evaluator schema validation — fails closed on unexpected format

### UI
- Civic theme — clean white card, blue shield, DM Sans font
- Overlay intercepts agree buttons inline on the page
- Manual popup via toolbar icon click
- Options page for API key entry and provider selection
- Identical rendering across overlay and popup via shared formatSummary()

### Browser Support
- ✅ Chrome (tested)
- 🔲 Microsoft Edge — architecture compatible, untested
- 🔲 Firefox — architecture compatible, untested

### Known Gaps
- Enter key via input field bypasses button-level interception
- Fingerprint instability on dynamic pages — pgvector semantic similarity planned
- Self-learning site database is single-user until backend is built