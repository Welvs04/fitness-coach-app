import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

const vertex = createVertex({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID, // Add your Project ID to .env.local
  location: 'europe-west1',
});

export async function POST(req: Request) {
  const { chatHistory } = await req.json();

  const systemPrompt = `Summarize the following client intake conversation for a fitness coach. Extract the client's name, their primary fitness goals, and any mentioned injuries or concerns. Present it as a brief, easy-to-read summary.`;

  const { text } = await generateText({
    model: vertex('gemini-2.0-flash'),
    system: systemPrompt,
    prompt: JSON.stringify(chatHistory),
  });

  return NextResponse.json({ summary: text });
}