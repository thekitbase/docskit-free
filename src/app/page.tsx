import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Github } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DocsKit Free - Open-Source Next.js Docs Template",
  description:
    "The free, MIT-licensed core of DocsKit: a Next.js documentation site with MDX, a sidebar + TOC layout, and dark/light mode. No search or syntax highlighting - those are in DocsKit Pro.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com",
  },
};

const included = [
  "MDX content with Callout, CodeBlock, Steps, and Tabs components",
  "Sidebar navigation + auto-generated table of contents",
  "Dark and light mode, no flash on load",
  "Static export - deploy anywhere",
];

const proOnly = [
  "Syntax-highlighted code blocks (Shiki, 100+ languages)",
  "Full-text search (Pagefind)",
  "A complete marketing homepage - hero, features, pricing, FAQ",
  "Configuration and API reference doc sections",
];

export default function HomePage() {
  return (
    <main>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-4 text-[13px] text-[var(--muted-foreground)]">
            <Link
              href="/docs"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              Docs
            </Link>
            <a
              href="https://github.com/thekitbase/docskit-free"
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--foreground)]"
            >
              <Github size={14} />
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--primary)]">
          Free &middot; MIT licensed
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
          A real Next.js docs site. No strings attached.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--muted-foreground)]">
          DocsKit Free is the open-source core of{" "}
          <a
            href="https://thekitbase.app/templates/docskit?utm_source=docskit-free&utm_medium=homepage&utm_campaign=docskit"
            className="text-[var(--primary)] underline underline-offset-2"
          >
            DocsKit
          </a>
          : sidebar navigation, a table of contents, MDX with real components,
          dark and light mode. Clone it, deploy it, ship your docs today.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="flex h-11 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            View the docs
            <ArrowRight size={15} />
          </Link>
          <a
            href="https://github.com/thekitbase/docskit-free"
            className="flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] px-5 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/50"
          >
            <Github size={15} />
            View on GitHub
          </a>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--foreground)]">
              What&apos;s included
            </p>
            <ul className="mt-3 space-y-2">
              {included.map((item) => (
                <li
                  key={item}
                  className="text-[14px] leading-relaxed text-[var(--muted-foreground)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--foreground)]">
              DocsKit Pro adds
            </p>
            <ul className="mt-3 space-y-2">
              {proOnly.map((item) => (
                <li
                  key={item}
                  className="text-[14px] leading-relaxed text-[var(--muted-foreground)]"
                >
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://thekitbase.app/templates/docskit?utm_source=docskit-free&utm_medium=homepage&utm_campaign=docskit"
              className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--primary)]"
            >
              Get DocsKit Pro - $39 one-time
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
