import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

async function callGemini(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): Promise<string> {
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('') as string | undefined;
  if (!text) throw new Error('Gemini returned an empty response.');
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

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
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
    throw new Error(`Grok API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Grok returned an empty response.');
  return content as string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { provider, apiKey, model, messages, systemPrompt } = body;

  if (!apiKey) {
    return NextResponse.json(
      { error: `Missing API key for ${provider}.` },
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
      content = await callGemini(apiKey, model, messages, systemPrompt);
    } else {
      content = await callGrok(apiKey, model, messages, systemPrompt);
    }
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
