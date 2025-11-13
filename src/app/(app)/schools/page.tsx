
import { PageHeader } from "@/components/page-header";
import { SchoolVisitForm } from "./school-visit-form";
import { RecentSchoolVisits } from "./recent-school-visits";

export default function SchoolHealthProgramsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="School"
        description="Track health education activities in schools"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SchoolVisitForm />
        </div>
        <div className="lg:col-span-1">
          <RecentSchoolVisits />
        </div>
      </div>
    </div>
  );
}
