
import { PageHeader } from "@/components/page-header";
import { HealthTalkForm } from "./health-talk-form";
import { HealthTalksHistory } from "./health-talks-history";
import { Separator } from "@/components/ui/separator";

export default function HealthTalksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Health Talks"
        description="Log and track health talks conducted in the community."
      />
      <HealthTalkForm />
      <Separator />
      <HealthTalksHistory />
    </div>
  );
}
