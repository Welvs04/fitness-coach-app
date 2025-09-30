'use client';

import { useEffect, useState } from 'react';

// This is a simple type for our messages
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ChatProps = {
  // The component will now send back the messages array when it's done
  onIntakeComplete: (data: {
    details: { name: string; email: string };
    messages: Message[];
  }) => void;
};

export default function ChatIntakeForm({ onIntakeComplete }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. To start, what's your full name?",
    },
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const marker = 'INTAKE_COMPLETE::';
      const jsonStartIndex = lastMessage.content.indexOf(marker);
      if (jsonStartIndex !== -1) {
        const potentialJson = lastMessage.content.substring(jsonStartIndex + marker.length);
        const firstBrace = potentialJson.indexOf('{');
        const lastBrace = potentialJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonString = potentialJson.substring(firstBrace, lastBrace + 1);
          try {
            const details = JSON.parse(jsonString);
            // Send back both the details AND the full message history
            onIntakeComplete({ details, messages });
          } catch (e) { console.error('Failed to parse intake JSON', e); }
        }
      }
    }
  }, [messages, onIntakeComplete]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantResponse = '';
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantResponse += decoder.decode(value, { stream: true });
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? { ...msg, content: assistantResponse } : msg
      ));
    }
  };

  return (
    <div>
      <div className="space-y-4 max-h-80 overflow-y-auto mb-4 p-3 border rounded-lg bg-gray-50">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs break-words ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-2 border rounded-lg"
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
}