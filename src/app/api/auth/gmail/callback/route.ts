import { google } from 'googleapis';
import { GMAIL_CONFIG } from '@/lib/email/oauth-config';
import { AccountsDB } from '@/lib/db/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret,
      GMAIL_CONFIG.redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      throw new Error('No email found in user info');
    }

    // Store account in database
    const existingAccount = AccountsDB.getByEmail(userInfo.data.email);

    if (existingAccount) {
      // Update existing account
      AccountsDB.updateTokens(
        existingAccount.id,
        tokens.access_token!,
        tokens.refresh_token || undefined,
        tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined
      );
    } else {
      // Create new account
      AccountsDB.create({
        provider: 'gmail',
        email: userInfo.data.email,
        name: userInfo.data.name || undefined,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || undefined,
        token_expiry: tokens.expiry_date || undefined,
      });
    }

    return NextResponse.redirect(new URL('/?success=gmail_connected', request.url));
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=gmail_auth_failed', request.url)
    );
  }
}
