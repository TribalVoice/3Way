export type Role = 'user' | 'gemini' | 'grok';

export interface ChatNode {
  id: string;
  parentId: string | null;
  role: Role;
  content: string;
  timestamp: number;
  modelName: string;
  status?: 'pending' | 'complete' | 'error';
  error?: string;
}

export interface ChatTree {
  nodes: Record<string, ChatNode>;
  rootId: string | null;
  activeNodeId: string | null;
}

export interface Settings {
  geminiApiKey: string;
  grokApiKey: string;
  geminiModel: string;
  grokModel: string;
}

export const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  grokApiKey: '',
  geminiModel: 'gemini-3.6-flash',
  grokModel: 'grok-4.5',
};

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_GROK_MODEL = 'grok-4.5';

export const GEMINI_MODEL_OPTIONS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

export const GROK_MODEL_OPTIONS = [
  'grok-4.5',
  'grok-4-5',
  'grok-4.20',
  'grok-3',
  'grok-3-mini',
  'grok-2',
  'grok-2-mini',
];
