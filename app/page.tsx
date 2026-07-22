'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Settings,
  Trash2,
  GitBranch,
  Bot,
  MessageSquare,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsModal } from '@/components/SettingsModal';
import { MessageCard } from '@/components/MessageCard';
import { Settings as SettingsType, ChatNode, ChatTree, Role } from '@/lib/types';
import {
  createEmptyTree,
  createNode,
  addChildNode,
  updateNode,
  setActiveNode,
  getActiveThread,
  getConversationContext,
  getChildren,
  getPathToRoot,
  getNodeDepth,
} from '@/lib/chatTree';
import { loadTree, saveTree, loadSettings, saveSettings } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface PendingResponse {
  nodeId: string;
  role: Role;
}

export default function Home() {
  const [tree, setTree] = useState<ChatTree>(createEmptyTree());
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const loaded = loadTree();
    if (loaded && loaded.nodes && Object.keys(loaded.nodes).length > 0) {
      setTree(loaded);
    }
    setSettings(loadSettings());
  }, []);

  // Persist tree
  useEffect(() => {
    if (settings !== null) {
      saveTree(tree);
    }
  }, [tree, settings]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tree]);

  const handleSaveSettings = (s: SettingsType) => {
    setSettings(s);
    saveSettings(s);
  };

  const callProvider = async (
    provider: 'gemini' | 'grok',
    apiKey: string,
    model: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model, messages }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data.content as string;
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const currentSettings = settings;
    if (!currentSettings) {
      setSettingsOpen(true);
      return;
    }

    if (!currentSettings.geminiApiKey && !currentSettings.grokApiKey) {
      setSettingsOpen(true);
      return;
    }

    const userContent = input.trim();
    setInput('');
    setIsSending(true);

    // Determine parent: the active node, or null if no tree yet
    const parentId = tree.activeNodeId;

    // Create user node
    const userNode = createNode('user', userContent, parentId, 'user');
    let newTree = addChildNode(tree, userNode);
    newTree = setActiveNode(newTree, userNode.id);
    setTree(newTree);

    // Build conversation context from the path to the user node
    const context = getConversationContext(newTree, userNode.id);

    // Create pending Gemini and Grok nodes (children of user node)
    const pendingNodes: { gemini?: ChatNode; grok?: ChatNode } = {};
    let treeWithPending = newTree;

    if (currentSettings.geminiApiKey) {
      const gNode = createNode(
        'gemini',
        '',
        userNode.id,
        currentSettings.geminiModel,
        'pending'
      );
      pendingNodes.gemini = gNode;
      treeWithPending = addChildNode(treeWithPending, gNode);
    }
    if (currentSettings.grokApiKey) {
      const xNode = createNode(
        'grok',
        '',
        userNode.id,
        currentSettings.grokModel,
        'pending'
      );
      pendingNodes.grok = xNode;
      treeWithPending = addChildNode(treeWithPending, xNode);
    }

    setTree(treeWithPending);

    // Fire both requests in parallel
    const tasks: Promise<void>[] = [];

    if (pendingNodes.gemini) {
      const gId = pendingNodes.gemini.id;
      tasks.push(
        callProvider(
          'gemini',
          currentSettings.geminiApiKey,
          currentSettings.geminiModel,
          context
        )
          .then((content) => {
            setTree((t) =>
              updateNode(t, gId, { content, status: 'complete' })
            );
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setTree((t) =>
              updateNode(t, gId, { status: 'error', error: msg })
            );
          })
      );
    }

    if (pendingNodes.grok) {
      const xId = pendingNodes.grok.id;
      tasks.push(
        callProvider(
          'grok',
          currentSettings.grokApiKey,
          currentSettings.grokModel,
          context
        )
          .then((content) => {
            setTree((t) =>
              updateNode(t, xId, { content, status: 'complete' })
            );
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setTree((t) =>
              updateNode(t, xId, { status: 'error', error: msg })
            );
          })
      );
    }

    await Promise.allSettled(tasks);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleSelectBranch = (nodeId: string) => {
    setTree((t) => setActiveNode(t, nodeId));
  };

  const handleRetry = async (nodeId: string) => {
    if (!settings) return;
    const node = tree.nodes[nodeId];
    if (!node) return;

    const provider = node.role as 'gemini' | 'grok';
    const apiKey =
      provider === 'gemini' ? settings.geminiApiKey : settings.grokApiKey;
    const model = node.modelName;

    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

    setTree((t) => updateNode(t, nodeId, { status: 'pending', error: undefined }));

    const context = getConversationContext(tree, node.parentId ?? nodeId);

    try {
      const content = await callProvider(provider, apiKey, model, context);
      setTree((t) => updateNode(t, nodeId, { content, status: 'complete' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setTree((t) => updateNode(t, nodeId, { status: 'error', error: msg }));
    }
  };

  const handleClearChat = () => {
    setTree(createEmptyTree());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render the tree as a linear thread following the active path,
  // then show sibling branches inline where they diverge.
  const renderThread = useCallback((): React.ReactNode => {
    if (!tree.activeNodeId || !tree.nodes[tree.activeNodeId]) {
      return null;
    }

    const activePath = getPathToRoot(tree, tree.activeNodeId);
    const pathIds = new Set(activePath.map((n) => n.id));

    return activePath.map((node, idx) => {
      const siblings =
        node.parentId !== null
          ? getChildren(tree, node.parentId).filter((s) => s.id !== node.id)
          : [];
      const hasSiblings = siblings.length > 0;
      const depth = getNodeDepth(tree, node.id);

      return (
        <div key={node.id} className="space-y-3">
          {/* Show sibling branches that diverge */}
          {hasSiblings && (
            <div className="ml-4 border-l border-slate-700/50 pl-3 space-y-3">
              {siblings.map((sib) => (
                <div key={sib.id} className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <GitBranch className="h-3 w-3" />
                    <span>Alternate branch</span>
                  </div>
                  <MessageCard
                    node={sib}
                    isActive={false}
                    onSelect={handleSelectBranch}
                    onRetry={handleRetry}
                  />
                </div>
              ))}
            </div>
          )}

          <MessageCard
            node={node}
            isActive={node.id === tree.activeNodeId && node.role !== 'user'}
            onSelect={handleSelectBranch}
            onRetry={handleRetry}
          />
        </div>
      );
    });
  }, [tree]);

  const hasChat =
    tree.activeNodeId && tree.nodes[tree.activeNodeId] !== undefined;
  const geminiReady = settings?.geminiApiKey?.trim();
  const grokReady = settings?.grokApiKey?.trim();

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-slate-600 shadow-lg">
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">
              BranchChat
            </h1>
            <p className="text-[10px] text-slate-500">
              Gemini × Grok · 3-Way Branching
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
          >
            <Settings className="h-5 w-5" />
          </Button>
          {hasChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="text-slate-400 hover:bg-slate-800 hover:text-red-400"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {!hasChat ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-slate-700">
                <MessageSquare className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-200">
                Start a 3-Way Conversation
              </h2>
              <p className="mb-6 max-w-md text-sm text-slate-500">
                Type a message below. It will be sent to both Gemini and Grok in
                parallel. Select either response as the main thread to continue
                the conversation from that branch.
              </p>
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
            renderThread()
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <div className="relative flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-800/50 p-2 focus-within:border-slate-600 transition-colors">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message and press Enter to send to both AIs..."
              disabled={isSending}
              className="min-h-[44px] max-h-[160px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-600">
            Enter to send · Shift+Enter for newline · Responses run in parallel
          </p>
        </div>
      </div>

      {/* Settings modal */}
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
