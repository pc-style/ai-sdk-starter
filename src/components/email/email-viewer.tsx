'use client';

import * as React from 'react';
import { Star, Reply, Forward, Archive, Clock, Sparkles, ArrowLeft, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface EmailMessage {
  id: string;
  subject: string;
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  date: Date;
  snippet: string;
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
  onBack?: () => void;
}

export function EmailViewer({
  email,
  accountId,
  onReply,
  onSnooze,
  onGenerateReply,
  onBack,
}: EmailViewerProps) {
  const [labels, setLabels] = React.useState<Array<{ label: string; confidence: number; reason: string }>>([]);
  const [followUps, setFollowUps] = React.useState<Array<{ action: string; description: string; priority: string }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);

  // Load AI suggestions when email changes
  React.useEffect(() => {
    if (email) {
      loadAISuggestions();
    }
  }, [email.id]);

  const loadAISuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      // Fetch label suggestions
      const labelsResponse = await fetch('/api/ai/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          from: email.from.email,
          snippet: email.snippet,
          body: email.body,
        }),
      });

      if (labelsResponse.ok) {
        const labelsData = await labelsResponse.json();
        setLabels(labelsData.suggestions || []);
      }

      // Fetch follow-up suggestions
      const followUpsResponse = await fetch('/api/ai/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          from: email.from.email,
          snippet: email.snippet,
          body: email.body || email.bodyHtml,
        }),
      });

      if (followUpsResponse.ok) {
        const followUpsData = await followUpsResponse.json();
        setFollowUps(followUpsData.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-3 md:p-4">
        <div className="flex items-start gap-2 mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 flex-shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50 break-words">{email.subject}</h2>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {email.from.name || email.from.email}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">{email.from.email}</div>
          </div>
          <div className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 flex-shrink-0">
            {formatDate(new Date(email.date))}
          </div>
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          To: {email.to.map((t) => t.email).join(', ')}
        </div>
      </div>

      <div className="flex gap-2 p-3 md:p-4 border-b border-zinc-200 dark:border-zinc-800 flex-wrap">
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

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Email Body */}
        <div>
          {email.bodyHtml ? (
            <div
              className="prose dark:prose-invert max-w-none text-sm md:text-base text-zinc-900 dark:text-zinc-100"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm md:text-base text-zinc-900 dark:text-zinc-100 leading-relaxed">{email.body}</div>
          )}
        </div>

        {/* AI Suggestions */}
        {!loadingSuggestions && (labels.length > 0 || followUps.length > 0) && (
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {/* Suggested Labels */}
            {labels.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Suggestions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.slice(0, 3).map((label, idx) => (
                    <button
                      key={idx}
                      className="px-3 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                      title={label.reason}
                    >
                      {label.label}
                      <span className="ml-1 text-blue-600 dark:text-blue-500">({Math.round(label.confidence * 100)}%)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Actions */}
            {followUps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Suggested Actions</h3>
                </div>
                <div className="space-y-2">
                  {followUps.slice(0, 3).map((followUp, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                        followUp.priority === 'high'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                          : followUp.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      <div className="font-medium">{followUp.action}</div>
                      <div className="text-xs opacity-75 mt-1">{followUp.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
