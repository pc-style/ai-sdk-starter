import { google } from 'googleapis';
import { GMAIL_CONFIG } from './oauth-config';
import { Account } from '../db/schema';
import {
  EmailMessage,
  EmailListOptions,
  EmailListResult,
  SendEmailOptions,
  EmailLabel,
} from './types';

export class GmailProvider {
  private oauth2Client;

  constructor(private account: Account) {
    this.oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret,
      GMAIL_CONFIG.redirectUri
    );

    this.oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.token_expiry,
    });
  }

  private getGmail() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async listMessages(options: EmailListOptions = {}): Promise<EmailListResult> {
    const gmail = this.getGmail();

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: options.maxResults || 50,
      pageToken: options.pageToken,
      labelIds: options.labelIds,
      q: options.query,
    });

    const messages: EmailMessage[] = [];

    if (response.data.messages) {
      for (const msg of response.data.messages) {
        const fullMessage = await this.getMessage(msg.id!);
        if (fullMessage) {
          messages.push(fullMessage);
        }
      }
    }

    return {
      messages,
      nextPageToken: response.data.nextPageToken || undefined,
      totalCount: response.data.resultSizeEstimate || undefined,
    };
  }

  async getMessage(id: string): Promise<EmailMessage | null> {
    const gmail = this.getGmail();

    const response = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    const msg = response.data;
    if (!msg) return null;

    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('from');
    const to = getHeader('to');
    const subject = getHeader('subject');
    const date = getHeader('date');

    // Parse body
    let body = '';
    let bodyHtml = '';

    const getParts = (parts: any[]): void => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          getParts(part.parts);
        }
      }
    };

    if (msg.payload?.parts) {
      getParts(msg.payload.parts);
    } else if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
    }

    return {
      id: msg.id!,
      threadId: msg.threadId || undefined,
      subject,
      from: this.parseEmailAddress(from),
      to: to.split(',').map((e) => this.parseEmailAddress(e.trim())),
      date: new Date(date),
      snippet: msg.snippet || '',
      body,
      bodyHtml,
      labels: msg.labelIds || undefined,
      isRead: !msg.labelIds?.includes('UNREAD'),
      isStarred: msg.labelIds?.includes('STARRED') || false,
      hasAttachments: msg.payload?.parts?.some((p) => p.filename) || false,
    };
  }

  async sendMessage(options: SendEmailOptions): Promise<void> {
    const gmail = this.getGmail();

    const message = [
      `To: ${options.to.map((t) => t.email).join(', ')}`,
      options.cc ? `Cc: ${options.cc.map((c) => c.email).join(', ')}` : '',
      options.bcc ? `Bcc: ${options.bcc.map((b) => b.email).join(', ')}` : '',
      `Subject: ${options.subject}`,
      options.isHtml ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
      '',
      options.body,
    ]
      .filter(Boolean)
      .join('\r\n');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: options.threadId,
      },
    });
  }

  async modifyLabels(messageId: string, addLabels: string[] = [], removeLabels: string[] = []): Promise<void> {
    const gmail = this.getGmail();

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });
  }

  async getLabels(): Promise<EmailLabel[]> {
    const gmail = this.getGmail();

    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    return (response.data.labels || []).map((label) => ({
      id: label.id!,
      name: label.name!,
      type: label.type === 'system' ? 'system' : 'user',
    }));
  }

  async search(query: string): Promise<EmailMessage[]> {
    const result = await this.listMessages({ query });
    return result.messages;
  }

  private parseEmailAddress(addressString: string): { email: string; name?: string } {
    const match = addressString.match(/^"?([^"]*)"?\s*<(.+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: addressString.trim() };
  }
}
