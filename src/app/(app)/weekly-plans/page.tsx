
'use client';
import { PageHeader } from '@/components/page-header';
import { WeeklyPlanForm } from './weekly-plan-form';
import { PlannedActivities } from './planned-activities';

export default function WeeklyPlansPage() {

  return (
    <div className="space-y-8">
      <PageHeader
        title="Weekly Plan"
        description="Plan and schedule your weekly health activities"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <WeeklyPlanForm />
        <PlannedActivities />
      </div>
    </div>
  );
}
