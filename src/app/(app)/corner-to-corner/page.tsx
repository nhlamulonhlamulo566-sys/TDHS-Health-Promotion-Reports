
import { PageHeader } from "@/components/page-header";
import { CornerToCornerForm } from "./corner-to-corner-form";
import { RecentCornerToCornerSessions } from "./recent-service-sessions";
import { Separator } from "@/components/ui/separator";

export default function CornerToCornerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Corner to Corner Services"
        description="Document comprehensive health services delivered in the community"
      />
      <CornerToCornerForm />
      <Separator />
      <RecentCornerToCornerSessions />
    </div>
  );
}
