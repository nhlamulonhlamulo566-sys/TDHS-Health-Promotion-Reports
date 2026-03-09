"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import React from "react";
import { CalendarIcon, Clock, Save, Loader2, PlusCircle } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { useUsers } from "@/hooks/use-users";
import { cn } from "@/lib/utils";

const radioSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  radioName: z.string().min(1, "Radio name is required."),
  topic: z.string().min(1, "Topic is required."),
  listenership: z.coerce.number().min(0, "Listenership is required."),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

type RadioValues = z.infer<typeof radioSchema>;

const defaultValues: Partial<RadioValues> = {
  radioName: "",
  topic: "",
  listenership: 0,
  startTime: "",
  endTime: "",
  notes: "",
};

export function RadioSlotForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore, app } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find((u) => u.id === user?.uid);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RadioValues>({ resolver: zodResolver(radioSchema), defaultValues });

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

  async function onSubmit(data: RadioValues) {
    if (!firestore || !user || !currentUserProfile?.district || !app) {
      toast({ title: "Error", description: "Could not save. User profile or district not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const activityData = { date: data.date.toISOString(), type: "Radio Slot", details: data };
      await addActivity(app, firestore, user.uid, currentUserProfile.district, activityData);
      toast({ title: "Radio Slot Saved!", description: "The radio slot has been recorded." });
      form.reset(defaultValues);
      setDuration(null);
    } catch (error: any) {
      console.error("Failed to save radio slot:", error);
      toast({ title: "Save failed", description: error?.message || "You do not have permission to save this data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> New Radio Slot</CardTitle>
        <CardDescription>Record radio slots with station, topic, listenership and exact start/end times.</CardDescription>
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

              <FormField control={form.control} name="radioName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Radio Station *</FormLabel>
                  <FormControl>
                    <Input placeholder="Station name" {...field} />
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

            <FormField control={form.control} name="topic" render={({ field }) => (
              <FormItem>
                <FormLabel>Topic Covered *</FormLabel>
                <FormControl>
                  <Input placeholder="Topic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="listenership" render={({ field }) => (
              <FormItem>
                <FormLabel>Listenership *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Estimated listeners" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Radio Slot"}
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

export default RadioSlotForm;
