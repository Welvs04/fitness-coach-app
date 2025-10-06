import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

// --- NEW DIRECT AUTHENTICATION METHOD ---
const serviceAccount = JSON.parse(
  process.env.GOOGLE_VERTEX_SERVICE_ACCOUNT || '{}'
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vertex = createVertex({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  project: serviceAccount.project_id,
  location: 'europe-west1',
} as any); // <-- Add 'as any' here
// --- END NEW METHOD ---


export async function POST(req: Request) {
  const { chatHistory }: { chatHistory: any } = await req.json();

  const systemPrompt = `Summarize the following client intake conversation for a fitness coach. Extract the client's name, their primary fitness goals, and any mentioned injuries or concerns. Present it as a brief, easy-to-read summary.`;

  const { text } = await generateText({
    model: vertex('gemini-1.5-flash-latest'),
    system: systemPrompt,
    prompt: JSON.stringify(chatHistory),
  });

  return NextResponse.json({ summary: text });
}