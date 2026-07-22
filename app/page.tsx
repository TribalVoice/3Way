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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SettingsModal } from '@/components/SettingsModal';
import { MessageCard } from '@/components/MessageCard';
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
import { cn } from '@/lib/utils';

export default function Home() {
  const [room, setRoom] = useState<Room>(createEmptyRoom());
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [input, setInput] = useState('');
  const [speakTarget, setSpeakTarget] = useState<SpeakTarget>('both');
  const [isBusy, setIsBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const roomRef = useRef(room);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.turns.length, isBusy]);

  const handleSaveSettings = (s: SettingsType) => {
    setSettings(s);
    saveSettings(s);
  };

  const callProvider = async (
    provider: 'gemini' | 'grok',
    apiKey: string,
    model: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey,
        model,
        messages,
        systemPrompt,
      }),
    });
    let data: { content?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      throw new Error(`Request failed (${res.status}).`);
    }
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    if (!data.content) {
      throw new Error('Empty response from server.');
    }
    return data.content;
  };

  const ensureKeys = (
    target: SpeakTarget,
    current: SettingsType
  ): { ok: true } | { ok: false; reason: string } => {
    const needGemini = target === 'both' || target === 'gemini';
    const needGrok = target === 'both' || target === 'grok';
    if (needGemini && !current.geminiApiKey.trim()) {
      return { ok: false, reason: 'gemini' };
    }
    if (needGrok && !current.grokApiKey.trim()) {
      return { ok: false, reason: 'grok' };
    }
    if (target === 'both') {
      if (!current.geminiApiKey.trim() && !current.grokApiKey.trim()) {
        return { ok: false, reason: 'none' };
      }
    }
    return { ok: true };
  };

  /** Resolve who will actually speak given keys + target */
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

    // Create pending turns first
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

    // Exclude all pending ids from context so each model sees the same prior room
    const pendingIds = new Set(pending.map((p) => p.turn.id));

    const tasks = pending.map(({ speaker, turn }) => {
      const apiKey =
        speaker === 'gemini' ? current.geminiApiKey : current.grokApiKey;
      const model =
        speaker === 'gemini' ? current.geminiModel : current.grokModel;
      // Snapshot room without any of this batch's pending turns
      const messages = buildProviderMessages(working, speaker, pendingIds);

      return callProvider(
        speaker,
        apiKey,
        model,
        messages,
        systemPromptFor(speaker)
      )
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

    // For "both", allow partial if only one key set
    if (speakTarget === 'gemini' || speakTarget === 'grok') {
      const check = ensureKeys(speakTarget, currentSettings);
      if (!check.ok) {
        setSettingsOpen(true);
        return;
      }
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

  /** Ask models to speak again without a new user message (continue / react) */
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
      // Nudge: if last turns were already AI, still allow re-invite by appending
      // a synthetic user cue only when the room would otherwise end mid-AI with no user prompt.
      let base = roomRef.current;
      const hasUser = base.turns.some(
        (t) => t.speaker === 'user' && t.status === 'complete'
      );
      if (!hasUser) {
        setIsBusy(false);
        return;
      }

      // Add a brief user-visible system-style note only when inviting cross-talk
      // without new user text? Prefer silent invite: inject internal cue in messages only.
      // For transparency, add a small "progress" user system line:
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
      const content = await callProvider(
        speaker,
        apiKey,
        model,
        messages,
        systemPromptFor(speaker)
      );
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

  // Group consecutive AI replies for side-by-side layout when both spoke
  const renderTranscript = () => {
    const nodes: React.ReactNode[] = [];
    let i = 0;
    const turns = room.turns;

    while (i < turns.length) {
      const t = turns[i];
      if (t.speaker === 'user') {
        nodes.push(
          <MessageCard key={t.id} turn={t} onRetry={handleRetry} />
        );
        i += 1;
        continue;
      }

      const run: Turn[] = [];
      while (i < turns.length && turns[i].speaker !== 'user') {
        run.push(turns[i]);
        i += 1;
      }

      if (run.length === 2 && run[0].speaker !== run[1].speaker) {
        // Prefer Gemini left, Grok right when both present
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
              You · Gemini · Grok · you control the pace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-slate-700">
                <MessageSquare className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-200">
                Three-way room
              </h2>
              <p className="mb-4 max-w-md text-sm text-slate-500">
                You, Gemini, and Grok share one transcript. You decide who
                speaks next. Nothing runs until you send or invite a reply.
              </p>
              <ol className="mb-6 max-w-sm space-y-1.5 text-left text-xs text-slate-500">
                <li>1. Add API keys in Settings</li>
                <li>2. Choose Both / Gemini / Grok</li>
                <li>3. Send a message — they reply in the shared room</li>
                <li>4. Use Invite to pull more replies without retyping</li>
              </ol>
              {!geminiReady && !grokReady && (
                <Button
                  onClick={() => setSettingsOpen(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure API Keys
                </Button>
              )}
            </div>
          ) : (
            renderTranscript()
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Progress controls + composer */}
      <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl space-y-3">
          {/* Who speaks after your next message */}
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
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                speakTarget === 'both'
                  ? 'Message the room — both AIs will reply…'
                  : speakTarget === 'gemini'
                    ? 'Message the room — Gemini will reply…'
                    : 'Message the room — Grok will reply…'
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
            Enter to send · Shift+Enter newline · Invite continues the room
            without a new topic
          </p>
        </div>
      </div>

      {settings && (
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
