# AI Mail Client

A modern, AI-powered email client built with Next.js 16 and Vercel AI SDK 5.

## Features

### Email Account Integration
- **Gmail Integration**: Connect via OAuth 2.0 and Gmail API
- **Outlook Integration**: Connect via OAuth 2.0 and Microsoft Graph API
- **Multi-Account Support**: Switch between multiple email accounts seamlessly

### Inbox Management
- **Smart Categorization**: Automatically categorize emails into Important, Newsletters, and Other
- **Snooze Emails**: Temporarily hide emails and bring them back later
- **Send Later**: Schedule emails to be sent at a specific time
- **Email Rules**: Create custom rules for auto-archiving and labeling

### AI-Powered Features (Using AI SDK 5)
- **Natural Language Search**: Search emails using plain English
  - Example: "unread emails from last week with attachments"
- **AI Reply Generation**: Get AI-generated draft replies to emails
- **Smart Label Suggestions**: AI suggests relevant labels/categories for emails
- **Follow-up Suggestions**: AI recommends appropriate follow-up actions

### User Interface
- **Split Inbox Views**: Separate views for Important, Newsletters, and Other emails
- **Account Switcher**: Easy switching between multiple email accounts
- **Compose Dialog**: Rich email composition with AI assistance
- **Smart Search**: Natural language search interface

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key
- Gmail OAuth credentials (optional)
- Outlook OAuth credentials (optional)

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

3. Set up OAuth credentials:

**For Gmail:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/gmail/callback`
6. Copy Client ID and Client Secret to `.env.local`

**For Outlook:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add Microsoft Graph API permissions (Mail.ReadWrite, Mail.Send, User.Read)
4. Add redirect URI: `http://localhost:3000/api/auth/outlook/callback`
5. Copy Application (client) ID and create a client secret
6. Copy values to `.env.local`

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # OAuth authentication
│   │   ├── emails/       # Email operations
│   │   ├── ai/           # AI SDK endpoints
│   │   ├── snooze/       # Snooze functionality
│   │   └── rules/        # Email rules
│   ├── inbox/            # Main inbox page
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   └── email/            # Email-specific components
└── lib/
    ├── db/               # SQLite database layer
    ├── email/            # Email provider integrations
    └── ai/               # AI prompts and helpers
```

## Database

The application uses SQLite for local data storage:

- **Accounts**: Stores connected email accounts and OAuth tokens
- **Snooze Entries**: Tracks snoozed emails
- **Send Later Queue**: Stores scheduled emails
- **Email Rules**: Stores custom email rules
- **Labels Cache**: Caches email labels/categories

Database file is stored in `data/mail.db`.

## AI Features

All AI features are powered by Vercel AI SDK 5:

### Natural Language Search
Converts natural language queries into provider-specific search syntax.

```typescript
// Example usage
await fetch('/api/ai/search-parse', {
  method: 'POST',
  body: JSON.stringify({
    query: "emails from john about project updates",
    provider: "gmail"
  })
});
```

### Reply Generation
Generates contextual email replies based on the original message.

```typescript
await fetch('/api/ai/reply', {
  method: 'POST',
  body: JSON.stringify({
    emailContent: originalEmail.body
  })
});
```

### Label Suggestions
Analyzes email content and suggests appropriate labels.

```typescript
await fetch('/api/ai/labels', {
  method: 'POST',
  body: JSON.stringify({
    subject: email.subject,
    from: email.from,
    snippet: email.snippet
  })
});
```

## API Reference

### Email Endpoints

- `GET /api/accounts` - List all connected accounts
- `GET /api/emails?accountId={id}` - List emails for account
- `GET /api/emails/{id}?accountId={id}` - Get email details
- `POST /api/emails/send` - Send or schedule email

### AI Endpoints

- `POST /api/ai/search-parse` - Parse natural language search
- `POST /api/ai/reply` - Generate email reply
- `POST /api/ai/labels` - Suggest email labels
- `POST /api/ai/follow-ups` - Suggest follow-up actions

### Management Endpoints

- `POST /api/snooze` - Snooze an email
- `GET /api/snooze?accountId={id}` - List snoozed emails
- `POST /api/rules` - Create email rule
- `GET /api/rules?accountId={id}` - List rules

## Development

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **AI**: Vercel AI SDK 5 with OpenAI
- **Database**: SQLite with better-sqlite3
- **UI**: Tailwind CSS + Radix UI
- **Email APIs**: Gmail API, Microsoft Graph API
- **OAuth**: Google OAuth2, Azure MSAL

### Adding New Features

1. Create API route in `src/app/api/`
2. Add UI components in `src/components/`
3. Update database schema in `src/lib/db/schema.ts` if needed
4. Add AI prompts in `src/lib/ai/prompts.ts` for AI features

## Production Deployment

1. Update `NEXT_PUBLIC_APP_URL` in environment variables
2. Update OAuth redirect URIs in Google/Azure consoles
3. Build and deploy:

```bash
pnpm build
pnpm start
```

## Security Notes

- OAuth tokens are stored in local SQLite database
- Never commit `.env.local` or database files
- Tokens are never sent to the client
- All API routes validate account ownership

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
