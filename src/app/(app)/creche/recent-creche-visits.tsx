
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Trash2, Loader2, User, Building } from "lucide-react";
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

const getTopicDisplay = (details: any) => {
    const { topic, otherTopic } = details;
    if (!topic) return 'No topics';
    if (Array.isArray(topic)) {
        const displayTopics = topic.map(t => (t === 'Other' && otherTopic ? otherTopic : t));
        return displayTopics.join(', ');
    }
    return topic === 'Other' && otherTopic ? otherTopic : topic;
}

export function RecentCrecheVisits() {
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
      title: "Creche Visit Deleted",
      description: "The creche visit has been removed.",
    });
  };

  const visits = React.useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return activities
      .filter(a => {
          if (a.type !== 'Creche Visit') return false;
          const activityDate = new Date(a.date);
          return activityDate >= monthStart && activityDate <= monthEnd;
      })
      .map(activity => {
          const user = users.find(u => u.id === activity.userId);
          return { ...activity, userName: user?.displayName, userDistrict: user?.district };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month's Creche Visits</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : visits.length > 0 ? (
          <ScrollArea className="h-[480px]">
            <div className="space-y-4 pr-6">
              {visits.map((visit, index) => {
                const canDelete = isAdministrator || visit.userId === currentUser?.uid;
                return (
                <React.Fragment key={visit.id}>
                  <div className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                      <div className="grid gap-1 flex-1">
                        <p className="font-semibold">{getTopicDisplay(visit.details)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{visit.details.crecheName}</span>
                        </div>
                        {isAdministrator && (
                              <>
                                  {visit.userName && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <User className="size-3" />
                                          <span>{visit.userName}</span>
                                      </div>
                                  )}
                                  {visit.userDistrict && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Building className="size-3" />
                                          <span>{visit.userDistrict}</span>
                                      </div>
                                  )}
                              </>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                          <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(visit.date).toLocaleDateString()}
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
                                      This action cannot be undone. This will permanently delete this creche visit.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(visit.id)}>
                                      Delete
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                          )}
                      </div>
                  </div>
                  {index < visits.length - 1 && <Separator />}
                </React.Fragment>
            )})}
          </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col h-60 items-center justify-center rounded-md border border-dashed text-center">
            <Heart className="h-10 w-10 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              No creche visits recorded this month.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
