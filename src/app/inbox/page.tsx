'use client';

import * as React from 'react';
import { Inbox, Send, Star, Archive, Settings, Plus } from 'lucide-react';
import { AccountSwitcher } from '@/components/email/account-switcher';
import { EmailList } from '@/components/email/email-list';
import { EmailViewer } from '@/components/email/email-viewer';
import { ComposeDialog } from '@/components/email/compose-dialog';
import { SmartSearch } from '@/components/email/smart-search';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  name?: string;
}

interface EmailMessage {
  id: string;
  subject: string;
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  date: Date;
  snippet: string;
  body?: string;
  bodyHtml?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

export default function InboxPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = React.useState<string>();
  const [emails, setEmails] = React.useState<EmailMessage[]>([]);
  const [categorizedEmails, setCategorizedEmails] = React.useState<{
    important: EmailMessage[];
    newsletters: EmailMessage[];
    other: EmailMessage[];
  }>({ important: [], newsletters: [], other: [] });
  const [selectedEmailId, setSelectedEmailId] = React.useState<string>();
  const [selectedEmail, setSelectedEmail] = React.useState<EmailMessage>();
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<{
    subject: string;
    from: string;
    body: string;
  }>();
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Load accounts on mount
  React.useEffect(() => {
    loadAccounts();
  }, []);

  // Load emails when account changes
  React.useEffect(() => {
    if (currentAccountId) {
      loadEmails();
    }
  }, [currentAccountId, searchQuery]);

  // Load selected email details
  React.useEffect(() => {
    if (selectedEmailId && currentAccountId) {
      loadEmailDetails(selectedEmailId);
    }
  }, [selectedEmailId, currentAccountId]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
      if (data.accounts?.length > 0 && !currentAccountId) {
        setCurrentAccountId(data.accounts[0].id);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadEmails = async () => {
    if (!currentAccountId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        accountId: currentAccountId,
        maxResults: '50',
      });

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`/api/emails?${params}`);
      const data = await response.json();

      const emailsWithDates = (data.messages || []).map((msg: any) => ({
        ...msg,
        date: new Date(msg.date),
      }));

      setEmails(emailsWithDates);
      categorizeEmails(emailsWithDates);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeEmails = (emailList: EmailMessage[]) => {
    const categorized = {
      important: [] as EmailMessage[],
      newsletters: [] as EmailMessage[],
      other: [] as EmailMessage[],
    };

    emailList.forEach((email) => {
      const subject = email.subject.toLowerCase();
      const snippet = email.snippet.toLowerCase();

      // Newsletter detection
      if (
        snippet.includes('unsubscribe') ||
        snippet.includes('newsletter') ||
        subject.includes('newsletter')
      ) {
        categorized.newsletters.push(email);
      }
      // Important detection
      else if (
        email.isStarred ||
        subject.includes('urgent') ||
        subject.includes('important')
      ) {
        categorized.important.push(email);
      }
      // Everything else
      else {
        categorized.other.push(email);
      }
    });

    setCategorizedEmails(categorized);
  };

  const loadEmailDetails = async (emailId: string) => {
    if (!currentAccountId) return;

    try {
      const response = await fetch(
        `/api/emails/${emailId}?accountId=${currentAccountId}`
      );
      const data = await response.json();
      setSelectedEmail({ ...data, date: new Date(data.date) });
    } catch (error) {
      console.error('Error loading email details:', error);
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setReplyTo({
        subject: selectedEmail.subject,
        from: selectedEmail.from.email,
        body: selectedEmail.body || selectedEmail.snippet,
      });
      setComposeOpen(true);
    }
  };

  const handleSnooze = async () => {
    if (!selectedEmail || !currentAccountId) return;

    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 4);

    try {
      await fetch('/api/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: currentAccountId,
          messageId: selectedEmail.id,
          snoozeUntil: snoozeUntil.toISOString(),
        }),
      });

      // Reload emails
      loadEmails();
    } catch (error) {
      console.error('Error snoozing email:', error);
    }
  };

  const currentAccount = accounts.find((a) => a.id === currentAccountId);

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to AI Mail Client</h1>
          <p className="text-zinc-500">Connect your email account to get started</p>
          <div className="space-y-2">
            <Button
              onClick={async () => {
                const response = await fetch('/api/auth/gmail');
                const data = await response.json();
                if (data.url) window.location.href = data.url;
              }}
            >
              Connect Gmail
            </Button>
            <br />
            <Button
              onClick={async () => {
                const response = await fetch('/api/auth/outlook');
                const data = await response.json();
                if (data.url) window.location.href = data.url;
              }}
            >
              Connect Outlook
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col">
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-4">AI Mail</h1>
          <AccountSwitcher
            accounts={accounts}
            currentAccountId={currentAccountId}
            onAccountSelect={setCurrentAccountId}
          />
        </div>

        <Button
          className="mb-4"
          onClick={() => {
            setReplyTo(undefined);
            setComposeOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>

        <nav className="space-y-1 flex-1">
          <NavItem icon={Inbox} label="Inbox" active />
          <NavItem icon={Star} label="Starred" />
          <NavItem icon={Send} label="Sent" />
          <NavItem icon={Archive} label="Archive" />
          <NavItem icon={Settings} label="Settings" />
        </nav>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <SmartSearch
            onSearch={setSearchQuery}
            provider={currentAccount?.provider}
          />
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="important">Important</TabsTrigger>
            <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="all" className="mt-0 h-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  Loading...
                </div>
              ) : (
                <EmailList
                  emails={emails}
                  selectedId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                />
              )}
            </TabsContent>

            <TabsContent value="important" className="mt-0 h-full">
              <EmailList
                emails={categorizedEmails.important}
                selectedId={selectedEmailId}
                onSelect={setSelectedEmailId}
              />
            </TabsContent>

            <TabsContent value="newsletters" className="mt-0 h-full">
              <EmailList
                emails={categorizedEmails.newsletters}
                selectedId={selectedEmailId}
                onSelect={setSelectedEmailId}
              />
            </TabsContent>

            <TabsContent value="other" className="mt-0 h-full">
              <EmailList
                emails={categorizedEmails.other}
                selectedId={selectedEmailId}
                onSelect={setSelectedEmailId}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Email Viewer */}
      <div className="flex-1 bg-white dark:bg-zinc-950">
        {selectedEmail && currentAccountId ? (
          <EmailViewer
            email={selectedEmail}
            accountId={currentAccountId}
            onReply={handleReply}
            onSnooze={handleSnooze}
            onGenerateReply={() => {
              handleReply();
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500">
            Select an email to read
          </div>
        )}
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setReplyTo(undefined);
        }}
        accountId={currentAccountId || ''}
        replyTo={replyTo}
      />
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
        active
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
