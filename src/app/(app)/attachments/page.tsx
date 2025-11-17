
import { PageHeader } from "@/components/page-header";
import { AttachmentForm } from "./attachment-form";
import { RecentAttachments } from "./recent-attachments";

export default function AttachmentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Attachments"
        description="Upload and categorize important documents and images"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttachmentForm />
        </div>
        <div className="lg:col-span-1">
          <RecentAttachments />
        </div>
      </div>
    </div>
  );
}
