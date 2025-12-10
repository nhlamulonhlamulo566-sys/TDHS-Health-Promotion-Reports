
import { PageHeader } from "@/components/page-header";
import { OutbreakResponseForm } from "./outbreak-response-form";
import { RecentOutbreakResponses } from "./recent-outbreak-responses";
import { Separator } from "@/components/ui/separator";

export default function OutbreakResponsePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Outbreak Response"
        description="Document outbreak response activities and community education"
      />
      <OutbreakResponseForm />
      <Separator />
      <RecentOutbreakResponses />
    </div>
  );
}
