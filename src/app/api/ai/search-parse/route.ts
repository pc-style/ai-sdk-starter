import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { SEARCH_PARSER_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 30;

const SearchQuerySchema = z.object({
  query: z.string().describe('The formatted search query for the email provider'),
  filters: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      subject: z.string().optional(),
      hasAttachment: z.boolean().optional(),
      isUnread: z.boolean().optional(),
      dateAfter: z.string().optional(),
      dateBefore: z.string().optional(),
    })
    .optional()
    .describe('Structured filters extracted from the query'),
});

export async function POST(request: Request) {
  try {
    const { query, provider } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: SEARCH_PARSER_PROMPT,
      prompt: `Provider: ${provider || 'gmail'}\nUser query: ${query}`,
      schema: SearchQuerySchema,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('Error parsing search query:', error);
    return NextResponse.json(
      { error: 'Failed to parse search query' },
      { status: 500 }
    );
  }
}
