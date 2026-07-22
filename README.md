# 3Way Lite

User-paced three-way chat: **you**, **Gemini**, and **Grok** share one room transcript. You control who speaks next.

This is the **Lite** milestone: text room, BYOK, dual providers, invite/continue controls. File attachments are planned for a later version.

## Features

- Shared linear room (not tournament branching)
- Send a message and choose **Both / Gemini / Grok** to reply
- **Invite** selected model(s) to speak again without retyping
- Full transcript context with named speakers and system prompts
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

## Deploy

Configured for Netlify (`netlify.toml` + `@netlify/plugin-nextjs`).

## Note

This is a personal BYOK tool. The `/api/chat` route proxies your key to the provider — do not expose a public deployment without rate limits if you care about abuse of the relay endpoint.
