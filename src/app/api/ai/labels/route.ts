import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { LABEL_SUGGESTER_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 30;

const LabelSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      label: z.string().describe('The suggested label/category name'),
      confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
      reason: z.string().describe('Brief explanation for this suggestion'),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const { subject, from, snippet, body } = await request.json();

    if (!subject && !snippet && !body) {
      return NextResponse.json(
        { error: 'Email content required' },
        { status: 400 }
      );
    }

    const emailContext = `
Subject: ${subject || 'No subject'}
From: ${from || 'Unknown'}
Preview: ${snippet || body?.substring(0, 200) || 'No content'}
    `.trim();

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: LABEL_SUGGESTER_PROMPT,
      prompt: `Analyze this email and suggest appropriate labels:\n\n${emailContext}`,
      schema: LabelSuggestionSchema,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('Error suggesting labels:', error);
    return NextResponse.json(
      { error: 'Failed to suggest labels' },
      { status: 500 }
    );
  }
}
