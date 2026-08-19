import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-[#f2f2f7] text-[#6e6e73]",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-accent-soft text-accent",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status?: string | null) {
  const value = (status ?? "").toLowerCase();
  if (["running", "qualified", "completed", "interested", "active"].includes(value)) return "good" as const;
  if (["paused", "waiting", "maybe", "scheduled", "queued"].includes(value)) return "warn" as const;
  if (["failed", "unqualified", "not_interested", "stopped"].includes(value)) return "bad" as const;
  if (["draft"].includes(value)) return "neutral" as const;
  return "info" as const;
}
