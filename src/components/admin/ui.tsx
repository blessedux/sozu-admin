import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-sozu-border bg-sozu-panel/60 p-5 backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sozu-border">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-sozu-border bg-sozu-panel/80 text-xs uppercase tracking-wider text-gray-400">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sozu-border">
          {rows.map((row, i) => (
            <tr key={i} className="text-gray-200 hover:bg-sozu-panel/40">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400",
    deployed: "bg-amber-500/10 text-amber-400",
    inactive: "bg-gray-500/10 text-gray-400",
    success: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    failed: "bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        colors[status] ?? "bg-gray-500/10 text-gray-400"
      )}
    >
      {status}
    </span>
  );
}

export function FunnelChart({
  steps,
}: {
  steps: Array<{ label: string; count: number; conversionPercent: number; dropoffPercent: number }>;
}) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-white">{step.label}</span>
            <span className="tabular-nums text-gray-400">
              {step.count.toLocaleString()} · {step.conversionPercent.toFixed(1)}% conv
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sozu-border">
            <div
              className="h-full rounded-full bg-sozu-cyan/70"
              style={{ width: `${(step.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VelocityChart({ points }: { points: Array<{ period: string; count: number }> }) {
  const max = Math.max(...points.map((p) => p.count), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {points.map((p) => (
        <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-sozu-cyan/60"
            style={{ height: `${(p.count / max) * 100}%`, minHeight: 4 }}
            title={`${p.count} wallets`}
          />
          <span className="text-xs text-gray-500">{p.period}</span>
        </div>
      ))}
    </div>
  );
}

export function NetworkMapPreview({
  nodes,
  edges,
}: {
  nodes: Array<{ id: string; type: string; label: string; activity: number }>;
  edges: Array<{ source: string; target: string; type: string; weight: number }>;
}) {
  const typeColor: Record<string, string> = {
    user: "border-blue-400 text-blue-300",
    merchant: "border-emerald-400 text-emerald-300",
    orb: "border-sozu-cyan text-sozu-cyan",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <h3 className="mb-4 text-sm font-semibold text-white">Nodes</h3>
        <div className="flex flex-wrap gap-2">
          {nodes.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                typeColor[n.type] ?? "border-gray-600 text-gray-300"
              )}
            >
              <p className="font-medium">{n.label}</p>
              <p className="opacity-70">{n.activity} events</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h3 className="mb-4 text-sm font-semibold text-white">Connections</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          {edges.map((e, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-sozu-cyan">{e.type}</span>
              <span>
                {e.source} → {e.target}
              </span>
              <span className="text-gray-500">({e.weight})</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
