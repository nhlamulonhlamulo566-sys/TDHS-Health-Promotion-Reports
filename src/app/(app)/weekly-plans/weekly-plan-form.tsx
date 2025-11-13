
'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, PlusCircle, Save, Loader2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import useStore from '@/lib/store';
import { useFirebase, useUser } from '@/firebase';
import { useUsers } from '@/hooks/use-users';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TimePicker } from '@/components/ui/time-picker';

const weeklyPlanSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  activity: z.string().min(1, "Activity description is required."),
  venue: z.string().min(1, "Venue is required."),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
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

type WeeklyPlanFormValues = z.infer<typeof weeklyPlanSchema>;

const defaultValues: Partial<WeeklyPlanFormValues> = {
  activity: "",
  venue: "",
  startTime: "",
  endTime: "",
  date: undefined,
};


export function WeeklyPlanForm() {
  const { toast } = useToast();
  const addActivityStore = useStore((state) => state.addActivity);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<WeeklyPlanFormValues>({
    resolver: zodResolver(weeklyPlanSchema),
    defaultValues,
  });
  
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

  async function onSubmit(data: WeeklyPlanFormValues) {
    if (!firestore || !user || !currentUserProfile?.district) {
        toast({
            title: 'Error',
            description: 'Could not connect to the database or user district is not set. Please try again.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await addActivityStore(firestore, user.uid, currentUserProfile.district, {
            date: data.date.toISOString(),
            type: 'Weekly Plan',
            details: data,
        });

        form.reset(defaultValues);
        setDuration(null);
        toast({
            title: 'Activity Saved',
            description: 'Your new activity has been added to the plan.',
        });
    } catch (error: any) {
        console.error("Failed to save activity:", error);
        toast({
          title: "Save failed",
          description: error?.message || "You do not have permission to save this data.",
          variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="size-6" />
          Add New Activity
        </CardTitle>
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
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    name="activity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Activity *</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Describe the planned activity..."
                                rows={4}
                                {...field}
                            />
                        </FormControl>
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
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Enter venue location..."
                                    className="pl-9"
                                    {...field}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                    {isSubmitting ? 'Saving...' : 'Save Activity'}
                </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
