# AI Mail Client

An AI-powered email client built with Next.js 16 and Vercel AI SDK.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Vercel AI SDK** - AI integration toolkit
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI** - AI model provider (default)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (package manager)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/api/chat/route.ts` - AI chat API endpoint
- `src/app/page.tsx` - Main page component
- `src/app/layout.tsx` - Root layout

## Features

- ✅ Next.js 16 with App Router
- ✅ AI SDK integration ready
- ✅ TypeScript configured
- ✅ Tailwind CSS v4
- ✅ API route for AI chat (`/api/chat`)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
