
import { PageHeader } from "@/components/page-header";
import { HealthSpecialProjectForm } from "./health-special-project-form";
import { RecentHealthSpecialProjects } from "./recent-health-special-projects";

export default function HealthSpecialProjectPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Health Special Projects"
        description="Document unique or one-time health initiatives"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <HealthSpecialProjectForm />
        </div>
        <div className="lg:col-span-1">
            <RecentHealthSpecialProjects />
        </div>
      </div>
    </div>
  );
}
