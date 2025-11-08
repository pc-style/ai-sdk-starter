import { AccountsDB } from '@/lib/db/accounts';
import { ProviderFactory } from '@/lib/email/provider-factory';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;
    const query = searchParams.get('query') || undefined;
    const labels = searchParams.get('labels')?.split(',').filter(Boolean);

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const account = AccountsDB.getById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const provider = ProviderFactory.createProvider(account);
    const result = await provider.listMessages({
      maxResults,
      pageToken,
      query,
      labelIds: labels,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
