import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

const CategorizationSchema = z.object({
  categorizations: z.array(
    z.object({
      emailId: z.string().describe('The email ID'),
      category: z.enum(['important', 'newsletters', 'other']).describe('Email category'),
      confidence: z.number().min(0).max(1).describe('Confidence score'),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array required' },
        { status: 400 }
      );
    }

    // Create a prompt with email summaries
    const emailSummaries = emails.map((email: any) => `
ID: ${email.id}
Subject: ${email.subject}
From: ${email.from.email}
Snippet: ${email.snippet}
IsStarred: ${email.isStarred}
    `).join('\n---\n');

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an email categorization expert. Categorize emails into one of three categories:
- "important": Urgent, personal, or high-priority emails (starred, from VIPs, work-critical, time-sensitive)
- "newsletters": Marketing, promotional, or bulk emails (contains unsubscribe links, auto-generated)
- "other": General emails that don't fit the above categories

Return a structured list of categorizations with confidence scores.`,
      prompt: `Categorize these emails:\n\n${emailSummaries}`,
      schema: CategorizationSchema,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('Error categorizing emails:', error);
    return NextResponse.json(
      { error: 'Failed to categorize emails' },
      { status: 500 }
    );
  }
}
