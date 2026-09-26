"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

type CodeBlockProps = {
  children: React.ReactNode;
  filename?: string;
  className?: string;
};

export function CodeBlock({ children, filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleCopy() {
    const codeEl = containerRef.current?.querySelector("code");
    const text = codeEl?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      ref={containerRef}
      className="group relative my-5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]"
      data-codefile={filename ?? ""}
    >
      {filename && (
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              {filename}
            </span>
          </div>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied!" : "Copy code"}
          title={copied ? "Copied!" : "Copy code"}
          className={`absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-[11px] font-medium transition-all duration-200 ${
            copied
              ? "border-green-500/50 bg-green-500/10 text-green-400 opacity-100"
              : "text-[var(--muted-foreground)] opacity-0 hover:border-[var(--primary)]/40 hover:text-[var(--foreground)] group-hover:opacity-100"
          }`}
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={2.5} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} strokeWidth={2} />
              <span>Copy</span>
            </>
          )}
        </button>
        <div className={`overflow-x-auto text-sm ${className ?? ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
