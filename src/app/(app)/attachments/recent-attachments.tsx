
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Trash2, Loader2, User, Building, File as FileIcon, Image as ImageIcon } from "lucide-react";
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
import { useAttachments } from '@/hooks/use-attachments';
import { useUsers } from '@/hooks/use-users';
import Link from 'next/link';

export function RecentAttachments() {
  const { toast } = useToast();
  const { attachments, isLoading } = useAttachments();
  const deleteAttachment = useStore((state) => state.deleteAttachment);
  const firestore = useFirestore();
  const { users } = useUsers();
  const { user: currentUser } = useUser();
  const currentUserProfile = users.find(u => u.id === currentUser?.uid);
  const isAdministrator = currentUserProfile?.role === 'Administrator' || currentUserProfile?.role === 'Super Administrator';

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    deleteAttachment(firestore, id);
    toast({
        title: "Attachment Deleted",
        description: "The attachment has been removed.",
    });
  };

  const sortedAttachments = attachments
    .map(attachment => {
        const user = users.find(u => u.id === attachment.userId);
        return { ...attachment, userName: user?.displayName, userDistrict: user?.district };
    })
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attachments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex flex-col h-60 items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : sortedAttachments.length > 0 ? (
          <div className="space-y-4">
            {sortedAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-start justify-between gap-4 rounded-lg p-4 hover:bg-secondary">
                    <div className="grid gap-2 flex-1">
                      <p className="font-semibold">{attachment.title}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {attachment.registerAttachmentUrl && (
                            <Link href={attachment.registerAttachmentUrl} target="_blank" className="flex items-center gap-1 hover:text-primary">
                                <FileIcon className="size-3" />
                                <span>Register</span>
                            </Link>
                        )}
                        {attachment.pictureAttachmentUrls && attachment.pictureAttachmentUrls.length > 0 && (
                            <div className="flex items-center gap-2">
                                <ImageIcon className="size-3" />
                                <span>{attachment.pictureAttachmentUrls.length} Picture{attachment.pictureAttachmentUrls.length > 1 ? 's' : ''}</span>
                            </div>
                        )}
                      </div>
                      
                      {isAdministrator && (
                            <div className="flex flex-wrap items-center gap-4">
                                {attachment.userName && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="size-3" />
                                        <span>{attachment.userName}</span>
                                    </div>
                                )}
                                {attachment.userDistrict && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Building className="size-3" />
                                        <span>{attachment.userDistrict}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(attachment.date).toLocaleDateString()}
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
                                    This action cannot be undone. This will permanently delete this attachment.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(attachment.id)}>
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
              No attachments recorded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
