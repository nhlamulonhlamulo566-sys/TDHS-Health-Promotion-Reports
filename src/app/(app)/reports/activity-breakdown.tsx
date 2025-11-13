
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import React from "react";

interface ActivityBreakdownProps {
  data: {
    [key: string]: number;
  };
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
};

export function ActivityBreakdown({ data, selectedActivities, onSelectionChange }: ActivityBreakdownProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const allActivities = Object.keys(data);
  const isAllSelected = allActivities.length > 0 && selectedActivities.length === allActivities.length;

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? allActivities : []);
  };

  const handleSelectActivity = (activityKey: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedActivities, activityKey]);
    } else {
      onSelectionChange(selectedActivities.filter(key => key !== activityKey));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Activity Breakdown</h2>
        <div className="flex items-center space-x-2">
            <Checkbox 
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all activities"
            />
            <Label htmlFor="select-all">Select All</Label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allActivities.map((key) => {
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
