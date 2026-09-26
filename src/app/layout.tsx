import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: "%s | DocsKit Free",
    default: "DocsKit Free - Open-Source Next.js Docs Template",
  },
  description:
    "The free, MIT-licensed core of DocsKit: MDX, sidebar + TOC docs layout, dark/light mode. Syntax highlighting, search, and the marketing homepage are in DocsKit Pro.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Static literal theme-init script, no interpolated/user-controlled data - must run before paint, so it can't be a normal event handler. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
