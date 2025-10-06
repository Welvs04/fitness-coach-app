import { createVertex } from '@ai-sdk/google-vertex';
import { streamText, CoreMessage } from 'ai';

export const maxDuration = 30;

// --- NEW DIRECT AUTHENTICATION METHOD ---
// This will manually parse the service account JSON from the Vercel environment variable.
const serviceAccount = JSON.parse(
  process.env.GOOGLE_VERTEX_SERVICE_ACCOUNT || '{}'
);

// This will pass the parsed credentials directly to the createVertex function.
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
    model: vertex('gemini-1.5-flash-latest'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}