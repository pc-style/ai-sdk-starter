export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-16 px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            AI Mail Client
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            An AI-powered email client built with Next.js 16 and Vercel AI SDK.
            Ready to build amazing email experiences.
          </p>
          <div className="mt-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 p-6 text-left">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
              Setup Complete ✓
            </h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• Next.js 16 initialized</li>
              <li>• AI SDK installed and configured</li>
              <li>• API route ready at /api/chat</li>
              <li>• TypeScript + Tailwind CSS configured</li>
            </ul>
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
              Don't forget to add your OPENAI_API_KEY to .env.local
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
