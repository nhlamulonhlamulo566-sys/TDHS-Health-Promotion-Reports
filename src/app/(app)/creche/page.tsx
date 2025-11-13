
import { PageHeader } from "@/components/page-header";
import { CrecheVisitForm } from "./creche-visit-form";
import { RecentCrecheVisits } from "./recent-creche-visits";

export default function CrecheHealthProgramsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Creche Health Programs"
        description="Track early childhood health education in creches"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrecheVisitForm />
        </div>
        <div className="lg:col-span-1">
          <RecentCrecheVisits />
        </div>
      </div>
    </div>
  );
}
