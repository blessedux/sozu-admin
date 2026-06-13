import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  growth,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  growth?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-sozu-border bg-sozu-panel/80 p-5 shadow-sm backdrop-blur",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-white">{value}</p>
      {sub != null && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
      {growth != null && (
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            growth >= 0 ? "text-emerald-400" : "text-red-400"
          )}
        >
          {growth >= 0 ? "+" : ""}
          {growth}% growth
        </p>
      )}
    </div>
  );
}

export function MetricGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
