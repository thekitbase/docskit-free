import type { MDXComponents } from "mdx/types";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { Step, Steps } from "./Steps";
import { Tab, Tabs } from "./Tabs";

export const mdxComponents: MDXComponents = {
  Callout,
  CodeBlock,
  Steps,
  Step,
  Tabs,
  Tab,
  h1: ({ children }: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mb-4 mt-2 text-3xl font-bold text-[var(--foreground)] [&>a]:!text-[var(--foreground)] [&>a]:!no-underline [&>a]:transition-colors hover:[&>a]:!text-[var(--primary)]">
      {children}
    </h1>
  ),
  h2: ({ children, id }: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      id={id}
      className="mb-3 mt-8 scroll-mt-20 text-xl font-semibold text-[var(--foreground)] [&>a]:!text-[var(--foreground)] [&>a]:!no-underline [&>a]:transition-colors hover:[&>a]:!text-[var(--primary)]"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }: React.ComponentPropsWithoutRef<"h3">) => (
    <h3
      id={id}
      className="mb-2 mt-6 scroll-mt-20 text-base font-semibold text-[var(--foreground)] [&>a]:!text-[var(--foreground)] [&>a]:!no-underline [&>a]:transition-colors hover:[&>a]:!text-[var(--primary)]"
    >
      {children}
    </h3>
  ),
  p: ({ children }: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mb-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
      {children}
    </p>
  ),
  ul: ({ children }: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-4 space-y-1.5 pl-4">{children}</ul>
  ),
  ol: ({ children }: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-4">{children}</ol>
  ),
  li: ({ children }: React.ComponentPropsWithoutRef<"li">) => (
    <li className="text-[15px] leading-relaxed text-[var(--muted-foreground)]">
      {children}
    </li>
  ),
  code: ({ children, className }: React.ComponentPropsWithoutRef<"code">) => {
    if (!className) {
      return (
        <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--primary)]">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }: React.ComponentPropsWithoutRef<"pre">) => (
    <pre className="my-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
      {children}
    </pre>
  ),
  a: ({ href, children }: React.ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      className="text-[var(--primary)] underline underline-offset-2 hover:text-[var(--primary-hover)]"
    >
      {children}
    </a>
  ),
  table: ({ children }: React.ComponentPropsWithoutRef<"table">) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: React.ComponentPropsWithoutRef<"thead">) => (
    <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
      {children}
    </thead>
  ),
  th: ({ children }: React.ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">
      {children}
    </th>
  ),
  td: ({ children }: React.ComponentPropsWithoutRef<"td">) => (
    <td className="border-t border-[var(--border)] px-4 py-3 text-[var(--muted-foreground)]">
      {children}
    </td>
  ),
  blockquote: ({ children }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="my-4 border-l-4 border-[var(--primary)] pl-4 italic text-[var(--muted-foreground)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-[var(--border)]" />,
};
