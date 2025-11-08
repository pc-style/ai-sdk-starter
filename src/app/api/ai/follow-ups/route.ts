import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { FOLLOW_UP_SUGGESTER_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 30;

const FollowUpSchema = z.object({
  suggestions: z.array(
    z.object({
      action: z.string().describe('The suggested follow-up action'),
      type: z
        .enum(['reminder', 'task', 'calendar', 'archive', 'forward', 'reply'])
        .describe('Type of follow-up action'),
      priority: z
        .enum(['high', 'medium', 'low'])
        .describe('Suggested priority level'),
      scheduledFor: z.string().optional().describe('Suggested date/time if applicable'),
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
Content: ${body || snippet || 'No content'}
    `.trim();

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: FOLLOW_UP_SUGGESTER_PROMPT,
      prompt: `Analyze this email and suggest follow-up actions:\n\n${emailContext}`,
      schema: FollowUpSchema,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('Error suggesting follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to suggest follow-ups' },
      { status: 500 }
    );
  }
}
