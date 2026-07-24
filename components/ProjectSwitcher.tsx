'use client';

import { useState } from 'react';
import {
  ChevronDown,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { ProjectIndex, ProjectMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProjectSwitcherProps {
  index: ProjectIndex;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectSwitcher({
  index,
  disabled,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const active =
    index.projects.find((p) => p.id === index.activeId) || index.projects[0];

  const startRename = (p: ProjectMeta) => {
    setEditingId(p.id);
    setEditTitle(p.title);
  };

  const commitRename = () => {
    if (editingId) {
      onRename(editingId, editTitle);
      setEditingId(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex max-w-[160px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40 sm:max-w-[220px]'
        )}
        title={active?.title || 'Project'}
      >
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-sky-400" />
        <span className="truncate">{active?.title || 'Project'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setEditingId(null);
            }}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
            <div className="mb-1 max-h-56 space-y-0.5 overflow-y-auto">
              {index.projects.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-lg px-1.5 py-1',
                    p.id === index.activeId
                      ? 'bg-sky-600/15'
                      : 'hover:bg-slate-800'
                  )}
                >
                  {editingId === p.id ? (
                    <form
                      className="flex flex-1 items-center gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        commitRename();
                      }}
                    >
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 border-slate-600 bg-slate-800 text-xs"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-400"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate px-1.5 py-1 text-left text-xs text-slate-200"
                        onClick={() => {
                          onSelect(p.id);
                          setOpen(false);
                        }}
                      >
                        {p.title}
                        {p.id === index.activeId && (
                          <span className="ml-1 text-[10px] text-sky-400">
                            · active
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-slate-500 opacity-70 hover:bg-slate-700 hover:text-slate-200"
                        title="Rename"
                        onClick={() => startRename(p)}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-slate-500 opacity-70 hover:bg-slate-700 hover:text-red-400"
                        title="Delete project"
                        onClick={() => {
                          if (
                            window.confirm(
                              index.projects.length <= 1
                                ? 'Clear this project’s transcript?'
                                : `Delete project “${p.title}”?`
                            )
                          ) {
                            onDelete(p.id);
                            setOpen(false);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onCreate();
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-700 px-2.5 py-2 text-xs font-medium text-sky-400 hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </button>
          </div>
        </>
      )}
    </div>
  );
}
