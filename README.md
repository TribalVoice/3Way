# 3Way Lite

User-paced three-way chat: **you** and **two AI seats** share one room transcript. You control who speaks next.

## Features

- Shared linear room (not tournament branching)
- **Seat A / Seat B** — each can be **Gemini**, **Grok**, **Claude**, **Perplexity**, or **NVIDIA Build**
- **Multiple projects** — separate transcripts; keys stay global
- **Both / seat** reply targets + **Invite** to continue
- **Streaming** replies (live tokens)
- **Attach files** → extract text (PDF, Markdown, code, CSV, …) → inject into the room
- **Copy** per turn · **Search** the room
- **Export / import** active project as JSON; export Markdown for reading
- BYOK: API keys stored in your browser only
- In-app **Getting started** help + **Ko-fi** support link
- **Languages:** English, Português (Brasil), Español (Settings)
- Windows **launcher** + desktop shortcut scripts

## Setup (first time)

1. Install [Node.js LTS](https://nodejs.org)
2. Clone or download this repo
3. In the project folder:

```bash
npm install
```

4. In Settings, fill the **API key register** (one key per provider), then set each seat’s provider and model:
   - [Google AI Studio](https://aistudio.google.com/apikey) (Gemini)
   - [xAI Console](https://console.x.ai/) (Grok)
   - [Anthropic Console](https://console.anthropic.com/) (Claude)
   - [Perplexity API](https://www.perplexity.ai/settings/api) (Perplexity)
   - [NVIDIA Build](https://build.nvidia.com/) (NIM free endpoints; use model ids from View code)

Defaults: Seat A = Gemini (`gemini-3.6-flash`), Seat B = Grok (`grok-4.5`). Custom model names supported (important for NVIDIA — catalog ids change; e.g. `deepseek-ai/deepseek-v4-flash`).

Use the **project switcher** (folder control in the header) for separate rooms. API keys are shared across projects.

## Launch on Windows (desktop icon)

After `npm install` has been run once:

| File | Purpose |
|------|---------|
| `launch-3way.cmd` | Starts the server and opens http://localhost:3000 |
| `create-desktop-shortcut.cmd` | Creates a **3Way Lite** icon on your Desktop |

Double-click the Desktop shortcut anytime. **Keep the console window open** while you use the app. Close it (or Ctrl+C) to stop the server.

## Launch (any platform, terminal)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Android & iPhone (home screen)

There is no App Store / Play Store package. The app is a **web app** you can pin:

1. Run it on a **hosted URL** (e.g. Netlify), **or** keep the PC server running and open `http://YOUR-PC-IP:3000` on the same Wi‑Fi.
2. **Android (Chrome):** menu ⋮ → *Install app* / *Add to Home screen*
3. **iPhone (Safari):** Share → *Add to Home Screen*

You still enter API keys in Settings on each browser/device (local storage is per device).

## Files

Paperclip attaches supported files. Text is extracted locally (PDFs via pdf.js). Large docs are truncated (~80k characters). Scanned image-only PDFs are not supported yet.

## Export / import

- **Download** icon → JSON backup of the room (re-importable)
- **Markdown** icon (desktop) → human-readable export
- **Upload** icon → restore a previous JSON export (replaces current room)

## Deploy

Configured for Netlify (`netlify.toml` + `@netlify/plugin-nextjs`).

## Support (Ko-fi)

Default tip link: [ko-fi.com/tribalvoice](https://ko-fi.com/tribalvoice)

Shown in the header, empty state, footer, and Getting started. Override with env:

```bash
NEXT_PUBLIC_BUY_ME_A_COFFEE_URL=https://ko-fi.com/yourname
```

Or edit `lib/support.ts`.

## Note

This is a personal BYOK tool. The `/api/chat` route proxies your key to the provider — do not expose a public deployment without rate limits if you care about abuse of the relay endpoint.
