'use client';

import * as React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartSearchProps {
  onSearch: (query: string) => void;
  provider?: 'gmail' | 'outlook';
}

export function SmartSearch({ onSearch, provider }: SmartSearchProps) {
  const [query, setQuery] = React.useState('');
  const [isParsingNL, setIsParsingNL] = React.useState(false);

  const handleNaturalLanguageSearch = async () => {
    if (!query.trim()) return;

    setIsParsingNL(true);
    try {
      const response = await fetch('/api/ai/search-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, provider }),
      });

      const data = await response.json();
      if (data.query) {
        onSearch(data.query);
      }
    } catch (error) {
      console.error('Error parsing search query:', error);
      // Fallback to direct search
      onSearch(query);
    } finally {
      setIsParsingNL(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNaturalLanguageSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emails or use natural language..."
          className="w-full pl-10 pr-24 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={isParsingNL || !query.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          {isParsingNL ? 'Searching...' : 'AI Search'}
        </Button>
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        Try: &quot;unread emails from last week&quot; or &quot;messages with attachments&quot;
      </div>
    </form>
  );
}
