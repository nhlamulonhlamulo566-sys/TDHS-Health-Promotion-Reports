
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Save, Loader2, X, File as FileIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { FileUpload } from "@/components/ui/file-upload";
import { useUsers } from "@/hooks/use-users";
import { Progress } from "@/components/ui/progress";

const attachmentFormSchema = z
  .object({
    date: z.date({ required_error: "A date for the attachment is required." }),
    title: z.string().min(1, "A title is required."),
    notes: z.string().optional(),
    registerFile: z.instanceof(File).nullable(),
    pictureFiles: z.array(z.instanceof(File)).optional(),
  })
  .refine(
    (data) => data.registerFile || (data.pictureFiles && data.pictureFiles.length > 0),
    {
      message: "You must upload at least one file.",
      path: ["registerFile"],
    }
  );

type AttachmentFormValues = z.infer<typeof attachmentFormSchema>;

const defaultValues: Partial<AttachmentFormValues> = {
  title: "",
  notes: "",
  registerFile: null,
  pictureFiles: [],
};

export function AttachmentForm() {
  const { toast } = useToast();
  const { addAttachment, isUploading, uploadProgress } = useStore();
  const { firestore, app } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find((u) => u.id === user?.uid);
  const [fileUploadKey, setFileUploadKey] = React.useState(Date.now());

  const form = useForm<AttachmentFormValues>({
    resolver: zodResolver(attachmentFormSchema),
    defaultValues,
  });

  async function onSubmit(data: AttachmentFormValues) {
    if (!firestore || !app || !user || !currentUserProfile?.district) {
        toast({
        title: "Error",
        description: "Missing Firebase or user data.",
        variant: "destructive",
        });
        return;
    }

    try {
        await addAttachment(
            firestore,
            app,
            user.uid,
            currentUserProfile.district,
            {
                date: data.date,
                title: data.title,
                notes: data.notes || "",
            },
            {
                registerFile: data.registerFile,
                pictureFiles: data.pictureFiles,
            }
        );

        toast({
            title: "Attachment Saved!",
            description: "The new attachment and files were uploaded.",
        });

        form.reset(defaultValues);
        setFileUploadKey(Date.now());
    } catch (error: any) {
        console.error("Failed to save attachment:", error);
        toast({
            title: "Save failed",
            description: error?.message || "An error occurred. You may not have permission to save this data.",
            variant: "destructive",
        });
    }
  }
  
  const allUploadFiles = [
    ...(form.watch('registerFile') ? [form.watch('registerFile')] : []),
    ...(form.watch('pictureFiles') || []),
  ].filter(Boolean) as File[];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          New Attachment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date & Title */}
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
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Atteridgeville Clinic Register" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Register File (single) */}
            <FormField
              control={form.control}
              name="registerFile"
              render={({ field }) => {
                const file = field.value;
                const isImage = file?.type.startsWith("image/");
                const previewUrl = file ? URL.createObjectURL(file) : null;
                
                return (
                  <FormItem>
                    <FormLabel>Register File</FormLabel>
                    <FormDescription>Upload a register document (PDF, DOC, images)</FormDescription>
                    <FileUpload
                      key={`${fileUploadKey}-register`}
                      title="Click to upload register"
                      accept="*/*"
                      icon="file"
                      onFileSelect={(selectedFile) => {
                        const file = selectedFile instanceof FileList ? selectedFile[0] : selectedFile;
                        field.onChange(file);
                      }}
                    />
                    {file && previewUrl && (
                      <div className="mt-2 relative">
                        {isImage ? (
                          <div className="relative inline-block">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-24 w-full object-cover rounded border"
                              onLoad={() => URL.revokeObjectURL(previewUrl)}
                            />
                             <button
                              type="button"
                              onClick={() => field.onChange(null)}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground border rounded p-2">
                             <div className="flex items-center gap-2">
                                <FileIcon className="h-5 w-5" />
                                <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => field.onChange(null)}
                              className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Picture Files (multi) */}
            <FormField
              control={form.control}
              name="pictureFiles"
              render={({ field }) => {
                const files = field.value || [];
                return (
                  <FormItem>
                    <FormLabel>Pictures</FormLabel>
                    <FormDescription>Upload one or more pictures</FormDescription>
                    <FileUpload
                      key={`${fileUploadKey}-pictures`}
                      multiple
                      accept="image/*"
                      title="Click to upload pictures"
                      icon="image"
                      onFileSelect={(selectedFiles) => {
                          const fileList = selectedFiles instanceof FileList ? Array.from(selectedFiles) : [selectedFiles];
                          field.onChange([...files, ...fileList])
                        }
                      }
                    />
                    {files.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {files.map((file, idx) => {
                          const url = URL.createObjectURL(file);
                          return (
                            <div key={idx} className="relative">
                              <img
                                src={url}
                                alt="Preview"
                                className="h-24 w-full object-cover rounded border"
                                onLoad={() => URL.revokeObjectURL(url)}
                              />
                              <button
                                type="button"
                                onClick={() => field.onChange(files.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            
            {isUploading && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading files...</p>
                {allUploadFiles.map((file, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="truncate max-w-xs">{file.name}</span>
                      <span className="font-medium">{uploadProgress[file.name] || 0}%</span>
                    </div>
                    <Progress value={uploadProgress[file.name] || 0} />
                  </div>
                ))}
              </div>
            )}


            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Save Attachment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
