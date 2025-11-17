
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Attachment } from "@/lib/store";

interface ActivityBreakdownProps {
  data: {
    [key: string]: number;
  };
  allAttachmentsForReport: Attachment[];
  selectedActivities: string[];
  onSelectionChange: (selected: string[]) => void;
}

const activityLabels = {
    weeklyPlans: 'Weekly Plans',
    healthTalks: 'Health Talks',
    healthCampaigns: 'Health Campaigns',
    imciTrainings: 'IMCI Trainings',
    schoolVisits: 'School Visits',
    crecheVisits: 'Creche Visits',
    outbreakResponses: 'Outbreak Responses',
    socialMobilizations: 'Social Mobilizations',
    tish: 'TISH',
    cornerToCorner: 'Corner to Corner',
    supportGroups: 'Support Groups',
    attachments: 'Attachments',
};

export function ActivityBreakdown({ data, allAttachmentsForReport, selectedActivities, onSelectionChange }: ActivityBreakdownProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const allActivityKeys = Object.keys(data);
  const nonAttachmentKeys = allActivityKeys.filter(key => key !== 'attachments');

  const isAllSelected = nonAttachmentKeys.length > 0 && nonAttachmentKeys.every(key => selectedActivities.includes(key));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentlySelectedAttachments = selectedActivities.includes('attachments');
      const newSelection = [...new Set([...nonAttachmentKeys, ...(currentlySelectedAttachments ? ['attachments'] : [])])];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedActivities.filter(key => key === 'attachments'));
    }
  };

  const handleSelectActivity = (activityKey: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedActivities, activityKey]);
    } else {
      onSelectionChange(selectedActivities.filter(key => key !== activityKey));
    }
  };

  const handleDownloadAttachments = () => {
    const urlsToDownload: string[] = [];
    allAttachmentsForReport.forEach(attachment => {
        if (attachment.registerAttachmentUrl) {
            urlsToDownload.push(attachment.registerAttachmentUrl);
        }
        if (attachment.pictureAttachmentUrls && Array.isArray(attachment.pictureAttachmentUrls)) {
            urlsToDownload.push(...attachment.pictureAttachmentUrls);
        }
    });

    if (urlsToDownload.length === 0) {
        console.warn("No attachment URLs found for download.");
        return;
    }

    urlsToDownload.forEach((url, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = true;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 300);
    });
  };

  const canDownloadAttachments = selectedActivities.includes('attachments') && (data.attachments || 0) > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Activity Breakdown</h2>
        <div className="flex items-center space-x-2">
            <Button onClick={handleDownloadAttachments} disabled={!canDownloadAttachments}>
                <Download className="mr-2 h-4 w-4" />
                Download Attachments
            </Button>
            <Checkbox 
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all activities"
            />
            <Label htmlFor="select-all">Select All (Exclude Attachments)</Label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allActivityKeys.map((key) => {
          const value = data[key];
          const percentage = total > 0 ? (value / total) * 100 : 0;
          const isSelected = selectedActivities.includes(key);
          return (
            <Card key={key} className={`transition-colors ${isSelected ? 'border-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            id={key}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectActivity(key, !!checked)}
                        />
                        <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{activityLabels[key]}</Label>
                    </div>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
                <Progress value={percentage} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
