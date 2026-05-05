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

## v1.1.0 — May 2026

### New Features
- Form-level submit interception — Enter key inside registration forms now triggers the extension
- Shadow DOM form traversal — forms inside web components are now hooked correctly
- Community caching via Supabase — analysis results shared across users instantly
- Cross-user site database — known site URLs shared across users via Supabase backend
- Semantic similarity via pgvector — ToS change detection uses vector embeddings instead of text hashing
- Automatic model escalation — low-confidence analyses retry with a stronger model before reaching the user
- Server-side document fetching — Next.js and CORS-restricted legal pages fetch via proxy backend
- AI disclaimer on all results — permanent accuracy disclaimer on every analysis surface
- Supabase write validation gate — incomplete or malformed analyses rejected before reaching community cache

### Known Limitations
- Reddit registration form lives inside a cross-origin iframe — Enter key interception not achievable at the extension layer. Button click interception works correctly.

### Browser Support
- ✅ Chrome (tested)
- ✅ Microsoft Edge — confirmed working
- 🔲 Firefox — architecture compatible, untested