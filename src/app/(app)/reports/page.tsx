
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ReportConfigurationForm } from "./report-configuration-form";
import { ReportSummary } from "./report-summary";
import { ActivityBreakdown } from "./activity-breakdown";
import { PrintableReport } from "./printable-report";
import { Separator } from "@/components/ui/separator";
import { useActivities } from "@/hooks/use-activities";
import { useUsers } from "@/hooks/use-users";

const activityTypes = {
    'Weekly Plan': 'weeklyPlans',
    'Health Talk': 'healthTalks',
    'Health Campaign': 'healthCampaigns',
    'IMCI Training': 'imciTrainings',
    'School Visit': 'schoolVisits',
    'Creche Visit': 'crecheVisits',
    'Outbreak Response': 'outbreakResponses',
    'Social Mobilization': 'socialMobilizations',
    'TISH': 'tish',
    'Corner to Corner': 'cornerToCorner',
    'Support Group': 'supportGroups',
    'Health Special Project': 'healthSpecialProjects',
};


export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { activities } = useActivities();
  const { users } = useUsers();
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // whether we're looking at interactive summary or printable layout
  const [viewMode, setViewMode] = useState<'summary' | 'print'>('summary');

  const handleGenerateReport = async (config: any) => {
    setIsLoading(true);
    setSelectedActivities([]); // Reset selection on new report

    // Filter activities based on config
    const filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.date);
        
        // Date range filtering
        const fromDate = config.date?.from ? new Date(config.date.from) : null;
        const toDate = config.date?.to ? new Date(config.date.to) : null;
        if (fromDate && activityDate < fromDate) return false;
        if (toDate && activityDate > toDate) return false;

        // User filtering
        if (config.selectedUser !== 'all' && activity.userId !== config.selectedUser) {
            return false;
        }
        
        return true;
    });

    const totalActivities = filteredActivities.length;
    const peopleReached = filteredActivities.reduce((acc, a) => {
        if (!a.details) return acc;
        const count = a.details.peopleReached || a.details.childrenReached || a.details.studentsReached || 0;
        return acc + Number(count);
    }, 0);

    const breakdown = {
        weeklyPlans: 0,
        healthTalks: 0,
        healthCampaigns: 0,
        imciTrainings: 0,
        schoolVisits: 0,
        crecheVisits: 0,
        outbreakResponses: 0,
        socialMobilizations: 0,
        tish: 0,
        cornerToCorner: 0,
        supportGroups: 0,
        healthSpecialProjects: 0,
    };
    
    let mostActiveCategoryCount = 0;
    let mostActiveCategory = "None";

    filteredActivities.forEach(activity => {
        const category = activityTypes[activity.type];
        if (category) {
            breakdown[category]++;
            if(breakdown[category] > mostActiveCategoryCount) {
                mostActiveCategoryCount = breakdown[category];
                mostActiveCategory = activity.type;
            }
        }
    });

    const summary = {
        totalActivities,
        peopleReached,
        mostActive: mostActiveCategory,
        avgPerActivity: totalActivities > 0 ? (peopleReached / totalActivities) : 0,
    };
    
    setReportData({
      summary,
      breakdown,
      activities: filteredActivities,
      config,
      users,
    });
    // when new data arrives, show printable layout by default
    setViewMode('print');
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Generate Reports"
        description="Create comprehensive reports of health activities"
      />
      
      <ReportConfigurationForm 
        onGenerateReport={handleGenerateReport} 
        isLoading={isLoading} 
      />

      {reportData && viewMode === 'summary' && (
        <div className="space-y-8">
          <Separator />
          <div className="flex justify-end">
            <button
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setViewMode('print')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 17l4 4 4-4m0-5H8m0 0V3m8 9v6m-8-6v6"
                />
              </svg>
              <span>View Printable Report</span>
            </button>
          </div>
          <ReportSummary data={reportData} selectedActivitiesForDownload={selectedActivities} />
          <ActivityBreakdown 
            data={(reportData as any).breakdown}
            selectedActivities={selectedActivities}
            onSelectionChange={setSelectedActivities}
          />
        </div>
      )}

      {reportData && viewMode === 'print' && (
        <PrintableReport data={reportData} onClose={() => setViewMode('summary')} />
      )}
    </div>
  );
}
