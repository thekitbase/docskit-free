import type { Pager } from "@/lib/get-pager";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function DocsPager({ prev, next }: Pager) {
  if (!prev && !next) return null;

  return (
    <nav
      className="mt-12 flex items-center justify-between border-t border-[var(--border)] pt-6"
      aria-label="Pagination"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]"
        >
          <ChevronLeft
            size={16}
            className="text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
            aria-hidden={true}
          />
          <div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Previous
            </p>
            <p className="font-medium text-[var(--foreground)]">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]"
        >
          <div className="text-right">
            <p className="text-[11px] text-[var(--muted-foreground)]">Next</p>
            <p className="font-medium text-[var(--foreground)]">{next.title}</p>
          </div>
          <ChevronRight
            size={16}
            className="text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
            aria-hidden={true}
          />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
