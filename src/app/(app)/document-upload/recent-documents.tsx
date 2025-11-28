
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Trash2, Loader2, User, Building, File, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
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

export function RecentDocuments() {
    const { toast } = useToast();
    const { activities, isLoading } = useActivities();
    const deleteActivity  = useStore(state => state.deleteActivity);
    const firestore = useFirestore();
    const { users } = useUsers();
    const { user: currentUser } = useUser();
    const currentUserProfile = users.find(u => u.id === currentUser?.uid);
    const isAdministrator = currentUserProfile?.role === 'Administrator' || currentUserProfile?.role === 'Super Administrator';

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        deleteActivity(firestore, id);
        toast({
            title: "Document Deleted",
            description: "The document has been removed.",
        });
    };

    const documents = activities
      .filter(a => a.type === 'Document Upload')
      .map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return { ...activity, userName: user?.displayName, userDistrict: user?.district };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : documents && documents.length > 0 ? (
            <div className="space-y-4">
                {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                        <div className="grid gap-1 flex-1">
                            <p className="font-semibold">{doc.details.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {doc.details.registerAttachment && (
                                    <a href={doc.details.registerAttachment} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                        <File className="size-4" />
                                        <span>Register</span>
                                    </a>
                                )}
                                {doc.details.pictureAttachment && (
                                    <a href={doc.details.pictureAttachment} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                        <ImageIcon className="size-4" />
                                        <span>Photo</span>
                                    </a>
                                )}
                            </div>
                            {isAdministrator && (
                                <>
                                    {doc.userName && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="size-3" />
                                            <span>{doc.userName}</span>
                                        </div>
                                    )}
                                    {doc.userDistrict && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Building className="size-3" />
                                            <span>{doc.userDistrict}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                                {format(new Date(doc.date), 'P')}
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
                                        This action cannot be undone. This will permanently delete this document.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(doc.id)}>
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
            <Paperclip className="h-10 w-10 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              No documents uploaded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
