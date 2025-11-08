import { ConfidentialClientApplication } from '@azure/msal-node';
import { OUTLOOK_CONFIG } from '@/lib/email/oauth-config';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const msalConfig = {
      auth: {
        clientId: OUTLOOK_CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${OUTLOOK_CONFIG.tenantId}`,
        clientSecret: OUTLOOK_CONFIG.clientSecret,
      },
    };

    const pca = new ConfidentialClientApplication(msalConfig);

    const authCodeUrlParameters = {
      scopes: OUTLOOK_CONFIG.scopes,
      redirectUri: OUTLOOK_CONFIG.redirectUri,
    };

    const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Outlook OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Outlook OAuth' },
      { status: 500 }
    );
  }
}
