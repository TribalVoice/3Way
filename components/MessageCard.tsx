'use client';

import { Bot, FileText, Loader2, RotateCcw, User } from 'lucide-react';
import { Turn } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageCardProps {
  turn: Turn;
  onRetry?: (id: string) => void;
}

export function MessageCard({ turn, onRetry }: MessageCardProps) {
  if (turn.kind === 'document') {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/20">
            <FileText className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-amber-300">
              Document
            </span>
            <span className="truncate text-[10px] text-slate-500">
              {turn.fileName || 'file'}
              {turn.truncated ? ' · truncated' : ''}
            </span>
          </div>
        </div>
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-300">
          {turn.content}
        </pre>
      </div>
    );
  }

  if (turn.speaker === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-sky-600/90 px-4 py-3 text-slate-50 shadow-lg shadow-sky-900/20">
          <div className="mb-1 flex items-center justify-end gap-1.5">
            <span className="text-xs font-medium text-sky-200">You</span>
            <User className="h-3.5 w-3.5 text-sky-200" />
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {turn.content}
          </p>
        </div>
      </div>
    );
  }

  const isGemini = turn.speaker === 'gemini';
  const accentBg = isGemini
    ? 'from-blue-500/10 to-purple-500/10'
    : 'from-slate-700/30 to-slate-800/30';
  const accentBorder = isGemini
    ? 'border-blue-500/30'
    : 'border-slate-600/40';
  const accentIcon = isGemini
    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
    : 'bg-slate-700 border border-slate-600';
  const accentLabel = isGemini ? 'text-blue-400' : 'text-slate-300';
  const isStreaming = turn.status === 'streaming' || turn.status === 'pending';

  return (
    <div
      className={cn(
        'rounded-2xl rounded-tl-sm border bg-gradient-to-br p-4 shadow-lg',
        accentBg,
        accentBorder
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            accentIcon
          )}
        >
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <span className={accentLabel}>
              {isGemini ? 'Gemini' : 'Grok'}
            </span>
            {isStreaming && (
              <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            )}
          </span>
          {turn.modelName && (
            <span className="text-[10px] text-slate-500">{turn.modelName}</span>
          )}
        </div>
      </div>

      {turn.status === 'pending' && !turn.content ? (
        <div className="flex items-center gap-2 py-4 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Starting…</span>
        </div>
      ) : turn.status === 'error' ? (
        <div className="space-y-3">
          {turn.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300 opacity-70">
              {turn.content}
            </p>
          ) : null}
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">
              {turn.error || 'Request failed.'}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(turn.id)}
              className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
          {turn.content}
          {isStreaming && turn.content ? (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-slate-400 align-middle" />
          ) : null}
        </p>
      )}
    </div>
  );
}
