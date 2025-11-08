import { AccountsDB } from '@/lib/db/accounts';
import { ProviderFactory } from '@/lib/email/provider-factory';
import { SendLaterDB } from '@/lib/db/send-later';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, to, cc, bcc, subject, message, isHtml, scheduledTime } = body;

    if (!accountId || !to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const account = AccountsDB.getById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // If scheduled for later, save to queue
    if (scheduledTime && new Date(scheduledTime).getTime() > Date.now()) {
      SendLaterDB.create(
        accountId,
        to[0].email, // For simplicity, storing first recipient
        subject,
        message,
        new Date(scheduledTime).getTime()
      );

      return NextResponse.json({ success: true, scheduled: true });
    }

    // Send immediately
    const provider = ProviderFactory.createProvider(account);
    await provider.sendMessage({
      to,
      cc,
      bcc,
      subject,
      body: message,
      isHtml,
    });

    return NextResponse.json({ success: true, scheduled: false });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
