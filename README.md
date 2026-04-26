# TOS Guardian

A Chrome browser extension that intercepts "I Agree" buttons and analyzes Terms of Service and Privacy Policy documents with AI — so you know what you're agreeing to before you agree.

## What It Does

Most people click "I Agree" without reading anything. TOS Guardian stops that. When you click an agree button on any website, the extension intercepts it, fetches the actual legal documents, analyzes them with AI, and returns a plain-English summary covering:

- 🔴 Data selling and sharing — who gets your data and why
- 🔴 Opt-out rights — what you can actually do about it
- 📋 Step-by-step opt-out guide — specific steps, links, and settings
- 🟡 Arbitration and legal rights — what rights you're signing away
- 🟡 Auto-renewal and billing traps
- 🟢 Data deletion rights — how to get your data removed

## How It Works

TOS Guardian runs a multi-agent pipeline entirely inside the Chrome extension:

Memory → Fetcher → Link Follower → Analyzer → Evaluator → UI

- **Memory Agent** — caches analysis results for 15 days, detects when a ToS has changed
- **Fetcher Agent** — opens hidden tabs to render JS-heavy legal pages and retrieve real document text
- **Link Follower Agent** — hunts down opt-out and privacy settings pages buried inside documents
- **Analyzer** — sends combined documents to an AI model with a structured 6-category prompt
- **Evaluator Agent** — scores the analysis quality before it reaches you
- **Site Database** — 30+ hardcoded known sites for instant URL lookup, plus self-learning for new sites

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the project folder
5. Right-click the TOS Guardian icon → **Options**
6. Enter your API key and select your AI provider
7. Visit any site with an agree button and click it

> **Note:** TOS Guardian requires your own API key to function. 
> See Supported AI Providers below for where to get one. 
> Anthropic offers free trial credits to new accounts.

## Supported AI Providers

TOS Guardian supports three AI providers. You supply your own API key.

| Provider | Model | Get a key |
|---|---|---|
| Anthropic (Claude) | claude-haiku-4-5 | console.anthropic.com |
| OpenAI (GPT) | gpt-4o-mini | platform.openai.com |
| Ollama (Local) | llama3 | ollama.com |

## Browser Support

- ✅ Chrome
- 🔲 Microsoft Edge — architecture is compatible but untested
- 🔲 Firefox — architecture is compatible but untested

## Security

TOS Guardian was built with security as a first-class concern. The extension:

- Never stores API keys in code — keys live in `chrome.storage.local` only
- Sanitizes all fetched document text before it reaches the AI prompt
- Defends against prompt injection via explicit system prompt instructions
- Validates all URLs before opening hidden tabs — blocks private IPs, localhost, and non-HTTPS
- Uses a WeakSet for button hook tracking — inaccessible to page scripts
- Verifies cached analysis integrity with a hash check on every read

## Known Limitations

- Sites that submit forms via Enter key on an input field (not a button) may bypass interception
- Fingerprint-based change detection can produce false positives on sites with dynamic content — semantic similarity via vector embeddings is the planned long-term fix
- The self-learning site database is currently per-user only — cross-user learning requires a backend

## Roadmap

- [ ] Proxy server backend — zero API key setup for general users
- [ ] Automated opt-out submission — fill and send opt-out requests on your behalf
- [ ] CCPA/GDPR deletion request generation and compliance tracking
- [ ] Semantic similarity via pgvector for reliable ToS change detection
- [ ] Chrome Web Store release

## About

I'm a healthcare professional with over a decade in the field and less than a year of coding experience. I started this project with no JavaScript knowledge, no CS background, and no idea what a service worker was.

What I did have was a reason. I got tired of watching people, including myself, get buried in loan calls and spam because some website buried a data-selling clause in a wall of legal text that nobody reads. That's the problem TOS Guardian exists to solve.

If you're a developer looking at this code and thinking "not bad for a first project", honestly, thank you. If you're a regular person who just wants to know what you're agreeing to, that's who this was built for.

## Contributing

Pull requests welcome. Please open an issue first for anything beyond small fixes.

## License

MIT