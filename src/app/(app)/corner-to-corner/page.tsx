
import { PageHeader } from "@/components/page-header";
import { CornerToCornerForm } from "./corner-to-corner-form";
import { RecentCornerToCornerSessions } from "./recent-service-sessions";

export default function CornerToCornerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Corner to Corner Services"
        description="Document comprehensive health services delivered in the community"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CornerToCornerForm />
        </div>
        <div className="lg:col-span-1">
          <RecentCornerToCornerSessions />
        </div>
      </div>
    </div>
  );
}
