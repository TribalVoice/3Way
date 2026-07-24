import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 120_000;

type ProviderId = 'gemini' | 'grok' | 'claude';

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  provider: ProviderId;
  apiKey: string;
  model: string;
  messages: MessageItem[];
  systemPrompt?: string;
  stream?: boolean;
}

function sseLine(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function friendlyHttpError(
  provider: string,
  status: number,
  body: string
): string {
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

function buildGeminiContents(messages: MessageItem[]) {
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
  if (contents[contents.length - 1].role !== 'user') {
    contents.push({
      role: 'user',
      parts: [{ text: '(Continue the conversation based on the room so far.)' }],
    });
  }
  return contents;
}

function buildOpenAiStyleMessages(
  messages: MessageItem[],
  systemPrompt?: string
): Array<{ role: string; content: string }> {
  const apiMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    apiMessages.push({ role: m.role, content: m.content });
  }
  if (apiMessages.filter((m) => m.role !== 'system').length === 0) {
    throw new Error('No messages to send.');
  }
  return apiMessages;
}

function buildClaudeMessages(messages: MessageItem[]): MessageItem[] {
  const out: MessageItem[] = [];
  for (const m of messages) {
    const last = out[out.length - 1];
    if (last && last.role === m.role) {
      last.content += `\n\n${m.content}`;
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  if (out.length === 0) throw new Error('No messages to send to Claude.');
  if (out[0].role !== 'user') {
    out.unshift({
      role: 'user',
      content: '(Continue the conversation based on the room so far.)',
    });
  }
  if (out[out.length - 1].role !== 'user') {
    out.push({
      role: 'user',
      content: '(Continue based on the room so far.)',
    });
  }
  return out;
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): Promise<string> {
  const contents = buildGeminiContents(messages);
  const body: Record<string, unknown> = { contents };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(friendlyHttpError('Gemini', res.status, errText));
    }

    const data = await res.json();
    if (data?.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini blocked the prompt (${data.promptFeedback.blockReason}).`
      );
    }
    const candidate = data?.candidates?.[0];
    if (!candidate) throw new Error('Gemini returned no candidates.');
    const text = candidate?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('') as string | undefined;
    if (!text?.trim()) {
      throw new Error(
        candidate.finishReason
          ? `Gemini returned an empty response (${candidate.finishReason}).`
          : 'Gemini returned an empty response.'
      );
    }
    return text;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callGrok(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): Promise<string> {
  const apiMessages = buildOpenAiStyleMessages(messages, systemPrompt);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
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
      signal: controller.signal,
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): Promise<string> {
  const claudeMessages = buildClaudeMessages(messages);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: systemPrompt || undefined,
        messages: claudeMessages,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(friendlyHttpError('Claude', res.status, errText));
    }

    const data = await res.json();
    const parts = data?.content;
    if (!Array.isArray(parts)) {
      throw new Error('Claude returned an unexpected response.');
    }
    const text = parts
      .filter((p: { type?: string }) => p.type === 'text')
      .map((p: { text?: string }) => p.text ?? '')
      .join('');
    if (!text.trim()) throw new Error('Claude returned an empty response.');
    return text;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function streamGemini(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const contents = buildGeminiContents(messages);
  const body: Record<string, unknown> = { contents };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  return new ReadableStream({
    async start(controller) {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);
      let full = '';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal: abort.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          controller.enqueue(
            encoder.encode(
              sseLine({
                error: friendlyHttpError('Gemini', res.status, errText),
              })
            )
          );
          controller.close();
          return;
        }

        if (!res.body) {
          controller.enqueue(
            encoder.encode(
              sseLine({ error: 'Gemini returned no stream body.' })
            )
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const parts = json?.candidates?.[0]?.content?.parts;
              if (Array.isArray(parts)) {
                for (const p of parts) {
                  if (typeof p?.text === 'string' && p.text) {
                    full += p.text;
                    controller.enqueue(
                      encoder.encode(sseLine({ text: p.text }))
                    );
                  }
                }
              }
            } catch {
              // skip
            }
          }
        }

        if (!full.trim()) {
          controller.enqueue(
            encoder.encode(
              sseLine({ error: 'Gemini returned an empty stream.' })
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(sseLine({ done: true, content: full }))
          );
        }
        controller.close();
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`
            : err instanceof Error
              ? err.message
              : 'Gemini stream failed.';
        controller.enqueue(encoder.encode(sseLine({ error: message })));
        controller.close();
      } finally {
        clearTimeout(timer);
      }
    },
  });
}

function streamGrok(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const apiMessages = buildOpenAiStyleMessages(messages, systemPrompt);

  return new ReadableStream({
    async start(controller) {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);
      let full = '';

      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            stream: true,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          controller.enqueue(
            encoder.encode(
              sseLine({ error: friendlyHttpError('Grok', res.status, errText) })
            )
          );
          controller.close();
          return;
        }

        if (!res.body) {
          controller.enqueue(
            encoder.encode(sseLine({ error: 'Grok returned no stream body.' }))
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta) {
                full += delta;
                controller.enqueue(encoder.encode(sseLine({ text: delta })));
              }
            } catch {
              // skip
            }
          }
        }

        if (!full.trim()) {
          controller.enqueue(
            encoder.encode(sseLine({ error: 'Grok returned an empty stream.' }))
          );
        } else {
          controller.enqueue(
            encoder.encode(sseLine({ done: true, content: full }))
          );
        }
        controller.close();
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`
            : err instanceof Error
              ? err.message
              : 'Grok stream failed.';
        controller.enqueue(encoder.encode(sseLine({ error: message })));
        controller.close();
      } finally {
        clearTimeout(timer);
      }
    },
  });
}

function streamClaude(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  systemPrompt?: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const claudeMessages = buildClaudeMessages(messages);

  return new ReadableStream({
    async start(controller) {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);
      let full = '';

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 8192,
            system: systemPrompt || undefined,
            messages: claudeMessages,
            stream: true,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          controller.enqueue(
            encoder.encode(
              sseLine({
                error: friendlyHttpError('Claude', res.status, errText),
              })
            )
          );
          controller.close();
          return;
        }

        if (!res.body) {
          controller.enqueue(
            encoder.encode(
              sseLine({ error: 'Claude returned no stream body.' })
            )
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              if (
                json?.type === 'content_block_delta' &&
                json?.delta?.type === 'text_delta' &&
                typeof json.delta.text === 'string'
              ) {
                const text = json.delta.text as string;
                if (text) {
                  full += text;
                  controller.enqueue(encoder.encode(sseLine({ text })));
                }
              }
            } catch {
              // skip
            }
          }
        }

        if (!full.trim()) {
          controller.enqueue(
            encoder.encode(
              sseLine({ error: 'Claude returned an empty stream.' })
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(sseLine({ done: true, content: full }))
          );
        }
        controller.close();
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`
            : err instanceof Error
              ? err.message
              : 'Claude stream failed.';
        controller.enqueue(encoder.encode(sseLine({ error: message })));
        controller.close();
      } finally {
        clearTimeout(timer);
      }
    },
  });
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { provider, apiKey, model, messages, systemPrompt, stream } = body;

  if (
    provider !== 'gemini' &&
    provider !== 'grok' &&
    provider !== 'claude'
  ) {
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

  if (stream) {
    try {
      let readable: ReadableStream<Uint8Array>;
      if (provider === 'gemini') {
        readable = streamGemini(
          apiKey.trim(),
          model.trim(),
          messages,
          systemPrompt
        );
      } else if (provider === 'grok') {
        readable = streamGrok(
          apiKey.trim(),
          model.trim(),
          messages,
          systemPrompt
        );
      } else {
        readable = streamClaude(
          apiKey.trim(),
          model.trim(),
          messages,
          systemPrompt
        );
      }

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start stream.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    let content: string;
    if (provider === 'gemini') {
      content = await callGemini(
        apiKey.trim(),
        model.trim(),
        messages,
        systemPrompt
      );
    } else if (provider === 'grok') {
      content = await callGrok(
        apiKey.trim(),
        model.trim(),
        messages,
        systemPrompt
      );
    } else {
      content = await callClaude(
        apiKey.trim(),
        model.trim(),
        messages,
        systemPrompt
      );
    }
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
