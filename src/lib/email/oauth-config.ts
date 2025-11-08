// OAuth Configuration for Gmail and Outlook

export const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID || '',
  clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
    : 'http://localhost:3000/api/auth/gmail/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
};

export const OUTLOOK_CONFIG = {
  clientId: process.env.OUTLOOK_CLIENT_ID || '',
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
  tenantId: process.env.OUTLOOK_TENANT_ID || 'common',
  redirectUri: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`
    : 'http://localhost:3000/api/auth/outlook/callback',
  scopes: [
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
  ],
};
