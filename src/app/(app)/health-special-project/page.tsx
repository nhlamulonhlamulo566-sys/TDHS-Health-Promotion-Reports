
import { PageHeader } from "@/components/page-header";
import { HealthSpecialProjectForm } from "./health-special-project-form";
import { RecentHealthSpecialProjects } from "./recent-health-special-projects";
import { Separator } from "@/components/ui/separator";

export default function HealthSpecialProjectPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Health Special Projects"
        description="Document unique or one-time health initiatives"
      />
      <HealthSpecialProjectForm />
      <Separator />
      <RecentHealthSpecialProjects />
    </div>
  );
}
