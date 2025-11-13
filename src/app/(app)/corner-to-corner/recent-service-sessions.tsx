
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Trash2, Loader2, User, Building } from "lucide-react";
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

export function RecentCornerToCornerSessions() {
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
        title: "Service Session Deleted",
        description: "The service session has been removed.",
    });
  };

  const sessions = activities
    .filter(a => a.type === 'Corner to Corner')
    .map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return { ...activity, userName: user?.displayName, userDistrict: user?.district };
    })
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Service Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
                <div key={session.id} className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                    <div className="grid gap-1 flex-1">
                      <p className="font-semibold">{session.details.topic === 'Other' ? session.details.otherTopic : session.details.topic}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{session.details.venue}</span>
                      </div>
                      {isAdministrator && (
                            <>
                                {session.userName && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="size-3" />
                                        <span>{session.userName}</span>
                                    </div>
                                )}
                                {session.userDistrict && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Building className="size-3" />
                                        <span>{session.userDistrict}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(session.date).toLocaleDateString()}
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
                                    This action cannot be undone. This will permanently delete this service session.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(session.id)}>
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
            <CheckSquare className="h-10 w-10 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              No service sessions recorded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
