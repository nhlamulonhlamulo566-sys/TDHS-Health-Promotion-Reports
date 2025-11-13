
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import {
  CalendarIcon,
  MapPin,
  Users,
  PlusCircle,
  Save,
  Loader2,
  Clock,
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

const topics = [
    "Health Education",
    "Vaccination Benefits",
    "Nutrition Importance",
    "Mental Health",
    "Disease Prevention",
    "Hygiene Practices",
    "Exercise Benefits",
    "Substance Abuse",
    "Other",
];

const campaignFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  location: z.string().min(1, "Location is required."),
  campaignType: z.string().min(1, "Campaign type is required."),
  otherCampaignType: z.string().optional(),
  mobilizationMethod: z.string().min(1, "Mobilization method is required."),
  otherMobilizationMethod: z.string().optional(),
  topic: z.string().min(1, "You have to select at least one topic."),
  otherTopic: z.string().optional(),
  peopleReached: z.coerce.number().min(0, "Please enter a valid number."),
  notes: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  registerFile: z.any().optional(),
  pictureFile: z.any().optional(),
}).refine(data => {
    if (data.campaignType === 'Other' && (!data.otherCampaignType || data.otherCampaignType.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' campaign type.",
    path: ["otherCampaignType"],
}).refine(data => {
    if (data.mobilizationMethod === 'Other' && (!data.otherMobilizationMethod || data.otherMobilizationMethod.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' mobilization method.",
    path: ["otherMobilizationMethod"],
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


type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const defaultValues: Partial<CampaignFormValues> = {
  location: "",
  campaignType: "",
  otherCampaignType: "",
  mobilizationMethod: "",
  otherMobilizationMethod: "",
  topic: "",
  otherTopic: "",
  peopleReached: 0,
  notes: "",
  startTime: "",
  endTime: "",
  registerFile: null,
  pictureFile: null,
};

const campaignTypes = [
  "Community Meetings",
  "Door-to-door visits",
  "Public Announcements",
  "Partnerships with local leaders",
  "Other",
];

const mobilizationMethods = [
    "Community meetings",
    "Home visits",
    "Public announcements (radio, posters)",
    "Using local media (newspapers, TV)",
    "Other",
];

export function SocialMobilizationForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [fileUploadKey, setFileUploadKey] = React.useState(Date.now());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues,
  });

  const watchCampaignType = form.watch("campaignType");
  const isOtherCampaignTypeSelected = watchCampaignType === "Other";

  const watchMobilizationMethod = form.watch("mobilizationMethod");
  const isOtherMobilizationMethodSelected = watchMobilizationMethod === "Other";

  const watchTopic = form.watch("topic");
  const isOtherTopicSelected = watchTopic === "Other";
  
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

  async function onSubmit(data: CampaignFormValues) {
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
        const { activityData, uploadTasks } = await prepareActivityData(data, 'Social Mobilization');
        await addActivity(firestore, user.uid, currentUserProfile.district, activityData, uploadTasks);

        toast({
        title: "Mobilization Campaign Saved!",
        description: "The new mobilization campaign has been recorded.",
        });
        form.reset(defaultValues);
        setDuration(null);
        setFileUploadKey(Date.now());
    } catch (error: any) {
        console.error("Failed to save social mobilization:", error);
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
            New Mobilisation Campaign
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter campaign location..."
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
              name="campaignType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignTypes.map((type) => (
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
            {isOtherCampaignTypeSelected && (
              <FormField
                control={form.control}
                name="otherCampaignType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please specify other campaign type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter other campaign type..."
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
              name="mobilizationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobilization Method *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mobilizationMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isOtherMobilizationMethodSelected && (
              <FormField
                control={form.control}
                name="otherMobilizationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please specify other mobilization method</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter other mobilization method..."
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
                      <Input placeholder="Enter other topic..." {...field} />
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
                  <FormLabel>Number of People Reached</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="number"
                        placeholder="0"
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
                  <FormLabel>Campaign Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Key messages, community response, impact..."
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
              {isSubmitting ? "Saving..." : "Save Campaign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
