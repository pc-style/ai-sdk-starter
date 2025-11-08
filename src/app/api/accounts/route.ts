import { AccountsDB } from '@/lib/db/accounts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const accounts = AccountsDB.getAll();

    // Don't send tokens to the client
    const sanitizedAccounts = accounts.map((acc) => ({
      id: acc.id,
      provider: acc.provider,
      email: acc.email,
      name: acc.name,
      created_at: acc.created_at,
    }));

    return NextResponse.json({ accounts: sanitizedAccounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    AccountsDB.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
