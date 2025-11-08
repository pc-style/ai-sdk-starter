import { ConfidentialClientApplication } from '@azure/msal-node';
import { OUTLOOK_CONFIG } from '@/lib/email/oauth-config';
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

    const msalConfig = {
      auth: {
        clientId: OUTLOOK_CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${OUTLOOK_CONFIG.tenantId}`,
        clientSecret: OUTLOOK_CONFIG.clientSecret,
      },
    };

    const pca = new ConfidentialClientApplication(msalConfig);

    const tokenRequest = {
      code,
      scopes: OUTLOOK_CONFIG.scopes,
      redirectUri: OUTLOOK_CONFIG.redirectUri,
    };

    const response = await pca.acquireTokenByCode(tokenRequest);

    if (!response || !response.account?.username) {
      throw new Error('No account information in token response');
    }

    // Store account in database
    const existingAccount = AccountsDB.getByEmail(response.account.username);

    if (existingAccount) {
      // Update existing account
      AccountsDB.updateTokens(
        existingAccount.id,
        response.accessToken,
        undefined,
        response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : undefined
      );
    } else {
      // Create new account
      AccountsDB.create({
        provider: 'outlook',
        email: response.account.username,
        name: response.account.name,
        access_token: response.accessToken,
        token_expiry: response.expiresOn?.getTime(),
      });
    }

    return NextResponse.redirect(new URL('/?success=outlook_connected', request.url));
  } catch (error) {
    console.error('Outlook callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=outlook_auth_failed', request.url)
    );
  }
}
