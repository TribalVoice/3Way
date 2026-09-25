# 3Way Lite v1.0.0

First public release of **3Way Lite** — a user-paced three-way chat room: **you** and **two AI seats**.

## Highlights

- Dual seats: Gemini, Grok, Claude, Perplexity, or NVIDIA Build
- API key register (save each provider once)
- Multiple projects (local browser storage)
- Streaming replies, Invite, route-by-first-word
- Attach text/PDF (text extract), copy, search, export/import
- English, Português (Brasil), Español
- Windows launcher + desktop shortcut scripts
- Ko-fi support link

## Requirements

- [Node.js LTS](https://nodejs.org)
- Your own API keys (BYOK)

## Install

```bash
git clone https://github.com/TribalVoice/3Way.git
cd 3Way
npm install
```

**Windows:** run `launch-3way.cmd` (or `create-desktop-shortcut.cmd` once).

Open http://localhost:3000 → Settings → keys + seats → chat.

Or: **Code → Download ZIP** on the repo / this Release.

## Notes

- PC-first. Conversations stay in browser local storage until you export.
- Public hosting of `/api/chat` without rate limits can be abused — prefer local run for personal use.
- Source is viewable; see `LICENSE` for use terms. Custom builds on request.
- Tips: [ko-fi.com/tribalvoice](https://ko-fi.com/tribalvoice)
