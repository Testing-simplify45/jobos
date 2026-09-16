import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-card border border-base-border bg-base-panel p-4">
      <div className="mb-3 flex items-center justify-between text-text-secondary">
        <span className="text-[13px]">{label}</span>
        <Icon size={15} strokeWidth={2} />
      </div>
      <div className="text-2xl font-semibold text-text-primary">{value}</div>
      {delta && <div className="mt-1 text-[12px] text-accent">{delta}</div>}
    </div>
  );
}

export function MatchBadge({ score }: { score: number }) {
  const strong = score >= 80;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[13px] font-semibold ${
        strong ? "bg-accent-dim text-accent-bright" : "bg-warn-dim text-warn"
      }`}
    >
      {score}
      <span className="font-sans text-[10px] font-normal opacity-70">match</span>
    </span>
  );
}
