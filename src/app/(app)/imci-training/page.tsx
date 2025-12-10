
import { PageHeader } from "@/components/page-header";
import { ImciTrainingForm } from "./imci-training-form";
import { TrainingRecords } from "./training-records";
import { Separator } from "@/components/ui/separator";

export default function ImciTrainingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="IMCI Training Reports"
        description="Integrated Management of Childhood Illness training documentation"
      />
      <ImciTrainingForm />
      <Separator />
      <TrainingRecords />
    </div>
  );
}
