
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import {
  CalendarIcon,
  MapPin,
  Clock,
  PlusCircle,
  Save,
  Users,
  Loader2
} from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";
import React from "react";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { useUsers } from "@/hooks/use-users";
import { Checkbox } from "@/components/ui/checkbox";

const topics = [
  { id: "physical-activity", label: "Importance of Physical Activity" },
  { id: "salt-reduction", label: "Salt reduction" },
  { id: "nutrition", label: "Nutrition" },
  { id: "obesity-overweight", label: "Obesity & Overweight" },
  { id: "substance-abuse", label: "Tobacco, Alcohol & Substance Abuse" },
  { id: "sexual-behaviour", label: "Safe Sexual Behaviour" },
  { id: "other", label: "Other" },
];

const topicSchema = z.object({
  id: z.string(),
  label: z.string(),
  peopleReached: z.coerce.number().optional(),
});

const healthTalkFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  venue: z.string().min(1, "Venue is required."),
  topics: z.array(topicSchema).refine((value) => value.length > 0, {
    message: "You have to select at least one topic.",
  }),
  otherTopic: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
}).refine(data => {
    const otherTopic = data.topics.find(s => s.id === 'other');
    if (otherTopic && (!data.otherTopic || data.otherTopic.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' topic.",
    path: ["otherTopic"],
}).refine(data => {
    for (const topic of data.topics) {
        if (!topic.peopleReached || topic.peopleReached < 1) {
            return false;
        }
    }
    return true;
}, {
    message: "People reached is required for every selected topic.",
    path: ["topics"],
});

type HealthTalkFormValues = z.infer<typeof healthTalkFormSchema>;

const defaultValues: Partial<HealthTalkFormValues> = {
  venue: "",
  topics: [],
  otherTopic: "",
  notes: "",
  startTime: "",
  endTime: "",
};

export function HealthTalkForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore, app } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<HealthTalkFormValues>({
    resolver: zodResolver(healthTalkFormSchema),
    defaultValues,
  });

  const [duration, setDuration] = React.useState<string | null>(null);

  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");
  const watchTopics = form.watch("topics");
  const isOtherSelected = watchTopics?.some(s => s.id === 'other');

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

  async function onSubmit(data: HealthTalkFormValues) {
    if (!firestore || !user || !currentUserProfile?.district || !app) {
         toast({
            title: 'Error',
            description: 'Could not save. User profile or district not found.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const totalPeopleReached = data.topics.reduce((acc, topic) => acc + (topic.peopleReached || 0), 0);
        const activityData = {
          date: data.date.toISOString(),
          type: 'Health Talk',
          details: { ...data, peopleReached: totalPeopleReached },
        };
        await addActivity(app, firestore, user.uid, currentUserProfile.district, activityData);
        
        toast({
            title: "Health Talk Saved!",
            description: "The new health talk has been recorded.",
        });
        form.reset(defaultValues);
        setDuration(null);
    } catch (error: any) {
        console.error("Failed to save health talk:", error);
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
        <CardTitle className="flex items-center gap-2"><PlusCircle/> New Health Talk</CardTitle>
        <CardDescription>Fill out the form to record a new health talk session.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                          placeholder="e.g., Community Hall"
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
              name="topics"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Topics Covered *</FormLabel>
                    <FormDescription>
                      Select all topics that apply and enter the number of people reached for each.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topics.map((topic) => (
                    <div key={topic.id} className="flex items-center gap-4 rounded-md border p-4">
                        <Checkbox
                          id={`topic-${topic.id}`}
                          checked={field.value?.some(t => t.id === topic.id)}
                          onCheckedChange={(checked) => {
                            const currentTopics = field.value || [];
                            if (checked) {
                              field.onChange([...currentTopics, { id: topic.id, label: topic.label, peopleReached: 1 }]);
                            } else {
                              field.onChange(currentTopics.filter(t => t.id !== topic.id));
                            }
                          }}
                        />
                        <label htmlFor={`topic-${topic.id}`} className="flex-1 text-sm font-medium leading-none">
                          {topic.label}
                        </label>
                        {field.value?.some(t => t.id === topic.id) && (
                           <div className="relative w-24">
                             <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input
                                type="number"
                                placeholder="0"
                                className="pl-9"
                                min={1}
                                value={field.value.find(t => t.id === topic.id)?.peopleReached || ''}
                                onChange={(e) => {
                                   const updatedTopics = field.value.map(t => 
                                    t.id === topic.id 
                                    ? { ...t, peopleReached: parseInt(e.target.value) || 0 }
                                    : t
                                   );
                                   field.onChange(updatedTopics);
                                }}
                             />
                           </div>
                        )}
                      </div>
                  ))}
                  </div>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes, comments, or follow-up actions..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Health Talk"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(defaultValues);
                  setDuration(null);
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
