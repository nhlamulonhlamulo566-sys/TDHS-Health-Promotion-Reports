
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
import { startOfMonth, endOfMonth } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';


export function RecentTishSessions() {
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
        title: "TISH Session Deleted",
        description: "The TISH service session has been removed.",
    });
  };

  const sessions = React.useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return activities
      .filter(a => {
          if (a.type !== 'TISH') return false;
          const activityDate = new Date(a.date);
          return activityDate >= monthStart && activityDate <= monthEnd;
      })
      .map(activity => {
          const user = users.find(u => u.id === activity.userId);
          return { ...activity, userName: user?.displayName, userDistrict: user?.district };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, users]);
    
  const getServicesDisplay = (session: any) => {
    if (!session.details.services || session.details.services.length === 0) return "No services recorded";
    
    return session.details.services.map((s: any) => {
        if (s.id === 'other') {
            return `${session.details.otherTopic || 'Other'} (${s.peopleReached || 0})`;
        }
        return `${s.label} (${s.peopleReached || 0})`;
    }).join(', ');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month's Service Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : sessions.length > 0 ? (
          <ScrollArea className="h-[480px]">
            <div className="space-y-4 pr-6">
              {sessions.map((session, index) => {
                const canDelete = isAdministrator || session.userId === currentUser?.uid;
                return (
                <React.Fragment key={session.id}>
                  <div className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                      <div className="grid gap-1 flex-1">
                        <p className="font-semibold">{getServicesDisplay(session)}</p>
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
                          )}
                      </div>
                  </div>
                  {index < sessions.length - 1 && <Separator />}
                </React.Fragment>
            )})}
          </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col h-60 items-center justify-center rounded-md border border-dashed text-center">
            <CheckSquare className="h-10 w-10 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              No service sessions recorded this month.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
