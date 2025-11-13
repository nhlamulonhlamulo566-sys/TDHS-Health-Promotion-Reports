
import { PageHeader } from "@/components/page-header";
import { SocialMobilizationForm } from "./social-mobilization-form";
import { RecentMobilizations } from "./recent-mobilizations";

export default function SocialMobilizationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Social Mobilisation"
        description="Track community mobilization and advocacy activities"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <SocialMobilizationForm />
        </div>
        <div className="lg:col-span-1">
            <RecentMobilizations />
        </div>
      </div>
    </div>
  );
}
