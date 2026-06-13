import { HeroMetricsGrid } from "@/components/admin/hero-metrics";
import { getDashboardOverview } from "@/lib/network/queries";

export default async function DashboardHomePage() {
  const { hero, snapshot } = await getDashboardOverview();
  return <HeroMetricsGrid data={hero} snapshot={snapshot} />;
}
