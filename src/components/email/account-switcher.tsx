'use client';

import * as React from 'react';
import { Check, Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  name?: string;
}

interface AccountSwitcherProps {
  accounts: Account[];
  currentAccountId?: string;
  onAccountSelect: (accountId: string) => void;
}

export function AccountSwitcher({
  accounts,
  currentAccountId,
  onAccountSelect,
}: AccountSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const currentAccount = accounts.find((a) => a.id === currentAccountId);

  const handleConnectGmail = async () => {
    const response = await fetch('/api/auth/gmail');
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handleConnectOutlook = async () => {
    const response = await fetch('/api/auth/outlook');
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Mail className="mr-2 h-4 w-4" />
          <span className="truncate">
            {currentAccount?.email || 'Select account'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                onAccountSelect(account.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                currentAccountId === account.id && 'bg-zinc-100 dark:bg-zinc-800'
              )}
            >
              <Mail className="h-4 w-4" />
              <div className="flex-1 truncate">
                <div className="font-medium">{account.email}</div>
                {account.name && (
                  <div className="text-xs text-zinc-500">{account.name}</div>
                )}
              </div>
              {currentAccountId === account.id && <Check className="h-4 w-4" />}
            </button>
          ))}
          <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <div className="text-xs font-medium text-zinc-500 mb-2 px-3">
              Add Account
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleConnectGmail}
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect Gmail
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleConnectOutlook}
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect Outlook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
