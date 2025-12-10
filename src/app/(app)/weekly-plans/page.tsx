
'use client';
import { PageHeader } from '@/components/page-header';
import { WeeklyPlanForm } from './weekly-plan-form';
import { PlannedActivities } from './planned-activities';
import { Separator } from '@/components/ui/separator';

export default function WeeklyPlansPage() {

  return (
    <div className="space-y-8">
      <PageHeader
        title="Weekly Plan"
        description="Plan and schedule your weekly health activities"
      />
      <WeeklyPlanForm />
      <Separator />
      <PlannedActivities />
    </div>
  );
}
