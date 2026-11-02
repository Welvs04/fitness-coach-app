import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getModel, INTAKE_MARKER } from '@/lib/ai';
import type { Message } from '@/components/ChatIntakeForm';

export const maxDuration = 30;

const systemPrompt = `You are helping a personal fitness coach prepare for a first session with a new client.
Given the intake chat transcript, write a concise pre-session brief using exactly these headings:

Goal: <one line>
Experience: <one line>
Injuries / limitations: <one line, or "None reported">
Availability: <training days per week>
Watch out for: <any red flags, motivation notes, or things to clarify — or "Nothing notable">
Suggested opener: <one question the coach could start the session with>

Only use information from the transcript. Do not invent details.`;

export async function POST(req: Request) {
  const { chatHistory }: { chatHistory: Message[] } = await req.json();

  const transcript = (chatHistory ?? [])
    .map((m) => `${m.role === 'user' ? 'Client' : 'Assistant'}: ${m.content.split(INTAKE_MARKER)[0].trim()}`)
    .join('\n');

  const { text } = await generateText({ model: getModel(), system: systemPrompt, prompt: transcript });

  return NextResponse.json({ summary: text });
}
