
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import { CalendarIcon, PlusCircle, Save, Users, School as SchoolIcon, Loader2, Clock } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { TimePicker } from "@/components/ui/time-picker";
import { FileUpload } from "@/components/ui/file-upload";
import { useUsers } from "@/hooks/use-users";
import { prepareActivityData } from "@/lib/activity-utils";
import { Checkbox } from "@/components/ui/checkbox";

const topics = [
  "Importance of Physical Activity",
  "Salt reduction",
  "Nutrition",
  "Obesity & Overweight",
  "Tobacco, Alcohol & Substance Abuse",
  "Safe Sexual Behaviour",
  "bullying",
  "Food Poisoning",
  "Teenage Pregnancy",
  "Human Traffic",
  "Personal Hygiene",
  "Children's Rights",
  "Dental & Oral Care",
  "Other",
];

const gradeLevels = [
  { id: "Grade R", label: "Grade R" },
  { id: "Grade 1", label: "Grade 1" },
  { id: "Grade 2", label: "Grade 2" },
  { id: "Grade 3", label: "Grade 3" },
  { id: "Grade 4", label: "Grade 4" },
  { id: "Grade 5", label: "Grade 5" },
  { id: "Grade 6", label: "Grade 6" },
  { id: "Grade 7", label: "Grade 7" },
  { id: "Grade 8", label: "Grade 8" },
  { id: "Grade 9", label: "Grade 9" },
  { id: "Grade 10", label: "Grade 10" },
  { id: "Grade 11", label: "Grade 11" },
  { id: "Grade 12", label: "Grade 12" },
  { id: "All Grades", label: "All Grades" },
];

const schoolVisitFormSchema = z.object({
  date: z.date({
    required_error: "A date for the visit is required.",
  }),
  schoolName: z.string().min(1, "School name is required."),
  gradeLevel: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one grade level.",
  }),
  topic: z.string().min(1, "You have to select at least one topic."),
  otherTopic: z.string().optional(),
  studentsReached: z.coerce
    .number()
    .min(0, "Number of students must be a positive number."),
  notes: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  registerFile: z.any().optional(),
  pictureFile: z.any().optional(),
}).refine(data => {
    if (data.topic === 'Other' && (!data.otherTopic || data.otherTopic.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' topic.",
    path: ["otherTopic"],
}).refine(data => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    const startDate = new Date(0, 0, 0, startHour, startMinute);
    const endDate = new Date(0, 0, 0, endHour, endMinute);
    return endDate > startDate;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});

type SchoolVisitFormValues = z.infer<typeof schoolVisitFormSchema>;

const defaultValues: Partial<SchoolVisitFormValues> = {
  schoolName: "",
  gradeLevel: [],
  topic: "",
  otherTopic: "",
  studentsReached: 0,
  notes: "",
  startTime: "",
  endTime: "",
  registerFile: null,
  pictureFile: null,
};

export function SchoolVisitForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [fileUploadKey, setFileUploadKey] = React.useState(Date.now());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<SchoolVisitFormValues>({
    resolver: zodResolver(schoolVisitFormSchema),
    defaultValues,
  });

  const watchTopic = form.watch("topic");
  const isOtherSelected = watchTopic === "Other";

  const [duration, setDuration] = React.useState<string | null>(null);
  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");

  React.useEffect(() => {
    if (watchStartTime && watchEndTime) {
      const [startHour, startMinute] = watchStartTime.split(":").map(Number);
      const [endHour, endMinute] = watchEndTime.split(":").map(Number);
      const startDate = new Date(0, 0, 0, startHour, startMinute);
      const endDate = new Date(0, 0, 0, endHour, endMinute);

      if (endDate <= startDate) {
        setDuration(null);
        return;
      }

      const diff = differenceInMinutes(endDate, startDate);
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      let durationString = "";
      if (hours > 0)
        durationString += `${hours} hour${hours > 1 ? "s" : ""}`;
      if (minutes > 0)
        durationString += ` ${minutes} minute${minutes > 1 ? "s" : ""}`;
      setDuration(durationString.trim());
    } else {
      setDuration(null);
    }
  }, [watchStartTime, watchEndTime, form]);

  async function onSubmit(data: SchoolVisitFormValues) {
    if (!firestore || !user || !currentUserProfile?.district) {
      toast({
          title: 'Error',
          description: 'Could not save. User profile or district not found.',
          variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const { activityData, uploadTasks } = await prepareActivityData(data, 'School Visit');
        await addActivity(firestore, user.uid, currentUserProfile.district, activityData, uploadTasks);

        toast({
        title: "School Visit Saved!",
        description: "The new school visit has been recorded.",
        });
        form.reset(defaultValues);
        setDuration(null);
        setFileUploadKey(Date.now());
    } catch (error: any) {
        console.error("Failed to save school visit:", error);
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
          <PlusCircle className="h-5 w-5" />
          New School Visit
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
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter school name..."
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

             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <div
                  className={cn(
                    "flex h-10 w-full items-center rounded-md border border-input bg-background/30 px-3 py-2 text-sm",
                    duration ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {duration || "N/A"}
                </div>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="gradeLevel"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Grade Level *</FormLabel>
                    <FormDescription>
                      Select all grade levels that apply.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gradeLevels.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Covered *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isOtherSelected && (
              <FormField
                control={form.control}
                name="otherTopic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please specify other topic</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter other topic..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="studentsReached"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Students Reached</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registerFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          key={fileUploadKey}
                          onFileSelect={(file) => field.onChange(file)}
                          title="Click to upload register"
                          subtitle="PDF, DOC, or images"
                          icon="file"
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
                      <FormControl>
                        <FileUpload
                          key={fileUploadKey}
                          onFileSelect={(file) => field.onChange(file)}
                          title="Click to upload pictures"
                          subtitle="PNG, JPG, GIF"
                          accept="image/*"
                          icon="image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the visit..."
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
              {isSubmitting ? "Saving..." : "Save School Visit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
    