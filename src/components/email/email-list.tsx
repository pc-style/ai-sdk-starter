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
    <ul role="listbox" aria-label="Email list" className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {emails.map((email) => (
        <li
          key={email.id}
          role="option"
          aria-selected={selectedId === email.id}
          onClick={() => onSelect(email.id)}
          className={cn(
            'w-full cursor-pointer px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-150',
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1',
            selectedId === email.id && 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500',
            !email.isRead && 'bg-white dark:bg-zinc-900'
          )}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(email.id);
            }
          }}
        >
          <article className="flex items-start gap-3">
            {/* Unread indicator */}
            <div className="flex-shrink-0 pt-1.5">
              {!email.isRead && (
                <div
                  className="w-2.5 h-2.5 rounded-full bg-blue-500"
                  aria-label="Unread"
                  title="Unread email"
                />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              {/* Header: Sender and Time */}
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-sm",
                    !email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-50" : "font-medium text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {email.from.name || email.from.email}
                </span>
                <time
                  className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap flex-shrink-0"
                  dateTime={email.date.toISOString()}
                >
                  {formatDate(new Date(email.date))}
                </time>
              </div>

              {/* Subject */}
              <h3
                className={cn(
                  "text-sm truncate leading-tight",
                  !email.isRead ? "font-semibold text-zinc-900 dark:text-zinc-50" : "font-normal text-zinc-700 dark:text-zinc-300"
                )}
              >
                {email.subject || '(No subject)'}
              </h3>

              {/* Snippet */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
                {email.snippet}
              </p>
            </div>

            {/* Icons: Star and Attachment */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pt-1">
              {email.isStarred && (
                <Star
                  className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  aria-label="Starred"
                />
              )}
              {email.hasAttachments && (
                <Paperclip
                  className="h-4 w-4 text-zinc-400"
                  aria-label="Has attachments"
                />
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
