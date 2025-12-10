
import { PageHeader } from "@/components/page-header";
import { SocialMobilizationForm } from "./social-mobilization-form";
import { RecentMobilizations } from "./recent-mobilizations";
import { Separator } from "@/components/ui/separator";

export default function SocialMobilizationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Social Mobilisation"
        description="Track community mobilization and advocacy activities"
      />
      <SocialMobilizationForm />
      <Separator />
      <RecentMobilizations />
    </div>
  );
}
