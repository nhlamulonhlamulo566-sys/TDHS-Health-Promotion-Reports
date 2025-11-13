
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import {
  CalendarIcon,
  MapPin,
  PlusCircle,
  Users,
  Loader2,
  Clock,
  Save,
} from "lucide-react";

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
import { TimePicker } from "@/components/ui/time-picker";
import React from "react";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { FileUpload } from "@/components/ui/file-upload";
import { useUsers } from "@/hooks/use-users";
import { prepareActivityData } from "@/lib/activity-utils";

const supportGroupFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  venue: z.string().min(1, "Venue is required."),
  supportGroupType: z.string().min(1, "Support group type is required."),
  otherSupportGroupType: z.string().optional(),
  topic: z.string().min(1, "Topic is required."),
  otherTopic: z.string().optional(),
  physicalActivity: z.string().min(1, "Physical activity is required."),
  otherPhysicalActivity: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  peopleReached: z.coerce.number().min(1, "Please enter a number."),
  notes: z.string().optional(),
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
    if (data.supportGroupType === 'Other' && (!data.otherSupportGroupType || data.otherSupportGroupType.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' support group type.",
    path: ["otherSupportGroupType"],
}).refine(data => {
    if (data.physicalActivity === 'Other' && (!data.otherPhysicalActivity || data.otherPhysicalActivity.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' physical activity.",
    path: ["otherPhysicalActivity"],
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


type SupportGroupFormValues = z.infer<typeof supportGroupFormSchema>;

const defaultValues: Partial<SupportGroupFormValues> = {
  venue: "",
  supportGroupType: "",
  otherSupportGroupType: "",
  topic: "",
  otherTopic: "",
  physicalActivity: "",
  otherPhysicalActivity: "",
  peopleReached: 0,
  notes: "",
  startTime: "",
  endTime: "",
  registerFile: null,
  pictureFile: null,
};

const groupTypes = [
  "Mental Health",
  "Chronic Illness",
  "Substance Abuse",
  "Grief and Loss",
  "Caregivers",
  "Other",
];

const topics = [
  "Coping Strategies",
  "Adherence",
  "Healthy Lifestyles",
  "Stress Reduction",
  "Peer Support",
  "Other",
];

const physicalActivities = [
    "Yoga",
    "Meditation",
    "Walking Group",
    "Stretching",
    "No Activity",
    "Other",
]

export function SupportGroupForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [fileUploadKey, setFileUploadKey] = React.useState(Date.now());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<SupportGroupFormValues>({
    resolver: zodResolver(supportGroupFormSchema),
    defaultValues,
  });

  const [duration, setDuration] = React.useState<string | null>(null);

  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");
  
  const watchTopic = form.watch("topic");
  const isOtherTopicSelected = watchTopic === "Other";

  const watchSupportGroupType = form.watch("supportGroupType");
  const isOtherSupportGroupTypeSelected = watchSupportGroupType === "Other";

  const watchPhysicalActivity = form.watch("physicalActivity");
  const isOtherPhysicalActivitySelected = watchPhysicalActivity === "Other";


  React.useEffect(() => {
    if (watchStartTime && watchEndTime) {
      const [startHour, startMinute] = watchStartTime.split(":").map(Number);
      const [endHour, endMinute] = watchEndTime.split(":").map(Number);
      const startDate = new Date(0, 0, 0, startHour, startMinute);
      const endDate = new Date(0, 0, 0, endHour, endMinute);

      if (endDate <= startDate) {
        setDuration(null);
        form.setError("endTime", {
          type: "manual",
          message: "End time must be after start time.",
        });
        return;
      } else {
        form.clearErrors("endTime");
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

  async function onSubmit(data: SupportGroupFormValues) {
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
        const { activityData, uploadTasks } = await prepareActivityData(data, 'Support Group');
        await addActivity(firestore, user.uid, currentUserProfile.district, activityData, uploadTasks);
        
        toast({
        title: "Support Group Session Saved!",
        description: "The new support group session has been recorded.",
        });
        form.reset(defaultValues);
        setDuration(null);
        setFileUploadKey(Date.now());
    } catch (error: any) {
        console.error("Failed to save support group session:", error);
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
        <CardTitle>Add New Support Group Session</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter venue"
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

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                  {duration || "Select times"}
                </div>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="supportGroupType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Group Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groupTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isOtherSupportGroupTypeSelected && (
              <FormField
                control={form.control}
                name="otherSupportGroupType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please specify other group type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter other group type..."
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
             {isOtherTopicSelected && (
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
              name="physicalActivity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Activity *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select physical activity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {physicalActivities.map((activity) => (
                        <SelectItem key={activity} value={activity}>
                          {activity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {isOtherPhysicalActivitySelected && (
              <FormField
                control={form.control}
                name="otherPhysicalActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please specify other physical activity</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter other physical activity..."
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
              name="peopleReached"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>People Reached *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="number"
                        placeholder="Enter number of people reached"
                        className="pl-9"
                        {...field}
                        onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                        }
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
                      placeholder="Additional notes..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Session"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(defaultValues);
                  setDuration(null);
                  setFileUploadKey(Date.now());
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
