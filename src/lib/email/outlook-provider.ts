import { Client } from '@microsoft/microsoft-graph-client';
import { Account } from '../db/schema';
import {
  EmailMessage,
  EmailListOptions,
  EmailListResult,
  SendEmailOptions,
  EmailLabel,
} from './types';

export class OutlookProvider {
  private client: Client;

  constructor(private account: Account) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, account.access_token);
      },
    });
  }

  async listMessages(options: EmailListOptions = {}): Promise<EmailListResult> {
    const maxResults = options.maxResults || 50;
    let endpoint = `/me/mailFolders/inbox/messages?$top=${maxResults}`;

    if (options.query) {
      endpoint += `&$search="${options.query}"`;
    }

    if (options.pageToken) {
      endpoint = options.pageToken;
    }

    const response = await this.client.api(endpoint).get();

    const messages: EmailMessage[] = response.value.map((msg: any) =>
      this.transformOutlookMessage(msg)
    );

    return {
      messages,
      nextPageToken: response['@odata.nextLink'],
    };
  }

  async getMessage(id: string): Promise<EmailMessage | null> {
    const msg = await this.client.api(`/me/messages/${id}`).get();
    return this.transformOutlookMessage(msg);
  }

  async sendMessage(options: SendEmailOptions): Promise<void> {
    const message = {
      subject: options.subject,
      body: {
        contentType: options.isHtml ? 'HTML' : 'Text',
        content: options.body,
      },
      toRecipients: options.to.map((t) => ({
        emailAddress: { address: t.email, name: t.name },
      })),
      ccRecipients: options.cc?.map((c) => ({
        emailAddress: { address: c.email, name: c.name },
      })),
      bccRecipients: options.bcc?.map((b) => ({
        emailAddress: { address: b.email, name: b.name },
      })),
    };

    if (options.inReplyTo) {
      await this.client.api(`/me/messages/${options.inReplyTo}/reply`).post({
        message,
      });
    } else {
      await this.client.api('/me/sendMail').post({ message });
    }
  }

  async modifyLabels(messageId: string, addLabels: string[] = [], removeLabels: string[] = []): Promise<void> {
    // Outlook uses categories instead of labels
    const msg = await this.client.api(`/me/messages/${messageId}`).get();
    const currentCategories = msg.categories || [];

    const newCategories = [
      ...currentCategories.filter((c: string) => !removeLabels.includes(c)),
      ...addLabels,
    ];

    await this.client.api(`/me/messages/${messageId}`).patch({
      categories: newCategories,
    });
  }

  async getLabels(): Promise<EmailLabel[]> {
    const response = await this.client.api('/me/outlook/masterCategories').get();

    return response.value.map((cat: any) => ({
      id: cat.id,
      name: cat.displayName,
      type: 'user' as const,
      color: cat.color,
    }));
  }

  async search(query: string): Promise<EmailMessage[]> {
    const result = await this.listMessages({ query });
    return result.messages;
  }

  private transformOutlookMessage(msg: any): EmailMessage {
    return {
      id: msg.id,
      threadId: msg.conversationId,
      subject: msg.subject || '',
      from: {
        email: msg.from?.emailAddress?.address || '',
        name: msg.from?.emailAddress?.name,
      },
      to: (msg.toRecipients || []).map((r: any) => ({
        email: r.emailAddress?.address || '',
        name: r.emailAddress?.name,
      })),
      cc: (msg.ccRecipients || []).map((r: any) => ({
        email: r.emailAddress?.address || '',
        name: r.emailAddress?.name,
      })),
      date: new Date(msg.receivedDateTime),
      snippet: msg.bodyPreview || '',
      body: msg.body?.contentType === 'text' ? msg.body?.content : undefined,
      bodyHtml: msg.body?.contentType === 'html' ? msg.body?.content : undefined,
      labels: msg.categories || [],
      isRead: msg.isRead || false,
      isStarred: msg.flag?.flagStatus === 'flagged',
      hasAttachments: msg.hasAttachments || false,
    };
  }
}
