import { createVertex } from '@ai-sdk/google-vertex';
import { streamText, CoreMessage } from 'ai';

export const maxDuration = 30;

// This is the most important change. An empty createVertex() call
// tells the code to automatically find the GOOGLE_VERTEX_SERVICE_ACCOUNT
// variable that you set in your Vercel project settings.
const vertex = createVertex({});

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const systemPrompt = `You are a friendly and helpful AI assistant for a fitness coach. Your goal is to conduct a brief client intake.
  - Ask questions ONE AT A TIME.
  - Wait for the user's response before asking the next question.
  - Your conversation flow should be:
  1. Greet the user warmly by asking for their full name.
  2. After they respond, ask for their email address.
  3. After they respond, ask about their primary fitness goal.
  4. After they respond, ask if they have any current or past injuries.
  5. Once you have their name and email, your final response MUST ONLY BE the special code and the JSON object. Do not add any other conversational text.
  The final response format is: INTAKE_COMPLETE::{"name": "USER_NAME", "email": "USER_EMAIL"}`;

  const result = await streamText({
    // Use the correct ID for the latest Gemini 1.5 Flash model
    model: vertex('gemini-2.5-flash'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}