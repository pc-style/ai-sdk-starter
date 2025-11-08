import { google } from 'googleapis';
import { GMAIL_CONFIG } from '@/lib/email/oauth-config';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret,
      GMAIL_CONFIG.redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_CONFIG.scopes,
      prompt: 'consent',
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Gmail OAuth' },
      { status: 500 }
    );
  }
}
