'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound, Bot, Save, Check, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsType,
  DEFAULT_SETTINGS,
  GEMINI_MODEL_OPTIONS,
  GROK_MODEL_OPTIONS,
} from '@/lib/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onSave,
}: SettingsModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [grokApiKey, setGrokApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');
  const [grokModel, setGrokModel] = useState('');
  const [geminiCustom, setGeminiCustom] = useState(false);
  const [grokCustom, setGrokCustom] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGrokKey, setShowGrokKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setGeminiApiKey(settings.geminiApiKey);
      setGrokApiKey(settings.grokApiKey);
      const gModel = settings.geminiModel || DEFAULT_SETTINGS.geminiModel;
      const xModel = settings.grokModel || DEFAULT_SETTINGS.grokModel;
      setGeminiModel(gModel);
      setGrokModel(xModel);
      setGeminiCustom(!GEMINI_MODEL_OPTIONS.includes(gModel));
      setGrokCustom(!GROK_MODEL_OPTIONS.includes(xModel));
      setSaved(false);
    }
  }, [open, settings]);

  const handleSave = () => {
    onSave({
      geminiApiKey: geminiApiKey.trim(),
      grokApiKey: grokApiKey.trim(),
      geminiModel: geminiModel.trim() || DEFAULT_SETTINGS.geminiModel,
      grokModel: grokModel.trim() || DEFAULT_SETTINGS.grokModel,
    });
    setSaved(true);
    setTimeout(() => onOpenChange(false), 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <KeyRound className="h-5 w-5 text-sky-400" />
            API Keys & Models
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Keys stay in your browser and are sent only through this app&apos;s
            server route to Gemini or xAI. Never shared between users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-200">Gemini</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gemini-key" className="text-xs text-slate-400">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 pr-10"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gemini-model" className="text-xs text-slate-400">
                Model
              </Label>
              {geminiCustom ? (
                <Input
                  id="gemini-model"
                  type="text"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  placeholder={DEFAULT_SETTINGS.geminiModel}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600"
                />
              ) : (
                <div className="relative">
                  <select
                    id="gemini-model"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="h-10 w-full appearance-none rounded-md border border-slate-700 bg-slate-800 px-3 pr-8 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    {GEMINI_MODEL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setGeminiCustom((c) => !c)}
                className="text-[10px] text-sky-400 hover:text-sky-300"
              >
                {geminiCustom ? 'Use dropdown' : 'Enter custom model name'}
              </button>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 border border-slate-600">
                <Bot className="h-4 w-4 text-slate-300" />
              </div>
              <span className="text-sm font-semibold text-slate-200">Grok</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grok-key" className="text-xs text-slate-400">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="grok-key"
                  type={showGrokKey ? 'text' : 'password'}
                  value={grokApiKey}
                  onChange={(e) => setGrokApiKey(e.target.value)}
                  placeholder="xai-..."
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 pr-10"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowGrokKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showGrokKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grok-model" className="text-xs text-slate-400">
                Model
              </Label>
              {grokCustom ? (
                <Input
                  id="grok-model"
                  type="text"
                  value={grokModel}
                  onChange={(e) => setGrokModel(e.target.value)}
                  placeholder={DEFAULT_SETTINGS.grokModel}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600"
                />
              ) : (
                <div className="relative">
                  <select
                    id="grok-model"
                    value={grokModel}
                    onChange={(e) => setGrokModel(e.target.value)}
                    className="h-10 w-full appearance-none rounded-md border border-slate-700 bg-slate-800 px-3 pr-8 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    {GROK_MODEL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setGrokCustom((c) => !c)}
                className="text-[10px] text-slate-400 hover:text-slate-300"
              >
                {grokCustom ? 'Use dropdown' : 'Enter custom model name'}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            className="bg-sky-600 hover:bg-sky-500 text-white"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
