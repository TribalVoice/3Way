'use client';

import {
  Monitor,
  Smartphone,
  KeyRound,
  Paperclip,
  Download,
  MessagesSquare,
  ExternalLink,
  Coffee,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  BUY_ME_A_COFFEE_URL,
  SUPPORT_LABEL,
  isSupportEnabled,
} from '@/lib/support';

interface GettingStartedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
}

export function GettingStarted({
  open,
  onOpenChange,
  onOpenSettings,
}: GettingStartedProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-slate-700 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Getting started</DialogTitle>
          <DialogDescription className="text-slate-400">
            3Way Lite is a local (or hosted) web app with two AI seats and
            multiple projects. Seats can be Gemini, Grok, Claude, Perplexity, or
            NVIDIA Build — you bring your own API keys.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm text-slate-300">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <KeyRound className="h-3.5 w-3.5" />
              1. API keys
            </h3>
            <ol className="list-decimal space-y-1 pl-5 text-slate-400">
              <li>
                Open{' '}
                <button
                  type="button"
                  className="text-sky-400 hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenSettings?.();
                  }}
                >
                  Settings
                </button>{' '}
                and configure Seat A and Seat B.
              </li>
              <li>
                Gemini:{' '}
                <a
                  className="text-sky-400 hover:underline"
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google AI Studio
                </a>
              </li>
              <li>
                Grok:{' '}
                <a
                  className="text-sky-400 hover:underline"
                  href="https://console.x.ai/"
                  target="_blank"
                  rel="noreferrer"
                >
                  xAI Console
                </a>
              </li>
              <li>
                Claude:{' '}
                <a
                  className="text-sky-400 hover:underline"
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Anthropic Console
                </a>
              </li>
              <li>
                Perplexity:{' '}
                <a
                  className="text-sky-400 hover:underline"
                  href="https://www.perplexity.ai/settings/api"
                  target="_blank"
                  rel="noreferrer"
                >
                  Perplexity API settings
                </a>
              </li>
              <li>
                NVIDIA Build (often free endpoints):{' '}
                <a
                  className="text-sky-400 hover:underline"
                  href="https://build.nvidia.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  build.nvidia.com
                </a>{' '}
                — use the exact model id from each model&apos;s View code panel
              </li>
              <li>Save, then choose Both / a seat and send a message.</li>
              <li>
                Use the project switcher (folder) for separate conversations.
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Monitor className="h-3.5 w-3.5" />
              2. Windows PC (desktop icon)
            </h3>
            <ol className="list-decimal space-y-1 pl-5 text-slate-400">
              <li>
                One-time: install{' '}
                <a
                  className="text-sky-400 hover:underline"
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noreferrer"
                >
                  Node.js LTS
                </a>
                , then in the project folder run{' '}
                <code className="rounded bg-slate-800 px-1 text-[11px] text-slate-200">
                  npm install
                </code>
                .
              </li>
              <li>
                Double-click{' '}
                <code className="rounded bg-slate-800 px-1 text-[11px] text-slate-200">
                  create-desktop-shortcut.cmd
                </code>{' '}
                once to put <strong className="text-slate-200">3Way Lite</strong>{' '}
                on your Desktop.
              </li>
              <li>
                Or run{' '}
                <code className="rounded bg-slate-800 px-1 text-[11px] text-slate-200">
                  launch-3way.cmd
                </code>{' '}
                anytime — it starts the server and opens the browser.
              </li>
              <li>Keep the black console window open while you chat.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Smartphone className="h-3.5 w-3.5" />
              3. Android &amp; iPhone (home screen)
            </h3>
            <p className="text-slate-400">
              Phones cannot run the Node server themselves. Use a{' '}
              <strong className="text-slate-200">hosted URL</strong> (e.g.
              Netlify) or open your PC server on the same Wi‑Fi, then install as
              an app:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-slate-400">
              <li>
                <strong className="text-slate-200">Android (Chrome):</strong>{' '}
                open the site → menu ⋮ → <em>Install app</em> or{' '}
                <em>Add to Home screen</em>.
              </li>
              <li>
                <strong className="text-slate-200">iPhone (Safari):</strong> open
                the site → Share → <em>Add to Home Screen</em>.
              </li>
              <li>
                Same Wi‑Fi as your PC: open{' '}
                <code className="rounded bg-slate-800 px-1 text-[11px] text-slate-200">
                  http://YOUR-PC-IP:3000
                </code>{' '}
                in the phone browser (firewall must allow it), then add to home
                screen. The PC launcher must stay running.
              </li>
            </ul>
            <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
              Home-screen icons open the web app; they do not replace Node on a
              PC.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <MessagesSquare className="h-3.5 w-3.5" />
              4. Using the room
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-slate-400">
              <li>
                <Paperclip className="mr-1 inline h-3.5 w-3.5" />
                Attach files to extract text into the room.
              </li>
              <li>Invite asks models to speak again without retyping.</li>
              <li>
                <Download className="mr-1 inline h-3.5 w-3.5" />
                Export JSON to back up a conversation.
              </li>
            </ul>
          </section>

          {isSupportEnabled() && (
            <section className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                <Coffee className="h-3.5 w-3.5" />
                Support
              </h3>
              <p className="text-slate-400">
                3Way Lite is free to use with your own API keys. If it helps you,
                you can optionally {SUPPORT_LABEL.toLowerCase()} — no account
                required in the app, and nothing is locked behind payment.
              </p>
              <a
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-300 hover:text-amber-200"
              >
                <Coffee className="h-4 w-4" />
                {SUPPORT_LABEL}
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
