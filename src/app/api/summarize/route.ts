import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, type CoreMessage } from 'ai'; // Import CoreMessage
import { NextResponse } from 'next/server';

export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vertex = createVertex({} as any);

export async function POST(req: Request) {
  // Use the CoreMessage type for the chat history
  const { chatHistory }: { chatHistory: CoreMessage[] } = await req.json();

  const systemPrompt = `Summarize the following client intake conversation for a fitness coach...`; // (Your prompt is correct)

  const { text } = await generateText({
    model: vertex('gemini-2.0-flash'),
    system: systemPrompt,
    prompt: JSON.stringify(chatHistory),
  });

  return NextResponse.json({ summary: text });
}