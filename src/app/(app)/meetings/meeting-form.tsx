"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import React from "react";
import { CalendarIcon, MapPin, Clock, Save, Loader2, PlusCircle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { useUsers } from "@/hooks/use-users";
import { cn } from "@/lib/utils";

const meetingSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  venue: z.string().min(1, "Venue is required."),
  purpose: z.string().min(1, "Purpose is required."),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

type MeetingValues = z.infer<typeof meetingSchema>;

const defaultValues: Partial<MeetingValues> = {
  venue: "",
  purpose: "",
  notes: "",
  startTime: "",
  endTime: "",
};

export function MeetingForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore, app } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find((u) => u.id === user?.uid);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<MeetingValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues,
  });

  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");
  const [duration, setDuration] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (watchStartTime && watchEndTime) {
      const [startHour, startMinute] = watchStartTime.split(":").map(Number);
      const [endHour, endMinute] = watchEndTime.split(":").map(Number);
      const startDate = new Date(0, 0, 0, startHour, startMinute);
      const endDate = new Date(0, 0, 0, endHour, endMinute);

      if (endDate <= startDate) {
        setDuration(null);
        form.setError("endTime", { type: "manual", message: "End time must be after start time." });
        return;
      } else {
        form.clearErrors("endTime");
      }

      const diff = differenceInMinutes(endDate, startDate);
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      let durationString = "";
      if (hours > 0) durationString += `${hours} hour${hours > 1 ? "s" : ""}`;
      if (minutes > 0) durationString += ` ${minutes} minute${minutes > 1 ? "s" : ""}`;
      setDuration(durationString.trim());
    } else {
      setDuration(null);
    }
  }, [watchStartTime, watchEndTime, form]);

  async function onSubmit(data: MeetingValues) {
    if (!firestore || !user || !currentUserProfile?.district || !app) {
      toast({ title: "Error", description: "Could not save. User profile or district not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const activityData = { date: data.date.toISOString(), type: "Meeting", details: data };
      await addActivity(app, firestore, user.uid, currentUserProfile.district, activityData);
      toast({ title: "Meeting Saved!", description: "The meeting has been recorded." });
      form.reset(defaultValues);
      setDuration(null);
    } catch (error: any) {
      console.error("Failed to save meeting:", error);
      toast({ title: "Save failed", description: error?.message || "You do not have permission to save this data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Schedule Meeting</CardTitle>
        <CardDescription>Record meetings including time, date, venue and purpose.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="venue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter venue" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time *</FormLabel>
                  <FormControl>
                    <TimePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time *</FormLabel>
                  <FormControl>
                    <TimePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <div className={cn("flex h-10 w-full items-center rounded-md border border-input bg-background/30 px-3 py-2 text-sm", duration ? "text-foreground" : "text-muted-foreground")}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {duration || "N/A"}
                </div>
              </FormItem>
            </div>

            <FormField control={form.control} name="purpose" render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter purpose of meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes..." rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Meeting"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { form.reset(defaultValues); setDuration(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default MeetingForm;
