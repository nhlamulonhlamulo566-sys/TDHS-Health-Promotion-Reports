
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, differenceInMinutes } from "date-fns";
import { CalendarIcon, PlusCircle, Save, Users, MapPin, Loader2, Clock } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import useStore from "@/lib/store";
import { useFirebase, useUser } from "@/firebase";
import { TimePicker } from "@/components/ui/time-picker";
import { useUsers } from "@/hooks/use-users";

const topics = [
  { id: "tb-screening", label: "TB Screening" },
  { id: "bp-screening", label: "BP Screening" },
  { id: "hiv-testing", label: "HIV Testing" },
  { id: "family-planning", label: "Family Planning" },
  { id: "eye-care", label: "Eye Care" },
  { id: "nutrition", label: "Nutrition" },
  { id: "bg-screening", label: "BG Screening" },
  { id: "flu-vaccine", label: "Flu Vaccine" },
  { id: "prep", label: "PrEP" },
  { id: "cervical-cancer-screening", label: "Cervical Cancer Screening" },
  { id: "vitamin-a", label: "Vitamin A" },
  { id: "deworming", label: "Deworming" },
  { id: "mental-health", label: "Mental Health" },
  { id: "dental-care", label: "Dental Care" },
  { id: "pamphlets-distributed", label: "Pamphlets Distributed" },
  { id: "condoms-distributed", label: "Condoms Distributed" },
  { id: "pap-smear", label: "Pap Smear" },
  { id: "mmc", label: "MMC" },
  { id: "muac", label: "MUAC" },
  { id: "other", label: "Other" },
];

const serviceSchema = z.object({
  id: z.string(),
  label: z.string(),
  peopleReached: z.coerce.number().optional(),
});

const serviceSessionFormSchema = z.object({
  date: z.date({
    required_error: "A date for the session is required.",
  }),
  venue: z.string().min(1, "Venue is required."),
  services: z.array(serviceSchema).refine((value) => value.length > 0, {
    message: "You have to select at least one service.",
  }),
  otherTopic: z.string().optional(),
  healthTalkDelivered: z.boolean().optional(),
  healthTalkTopic: z.string().optional(),
  healthTalkAttendees: z.coerce.number().optional(),
  notes: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine(data => {
    const otherService = data.services.find(s => s.id === 'other');
    if (otherService && (!data.otherTopic || data.otherTopic.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Please specify the 'Other' service.",
    path: ["otherTopic"],
}).refine(data => {
    for (const service of data.services) {
        if (!service.peopleReached || service.peopleReached < 1) {
            return false;
        }
    }
    return true;
}, {
    message: "People reached is required for every selected service.",
    path: ["services"],
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

type ServiceSessionFormValues = z.infer<typeof serviceSessionFormSchema>;

const defaultValues: Partial<ServiceSessionFormValues> = {
  venue: "",
  services: [],
  otherTopic: "",
  healthTalkDelivered: false,
  healthTalkTopic: "",
  healthTalkAttendees: undefined,
  notes: "",
  startTime: "",
  endTime: "",
};

export function CornerToCornerForm() {
  const { toast } = useToast();
  const addActivity = useStore((state) => state.addActivity);
  const { firestore, app } = useFirebase();
  const { user } = useUser();
  const { users } = useUsers();
  const currentUserProfile = users.find(u => u.id === user?.uid);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<ServiceSessionFormValues>({
    resolver: zodResolver(serviceSessionFormSchema),
    defaultValues,
  });
  
  const watchServices = form.watch("services");
  const isOtherSelected = watchServices?.some(s => s.id === 'other');

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

  async function onSubmit(data: ServiceSessionFormValues) {
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
        const totalPeopleReached = data.services.reduce((acc, service) => acc + (service.peopleReached || 0), 0);
        const details = { ...data, peopleReached: totalPeopleReached } as any;
        // If health talk not delivered, ensure we don't include empty fields
        if (!data.healthTalkDelivered) {
          delete details.healthTalkTopic;
          delete details.healthTalkAttendees;
        }
        const activityData = {
          date: data.date.toISOString(),
          type: 'Corner to Corner',
          details,
        };
        await addActivity(app, firestore, user.uid, currentUserProfile.district, activityData);

        toast({
        title: "Service Session Saved!",
        description: "The new service session has been recorded.",
        });
        form.reset(defaultValues);
        setDuration(null);
    } catch (error: any) {
        console.error("Failed to save corner to corner session:", error);
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
          New Service Session
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
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <FormField
                control={form.control}
                name="healthTalkDelivered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Health Talk Delivered?</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={field.value || false} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm text-muted-foreground">Check if a health talk was given during this session</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('healthTalkDelivered') && (
                <>
                  <FormField
                    control={form.control}
                    name="healthTalkTopic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Talk Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter topic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="healthTalkAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of attendees</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Rendered *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topics.map((topic) => (
                      <div key={topic.id} className="flex items-center gap-4 rounded-md border p-4">
                        <Checkbox
                          id={`service-${topic.id}`}
                          checked={field.value?.some(s => s.id === topic.id)}
                          onCheckedChange={(checked) => {
                            const currentServices = field.value || [];
                            if (checked) {
                              field.onChange([...currentServices, { id: topic.id, label: topic.label, peopleReached: 1 }]);
                            } else {
                              field.onChange(currentServices.filter(s => s.id !== topic.id));
                            }
                          }}
                        />
                        <label htmlFor={`service-${topic.id}`} className="flex-1 text-sm font-medium leading-none">
                          {topic.label}
                        </label>
                        {field.value?.some(s => s.id === topic.id) && (
                           <div className="relative w-24">
                             <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input
                                type="number"
                                placeholder="0"
                                className="pl-9"
                                min={1}
                                value={field.value.find(s => s.id === topic.id)?.peopleReached || ''}
                                onChange={(e) => {
                                   const updatedServices = field.value.map(s => 
                                    s.id === topic.id 
                                    ? { ...s, peopleReached: parseInt(e.target.value) || 0 }
                                    : s
                                   );
                                   field.onChange(updatedServices);
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
                    <FormLabel>Please specify other service *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter other service..."
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
                      placeholder="Additional notes about the services provided..."
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
              {isSubmitting ? "Saving..." : "Save Service Session"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
