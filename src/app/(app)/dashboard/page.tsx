
'use client';
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { StatsCardsContainer } from "./components/stats-cards";
import ActivityChart from "./components/activity-chart";
import RecentReports from "./components/recent-reports";
import { useActivities } from "@/hooks/use-activities";
import { addDays, startOfWeek, format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { activities, isLoading } = useActivities();

  const dashboardData = useMemo(() => {
    if (isLoading || !activities) return null;

    const weeklyPlans = activities.filter(a => a.type === 'Weekly Plan').length;
    const healthTalks = activities.filter(a => a.type === 'Health Talk').length;
    const reportsFiled = activities.length;

    const peopleReached = activities.reduce((acc, a) => {
        if (!a.details) return acc;
        const count = a.details.peopleReached || a.details.childrenReached || a.details.studentsReached || 0;
        return acc + Number(count);
    }, 0);


    const stats = [
        { title: "Weekly Plans", value: weeklyPlans.toString(), icon: 'CalendarDays', change: "", color: "border-blue-500" },
        { title: "People Reached", value: peopleReached.toLocaleString(), icon: 'Users', change: "Across all activities", color: "border-green-500" },
        { title: "Health Talks", value: healthTalks.toString(), icon: 'Mic', change: "", color: "border-orange-500" },
        { title: "Reports Filed", value: reportsFiled.toString(), icon: 'FileText', change: "All activity types", color: "border-purple-500" },
    ];

    const weekStartsOn = 1; // Monday
    const weekStart = startOfWeek(new Date(), { weekStartsOn });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const chartData = days.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const total = activities.filter(a => {
            if (!a.date) return false;
            return format(new Date(a.date), 'yyyy-MM-dd') === dayString;
        }).length;
        return {
            name: format(day, 'E'), // Mon, Tue, etc.
            total: total
        };
    });

    const recentActivities = activities
        .filter(a => a.date)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return { stats, chartData, recentActivities };
  }, [activities, isLoading]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome Back!"
        description="Here's a summary of your health reporting activities."
      />
      {isLoading || !dashboardData ? (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <Skeleton className="h-[430px]" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-[430px]" />
                </div>
            </div>
        </>
      ) : (
        <>
            <StatsCardsContainer stats={dashboardData.stats} />
            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                <ActivityChart chartData={dashboardData.chartData} />
                </div>
                <div className="lg:col-span-2">
                <RecentReports recentActivities={dashboardData.recentActivities} />
                </div>
            </div>
        </>
      )}
    </div>
  );
}
