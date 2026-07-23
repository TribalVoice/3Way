'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Settings,
  Trash2,
  Bot,
  MessageSquare,
  Loader2,
  Users,
  MessagesSquare,
  Paperclip,
  Download,
  Upload,
  FileDown,
  CircleHelp,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SettingsModal } from '@/components/SettingsModal';
import { MessageCard } from '@/components/MessageCard';
import { GettingStarted } from '@/components/GettingStarted';
import {
  Settings as SettingsType,
  Room,
  SpeakTarget,
  Turn,
} from '@/lib/types';
import {
  createEmptyRoom,
  createTurn,
  appendTurn,
  updateTurn,
  hasPendingTurns,
  buildProviderMessages,
  systemPromptFor,
} from '@/lib/room';
import {
  loadRoom,
  saveRoom,
  loadSettings,
  saveSettings,
  clearLegacyTree,
} from '@/lib/storage';
import { extractTextFromFile } from '@/lib/extractFile';
import {
  exportRoomAsJson,
  exportRoomAsMarkdown,
  parseRoomImport,
} from '@/lib/exportRoom';
import { streamProvider } from '@/lib/streamChat';
import { cn } from '@/lib/utils';

export default function Home() {
  const [room, setRoom] = useState<Room>(createEmptyRoom());
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [input, setInput] = useState('');
  const [speakTarget, setSpeakTarget] = useState<SpeakTarget>('both');
  const [isBusy, setIsBusy] = useState(false);
  const [attachBusy, setAttachBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef(room);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    const loadedRoom = loadRoom();
    setRoom(loadedRoom);
    setSettings(loadSettings());
    clearLegacyTree();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveRoom(room);
  }, [room, hydrated]);

  const streamLens = room.turns
    .filter((t) => t.status === 'streaming' || t.status === 'pending')
    .map((t) => t.content.length)
    .join(',');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.turns.length, isBusy, streamLens]);

  const handleSaveSettings = (s: SettingsType) => {
    setSettings(s);
    saveSettings(s);
  };

  const resolveSpeakers = (
    target: SpeakTarget,
    current: SettingsType
  ): Array<'gemini' | 'grok'> => {
    const speakers: Array<'gemini' | 'grok'> = [];
    if (
      (target === 'both' || target === 'gemini') &&
      current.geminiApiKey.trim()
    ) {
      speakers.push('gemini');
    }
    if ((target === 'both' || target === 'grok') && current.grokApiKey.trim()) {
      speakers.push('grok');
    }
    return speakers;
  };

  const runSpeakers = async (
    baseRoom: Room,
    speakers: Array<'gemini' | 'grok'>,
    current: SettingsType
  ) => {
    if (speakers.length === 0) return baseRoom;

    let working = baseRoom;
    const pending: { speaker: 'gemini' | 'grok'; turn: Turn }[] = [];

    for (const speaker of speakers) {
      const modelName =
        speaker === 'gemini' ? current.geminiModel : current.grokModel;
      const turn = createTurn(speaker, '', {
        modelName,
        status: 'pending',
      });
      pending.push({ speaker, turn });
      working = appendTurn(working, turn);
    }
    setRoom(working);
    roomRef.current = working;

    const pendingIds = new Set(pending.map((p) => p.turn.id));

    const tasks = pending.map(({ speaker, turn }) => {
      const apiKey =
        speaker === 'gemini' ? current.geminiApiKey : current.grokApiKey;
      const model =
        speaker === 'gemini' ? current.geminiModel : current.grokModel;
      const messages = buildProviderMessages(working, speaker, pendingIds);

      return streamProvider({
        provider: speaker,
        apiKey,
        model,
        messages,
        systemPrompt: systemPromptFor(speaker),
        handlers: {
          onToken: (chunk) => {
            setRoom((r) => {
              const existing = r.turns.find((t) => t.id === turn.id);
              const nextContent = (existing?.content || '') + chunk;
              const next = updateTurn(r, turn.id, {
                content: nextContent,
                status: 'streaming',
                error: undefined,
              });
              roomRef.current = next;
              return next;
            });
          },
        },
      })
        .then((content) => {
          setRoom((r) => {
            const next = updateTurn(r, turn.id, {
              content,
              status: 'complete',
              error: undefined,
            });
            roomRef.current = next;
            return next;
          });
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setRoom((r) => {
            const next = updateTurn(r, turn.id, {
              status: 'error',
              error: msg,
            });
            roomRef.current = next;
            return next;
          });
        });
    });

    await Promise.allSettled(tasks);
    return roomRef.current;
  };

  const handleSend = async () => {
    if (!input.trim() || isBusy) return;

    const currentSettings = settings;
    if (!currentSettings) {
      setSettingsOpen(true);
      return;
    }

    const speakers = resolveSpeakers(speakTarget, currentSettings);
    if (speakers.length === 0) {
      setSettingsOpen(true);
      return;
    }

    const userContent = input.trim();
    setInput('');
    setIsBusy(true);

    let nextRoom = appendTurn(
      roomRef.current,
      createTurn('user', userContent)
    );
    setRoom(nextRoom);
    roomRef.current = nextRoom;

    try {
      await runSpeakers(nextRoom, speakers, currentSettings);
    } finally {
      setIsBusy(false);
      inputRef.current?.focus();
    }
  };

  const handleInvite = async (target: SpeakTarget) => {
    if (isBusy) return;
    const currentSettings = settings;
    if (!currentSettings) {
      setSettingsOpen(true);
      return;
    }

    if (roomRef.current.turns.length === 0) return;

    const speakers = resolveSpeakers(target, currentSettings);
    if (speakers.length === 0) {
      setSettingsOpen(true);
      return;
    }

    setIsBusy(true);
    try {
      let base = roomRef.current;
      const hasUser = base.turns.some(
        (t) =>
          (t.speaker === 'user' || t.kind === 'document') &&
          t.status === 'complete'
      );
      if (!hasUser) {
        setIsBusy(false);
        return;
      }

      const inviteNote =
        target === 'both'
          ? 'Both of you: please respond to the conversation so far (including each other if relevant).'
          : target === 'gemini'
            ? 'Gemini: please respond to the conversation so far.'
            : 'Grok: please respond to the conversation so far.';

      base = appendTurn(base, createTurn('user', inviteNote));
      setRoom(base);
      roomRef.current = base;

      await runSpeakers(base, speakers, currentSettings);
    } finally {
      setIsBusy(false);
      inputRef.current?.focus();
    }
  };

  const handleRetry = async (turnId: string) => {
    if (!settings || isBusy) return;
    const turn = roomRef.current.turns.find((t) => t.id === turnId);
    if (!turn || (turn.speaker !== 'gemini' && turn.speaker !== 'grok')) return;

    const speaker = turn.speaker;
    const apiKey =
      speaker === 'gemini' ? settings.geminiApiKey : settings.grokApiKey;
    const model =
      turn.modelName ||
      (speaker === 'gemini' ? settings.geminiModel : settings.grokModel);

    if (!apiKey.trim()) {
      setSettingsOpen(true);
      return;
    }

    setIsBusy(true);
    setRoom((r) => {
      const next = updateTurn(r, turnId, {
        status: 'pending',
        error: undefined,
        content: '',
      });
      roomRef.current = next;
      return next;
    });

    try {
      const messages = buildProviderMessages(
        roomRef.current,
        speaker,
        new Set([turnId])
      );
      const content = await streamProvider({
        provider: speaker,
        apiKey,
        model,
        messages,
        systemPrompt: systemPromptFor(speaker),
        handlers: {
          onToken: (chunk) => {
            setRoom((r) => {
              const existing = r.turns.find((t) => t.id === turnId);
              const nextContent = (existing?.content || '') + chunk;
              const next = updateTurn(r, turnId, {
                content: nextContent,
                status: 'streaming',
              });
              roomRef.current = next;
              return next;
            });
          },
        },
      });
      setRoom((r) => {
        const next = updateTurn(r, turnId, {
          content,
          status: 'complete',
          error: undefined,
        });
        roomRef.current = next;
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setRoom((r) => {
        const next = updateTurn(r, turnId, { status: 'error', error: msg });
        roomRef.current = next;
        return next;
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || attachBusy || isBusy) return;
    setAttachBusy(true);
    try {
      let working = roomRef.current;
      for (const file of Array.from(files)) {
        try {
          const doc = await extractTextFromFile(file);
          const turn = createTurn('user', doc.text, {
            kind: 'document',
            fileName: doc.fileName,
            truncated: doc.truncated,
            status: 'complete',
          });
          working = appendTurn(working, turn);
          setRoom(working);
          roomRef.current = working;
          showToast(
            doc.truncated
              ? `Attached ${doc.fileName} (truncated)`
              : `Attached ${doc.fileName}`
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Attach failed';
          showToast(`${file.name}: ${msg}`);
        }
      }
    } finally {
      setAttachBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      inputRef.current?.focus();
    }
  };

  const handleExportJson = () => {
    if (room.turns.length === 0) {
      showToast('Nothing to export yet.');
      return;
    }
    exportRoomAsJson(room);
    showToast('Exported JSON');
  };

  const handleExportMd = () => {
    if (room.turns.length === 0) {
      showToast('Nothing to export yet.');
      return;
    }
    exportRoomAsMarkdown(room);
    showToast('Exported Markdown');
  };

  const handleImportFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseRoomImport(text);
      if (
        roomRef.current.turns.length > 0 &&
        !window.confirm(
          'Replace the current room with the imported transcript?'
        )
      ) {
        return;
      }
      setRoom(imported);
      roomRef.current = imported;
      showToast(`Imported ${imported.turns.length} turns`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      showToast(msg);
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (isBusy) return;
    if (room.turns.length === 0) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Clear the entire room transcript?')
    ) {
      return;
    }
    const empty = createEmptyRoom();
    setRoom(empty);
    roomRef.current = empty;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const geminiReady = Boolean(settings?.geminiApiKey?.trim());
  const grokReady = Boolean(settings?.grokApiKey?.trim());
  const hasChat = room.turns.length > 0;
  const pending = hasPendingTurns(room) || isBusy;

  const renderTranscript = () => {
    const nodes: React.ReactNode[] = [];
    let i = 0;
    const turns = room.turns;

    while (i < turns.length) {
      const t = turns[i];
      if (t.speaker === 'user' || t.kind === 'document') {
        nodes.push(
          <MessageCard key={t.id} turn={t} onRetry={handleRetry} />
        );
        i += 1;
        continue;
      }

      const run: Turn[] = [];
      while (
        i < turns.length &&
        turns[i].speaker !== 'user' &&
        turns[i].kind !== 'document'
      ) {
        run.push(turns[i]);
        i += 1;
      }

      if (run.length === 2 && run[0].speaker !== run[1].speaker) {
        const ordered = [...run].sort((a, b) => {
          if (a.speaker === 'gemini') return -1;
          if (b.speaker === 'gemini') return 1;
          return 0;
        });
        nodes.push(
          <div
            key={`pair-${run[0].id}`}
            className="grid gap-3 md:grid-cols-2"
          >
            {ordered.map((ai) => (
              <MessageCard key={ai.id} turn={ai} onRetry={handleRetry} />
            ))}
          </div>
        );
      } else {
        for (const ai of run) {
          nodes.push(
            <MessageCard key={ai.id} turn={ai} onRetry={handleRetry} />
          );
        }
      }
    }

    return nodes;
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-slate-600 shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">
              3Way Lite
            </h1>
            <p className="text-[10px] text-slate-500">
              You · Gemini · Grok · files · stream · export
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium',
                geminiReady
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-slate-800 text-slate-500'
              )}
            >
              <Bot className="h-3 w-3" />
              Gemini {geminiReady ? '✓' : '—'}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium',
                grokReady
                  ? 'bg-slate-200/15 text-slate-300'
                  : 'bg-slate-800 text-slate-500'
              )}
            >
              <Bot className="h-3 w-3" />
              Grok {grokReady ? '✓' : '—'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportJson}
            disabled={!hasChat}
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Export JSON"
            title="Export room as JSON"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportMd}
            disabled={!hasChat}
            className="hidden text-slate-400 hover:bg-slate-800 hover:text-slate-200 sm:inline-flex"
            aria-label="Export Markdown"
            title="Export room as Markdown"
          >
            <FileDown className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => importInputRef.current?.click()}
            disabled={pending}
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Import room"
            title="Import room JSON"
          >
            <Upload className="h-5 w-5" />
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void handleImportFile(e.target.files)}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHelpOpen(true)}
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Getting started"
            title="Getting started"
          >
            <CircleHelp className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          {hasChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={pending}
              className="text-slate-400 hover:bg-slate-800 hover:text-red-400"
              aria-label="Clear room"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {!hasChat ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-slate-700">
                <MessageSquare className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-200">
                Three-way room
              </h2>
              <p className="mb-5 max-w-md text-sm text-slate-500">
                You, Gemini, and Grok share one transcript. Attach docs as text,
                stream replies, and export backups. You control the pace.
              </p>

              <div className="mb-6 w-full max-w-md space-y-3 text-left">
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    First-time setup
                  </p>
                  <ol className="space-y-1.5 text-xs text-slate-500">
                    <li>1. Open Settings and paste Gemini and/or Grok API keys</li>
                    <li>2. Optional: paperclip to attach PDF or text files</li>
                    <li>3. Choose Both / Gemini / Grok, then send a message</li>
                    <li>4. Export JSON anytime to back up the room</li>
                  </ol>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                      <Monitor className="h-3.5 w-3.5 text-sky-400" />
                      Windows desktop
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      After Node.js is installed, run{' '}
                      <span className="text-slate-400">create-desktop-shortcut.cmd</span>{' '}
                      once, then double-click{' '}
                      <span className="text-slate-400">3Way Lite</span> on the
                      Desktop. Or use{' '}
                      <span className="text-slate-400">launch-3way.cmd</span>.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                      <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                      Android &amp; iPhone
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Open this site in Chrome or Safari, then{' '}
                      <span className="text-slate-400">Add to Home Screen</span>{' '}
                      / Install app. Needs a hosted URL or your PC server on the
                      same Wi‑Fi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {!geminiReady && !grokReady && (
                  <Button
                    onClick={() => setSettingsOpen(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure API Keys
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setHelpOpen(true)}
                  className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                >
                  <CircleHelp className="h-4 w-4 mr-2" />
                  Getting started
                </Button>
              </div>
            </div>
          ) : (
            renderTranscript()
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 mr-1">
              Next reply
            </span>
            {(
              [
                { id: 'both' as const, label: 'Both' },
                { id: 'gemini' as const, label: 'Gemini' },
                { id: 'grok' as const, label: 'Grok' },
              ] as const
            ).map((opt) => {
              const disabled =
                (opt.id === 'gemini' && !geminiReady) ||
                (opt.id === 'grok' && !grokReady) ||
                (opt.id === 'both' && !geminiReady && !grokReady);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled || pending}
                  onClick={() => setSpeakTarget(opt.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40',
                    speakTarget === opt.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}

            {hasChat && (
              <>
                <span className="mx-1 hidden h-4 w-px bg-slate-700 sm:inline-block" />
                <button
                  type="button"
                  disabled={pending || (!geminiReady && !grokReady)}
                  onClick={() => void handleInvite(speakTarget)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-40"
                  title="Ask the selected model(s) to speak again without typing a new message"
                >
                  <MessagesSquare className="h-3.5 w-3.5" />
                  Invite {speakTarget === 'both' ? 'both' : speakTarget}
                </button>
              </>
            )}
          </div>

          <div className="relative flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-800/50 p-2 focus-within:border-slate-600 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.markdown,.csv,.json,.pdf,.ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.yml,.yaml,.html,.css,.log,.sql,.xml,.toml"
              className="hidden"
              onChange={(e) => void handleAttachFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending || attachBusy}
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 shrink-0 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
              aria-label="Attach file"
              title="Attach file (text extracted)"
            >
              {attachBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
            </Button>
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                speakTarget === 'both'
                  ? 'Message the room — both AIs stream replies…'
                  : speakTarget === 'gemini'
                    ? 'Message the room — Gemini streams…'
                    : 'Message the room — Grok streams…'
              }
              disabled={pending}
              className="min-h-[44px] max-h-[160px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
            <Button
              onClick={() => void handleSend()}
              disabled={!input.trim() || pending}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40"
              aria-label="Send"
            >
              {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-center text-[10px] text-slate-600">
            Paperclip attaches text/PDF · replies stream live · download exports
            the room
          </p>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-200 shadow-lg">
          {toast}
        </div>
      )}

      {settings && (
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}

      <GettingStarted
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  );
}
