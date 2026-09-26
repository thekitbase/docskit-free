import React from "react";

type StepsProps = { children: React.ReactNode };

export function Steps({ children }: StepsProps) {
  const steps = React.Children.toArray(children);
  return (
    <div className="my-5">
      {steps.map((child, index) =>
        React.isValidElement<StepProps>(child)
          ? React.cloneElement(child, {
              index: index + 1,
              isLast: index === steps.length - 1,
            })
          : child,
      )}
    </div>
  );
}

type StepProps = {
  title: string;
  children: React.ReactNode;
  index?: number;
  isLast?: boolean;
};

export function Step({ title, children, index, isLast }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white ring-2 ring-[var(--background)]">
          {index}
        </div>
        {!isLast && <div className="mt-1 w-0.5 flex-1 bg-[var(--border)]" />}
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <h4 className="mb-1.5 text-sm font-semibold text-[var(--foreground)]">
          {title}
        </h4>
        <div className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {children}
        </div>
      </div>
    </div>
  );
}
