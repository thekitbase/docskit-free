"use client";

import type { Heading } from "@/lib/get-headings";
import { useEffect, useState } from "react";

type Props = { headings: Heading[] };

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0.1 },
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden w-[var(--toc-width)] shrink-0 lg:block">
      <div className="sticky top-16 pt-8">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          On this page
        </p>
        <ul className="space-y-1.5">
          {headings.map((h) => (
            <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${h.id}`}
                className={`block text-[13px] transition-colors duration-150 ${
                  activeId === h.id
                    ? "font-medium text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 text-[12px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 11l7-7 7 7M5 19l7-7 7 7"
              />
            </svg>
            Back to top
          </button>
        </div>
      </div>
    </aside>
  );
}
