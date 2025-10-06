import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, type CoreMessage } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vertex = createVertex({
  location: 'europe-west1' // <-- Add this location back
} as any);

export async function POST(req: Request) {
  const { chatHistory }: { chatHistory: CoreMessage[] } = await req.json();

  const systemPrompt = `Summarize the following client intake conversation for a fitness coach...`; // (Your prompt is correct)

  const { text } = await generateText({
    model: vertex('gemini-2.5-flash'), // Using a valid model ID
    system: systemPrompt,
    prompt: JSON.stringify(chatHistory),
  });

  return NextResponse.json({ summary: text });
}