
import { PageHeader } from "@/components/page-header";
import { HealthTalkForm } from "./health-talk-form";
import { HealthTalksHistory } from "./health-talks-history";

export default function HealthTalksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Health Talks"
        description="Log and track health talks conducted in the community."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <HealthTalkForm />
        </div>
        <div className="lg:col-span-1">
            <HealthTalksHistory />
        </div>
      </div>
    </div>
  );
}
