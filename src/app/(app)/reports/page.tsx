
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ReportConfigurationForm } from "./report-configuration-form";
import { ReportSummary } from "./report-summary";
import { ActivityBreakdown } from "./activity-breakdown";
import { Separator } from "@/components/ui/separator";
import { useActivities } from "@/hooks/use-activities";
import { useUsers } from "@/hooks/use-users";
import { useAttachments } from "@/hooks/use-attachments";

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
};


export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { activities } = useActivities();
  const { attachments } = useAttachments();
  const { users } = useUsers();
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const handleGenerateReport = async (config: any) => {
    setIsLoading(true);
    setSelectedActivities([]);

    const filterByConfig = (item: any) => {
        const itemDate = new Date(item.date);
        
        const fromDate = config.date?.from ? new Date(config.date.from) : null;
        const toDate = config.date?.to ? new Date(config.date.to) : null;
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;

        if (config.selectedUser !== 'all' && item.userId !== config.selectedUser) {
            return false;
        }
        
        return true;
    }

    const filteredActivities = activities.filter(filterByConfig);
    const filteredAttachments = attachments.filter(filterByConfig);

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
        attachments: filteredAttachments.length,
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
      attachments: filteredAttachments,
      config,
      users,
    });
    
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

      {reportData && (
        <div className="space-y-8">
          <Separator />
          <ReportSummary data={reportData} selectedActivitiesForDownload={selectedActivities} />
          <ActivityBreakdown 
            data={(reportData as any).breakdown}
            allAttachmentsForReport={(reportData as any).attachments}
            selectedActivities={selectedActivities}
            onSelectionChange={setSelectedActivities}
          />
        </div>
      )}
    </div>
  );
}
