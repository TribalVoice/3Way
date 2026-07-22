import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 90_000;

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  provider: 'gemini' | 'grok';
  apiKey: string;
  model: string;
  messages: MessageItem[];
  systemPrompt?: string;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function friendlyHttpError(provider: string, status: number, body: string): string {
  const snippet = body.slice(0, 400);
  if (status === 401 || status === 403) {
    return `${provider} rejected the API key (${status}). Check the key in Settings.`;
  }
  if (status === 404) {
    return `${provider} model not found (${status}). Try a different model name in Settings. ${snippet}`;
  }
  if (status === 429) {
    return `${provider} rate limit hit (${status}). Wait a moment and retry.`;
  }
  return `${provider} API error (${status}): ${snippet}`;
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): Promise<string> {
  // Gemini prefers alternating user/model; merge consecutive same-role turns.
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    const role = m.role === 'user' ? 'user' : 'model';
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n\n${m.content}`;
    } else {
      contents.push({ role, parts: [{ text: m.content }] });
    }
  }

  if (contents.length === 0) {
    throw new Error('No messages to send to Gemini.');
  }

  // Gemini requires the last content role to be "user" for generateContent in many cases;
  // if the transcript ends on this model's own assistant turn only, prepend is already handled client-side.
  if (contents[contents.length - 1].role !== 'user') {
    contents.push({
      role: 'user',
      parts: [{ text: '(Continue the conversation based on the room so far.)' }],
    });
  }

  const body: Record<string, unknown> = { contents };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(friendlyHttpError('Gemini', res.status, errText));
  }

  const data = await res.json();

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini blocked the prompt (${blockReason}).`);
  }

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned no candidates.');
  }

  const finish = candidate.finishReason;
  const text = candidate?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('') as string | undefined;

  if (!text?.trim()) {
    throw new Error(
      finish
        ? `Gemini returned an empty response (${finish}).`
        : 'Gemini returned an empty response.'
    );
  }
  return text;
}

async function callGrok(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): Promise<string> {
  const apiMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    apiMessages.push({ role: m.role, content: m.content });
  }

  if (apiMessages.filter((m) => m.role !== 'system').length === 0) {
    throw new Error('No messages to send to Grok.');
  }

  const res = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(friendlyHttpError('Grok', res.status, errText));
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (content == null || String(content).trim() === '') {
    throw new Error('Grok returned an empty response.');
  }
  return typeof content === 'string' ? content : String(content);
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { provider, apiKey, model, messages, systemPrompt } = body;

  if (provider !== 'gemini' && provider !== 'grok') {
    return NextResponse.json({ error: 'Invalid provider.' }, { status: 400 });
  }

  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: `Missing API key for ${provider}.` },
      { status: 400 }
    );
  }

  if (!model?.trim()) {
    return NextResponse.json(
      { error: `Missing model name for ${provider}.` },
      { status: 400 }
    );
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages array is required.' },
      { status: 400 }
    );
  }

  try {
    let content: string;
    if (provider === 'gemini') {
      content = await callGemini(apiKey.trim(), model.trim(), messages, systemPrompt);
    } else {
      content = await callGrok(apiKey.trim(), model.trim(), messages, systemPrompt);
    }
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
