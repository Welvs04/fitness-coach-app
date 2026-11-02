'use client';

import { useEffect, useRef, useState } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ChatProps = {
  onIntakeComplete: (data: {
    details: { name: string; email: string };
    messages: Message[];
  }) => void;
};

const MARKER = 'INTAKE_COMPLETE::';

/** Pull the `{name, email}` JSON out of a finished assistant message, if present. */
function parseIntake(content: string): { name: string; email: string } | null {
  const idx = content.indexOf(MARKER);
  if (idx === -1) return null;
  const rest = content.slice(idx + MARKER.length);
  const start = rest.indexOf('{');
  const end = rest.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(rest.slice(start, end + 1));
    if (typeof parsed.name === 'string' && typeof parsed.email === 'string') return parsed;
  } catch (e) {
    console.error('Failed to parse intake JSON', e);
  }
  return null;
}

/** What the client sees: everything before the machine-readable marker. */
const visibleText = (content: string) => content.split(MARKER)[0].trim();

export default function ChatIntakeForm({ onIntakeComplete }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi! I'm your coach's intake assistant. To start, what's your full name?" },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    const history = [...messages, userMessage];
    const assistantId = crypto.randomUUID();
    setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)));
      }

      const details = parseIntake(reply);
      if (details) {
        onIntakeComplete({ details, messages: [...history, { id: assistantId, role: 'assistant', content: reply }] });
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try sending that again.');
      setMessages(history.slice(0, -1));
      setInput(text);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div>
      <div ref={scrollRef} className="space-y-3 h-80 overflow-y-auto mb-3 p-3 border rounded-lg bg-gray-50">
        {messages.map((m) => {
          const text = m.role === 'assistant' ? visibleText(m.content) : m.content;
          return (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] break-words whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'
                }`}
              >
                {text || <span className="inline-block animate-pulse text-gray-400">typing…</span>}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          placeholder="Type your answer…"
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          autoFocus
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}
