import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";

export type CalloutVariant = "note" | "warning" | "tip" | "danger";

const config: Record<
  CalloutVariant,
  {
    icon: React.ReactNode;
    border: string;
    bg: string;
    iconClass: string;
    labelClass: string;
    label: string;
  }
> = {
  note: {
    icon: <Info size={14} strokeWidth={2.5} />,
    border: "border-l-blue-500",
    bg: "bg-blue-500/[0.07] light:bg-blue-50",
    iconClass: "text-blue-400 light:text-blue-600",
    labelClass: "[&_strong]:text-blue-400 light:[&_strong]:text-blue-700",
    label: "Note",
  },
  warning: {
    icon: <AlertTriangle size={14} strokeWidth={2.5} />,
    border: "border-l-yellow-500",
    bg: "bg-yellow-500/[0.07] light:bg-amber-50",
    iconClass: "text-yellow-400 light:text-yellow-600",
    labelClass: "[&_strong]:text-yellow-400 light:[&_strong]:text-yellow-700",
    label: "Warning",
  },
  tip: {
    icon: <Lightbulb size={14} strokeWidth={2.5} />,
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/[0.07] light:bg-emerald-50",
    iconClass: "text-emerald-400 light:text-emerald-600",
    labelClass: "[&_strong]:text-emerald-400 light:[&_strong]:text-emerald-700",
    label: "Tip",
  },
  danger: {
    icon: <AlertCircle size={14} strokeWidth={2.5} />,
    border: "border-l-red-500",
    bg: "bg-red-500/[0.07] light:bg-red-50",
    iconClass: "text-red-400 light:text-red-500",
    labelClass: "[&_strong]:text-red-400 light:[&_strong]:text-red-600",
    label: "Danger",
  },
};

type CalloutProps = {
  variant?: CalloutVariant;
  children: React.ReactNode;
};

export function Callout({ variant = "note", children }: CalloutProps) {
  const { icon, border, bg, iconClass, labelClass, label } = config[variant];
  return (
    <div
      role="note"
      aria-label={label}
      className={`my-5 flex gap-3 rounded-r-md border-l-4 px-4 py-3.5 ${border} ${bg}`}
    >
      <span className={`mt-0.5 shrink-0 ${iconClass}`} aria-hidden="true">
        {icon}
      </span>
      <div
        className={`min-w-0 text-[14px] leading-relaxed [&>p:last-child]:mb-0 [&>p]:mb-1.5 [&>p]:text-[var(--muted-foreground)] ${labelClass}`}
      >
        {children}
      </div>
    </div>
  );
}
