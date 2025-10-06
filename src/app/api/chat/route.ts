import { createVertex } from '@ai-sdk/google-vertex';
import { streamText, type CoreMessage } from 'ai'; // Correctly import CoreMessage

export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vertex = createVertex({} as any);

export async function POST(req: Request) {
  // Use the CoreMessage type here
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const systemPrompt = `You are a friendly and helpful AI assistant for a fitness coach. Your goal is to conduct a brief client intake...`; // (Your prompt is correct)

  const result = await streamText({
    model: vertex('gemini-1.5-flash-latest'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}