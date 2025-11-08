import { SnoozeDB } from '@/lib/db/snooze';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { accountId, messageId, snoozeUntil } = await request.json();

    if (!accountId || !messageId || !snoozeUntil) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const snoozeEntry = SnoozeDB.create(
      accountId,
      messageId,
      new Date(snoozeUntil).getTime()
    );

    return NextResponse.json(snoozeEntry);
  } catch (error) {
    console.error('Error creating snooze:', error);
    return NextResponse.json({ error: 'Failed to snooze email' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const snoozed = SnoozeDB.getByAccount(accountId);
    return NextResponse.json({ snoozed });
  } catch (error) {
    console.error('Error fetching snoozed emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snoozed emails' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Snooze ID required' }, { status: 400 });
    }

    SnoozeDB.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting snooze:', error);
    return NextResponse.json({ error: 'Failed to delete snooze' }, { status: 500 });
  }
}
