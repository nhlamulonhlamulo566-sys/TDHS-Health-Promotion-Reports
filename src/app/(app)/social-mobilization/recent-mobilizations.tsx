
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Trash2, Loader2, User, Building } from "lucide-react";
import useStore from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from '@/firebase';
import { useActivities } from '@/hooks/use-activities';
import { useUsers } from '@/hooks/use-users';
import { startOfMonth, endOfMonth } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const getCampaignTypeDisplay = (types: string[] | string, otherType?: string) => {
    if (!types) return "N/A";
    if (Array.isArray(types)) {
        const displayTypes = types.map(t => (t === 'Other' && otherType ? otherType : t));
        return displayTypes.join(', ');
    }
    return types === 'Other' && otherType ? otherType : types;
};


export function RecentMobilizations() {
  const { toast } = useToast();
  const { activities, isLoading } = useActivities();
  const deleteActivity = useStore((state) => state.deleteActivity);
  const firestore = useFirestore();
  const { users } = useUsers();
  const { user: currentUser } = useUser();
  const currentUserProfile = users.find(u => u.id === currentUser?.uid);
  const isAdministrator = currentUserProfile?.role === 'Administrator' || currentUserProfile?.role === 'Super Administrator';
  
  const handleDelete = async (id: string) => {
    if (!firestore) return;
    deleteActivity(firestore, id);
    toast({
        title: "Mobilization Deleted",
        description: "The mobilization campaign has been removed.",
    });
  };

  const campaigns = React.useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return activities
      .filter(a => {
          if (a.type !== 'Social Mobilization') return false;
          const activityDate = new Date(a.date);
          return activityDate >= monthStart && activityDate <= monthEnd;
      })
      .map(activity => {
          const user = users.find(u => u.id === activity.userId);
          return { ...activity, userName: user?.displayName, userDistrict: user?.district };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, users]);
    
  const getMobilizationMethodDisplay = (methods: string[] | string, otherMethod?: string) => {
    if (!methods) return "N/A";
    if (Array.isArray(methods)) {
        const displayMethods = methods.map(m => (m === 'Other' && otherMethod ? otherMethod : m));
        return displayMethods.join(', ');
    }
    return methods === 'Other' && otherMethod ? otherMethod : methods;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month's Campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : campaigns.length > 0 ? (
          <ScrollArea className="h-[480px]">
            <div className="space-y-4 pr-6">
              {campaigns.map((campaign, index) => {
                const canDelete = isAdministrator || campaign.userId === currentUser?.uid;
                return (
                <React.Fragment key={campaign.id}>
                  <div className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                      <div className="grid gap-1 flex-1">
                        <p className="font-semibold">{getCampaignTypeDisplay(campaign.details.campaignType, campaign.details.otherCampaignType)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getMobilizationMethodDisplay(campaign.details.mobilizationMethod, campaign.details.otherMobilizationMethod)}</span>
                        </div>
                        {isAdministrator && (
                              <>
                                  {campaign.userName && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <User className="size-3" />
                                          <span>{campaign.userName}</span>
                                      </div>
                                  )}
                                  {campaign.userDistrict && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Building className="size-3" />
                                          <span>{campaign.userDistrict}</span>
                                      </div>
                                  )}
                              </>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                          <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(campaign.date).toLocaleDateString()}
                          </p>
                          {canDelete && (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this mobilization.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(campaign.id)}>
                                      Delete
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                          )}
                      </div>
                  </div>
                  {index < campaigns.length - 1 && <Separator />}
                </React.Fragment>
            )})}
          </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col h-60 items-center justify-center rounded-md border border-dashed text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              No campaigns recorded this month.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
