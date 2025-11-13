
import { PageHeader } from "@/components/page-header";
import { SupportGroupForm } from "./support-group-form";
import { SupportGroupHistory } from "./support-group-history";
import { Separator } from "@/components/ui/separator";

export default function SupportGroupsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Support Groups"
        description="Log and track support group sessions."
      />
      <SupportGroupForm />
      <Separator />
      <SupportGroupHistory />
    </div>
  );
}
