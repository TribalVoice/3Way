'use client';

import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Bot,
  Save,
  Check,
  ChevronDown,
} from 'lucide-react';
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
  ProviderId,
  SeatConfig,
} from '@/lib/types';
import {
  PROVIDER_OPTIONS,
  modelOptionsFor,
  defaultModelFor,
  providerLabel,
} from '@/lib/providers';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
}

function SeatEditor({
  title,
  seat,
  onChange,
}: {
  title: string;
  seat: SeatConfig;
  onChange: (seat: SeatConfig) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const options = modelOptionsFor(seat.provider);
  const [custom, setCustom] = useState(!options.includes(seat.model));
  const meta = PROVIDER_OPTIONS.find((p) => p.id === seat.provider);

  useEffect(() => {
    setCustom(!modelOptionsFor(seat.provider).includes(seat.model));
  }, [seat.provider, seat.model]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 border border-slate-600">
          <Bot className="h-4 w-4 text-slate-200" />
        </div>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-[10px] text-slate-500">
          → {providerLabel(seat.provider)}
        </span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-400">Provider</Label>
        <div className="relative">
          <select
            value={seat.provider}
            onChange={(e) => {
              const provider = e.target.value as ProviderId;
              setCustom(false);
              onChange({
                provider,
                apiKey: seat.apiKey,
                model: defaultModelFor(provider),
              });
            }}
            className="h-10 w-full appearance-none rounded-md border border-slate-700 bg-slate-800 px-3 pr-8 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-400">API Key</Label>
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            value={seat.apiKey}
            onChange={(e) => onChange({ ...seat, apiKey: e.target.value })}
            placeholder={meta?.keyPlaceholder || 'API key'}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 pr-10"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-400">Model</Label>
        {custom ? (
          <Input
            type="text"
            value={seat.model}
            onChange={(e) => onChange({ ...seat, model: e.target.value })}
            placeholder={defaultModelFor(seat.provider)}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600"
          />
        ) : (
          <div className="relative">
            <select
              value={
                options.includes(seat.model)
                  ? seat.model
                  : options[0] || defaultModelFor(seat.provider)
              }
              onChange={(e) => onChange({ ...seat, model: e.target.value })}
              className="h-10 w-full appearance-none rounded-md border border-slate-700 bg-slate-800 px-3 pr-8 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {options.map((m) => (
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
          onClick={() => {
            if (custom) {
              setCustom(false);
              onChange({
                ...seat,
                model: options[0] || defaultModelFor(seat.provider),
              });
            } else {
              setCustom(true);
            }
          }}
          className="text-[10px] text-sky-400 hover:text-sky-300"
        >
          {custom ? 'Use dropdown' : 'Enter custom model name'}
        </button>
        {meta?.note && (
          <p className="text-[10px] text-slate-500">{meta.note}</p>
        )}
      </div>
    </div>
  );
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onSave,
}: SettingsModalProps) {
  const [seatA, setSeatA] = useState<SeatConfig>(DEFAULT_SETTINGS.seatA);
  const [seatB, setSeatB] = useState<SeatConfig>(DEFAULT_SETTINGS.seatB);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSeatA(settings.seatA);
      setSeatB(settings.seatB);
      setSaved(false);
    }
  }, [open, settings]);

  const handleSave = () => {
    onSave({
      seatA: {
        ...seatA,
        apiKey: seatA.apiKey.trim(),
        model: seatA.model.trim() || defaultModelFor(seatA.provider),
      },
      seatB: {
        ...seatB,
        apiKey: seatB.apiKey.trim(),
        model: seatB.model.trim() || defaultModelFor(seatB.provider),
      },
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
            Seats & API keys
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Each seat is one AI voice. Pick Gemini, Grok, Claude, or Perplexity;
            paste your key and choose a model. Keys stay in this browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <SeatEditor title="Seat A" seat={seatA} onChange={setSeatA} />
          <Separator className="bg-slate-700" />
          <SeatEditor title="Seat B" seat={seatB} onChange={setSeatB} />
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
