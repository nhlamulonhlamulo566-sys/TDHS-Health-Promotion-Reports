
import { PageHeader } from "@/components/page-header";
import { TishForm } from "./tish-form";
import { RecentTishSessions } from "./recent-tish-sessions";

export default function TishPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="TISH Services"
        description="Document comprehensive health services delivered in the community"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TishForm />
        </div>
        <div className="lg:col-span-1">
          <RecentTishSessions />
        </div>
      </div>
    </div>
  );
}
