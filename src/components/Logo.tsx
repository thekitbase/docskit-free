export function Logo() {
  return (
    <span className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)] text-[10px] font-bold text-white">
        D
      </span>
      DocsKit{" "}
      <span className="font-normal text-[var(--muted-foreground)]">Free</span>
    </span>
  );
}
