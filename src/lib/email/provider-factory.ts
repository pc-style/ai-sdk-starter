import { Account } from '../db/schema';
import { GmailProvider } from './gmail-provider';
import { OutlookProvider } from './outlook-provider';
import {
  EmailMessage,
  EmailListOptions,
  EmailListResult,
  SendEmailOptions,
  EmailLabel,
} from './types';

export interface EmailProvider {
  listMessages(options?: EmailListOptions): Promise<EmailListResult>;
  getMessage(id: string): Promise<EmailMessage | null>;
  sendMessage(options: SendEmailOptions): Promise<void>;
  modifyLabels(messageId: string, addLabels?: string[], removeLabels?: string[]): Promise<void>;
  getLabels(): Promise<EmailLabel[]>;
  search(query: string): Promise<EmailMessage[]>;
}

export class ProviderFactory {
  static createProvider(account: Account): EmailProvider {
    switch (account.provider) {
      case 'gmail':
        return new GmailProvider(account);
      case 'outlook':
        return new OutlookProvider(account);
      default:
        throw new Error(`Unsupported provider: ${account.provider}`);
    }
  }
}
