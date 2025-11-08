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
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Welcome to AI Mail</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Connect your email account to get started with AI-powered email management
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={async () => {
                const response = await fetch('/api/auth/gmail');
                const data = await response.json();
                if (data.url) window.location.href = data.url;
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/>
              </svg>
              Connect Gmail
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={async () => {
                const response = await fetch('/api/auth/outlook');
                const data = await response.json();
                if (data.url) window.location.href = data.url;
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4v16h10V4H7zm5 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
              </svg>
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
          <h1 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">AI Mail</h1>
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

        <nav className="space-y-1 flex-1" role="navigation" aria-label="Main navigation">
          <NavItem icon={Inbox} label="Inbox" active count={emails.filter(e => !e.isRead).length} />
          <NavItem icon={Star} label="Starred" count={emails.filter(e => e.isStarred).length} />
          <NavItem icon={Send} label="Sent" disabled />
          <NavItem icon={Archive} label="Archive" disabled />
          <div className="pt-4">
            <NavItem icon={Settings} label="Settings" disabled />
          </div>
        </nav>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Inbox</h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {emails.length} {emails.length === 1 ? 'email' : 'emails'}
            </span>
          </div>
          <SmartSearch
            onSearch={setSearchQuery}
            provider={currentAccount?.provider}
          />
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 flex-shrink-0">
            <TabsTrigger value="all">
              All {emails.length > 0 && `(${emails.length})`}
            </TabsTrigger>
            <TabsTrigger value="important">
              Important {categorizedEmails.important.length > 0 && `(${categorizedEmails.important.length})`}
            </TabsTrigger>
            <TabsTrigger value="newsletters">
              Newsletters {categorizedEmails.newsletters.length > 0 && `(${categorizedEmails.newsletters.length})`}
            </TabsTrigger>
            <TabsTrigger value="other">
              Other {categorizedEmails.other.length > 0 && `(${categorizedEmails.other.length})`}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="all" className="mt-0 h-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 text-zinc-600 dark:text-zinc-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-sm">Loading emails...</p>
                </div>
              ) : (
                <EmailList
                  emails={emails}
                  selectedId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                />
              )}
            </TabsContent>

            <TabsContent value="important" className="mt-0 h-auto">
              <EmailList
                emails={categorizedEmails.important}
                selectedId={selectedEmailId}
                onSelect={setSelectedEmailId}
              />
            </TabsContent>

            <TabsContent value="newsletters" className="mt-0 h-auto">
              <EmailList
                emails={categorizedEmails.newsletters}
                selectedId={selectedEmailId}
                onSelect={setSelectedEmailId}
              />
            </TabsContent>

            <TabsContent value="other" className="mt-0 h-auto">
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
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 dark:text-zinc-400 space-y-3">
            <Inbox className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No email selected</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Select an email from the list to view its contents</p>
            </div>
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
  count,
  disabled = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        active
          ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-medium'
          : disabled
          ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50'
      )}
      aria-current={active ? 'page' : undefined}
      title={disabled ? `${label} (Coming soon)` : label}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && !disabled && (
        <span className={cn(
          'px-2 py-0.5 text-xs rounded-full font-medium',
          active
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
