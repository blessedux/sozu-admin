import { HeroMetricsGrid } from "@/components/admin/hero-metrics";
import { mockHeroMetrics } from "@/lib/network/mock-data";

export default function DashboardHomePage() {
  return <HeroMetricsGrid data={mockHeroMetrics} />;
}
