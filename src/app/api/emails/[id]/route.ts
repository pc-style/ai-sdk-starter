import { AccountsDB } from '@/lib/db/accounts';
import { ProviderFactory } from '@/lib/email/provider-factory';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const account = AccountsDB.getById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const provider = ProviderFactory.createProvider(account);
    const message = await provider.getMessage(id);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}
