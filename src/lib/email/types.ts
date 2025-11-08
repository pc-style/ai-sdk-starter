// Common email types across providers

export interface EmailMessage {
  id: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: Date;
  snippet: string;
  body?: string;
  bodyHtml?: string;
  labels?: string[];
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailListOptions {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  query?: string;
}

export interface EmailListResult {
  messages: EmailMessage[];
  nextPageToken?: string;
  totalCount?: number;
}

export interface SendEmailOptions {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  isHtml?: boolean;
  inReplyTo?: string;
  threadId?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  type?: 'system' | 'user';
  color?: string;
}
