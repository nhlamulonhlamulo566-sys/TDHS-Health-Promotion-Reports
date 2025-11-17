
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Activity, Users, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { UserProfile, Attachment } from "@/lib/store";

interface ReportSummaryProps {
  data: {
    summary: {
      totalActivities: number;
      peopleReached: number;
      mostActive: string;
      avgPerActivity: number;
    },
    breakdown: { [key: string]: number },
    activities: any[], // Full activities data
    attachments: Attachment[], // Full attachments data
    config: {
        reportType: string;
        date: { from: Date, to: Date };
        selectedUser: string;
    },
    users: UserProfile[],
  };
  selectedActivitiesForDownload: string[];
}

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card className={`bg-opacity-10 ${colorClass}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
)

const activityLabels = {
    weeklyPlans: 'Weekly Plan',
    healthTalks: 'Health Talk',
    healthCampaigns: 'Health Campaign',
    imciTrainings: 'IMCI Training',
    schoolVisits: 'School Visit',
    crecheVisits: 'Creche Visit',
    outbreakResponses: 'Outbreak Response',
    socialMobilizations: 'Social Mobilization',
    tish: 'TISH',
    cornerToCorner: 'Corner to Corner',
    supportGroups: 'Support Group',
    attachments: 'Attachment',
};

const escapeCsvCell = (cellData: any) => {
    if (cellData === null || cellData === undefined) {
        return "";
    }
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
};

export function ReportSummary({ data, selectedActivitiesForDownload }: ReportSummaryProps) {
  const { summary, breakdown, config, activities, attachments, users } = data;
    
  const handleDownload = () => {
    const activityKeysToDownload = (selectedActivitiesForDownload.length > 0 
        ? selectedActivitiesForDownload 
        : Object.keys(breakdown).filter(key => key !== 'attachments')
    );
    
    const activityTypesToDownload = activityKeysToDownload.map(key => activityLabels[key]).filter(Boolean);
    
    const detailedActivities = activities.filter(activity => activityTypesToDownload.includes(activity.type));

    const headers = [
        "Activity ID", "Activity Type",
        "User Name",
        "District", "Date", "Start Time", "End Time",
        "Venue", "Location", "People Reached", "Topic", "Notes",
        // Campaign specific
        "Campaign Type", "Target Group",
        // Creche specific
        "Creche Name", "Age Group", "Children Minders Reached", "Children Reached",
        // IMCI specific
        "Trainee Type",
        // Outbreak specific
        "Disease Type", "Severity Level",
        // School specific
        "School Name", "Grade Level", "Students Reached",
        // Social Mob specific
        "Mobilization Method",
        // Support Group specific
        "Support Group Type", "Physical Activity",
        // Attachment specific (now separate)
    ];

    const attachmentHeaders = [
        "Attachment ID", "User Name", "District", "Date", "Title", "Notes", 
        "Register Attachment URL", "Picture Attachment URLs"
    ]

    const activityRows = detailedActivities.map(activity => {
        const user = users.find(u => u.id === activity.userId);
        const details = activity.details || {};
        const rowData = {
            "Activity ID": activity.id,
            "Activity Type": activity.type,
            "User Name": user?.displayName,
            "District": activity.district,
            "Date": format(new Date(activity.date), 'yyyy-MM-dd'),
            "Start Time": details.startTime,
            "End Time": details.endTime,
            "Venue": details.venue,
            "Location": details.location,
            "People Reached": details.peopleReached,
            "Topic": details.topic === 'Other' ? details.otherTopic : details.topic,
            "Notes": details.notes,
            "Campaign Type": details.campaignType === 'Other' ? details.otherCampaignType : details.campaignType,
            "Target Group": details.targetGroup === 'Other' ? details.otherTargetGroup : details.targetGroup,
            "Creche Name": details.crecheName,
            "Age Group": details.ageGroup,
            "Children Minders Reached": details.childrenMindersReached,
            "Children Reached": details.childrenReached,
            "Trainee Type": details.traineeType === 'Other' ? details.otherTraineeType : details.traineeType,
            "Disease Type": details.diseaseType === 'Other' ? details.otherDiseaseType : details.diseaseType,
            "Severity Level": details.severityLevel,
            "School Name": details.schoolName,
            "Grade Level": details.gradeLevel,
            "Students Reached": details.studentsReached,
            "Mobilization Method": details.mobilizationMethod === 'Other' ? details.otherMobilizationMethod : details.mobilizationMethod,
            "Support Group Type": details.supportGroupType === 'Other' ? details.otherSupportGroupType : details.supportGroupType,
            "Physical Activity": details.physicalActivity === 'Other' ? details.otherPhysicalActivity : details.physicalActivity,
        };
        return headers.map(header => escapeCsvCell(rowData[header])).join(',');
    });

    let csvContent = [headers.join(','), ...activityRows].join('\n');

    if (selectedActivitiesForDownload.includes('attachments')) {
        const attachmentRows = attachments.map(attachment => {
            const user = users.find(u => u.id === attachment.userId);
            return [
                escapeCsvCell(attachment.id),
                escapeCsvCell(user?.displayName),
                escapeCsvCell(attachment.district),
                escapeCsvCell(format(new Date(attachment.date), 'yyyy-MM-dd')),
                escapeCsvCell(attachment.title),
                escapeCsvCell(attachment.notes),
                escapeCsvCell(attachment.registerAttachmentUrl),
                escapeCsvCell(Array.isArray(attachment.pictureAttachmentUrls) ? attachment.pictureAttachmentUrls.join(', ') : ''),
            ].join(',');
        });
        csvContent += '\n\n' + [attachmentHeaders.join(','), ...attachmentRows].join('\n');
    }


    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Report Summary</h2>
            <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Activities" value={summary.totalActivities} icon={Activity} colorClass="bg-blue-100" />
        <StatCard title="People Reached" value={summary.peopleReached} icon={Users} colorClass="bg-green-100" />
        <StatCard title="Most Active" value={summary.mostActive} icon={Clock} colorClass="bg-purple-100" />
        <StatCard title="Avg. per Activity" value={summary.avgPerActivity.toFixed(2)} icon={TrendingUp} colorClass="bg-orange-100" />
      </div>
    </div>
  );
}
