import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful AI assistant for an email client. Help users manage their emails, compose messages, and organize their inbox.',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

