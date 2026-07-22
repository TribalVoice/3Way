/**
 * Client helper: call /api/chat with stream:true and consume SSE-style events.
 */

export type StreamHandlers = {
  onToken: (chunk: string) => void;
  onDone?: (full: string) => void;
  onError?: (message: string) => void;
};

export async function streamProvider(options: {
  provider: 'gemini' | 'grok';
  apiKey: string;
  model: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt: string;
  handlers: StreamHandlers;
}): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: options.provider,
      apiKey: options.apiKey,
      model: options.model,
      messages: options.messages,
      systemPrompt: options.systemPrompt,
      stream: true,
    }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error('No response body for stream.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n');
    buffer = parts.pop() ?? '';

    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;

      let evt: {
        text?: string;
        done?: boolean;
        error?: string;
        content?: string;
      };
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }

      if (evt.error) {
        options.handlers.onError?.(evt.error);
        throw new Error(evt.error);
      }
      if (typeof evt.text === 'string' && evt.text.length) {
        full += evt.text;
        options.handlers.onToken(evt.text);
      }
      if (evt.done && typeof evt.content === 'string') {
        full = evt.content;
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim().startsWith('data:')) {
    try {
      const evt = JSON.parse(buffer.trim().slice(5).trim());
      if (evt.error) throw new Error(evt.error);
      if (typeof evt.text === 'string') {
        full += evt.text;
        options.handlers.onToken(evt.text);
      }
      if (evt.done && typeof evt.content === 'string') full = evt.content;
    } catch (err) {
      if (err instanceof Error && err.message && !err.message.includes('JSON')) {
        throw err;
      }
    }
  }

  if (!full.trim()) {
    throw new Error('Stream ended with empty response.');
  }
  options.handlers.onDone?.(full);
  return full;
}
