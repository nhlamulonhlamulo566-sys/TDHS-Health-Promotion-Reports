
import { PageHeader } from "@/components/page-header";
import { OutbreakResponseForm } from "./outbreak-response-form";
import { RecentOutbreakResponses } from "./recent-outbreak-responses";

export default function OutbreakResponsePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Outbreak Response"
        description="Document outbreak response activities and community education"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OutbreakResponseForm />
        </div>
        <div className="lg:col-span-1">
          <RecentOutbreakResponses />
        </div>
      </div>
    </div>
  );
}
