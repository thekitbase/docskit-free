"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";

export function MobileSidebarDrawer() {
  const [open, setOpen] = useState(false);

  // Close on route change (pathname updates)
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="rounded-md p-1.5 transition-colors hover:bg-[var(--muted)] lg:hidden"
      >
        <Menu size={20} className="text-[var(--foreground)]" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-[var(--border)] bg-[var(--card)] shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-end border-b border-[var(--border)] px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1.5 transition-colors hover:bg-[var(--muted)]"
              >
                <X size={18} className="text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Sidebar />
            </div>
          </nav>
        </>
      )}
    </>
  );
}
