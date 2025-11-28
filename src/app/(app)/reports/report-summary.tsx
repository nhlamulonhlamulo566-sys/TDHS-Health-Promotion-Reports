
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
import { UserProfile } from "@/lib/store";

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
    documentUploads: 'Document Upload',
    healthSpecialProjects: 'Health Special Project',
};

const topicLabels = {
    "physical-activity": "Importance of Physical Activity",
    "salt-reduction": "Salt reduction",
    "nutrition": "Nutrition",
    "obesity-overweight": "Obesity & Overweight",
    "substance-abuse": "Tobacco, Alcohol & Substance Abuse",
    "sexual-behaviour": "Safe Sexual Behaviour",
    "other": "Other",
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
  const { summary, breakdown, config, activities, users } = data;
    
  const handleDownload = () => {
    const activityTypesToDownload = (selectedActivitiesForDownload.length > 0 
        ? selectedActivitiesForDownload 
        : Object.keys(breakdown)
    ).map(key => activityLabels[key]);
    
    const detailedActivities = activities.filter(activity => activityTypesToDownload.includes(activity.type));

    const headers = [
        "Activity ID", "Activity Type", "User Name", "District", "Date", "Start Time", "End Time",
        // Universal-ish fields
        "Venue", "Location", "People Reached", "Topic", "Other Topic", "Notes", "NB",
        // Campaign specific
        "Campaign Type", "Other Campaign Type", "Target Group", "Other Target Group",
        // Creche specific
        "Creche Name", "Age Group", "Children Minders Reached", "Parents Reached", "Children Reached",
        // IMCI specific
        "Trainee Type", "Other Trainee Type",
        // Outbreak specific
        "Disease Type", "Other Disease Type", "Severity Level",
        // School specific
        "School Name", "Grade Level", "Students Reached",
        // Social Mob specific
        "Mobilization Method", "Other Mobilization Method",
        // Support Group specific
        "Support Group Type", "Other Support Group Type", "Physical Activity", "Other Physical Activity",
        // TISH / Corner to Corner specific
        "Services",
        // Document Upload specific
        "Document Title",
        // Health Special Project specific
        "Project Name", "Project Description",
        // Attachments
        "Register Attachment URL", "Picture Attachment URL",
    ];

    const rows = detailedActivities.map(activity => {
        const user = users.find(u => u.id === activity.userId);
        const details = activity.details || {};

        let topicDisplay = details.topic;
        if (Array.isArray(details.topic)) {
          topicDisplay = details.topic.map(t => (t === 'Other' || t ==='other') && details.otherTopic ? details.otherTopic : t).join(', ');
        } else if (details.topic === 'Other' || details.topic === 'other') {
          topicDisplay = details.otherTopic;
        } else if (activity.type === 'Health Talk' && details.topics) {
            topicDisplay = details.topics.map(t => t === 'other' ? details.otherTopic : (topicLabels[t] || t)).join(', ');
        }

        let servicesDisplay = "";
        if (details.services && Array.isArray(details.services)) {
            servicesDisplay = details.services.map(s => {
                if (s.id === 'other') {
                    return `${details.otherTopic || 'Other'} (${s.peopleReached || 0})`;
                }
                return `${s.label} (${s.peopleReached || 0})`;
            }).join('; ');
        }
        
        let campaignTypeDisplay = details.campaignType;
        if (Array.isArray(details.campaignType)) {
             campaignTypeDisplay = details.campaignType.map(t => t === 'Other' && details.otherCampaignType ? details.otherCampaignType : t).join(', ');
        } else if (details.campaignType === 'Other') {
            campaignTypeDisplay = details.otherCampaignType;
        }

        let mobilizationMethodDisplay = details.mobilizationMethod;
        if (Array.isArray(details.mobilizationMethod)) {
            mobilizationMethodDisplay = details.mobilizationMethod.map(m => m === 'Other' && details.otherMobilizationMethod ? details.otherMobilizationMethod : m).join(', ');
        } else if (details.mobilizationMethod === 'Other') {
            mobilizationMethodDisplay = details.otherMobilizationMethod;
        }
        
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
            "People Reached": details.peopleReached || details.studentsReached || details.childrenReached,
            "Topic": topicDisplay,
            "Other Topic": details.otherTopic,
            "Notes": details.notes,
            "NB": details.nb,
            "Campaign Type": campaignTypeDisplay,
            "Other Campaign Type": details.otherCampaignType,
            "Target Group": details.targetGroup === 'Other' ? details.otherTargetGroup : details.targetGroup,
            "Other Target Group": details.otherTargetGroup,
            "Creche Name": details.crecheName,
            "Age Group": details.ageGroup,
            "Children Minders Reached": details.childrenMindersReached,
            "Parents Reached": details.parentsReached,
            "Children Reached": details.childrenReached,
            "Trainee Type": details.traineeType === 'Other' ? details.otherTraineeType : details.traineeType,
            "Other Trainee Type": details.otherTraineeType,
            "Disease Type": details.diseaseType === 'Other' ? details.otherDiseaseType : details.diseaseType,
            "Other Disease Type": details.otherDiseaseType,
            "Severity Level": details.severityLevel,
            "School Name": details.schoolName,
            "Grade Level": Array.isArray(details.gradeLevel) ? details.gradeLevel.join(', ') : details.gradeLevel,
            "Students Reached": details.studentsReached,
            "Mobilization Method": mobilizationMethodDisplay,
            "Other Mobilization Method": details.otherMobilizationMethod,
            "Support Group Type": details.supportGroupType === 'Other' ? details.otherSupportGroupType : details.supportGroupType,
            "Other Support Group Type": details.otherSupportGroupType,
            "Physical Activity": details.physicalActivity === 'Other' ? details.otherPhysicalActivity : details.physicalActivity,
            "Other Physical Activity": details.otherPhysicalActivity,
            "Services": servicesDisplay,
            "Document Title": details.title,
            "Project Name": details.projectName,
            "Project Description": details.description,
            "Register Attachment URL": details.registerAttachment,
            "Picture Attachment URL": details.pictureAttachment,
        };
        return headers.map(header => escapeCsvCell(rowData[header])).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

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
