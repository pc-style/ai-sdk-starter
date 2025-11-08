'use client';

import * as React from 'react';
import { Star, Paperclip } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface EmailMessage {
  id: string;
  subject: string;
  from: { name?: string; email: string };
  date: Date;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

interface EmailListProps {
  emails: EmailMessage[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function EmailList({ emails, selectedId, onSelect }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        No emails found
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => onSelect(email.id)}
          className={cn(
            'w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors',
            selectedId === email.id && 'bg-zinc-100 dark:bg-zinc-800',
            !email.isRead && 'font-semibold'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="truncate text-sm">
                  {email.from.name || email.from.email}
                </span>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {formatDate(new Date(email.date))}
                </span>
              </div>
              <div className="text-sm truncate mb-1">{email.subject}</div>
              <div className="text-xs text-zinc-500 truncate">
                {email.snippet}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {email.isStarred && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
              {email.hasAttachments && (
                <Paperclip className="h-4 w-4 text-zinc-400" />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
