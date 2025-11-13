
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Mic, MapPin, Trash2, Loader2, User, Building } from "lucide-react";
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

const topicLabels = {
    "physical-activity": "Importance of Physical Activity",
    "salt-reduction": "Salt reduction",
    "nutrition": "Nutrition",
    "obesity-overweight": "Obesity & Overweight",
    "substance-abuse": "Tobacco, Alcohol & Substance Abuse",
    "sexual-behaviour": "Safe Sexual Behaviour",
    "other": "Other",
  };
  
const getTopicDisplayNames = (topics: string[], otherTopic?: string) => {
    if (!topics || topics.length === 0) return "No topics";
    const topicNames = topics.map(t => {
        if (t === 'other' && otherTopic) {
            return otherTopic;
        }
        return topicLabels[t] || t;
    });
    return topicNames.join(', ');
}

export function HealthTalksHistory() {
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
        title: "Health Talk Deleted",
        description: "The health talk has been removed.",
    });
  };
  
  const talks = activities
    .filter(a => a.type === 'Health Talk')
    .map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return { ...activity, userName: user?.displayName, userDistrict: user?.district };
    })
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Health Talks</CardTitle>
        <CardDescription>A list of the most recently recorded health talks.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : talks && talks.length > 0 ? (
            <div className="space-y-4">
                {talks.map((talk) => (
                    <div key={talk.id} className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                        <div className="grid gap-1 flex-1">
                          <p className="font-semibold">{getTopicDisplayNames(talk.details.topics, talk.details.otherTopic)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="size-4" />
                              <span>{talk.details.venue}</span>
                          </div>
                         {isAdministrator && (
                            <>
                                {talk.userName && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="size-3" />
                                        <span>{talk.userName}</span>
                                    </div>
                                )}
                                {talk.userDistrict && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Building className="size-3" />
                                        <span>{talk.userDistrict}</span>
                                    </div>
                                )}
                            </>
                        )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(talk.date), 'P')}
                          </p>
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
                                      This action cannot be undone. This will permanently delete this health talk.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(talk.id)}>
                                      Delete
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
          <div className="flex flex-col h-60 items-center justify-center rounded-md border border-dashed text-center">
            <Mic className="h-10 w-10 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              No health talks recorded yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
