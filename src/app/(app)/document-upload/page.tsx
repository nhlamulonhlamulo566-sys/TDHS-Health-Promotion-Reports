
import { PageHeader } from "@/components/page-header";
import { DocumentUploadForm } from "./document-upload-form";
import { RecentDocuments } from "./recent-documents";

export default function DocumentUploadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Document Upload"
        description="Upload and manage registers, photos, and other documents"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <DocumentUploadForm />
        </div>
        <div className="lg:col-span-1">
            <RecentDocuments />
        </div>
      </div>
    </div>
  );
}
