'use client';

import { useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  FileText,
  Loader2,
  RotateCcw,
  User,
} from 'lucide-react';
import { Turn } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageCardProps {
  turn: Turn;
  onRetry?: (id: string) => void;
  /** Case-insensitive substring to highlight */
  highlightQuery?: string;
  /** Emphasize when this turn is the active search hit */
  isActiveMatch?: boolean;
}

function highlightText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let start = 0;
  let idx = lower.indexOf(needle, start);
  let key = 0;
  while (idx !== -1) {
    if (idx > start) {
      parts.push(text.slice(start, idx));
    }
    parts.push(
      <mark
        key={`h-${key++}`}
        className="rounded-sm bg-amber-400/35 px-0.5 text-inherit"
      >
        {text.slice(idx, idx + needle.length)}
      </mark>
    );
    start = idx + needle.length;
    idx = lower.indexOf(needle, start);
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts.length ? parts : text;
}

function CopyButton({
  text,
  className,
  light,
}: {
  text: string;
  className?: string;
  light?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers / restricted contexts
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text.trim()}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-30',
        light
          ? 'text-sky-100/80 hover:bg-sky-500/40 hover:text-white'
          : 'text-slate-400 hover:bg-slate-700/80 hover:text-slate-100',
        className
      )}
      title={copied ? 'Copied' : 'Copy text'}
      aria-label={copied ? 'Copied' : 'Copy text'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

export function MessageCard({
  turn,
  onRetry,
  highlightQuery = '',
  isActiveMatch = false,
}: MessageCardProps) {
  const q = highlightQuery.trim();
  const body = (text: string) => (q ? highlightText(text, q) : text);

  if (turn.kind === 'document') {
    return (
      <div
        id={`turn-${turn.id}`}
        className={cn(
          'rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 shadow-lg scroll-mt-24',
          isActiveMatch && 'ring-2 ring-amber-400/70'
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/20">
            <FileText className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold text-amber-300">
              Document
            </span>
            <span className="truncate text-[10px] text-slate-500">
              {turn.fileName || 'file'}
              {turn.truncated ? ' · truncated' : ''}
            </span>
          </div>
          <CopyButton text={turn.content} />
        </div>
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-300">
          {body(turn.content)}
        </pre>
      </div>
    );
  }

  if (turn.speaker === 'user') {
    return (
      <div
        id={`turn-${turn.id}`}
        className={cn('flex justify-end scroll-mt-24', isActiveMatch && '')}
      >
        <div
          className={cn(
            'max-w-[85%] rounded-2xl rounded-br-sm bg-sky-600/90 px-4 py-3 text-slate-50 shadow-lg shadow-sky-900/20',
            isActiveMatch && 'ring-2 ring-amber-300/80'
          )}
        >
          <div className="mb-1 flex items-center justify-end gap-1.5">
            <CopyButton text={turn.content} light />
            <span className="text-xs font-medium text-sky-200">You</span>
            <User className="h-3.5 w-3.5 text-sky-200" />
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {body(turn.content)}
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
  const copyText =
    turn.status === 'error' && turn.error
      ? [turn.content, turn.error].filter(Boolean).join('\n\n')
      : turn.content;

  return (
    <div
      id={`turn-${turn.id}`}
      className={cn(
        'rounded-2xl rounded-tl-sm border bg-gradient-to-br p-4 shadow-lg scroll-mt-24',
        accentBg,
        accentBorder,
        isActiveMatch && 'ring-2 ring-amber-400/70'
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
        <div className="flex min-w-0 flex-1 flex-col">
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
        {!isStreaming && turn.content ? (
          <CopyButton text={copyText} />
        ) : null}
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
              {body(turn.content)}
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
          {body(turn.content)}
          {isStreaming && turn.content ? (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-slate-400 align-middle" />
          ) : null}
        </p>
      )}
    </div>
  );
}
