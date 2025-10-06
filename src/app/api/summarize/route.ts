import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, type CoreMessage } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vertex = createVertex({
  location: 'europe-west1'
} as any);

export async function POST(req: Request) {
  const { chatHistory }: { chatHistory: CoreMessage[] } = await req.json();

  const systemPrompt = `Summarize the following client intake conversation...`; // Your prompt

  const { text } = await generateText({
    model: vertex('gemini-2.5-flash'),
    system: systemPrompt,
    prompt: JSON.stringify(chatHistory),
  });

  return NextResponse.json({ summary: text });
}