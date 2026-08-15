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
import { turnDisplayName } from '@/lib/providers';
import { prepareDisplayText } from '@/lib/formatMessage';
import { cn } from '@/lib/utils';

interface MessageCardProps {
  turn: Turn;
  onRetry?: (id: string) => void;
  highlightQuery?: string;
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
    if (idx > start) parts.push(text.slice(start, idx));
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

/** Light markdown + LaTeX cleanup for AI message display */
function FormattedBody({
  text,
  highlightQuery = '',
  className,
  streaming,
}: {
  text: string;
  highlightQuery?: string;
  className?: string;
  streaming?: boolean;
}) {
  const display = prepareDisplayText(text);
  const q = highlightQuery.trim();

  const renderInline = (chunk: string, keyBase: string): React.ReactNode[] => {
    // `code`, **bold**, *italic* (simple, non-nested)
    const nodes: React.ReactNode[] = [];
    const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(chunk)) !== null) {
      if (m.index > last) {
        const plain = chunk.slice(last, m.index);
        nodes.push(
          <span key={`${keyBase}-p-${i++}`}>
            {q ? highlightText(plain, q) : plain}
          </span>
        );
      }
      const token = m[0];
      if (token.startsWith('`')) {
        const inner = token.slice(1, -1);
        nodes.push(
          <code
            key={`${keyBase}-c-${i++}`}
            className="rounded bg-slate-950/50 px-1 py-0.5 font-mono text-[0.85em] text-sky-200/90"
          >
            {q ? highlightText(inner, q) : inner}
          </code>
        );
      } else if (token.startsWith('**')) {
        const inner = token.slice(2, -2);
        nodes.push(
          <strong key={`${keyBase}-b-${i++}`} className="font-semibold text-slate-100">
            {q ? highlightText(inner, q) : inner}
          </strong>
        );
      } else {
        const inner = token.slice(1, -1);
        nodes.push(
          <em key={`${keyBase}-i-${i++}`} className="italic text-slate-200">
            {q ? highlightText(inner, q) : inner}
          </em>
        );
      }
      last = m.index + token.length;
    }
    if (last < chunk.length) {
      const plain = chunk.slice(last);
      nodes.push(
        <span key={`${keyBase}-p-end`}>
          {q ? highlightText(plain, q) : plain}
        </span>
      );
    }
    return nodes;
  };

  const lines = display.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let bi = 0;

  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push(
      <ul
        key={`ul-${bi++}`}
        className="my-1.5 list-disc space-y-0.5 pl-5 text-sm"
      >
        {listBuf.map((item, li) => (
          <li key={li} className="leading-relaxed">
            {renderInline(item, `li-${bi}-${li}`)}
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      listBuf.push((bullet || numbered)![1]);
      continue;
    }
    flushList();
    if (!line.trim()) {
      blocks.push(<div key={`br-${bi++}`} className="h-2" />);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push(
        <p
          key={`h-${bi++}`}
          className="mt-2 mb-1 text-sm font-semibold text-slate-100"
        >
          {renderInline(heading[2], `h-${bi}`)}
        </p>
      );
      continue;
    }
    blocks.push(
      <p key={`p-${bi++}`} className="leading-relaxed">
        {renderInline(line, `p-${bi}`)}
      </p>
    );
  }
  flushList();

  return (
    <div
      className={cn(
        'break-words text-sm text-slate-200 space-y-0.5',
        className
      )}
    >
      {blocks}
      {streaming ? (
        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-slate-400 align-middle" />
      ) : null}
    </div>
  );
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

function seatAccent(turn: Turn): {
  bg: string;
  border: string;
  icon: string;
  label: string;
} {
  const name = turnDisplayName(turn).toLowerCase();
  if (name.includes('gemini') || turn.provider === 'gemini') {
    return {
      bg: 'from-blue-500/10 to-purple-500/10',
      border: 'border-blue-500/30',
      icon: 'bg-gradient-to-br from-blue-500 to-purple-500',
      label: 'text-blue-400',
    };
  }
  if (name.includes('claude') || turn.provider === 'claude') {
    return {
      bg: 'from-orange-500/10 to-amber-600/10',
      border: 'border-orange-500/30',
      icon: 'bg-gradient-to-br from-orange-500 to-amber-700',
      label: 'text-orange-300',
    };
  }
  if (name.includes('perplexity') || turn.provider === 'perplexity') {
    return {
      bg: 'from-teal-500/10 to-cyan-600/10',
      border: 'border-teal-500/30',
      icon: 'bg-gradient-to-br from-teal-500 to-cyan-700',
      label: 'text-teal-300',
    };
  }
  if (name.includes('nvidia') || turn.provider === 'nvidia') {
    return {
      bg: 'from-lime-500/10 to-green-700/10',
      border: 'border-lime-500/35',
      icon: 'bg-gradient-to-br from-lime-500 to-green-700',
      label: 'text-lime-300',
    };
  }
  // Grok / default
  return {
    bg: 'from-slate-700/30 to-slate-800/30',
    border: 'border-slate-600/40',
    icon: 'bg-slate-700 border border-slate-600',
    label: 'text-slate-300',
  };
}

export function MessageCard({
  turn,
  onRetry,
  highlightQuery = '',
  isActiveMatch = false,
}: MessageCardProps) {
  const q = highlightQuery.trim();
  const plainBody = (text: string) => (q ? highlightText(text, q) : text);

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
          {plainBody(turn.content)}
        </pre>
      </div>
    );
  }

  if (turn.speaker === 'user') {
    return (
      <div id={`turn-${turn.id}`} className="flex justify-end scroll-mt-24">
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
            {plainBody(turn.content)}
          </p>
        </div>
      </div>
    );
  }

  const accent = seatAccent(turn);
  const isStreaming = turn.status === 'streaming' || turn.status === 'pending';
  const name = turnDisplayName(turn);
  const copyText =
    turn.status === 'error' && turn.error
      ? [turn.content, turn.error].filter(Boolean).join('\n\n')
      : turn.content;

  return (
    <div
      id={`turn-${turn.id}`}
      className={cn(
        'rounded-2xl rounded-tl-sm border bg-gradient-to-br p-4 shadow-lg scroll-mt-24',
        accent.bg,
        accent.border,
        isActiveMatch && 'ring-2 ring-amber-400/70'
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            accent.icon
          )}
        >
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <span className={accent.label}>{name}</span>
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
            <FormattedBody
              text={turn.content}
              highlightQuery={highlightQuery}
              className="opacity-70"
            />
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
        <FormattedBody
          text={turn.content}
          highlightQuery={highlightQuery}
          streaming={isStreaming && Boolean(turn.content)}
        />
      )}
    </div>
  );
}
