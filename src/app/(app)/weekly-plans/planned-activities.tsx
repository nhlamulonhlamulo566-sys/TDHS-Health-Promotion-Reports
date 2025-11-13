
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { MapPin, Trash2, Loader2, Clock, User, Building } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import useStore from '@/lib/store';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { useActivities } from '@/hooks/use-activities';
import { useUsers } from '@/hooks/use-users';

export function PlannedActivities() {
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
            title: "Activity Deleted",
            description: "The weekly plan activity has been removed.",
        });
    };

  const sortedActivities = activities
    .filter(a => a.type === 'Weekly Plan')
    .map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return { ...activity, userName: user?.displayName, userDistrict: user?.district };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planned Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : sortedActivities.length > 0 ? (
          <ScrollArea className="h-[480px]">
            <div className="space-y-4 pr-6">
              {sortedActivities.map((item, index) => (
                <React.Fragment key={item.id}>
                  <div className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                    <div className="grid gap-1 flex-1">
                      <p className="font-semibold">{item.details.activity}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4" />
                        <span>{item.details.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        <span>{item.details.startTime} - {item.details.endTime}</span>
                      </div>
                       {isAdministrator && (
                            <>
                                {item.userName && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="size-3" />
                                        <span>{item.userName}</span>
                                    </div>
                                )}
                                {item.userDistrict && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Building className="size-3" />
                                        <span>{item.userDistrict}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(item.date), 'P')}
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
                                    This action cannot be undone. This will permanently delete this activity.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                  {index < sortedActivities.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground">No activities planned yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
