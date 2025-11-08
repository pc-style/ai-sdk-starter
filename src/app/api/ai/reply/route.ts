import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { REPLY_GENERATOR_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { emailContent, context } = await request.json();

    if (!emailContent) {
      return NextResponse.json({ error: 'Email content required' }, { status: 400 });
    }

    const result = await generateText({
      model: openai('gpt-4o'),
      system: REPLY_GENERATOR_PROMPT,
      prompt: `Original email:\n\n${emailContent}\n\n${context ? `Additional context: ${context}` : ''}\n\nGenerate a professional reply:`,
    });

    return NextResponse.json({ reply: result.text });
  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
