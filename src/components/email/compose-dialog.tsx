'use client';

import * as React from 'react';
import { Send, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  replyTo?: {
    subject: string;
    from: string;
    body: string;
  };
}

export function ComposeDialog({
  open,
  onOpenChange,
  accountId,
  replyTo,
}: ComposeDialogProps) {
  const [to, setTo] = React.useState(replyTo?.from || '');
  const [subject, setSubject] = React.useState(
    replyTo ? `Re: ${replyTo.subject}` : ''
  );
  const [body, setBody] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [scheduledTime, setScheduledTime] = React.useState('');

  const handleGenerateReply = async () => {
    if (!replyTo) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: replyTo.body }),
      });

      const data = await response.json();
      if (data.reply) {
        setBody(data.reply);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          to: [{ email: to }],
          subject,
          message: body,
          scheduledTime: scheduledTime || undefined,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        setTo('');
        setSubject('');
        setBody('');
        setScheduledTime('');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
              placeholder="Email subject"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Message</label>
              {replyTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateReply}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Reply'}
                </Button>
              )}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 min-h-[200px]"
              placeholder="Type your message..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Send Later (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={!to || !subject || !body}>
              <Send className="h-4 w-4 mr-2" />
              {scheduledTime ? 'Schedule' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
