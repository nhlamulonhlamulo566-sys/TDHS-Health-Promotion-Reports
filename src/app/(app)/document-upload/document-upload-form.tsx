
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  PlusCircle,
  Save,
  Loader2,
  Paperclip,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { useUsers } from "@/hooks/use-users";
import { FileUpload } from "@/components/ui/file-upload";

const documentUploadSchema = z.object({
  date: z.date({
    required_error: "A date for the document is required.",
  }),
  title: z.string().min(1, "A title for the document is required."),
  notes: z.string().optional(),
  registerFile: z.instanceof(File).optional().nullable(),
  pictureFile: z.instanceof(File).optional().nullable(),
});

type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

const defaultValues: Partial<DocumentUploadFormValues> = {
  title: "",
  notes: "",
  registerFile: null,
  pictureFile: null,
};

export function DocumentUploadForm() {
  const { toast } = useToast();
  const addDocumentUpload = useStore((state) => state.addDocumentUpload);
  const { firestore, app } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues,
  });

  async function onSubmit(data: DocumentUploadFormValues) {
    if (!firestore || !app || !user || !currentUserProfile?.district) {
      toast({
        title: 'Error',
        description: 'Could not save. User profile, district, or Firebase connection not found.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const attachmentData = {
        date: data.date,
        title: data.title,
        notes: data.notes,
      };

      const uploadTasks = {
        registerFile: data.registerFile,
        pictureFile: data.pictureFile,
      };

      await addDocumentUpload(app, firestore, user.uid, currentUserProfile.district, attachmentData, uploadTasks);
      
      toast({
        title: "Document Saved!",
        description: "Your document and files have been uploaded.",
      });
      form.reset(defaultValues);
    } catch (error: any) {
      console.error("Failed to save document:", error);
      toast({
        title: "Save failed",
        description: error?.message || "You do not have permission to save this data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-6 w-6" />
          New Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value ? (
                                format(field.value, "PPP")
                                ) : (
                                <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Document Title *</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder="e.g., Weekly Plan Register"
                            className="pl-9"
                            {...field}
                            />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="registerFile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Attendance Register</FormLabel>
                            <FormControl>
                                <FileUpload
                                    onFileSelect={(file) => field.onChange(file)}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                                    title="Upload Register"
                                    subtitle="PDF, Docs, Excel, Images"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="pictureFile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Photo</FormLabel>
                            <FormControl>
                                <FileUpload
                                    onFileSelect={(file) => field.onChange(file)}
                                    accept="image/*"
                                    icon="image"
                                    title="Upload Photo"
                                    subtitle="JPG, PNG, GIF"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the document..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Uploading..." : "Save Document"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
