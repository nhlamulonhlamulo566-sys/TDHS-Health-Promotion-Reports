
import { PageHeader } from "@/components/page-header";
import { ImciTrainingForm } from "./imci-training-form";
import { TrainingRecords } from "./training-records";

export default function ImciTrainingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="IMCI Training Reports"
        description="Integrated Management of Childhood Illness training documentation"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <ImciTrainingForm />
        </div>
        <div className="lg:col-span-1">
            <TrainingRecords />
        </div>
      </div>
    </div>
  );
}
