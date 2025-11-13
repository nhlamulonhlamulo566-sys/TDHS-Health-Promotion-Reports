import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "./campaign-form";
import { RecentCampaigns } from "./recent-campaigns";
import { Separator } from "@/components/ui/separator";

export default function HealthCampaignsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Health Calendar Campaigns"
        description="Document your health campaign activities and outcomes"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <CampaignForm />
        </div>
        <div className="lg:col-span-1">
            <RecentCampaigns />
        </div>
      </div>
    </div>
  );
}
