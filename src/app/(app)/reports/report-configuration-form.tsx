
"use client";

import * as React from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Users } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/hooks/use-users";

interface ReportConfigurationFormProps {
  onGenerateReport: (config: any) => void;
  isLoading: boolean;
}

export function ReportConfigurationForm({
  onGenerateReport,
  isLoading,
}: ReportConfigurationFormProps) {
  const [reportType, setReportType] = React.useState("monthly");
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedUser, setSelectedUser] = React.useState("all");
  const { users } = useUsers();

  React.useEffect(() => {
    const now = new Date();
    if (reportType === 'weekly') {
      setDate({
        from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        to: endOfWeek(now, { weekStartsOn: 1 }),
      });
    } else if (reportType === 'monthly') {
      setDate({
        from: startOfMonth(now),
        to: endOfMonth(now),
      });
    } else if (reportType === 'yearly') {
      setDate({
        from: startOfYear(now),
        to: endOfYear(now),
      });
    }
  }, [reportType]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateReport({ reportType, date, selectedUser });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-2 block">Report Type</Label>
            <RadioGroup
              defaultValue="monthly"
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              onValueChange={setReportType}
              value={reportType}
            >
              <div>
                <RadioGroupItem value="weekly" id="weekly" className="peer sr-only" />
                <Label
                  htmlFor="weekly"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Weekly Report
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="monthly"
                  id="monthly"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="monthly"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Monthly Report
                </Label>
              </div>
              <div>
                <RadioGroupItem value="yearly" id="yearly" className="peer sr-only" />
                <Label
                  htmlFor="yearly"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Yearly Report
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select user..." />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
