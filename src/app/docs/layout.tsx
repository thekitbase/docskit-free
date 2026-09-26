import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileSidebarDrawer } from "@/components/docs/MobileSidebarDrawer";
import { Sidebar } from "@/components/docs/Sidebar";
import Link from "next/link";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <MobileSidebarDrawer />
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)]">Docs</span>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://thekitbase.app/templates/docskit?utm_source=docskit-free&utm_medium=docs-nav&utm_campaign=docskit"
              className="hidden text-[13px] font-medium text-[var(--primary)] transition-opacity hover:opacity-80 sm:block"
            >
              Get Pro →
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6">
        <aside className="hidden w-[var(--sidebar-width)] shrink-0 lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4">
            <Sidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
