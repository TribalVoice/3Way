# 3Way Lite

User-paced three-way chat: **you**, **Gemini**, and **Grok** share one room transcript. You control who speaks next.

## Features

- Shared linear room (not tournament branching)
- **Both / Gemini / Grok** reply targets + **Invite** to continue
- **Streaming** replies (live tokens)
- **Attach files** → extract text (PDF, Markdown, code, CSV, …) → inject into the room
- **Export / import** room as JSON; export Markdown for reading
- BYOK: API keys stored in your browser only
- Retry failed turns; clear room with confirm

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), open **Settings**, and add:

- [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key
- [xAI Console](https://console.x.ai/) Grok API key

Default models: `gemini-3.6-flash` and `grok-4.5` (custom names supported).
Older Gemini IDs (e.g. `gemini-2.5-flash`) are auto-upgraded for new API keys.

## Files

Paperclip attaches supported files. Text is extracted locally (PDFs via pdf.js). Large docs are truncated (~80k characters). Scanned image-only PDFs are not supported yet.

## Export / import

- **Download** icon → JSON backup of the room (re-importable)
- **Markdown** icon (desktop) → human-readable export
- **Upload** icon → restore a previous JSON export (replaces current room)

## Deploy

Configured for Netlify (`netlify.toml` + `@netlify/plugin-nextjs`).

## Note

This is a personal BYOK tool. The `/api/chat` route proxies your key to the provider — do not expose a public deployment without rate limits if you care about abuse of the relay endpoint.
