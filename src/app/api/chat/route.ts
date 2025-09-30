import { createVertex } from '@ai-sdk/google-vertex';
import { streamText, CoreMessage } from 'ai';

export const maxDuration = 30;

// Initialize the Vertex AI provider
const vertex = createVertex({
  // The SDK is smart and often finds your project ID automatically,
  // but if you get an error, you may need to add it here.
  // You can find your Project ID on the Google Cloud Console dashboard.
  project: 'fitness-coach-ai-473319',
  location: 'us-central1',
});

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
    // The model name for Vertex is also different.
    // Let's use a powerful and common Gemini 1.5 Pro model.
    model: vertex('gemini-2.0-flash'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}