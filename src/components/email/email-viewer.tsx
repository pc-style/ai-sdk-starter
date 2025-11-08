'use client';

import * as React from 'react';
import { Star, Reply, Forward, Archive, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface EmailMessage {
  id: string;
  subject: string;
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  date: Date;
  body?: string;
  bodyHtml?: string;
  isStarred: boolean;
}

interface EmailViewerProps {
  email: EmailMessage;
  accountId: string;
  onReply: () => void;
  onSnooze: () => void;
  onGenerateReply?: () => void;
}

export function EmailViewer({
  email,
  accountId,
  onReply,
  onSnooze,
  onGenerateReply,
}: EmailViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-xl font-semibold mb-2">{email.subject}</h2>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-medium">
              {email.from.name || email.from.email}
            </div>
            <div className="text-xs text-zinc-500">{email.from.email}</div>
          </div>
          <div className="text-sm text-zinc-500">
            {formatDate(new Date(email.date))}
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          To: {email.to.map((t) => t.email).join(', ')}
        </div>
      </div>

      <div className="flex gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <Button variant="outline" size="sm" onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
        {onGenerateReply && (
          <Button variant="outline" size="sm" onClick={onGenerateReply}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Reply
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onSnooze}>
          <Clock className="h-4 w-4 mr-2" />
          Snooze
        </Button>
        <Button variant="outline" size="sm">
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {email.bodyHtml ? (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <div className="whitespace-pre-wrap">{email.body}</div>
        )}
      </div>
    </div>
  );
}
