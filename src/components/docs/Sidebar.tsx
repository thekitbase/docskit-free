"use client";

import { nav } from "@/config/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-full space-y-6" aria-label="Documentation navigation">
      {nav.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group relative block rounded-md px-3 py-1.5 text-[14px] transition-all duration-150 ${
                      isActive
                        ? "bg-[var(--primary)]/10 font-semibold text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-[var(--primary)]" />
                    )}
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
