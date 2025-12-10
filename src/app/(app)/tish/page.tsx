
import { PageHeader } from "@/components/page-header";
import { TishForm } from "./tish-form";
import { RecentTishSessions } from "./recent-tish-sessions";
import { Separator } from "@/components/ui/separator";

export default function TishPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="TISH Services"
        description="Document comprehensive health services delivered in the community"
      />
      <TishForm />
      <Separator />
      <RecentTishSessions />
    </div>
  );
}
