
import { PageHeader } from "@/components/page-header";
import { CrecheVisitForm } from "./creche-visit-form";
import { RecentCrecheVisits } from "./recent-creche-visits";
import { Separator } from "@/components/ui/separator";

export default function CrecheHealthProgramsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Creche Health Programs"
        description="Track early childhood health education in creches"
      />
      <CrecheVisitForm />
      <Separator />
      <RecentCrecheVisits />
    </div>
  );
}
