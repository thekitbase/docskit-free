"use client";

import { useState } from "react";
import React from "react";

type TabProps = { label: string; children: React.ReactNode };

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);

  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> =>
      React.isValidElement(child),
  );

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-[var(--border)]">
      <div
        role="tablist"
        className="flex border-b border-[var(--border)] bg-[var(--card)]"
      >
        {tabs.map((tab, i) => (
          <button
            type="button"
            key={tab.props.label}
            role="tab"
            aria-selected={i === active}
            aria-controls={`tab-panel-${i}`}
            id={`tab-${i}`}
            onClick={() => setActive(i)}
            className={`relative px-4 py-2.5 text-xs font-medium transition-colors duration-150 ${
              i === active
                ? "text-[var(--primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--primary)] after:content-['']"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tab-panel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {tabs[active]}
      </div>
    </div>
  );
}
