'use client';

import { Bot, Check, GitBranch, Loader2, RotateCcw, User } from 'lucide-react';
import { ChatNode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageCardProps {
  node: ChatNode;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRetry?: (id: string) => void;
  variant?: 'user' | 'gemini' | 'grok';
}

export function MessageCard({
  node,
  isActive,
  onSelect,
  onRetry,
  variant,
}: MessageCardProps) {
  const role = variant ?? node.role;

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-sky-600/90 px-4 py-3 text-slate-50 shadow-lg shadow-sky-900/20">
          <div className="mb-1 flex items-center justify-end gap-1.5">
            <span className="text-xs font-medium text-sky-200">You</span>
            <User className="h-3.5 w-3.5 text-sky-200" />
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {node.content}
          </p>
        </div>
      </div>
    );
  }

  const isGemini = role === 'gemini';
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
  const accentSelect = isGemini
    ? 'bg-blue-600 hover:bg-blue-500 text-white'
    : 'bg-slate-200 hover:bg-white text-slate-900';
  const accentActive = isGemini
    ? 'ring-2 ring-blue-500/50 bg-blue-500/10'
    : 'ring-2 ring-slate-400/50 bg-slate-300/10';

  return (
    <div
      className={cn(
        'rounded-2xl rounded-tl-sm border bg-gradient-to-br p-4 shadow-lg transition-all',
        accentBg,
        accentBorder,
        isActive && accentActive
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
          <span className={cn('text-sm font-semibold', accentLabel)}>
            {isGemini ? 'Gemini' : 'Grok'}
          </span>
          <span className="text-[10px] text-slate-500">{node.modelName}</span>
        </div>
        {isActive && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <GitBranch className="h-3 w-3" />
            Main Thread
          </span>
        )}
      </div>

      {node.status === 'pending' ? (
        <div className="flex items-center gap-2 py-6 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generating response...</span>
        </div>
      ) : node.status === 'error' ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">{node.error}</p>
          </div>
          {onRetry && (
            <button
              onClick={() => onRetry(node.id)}
              className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
          {node.content}
        </p>
      )}

      {node.status !== 'pending' && node.status !== 'error' && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => onSelect(node.id)}
            disabled={isActive}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-default disabled:opacity-70',
              isActive
                ? 'bg-emerald-500/15 text-emerald-400'
                : accentSelect
            )}
          >
            {isActive ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Selected
              </>
            ) : (
              <>
                <GitBranch className="h-3.5 w-3.5" />
                Select as Main Thread
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
