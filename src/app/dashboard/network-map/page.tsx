import { NetworkMapPreview, PageHeader } from "@/components/admin/ui";
import { getNetworkMap } from "@/lib/network/queries";

export default async function NetworkMapPage() {
  const { nodes, edges } = await getNetworkMap();

  return (
    <div>
      <PageHeader
        title="Network Map"
        description="Interactive view of users, merchants, orbs, and their connections"
      />
      <NetworkMapPreview nodes={nodes} edges={edges} />
      <p className="mt-6 text-sm text-gray-500">
        Nodes and edges are derived from live orb claims and referral data in Supabase.
      </p>
    </div>
  );
}
