'use client';

import * as React from 'react';
import { Inbox, Send, Star, Archive, Settings, Plus, Menu, X, AlertCircle } from 'lucide-react';
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
  folder?: string;
}

interface PersistedState {
  currentAccountId?: string;
  selectedEmailId?: string;
}

export default function InboxPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = React.useState<string>();
  const [emails, setEmails] = React.useState<EmailMessage[]>([]);
  const [sentEmails, setSentEmails] = React.useState<EmailMessage[]>([]);
  const [archivedEmails, setArchivedEmails] = React.useState<EmailMessage[]>([]);
  const [categorizedEmails, setCategorizedEmails] = React.useState<{
    important: EmailMessage[];
    newsletters: EmailMessage[];
    other: EmailMessage[];
  }>({ important: [], newsletters: [], other: [] });
  const [selectedEmailId, setSelectedEmailId] = React.useState<string>();
  const [selectedEmail, setSelectedEmail] = React.useState<EmailMessage>();
  const [selectedFolder, setSelectedFolder] = React.useState<'inbox' | 'sent' | 'archive' | 'starred'>('inbox');
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<{
    subject: string;
    from: string;
    body: string;
  }>();
  const [loading, setLoading] = React.useState(false);
  const [loadingEmailDetails, setLoadingEmailDetails] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Load persisted state on mount
  React.useEffect(() => {
    const savedState = localStorage.getItem('inboxState');
    if (savedState) {
      try {
        const parsed: PersistedState = JSON.parse(savedState);
        if (parsed.currentAccountId) {
          setCurrentAccountId(parsed.currentAccountId);
        }
        if (parsed.selectedEmailId) {
          setSelectedEmailId(parsed.selectedEmailId);
        }
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
    }
    loadAccounts();
  }, []);

  // Persist state to localStorage
  React.useEffect(() => {
    const state: PersistedState = {
      currentAccountId,
      selectedEmailId,
    };
    localStorage.setItem('inboxState', JSON.stringify(state));
  }, [currentAccountId, selectedEmailId]);

  // Load emails when account or folder changes
  React.useEffect(() => {
    if (currentAccountId) {
      if (selectedFolder === 'inbox') {
        loadEmails();
      } else if (selectedFolder === 'sent') {
        loadSentEmails();
      } else if (selectedFolder === 'archive') {
        loadArchivedEmails();
      }
    }
  }, [currentAccountId, searchQuery, selectedFolder]);

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
      setError(null);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    }
  };

  const loadEmails = async () => {
    if (!currentAccountId) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        accountId: currentAccountId,
        maxResults: '50',
      });

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`/api/emails?${params}`);
      if (!response.ok) throw new Error('Failed to load emails');

      const data = await response.json();

      const emailsWithDates = (data.messages || []).map((msg: any) => ({
        ...msg,
        date: new Date(msg.date),
        folder: 'inbox',
      }));

      setEmails(emailsWithDates);
      categorizeEmails(emailsWithDates);
    } catch (error) {
      console.error('Error loading emails:', error);
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const loadSentEmails = async () => {
    if (!currentAccountId) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        accountId: currentAccountId,
        maxResults: '50',
        folder: 'sent',
      });

      const response = await fetch(`/api/emails?${params}`);
      if (!response.ok) throw new Error('Failed to load sent emails');

      const data = await response.json();
      const emailsWithDates = (data.messages || []).map((msg: any) => ({
        ...msg,
        date: new Date(msg.date),
        folder: 'sent',
      }));

      setSentEmails(emailsWithDates);
    } catch (error) {
      console.error('Error loading sent emails:', error);
      setError('Failed to load sent emails');
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedEmails = async () => {
    if (!currentAccountId) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        accountId: currentAccountId,
        maxResults: '50',
        folder: 'archive',
      });

      const response = await fetch(`/api/emails?${params}`);
      if (!response.ok) throw new Error('Failed to load archived emails');

      const data = await response.json();
      const emailsWithDates = (data.messages || []).map((msg: any) => ({
        ...msg,
        date: new Date(msg.date),
        folder: 'archive',
      }));

      setArchivedEmails(emailsWithDates);
    } catch (error) {
      console.error('Error loading archived emails:', error);
      setError('Failed to load archived emails');
    } finally {
      setLoading(false);
    }
  };

  const categorizeEmails = async (emailList: EmailMessage[]) => {
    const categorized = {
      important: [] as EmailMessage[],
      newsletters: [] as EmailMessage[],
      other: [] as EmailMessage[],
    };

    try {
      // Try AI categorization for better accuracy
      if (emailList.length > 0) {
        const response = await fetch('/api/emails/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: emailList }),
        });

        if (response.ok) {
          const { categorizations } = await response.json();

          // Create a map of email ID to category
          const categoryMap = new Map(
            categorizations.map((cat: any) => [cat.emailId, cat.category])
          );

          // Categorize emails using AI results
          emailList.forEach((email) => {
            const category = categoryMap.get(email.id) || 'other';
            if (category === 'important') {
              categorized.important.push(email);
            } else if (category === 'newsletters') {
              categorized.newsletters.push(email);
            } else {
              categorized.other.push(email);
            }
          });

          setCategorizedEmails(categorized);
          return;
        }
      }
    } catch (error) {
      console.error('Error with AI categorization, falling back to keyword-based:', error);
    }

    // Fallback to keyword-based categorization if AI fails
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

    setLoadingEmailDetails(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/emails/${emailId}?accountId=${currentAccountId}`
      );
      if (!response.ok) throw new Error('Failed to load email details');

      const data = await response.json();
      setSelectedEmail({ ...data, date: new Date(data.date) });
    } catch (error) {
      console.error('Error loading email details:', error);
      setError('Failed to load email');
    } finally {
      setLoadingEmailDetails(false);
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

  const currentEmailList = selectedFolder === 'inbox'
    ? emails
    : selectedFolder === 'sent'
    ? sentEmails
    : selectedFolder === 'archive'
    ? archivedEmails
    : selectedFolder === 'starred'
    ? emails.filter(e => e.isStarred)
    : [];

  const folderLabel = selectedFolder === 'inbox'
    ? 'Inbox'
    : selectedFolder === 'sent'
    ? 'Sent'
    : selectedFolder === 'archive'
    ? 'Archive'
    : 'Inbox';

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black flex-col md:flex-row">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800 p-3 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm z-50">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button className="ml-auto text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col md:flex-col transition-all duration-300",
        !sidebarOpen && "hidden md:flex"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">AI Mail</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <AccountSwitcher
            accounts={accounts}
            currentAccountId={currentAccountId}
            onAccountSelect={setCurrentAccountId}
          />
        </div>

        <Button
          className="mb-4 w-full"
          onClick={() => {
            setReplyTo(undefined);
            setComposeOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>

        <nav className="space-y-1 flex-1" role="navigation" aria-label="Main navigation">
          <NavItem
            icon={Inbox}
            label="Inbox"
            active={selectedFolder === 'inbox'}
            count={emails.filter(e => !e.isRead).length}
            onClick={() => {
              setSelectedFolder('inbox');
              setSelectedEmailId(undefined);
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Star}
            label="Starred"
            count={emails.filter(e => e.isStarred).length}
            onClick={() => {
              setSelectedFolder('starred');
              setSelectedEmailId(undefined);
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Send}
            label="Sent"
            active={selectedFolder === 'sent'}
            count={sentEmails.length}
            onClick={() => {
              setSelectedFolder('sent');
              setSelectedEmailId(undefined);
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Archive}
            label="Archive"
            active={selectedFolder === 'archive'}
            count={archivedEmails.length}
            onClick={() => {
              setSelectedFolder('archive');
              setSelectedEmailId(undefined);
              setSidebarOpen(false);
            }}
          />
          <div className="pt-4">
            <NavItem
              icon={Settings}
              label="Settings"
              onClick={() => {
                setSidebarOpen(false);
                // TODO: Implement settings page
              }}
            />
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Email List */}
        <div className={cn(
          "w-full md:w-96 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden",
          selectedEmailId && "hidden md:flex"
        )}>
          <div className="p-3 md:p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex-1">{folderLabel}</h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {currentEmailList.length}
              </span>
            </div>
            {selectedFolder === 'inbox' && (
              <SmartSearch
                onSearch={setSearchQuery}
                provider={currentAccount?.provider}
              />
            )}
          </div>

          {selectedFolder === 'inbox' && (
            <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-2 md:mx-4 mt-2 flex-shrink-0 grid grid-cols-4 h-auto">
                <TabsTrigger value="all" className="text-xs md:text-sm">
                  All {emails.length > 0 && `(${emails.length})`}
                </TabsTrigger>
                <TabsTrigger value="important" className="text-xs md:text-sm">
                  Imp {categorizedEmails.important.length > 0 && `(${categorizedEmails.important.length})`}
                </TabsTrigger>
                <TabsTrigger value="newsletters" className="text-xs md:text-sm">
                  News {categorizedEmails.newsletters.length > 0 && `(${categorizedEmails.newsletters.length})`}
                </TabsTrigger>
                <TabsTrigger value="other" className="text-xs md:text-sm">
                  Other {categorizedEmails.other.length > 0 && `(${categorizedEmails.other.length})`}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto min-h-0">
                <TabsContent value="all" className="mt-0 h-auto">
                  {loading ? (
                    <EmailListSkeleton />
                  ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-600 dark:text-zinc-400">
                      <Inbox className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-sm">No emails found</p>
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
                  {categorizedEmails.important.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-600 dark:text-zinc-400">
                      <Star className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-sm">No important emails</p>
                    </div>
                  ) : (
                    <EmailList
                      emails={categorizedEmails.important}
                      selectedId={selectedEmailId}
                      onSelect={setSelectedEmailId}
                    />
                  )}
                </TabsContent>

                <TabsContent value="newsletters" className="mt-0 h-auto">
                  {categorizedEmails.newsletters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-600 dark:text-zinc-400">
                      <Send className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-sm">No newsletters</p>
                    </div>
                  ) : (
                    <EmailList
                      emails={categorizedEmails.newsletters}
                      selectedId={selectedEmailId}
                      onSelect={setSelectedEmailId}
                    />
                  )}
                </TabsContent>

                <TabsContent value="other" className="mt-0 h-auto">
                  {categorizedEmails.other.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-600 dark:text-zinc-400">
                      <Inbox className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-sm">No other emails</p>
                    </div>
                  ) : (
                    <EmailList
                      emails={categorizedEmails.other}
                      selectedId={selectedEmailId}
                      onSelect={setSelectedEmailId}
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}

          {(selectedFolder === 'sent' || selectedFolder === 'archive' || selectedFolder === 'starred') && (
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <EmailListSkeleton />
              ) : currentEmailList.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-600 dark:text-zinc-400">
                  <Inbox className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm">No emails in {folderLabel.toLowerCase()}</p>
                </div>
              ) : (
                <EmailList
                  emails={currentEmailList}
                  selectedId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                />
              )}
            </div>
          )}
        </div>

        {/* Email Viewer */}
        <div className={cn(
          "w-full flex-1 bg-white dark:bg-zinc-950 md:flex",
          !selectedEmailId && "hidden md:flex"
        )}>
          {selectedEmail && currentAccountId ? (
            loadingEmailDetails ? (
              <EmailViewerSkeleton />
            ) : (
              <EmailViewer
                email={selectedEmail}
                accountId={currentAccountId}
                onReply={handleReply}
                onSnooze={handleSnooze}
                onGenerateReply={() => {
                  handleReply();
                }}
                onBack={() => setSelectedEmailId(undefined)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-zinc-600 dark:text-zinc-400 space-y-3">
              <Inbox className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No email selected</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Select an email from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
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
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  count?: number;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
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

function EmailListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 border-b border-zinc-200 dark:border-zinc-800 animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2"></div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

function EmailViewerSkeleton() {
  return (
    <div className="flex flex-col h-full p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div>
        ))}
      </div>
      <div className="space-y-3 flex-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        ))}
      </div>
    </div>
  );
}
