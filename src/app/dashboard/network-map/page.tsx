import { NetworkMapPreview, PageHeader } from "@/components/admin/ui";
import { mockNetworkMap } from "@/lib/network/mock-data";

export default function NetworkMapPage() {
  return (
    <div>
      <PageHeader
        title="Network Map"
        description="Interactive view of users, merchants, orbs, and their connections"
      />
      <NetworkMapPreview nodes={mockNetworkMap.nodes} edges={mockNetworkMap.edges} />
      <p className="mt-6 text-sm text-gray-500">
        Full force-directed visualization ships next — this scaffold exposes the data model and API
        surface for payments, referrals, and claims.
      </p>
    </div>
  );
}
