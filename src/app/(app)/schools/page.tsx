
import { PageHeader } from "@/components/page-header";
import { SchoolVisitForm } from "./school-visit-form";
import { RecentSchoolVisits } from "./recent-school-visits";
import { Separator } from "@/components/ui/separator";

export default function SchoolHealthProgramsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="School"
        description="Track health education activities in schools"
      />
      <SchoolVisitForm />
      <Separator />
      <RecentSchoolVisits />
    </div>
  );
}
