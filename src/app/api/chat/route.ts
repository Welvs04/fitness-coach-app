import { createVertex } from '@ai-sdk/google-vertex';
import { streamText, type CoreMessage } from 'ai';

export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vertex = createVertex({
  location: 'europe-west1'
} as any);

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const systemPrompt = `You are a friendly and helpful AI assistant for a fitness coach. Your goal is to conduct a brief client intake...`; // (Your prompt is correct)

  const result = await streamText({
    model: vertex('gemini-2.5-flash'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}