import {
  FunnelChart,
  PageHeader,
  Panel,
  VelocityChart,
} from "@/components/admin/ui";
import { MetricCard } from "@/components/admin/metric-card";
import { getGrowthData } from "@/lib/network/queries";

export default async function GrowthPage() {
  const { funnel, acquisition, velocity } = await getGrowthData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Growth Analytics"
        description="Thesis validation — funnel, acquisition, and wallet creation velocity"
      />

      <Panel>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
          Funnel
        </h2>
        <FunnelChart steps={funnel} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
            Acquisition Sources
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {acquisition.map((s) => (
              <MetricCard
                key={s.source}
                label={s.source}
                value={s.count.toLocaleString()}
                sub={`${s.percent}% of wallets`}
              />
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
            Wallet Creation Velocity (7d)
          </h2>
          <VelocityChart points={velocity} />
        </Panel>
      </div>
    </div>
  );
}
