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
  BookKey,
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
  ProviderKeys,
  SeatConfig,
  EMPTY_PROVIDER_KEYS,
} from '@/lib/types';
import {
  PROVIDER_OPTIONS,
  modelOptionsFor,
  defaultModelFor,
  providerLabel,
  emptyProviderKeys,
} from '@/lib/providers';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
}

function KeyRegister({
  keys,
  onChange,
}: {
  keys: ProviderKeys;
  onChange: (keys: ProviderKeys) => void;
}) {
  const [show, setShow] = useState<Partial<Record<ProviderId, boolean>>>({});

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-600/20 border border-sky-500/30">
          <BookKey className="h-4 w-4 text-sky-400" />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-200">
            API key register
          </span>
          <p className="text-[10px] text-slate-500">
            Save each provider once. Seats reuse these when you switch models.
          </p>
        </div>
      </div>

      {PROVIDER_OPTIONS.map((p) => {
        const hasKey = Boolean(keys[p.id]?.trim());
        return (
          <div key={p.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-slate-400">{p.label}</Label>
              <span
                className={
                  hasKey
                    ? 'text-[10px] text-emerald-400'
                    : 'text-[10px] text-slate-600'
                }
              >
                {hasKey ? 'Saved' : 'Not set'}
              </span>
            </div>
            <div className="relative">
              <Input
                type={show[p.id] ? 'text' : 'password'}
                value={keys[p.id] ?? ''}
                onChange={(e) =>
                  onChange({ ...keys, [p.id]: e.target.value })
                }
                placeholder={p.keyPlaceholder}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() =>
                  setShow((s) => ({ ...s, [p.id]: !s[p.id] }))
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {show[p.id] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {p.note && (
              <p className="text-[10px] text-slate-500">{p.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeatEditor({
  title,
  seat,
  onChange,
  keyReady,
}: {
  title: string;
  seat: SeatConfig;
  onChange: (seat: SeatConfig) => void;
  keyReady: boolean;
}) {
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
        <span
          className={
            keyReady
              ? 'ml-auto text-[10px] text-emerald-400'
              : 'ml-auto text-[10px] text-amber-500/90'
          }
        >
          {keyReady ? 'Key ready' : 'Add key above'}
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
        {meta?.note && seat.provider === 'nvidia' && (
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
  const [keys, setKeys] = useState<ProviderKeys>(emptyProviderKeys());
  const [seatA, setSeatA] = useState<SeatConfig>(DEFAULT_SETTINGS.seatA);
  const [seatB, setSeatB] = useState<SeatConfig>(DEFAULT_SETTINGS.seatB);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKeys({ ...EMPTY_PROVIDER_KEYS, ...settings.keys });
      setSeatA(settings.seatA);
      setSeatB(settings.seatB);
      setSaved(false);
    }
  }, [open, settings]);

  const handleSave = () => {
    onSave({
      keys: {
        gemini: keys.gemini.trim(),
        grok: keys.grok.trim(),
        claude: keys.claude.trim(),
        perplexity: keys.perplexity.trim(),
        nvidia: keys.nvidia.trim(),
      },
      seatA: {
        provider: seatA.provider,
        model: seatA.model.trim() || defaultModelFor(seatA.provider),
      },
      seatB: {
        provider: seatB.provider,
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
            Keys & seats
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Register API keys once per provider, then assign each seat a
            provider and model. Keys stay in this browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <KeyRegister keys={keys} onChange={setKeys} />
          <Separator className="bg-slate-700" />
          <SeatEditor
            title="Seat A"
            seat={seatA}
            onChange={setSeatA}
            keyReady={Boolean(keys[seatA.provider]?.trim())}
          />
          <Separator className="bg-slate-700" />
          <SeatEditor
            title="Seat B"
            seat={seatB}
            onChange={setSeatB}
            keyReady={Boolean(keys[seatB.provider]?.trim())}
          />
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
