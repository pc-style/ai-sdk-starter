import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Mail Client",
  description: "An AI-powered email client built with Next.js 16 and Vercel AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
