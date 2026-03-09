
'use client';
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { StatsCardsContainer } from "./components/stats-cards";
import ActivityChart from "./components/activity-chart";
import MonthlyTopics from "./components/monthly-topics";
import { useActivities } from "@/hooks/use-activities";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

const topicLabelMap: { [key: string]: string } = {
    "Importance of Physical Activity": "Physical Activity",
    "Tobacco, Alcohol & Substance Abuse": "Substance Abuse",
};

export default function DashboardPage() {
  const { activities, isLoading } = useActivities();

  const dashboardData = useMemo(() => {
    if (isLoading || !activities) {
        return { stats: null, chartData: null, topicsData: null };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyActivities = activities.filter(a => {
        if (!a.date) return false;
        const activityDate = new Date(a.date);
        return activityDate >= monthStart && activityDate <= monthEnd;
    });

    const weeklyPlans = monthlyActivities.filter(a => a.type === 'Weekly Plan').length;
    const healthTalksCount = monthlyActivities.filter(a => a.type === 'Health Talk').length;
    const reportsFiled = monthlyActivities.length;

    const peopleReached = monthlyActivities.reduce((acc, a) => {
        if (!a.details) return acc;
        const count = a.details.peopleReached || a.details.childrenReached || a.details.studentsReached || 0;
        return acc + Number(count);
    }, 0);


    const stats = [
        { title: "Weekly Plans", value: weeklyPlans.toString(), icon: 'CalendarDays', change: "This month", color: "border-blue-500" },
        { title: "People Reached", value: peopleReached.toLocaleString(), icon: 'Users', change: "This month", color: "border-green-500" },
        { title: "Health Talks", value: healthTalksCount.toString(), icon: 'Mic', change: "This month", color: "border-orange-500" },
        { title: "Reports Filed", value: reportsFiled.toString(), icon: 'FileText', change: "This month", color: "border-purple-500" },
    ];

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const chartData = daysInMonth.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const total = monthlyActivities.filter(a => {
            if (!a.date) return false;
            return format(new Date(a.date), 'yyyy-MM-dd') === dayString;
        }).length;
        return {
            name: format(day, 'd'), // Day of the month
            total: total
        };
    });

    const monthlyHealthTalks = monthlyActivities.filter(a => a.type === 'Health Talk');

    const topicsSummary: { [key: string]: number } = monthlyHealthTalks.reduce((acc, talk) => {
        if (talk.details && Array.isArray(talk.details.topics)) {
            talk.details.topics.forEach((topic: { id: string; label: string; peopleReached: number }) => {
                // Exclude 'other' from dashboard topic counts
                if (topic.id === 'other') return;
                const reached = topic.peopleReached || 0;
                const topicLabel = topic.label;
                if (!acc[topicLabel]) {
                    acc[topicLabel] = 0;
                }
                acc[topicLabel] += reached;
            });
        }
        return acc;
    }, {} as { [key: string]: number });

        const topicsData = Object.entries(topicsSummary)
            .map(([topic, count]) => ({
                    topic: topicLabelMap[topic] || topic, // Use shortcut if available
                    count
            }))
            .filter(t => (t.topic || '').toLowerCase() !== 'other')
            .sort((a, b) => b.count - a.count);

    return { stats, chartData, topicsData };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities?.length, isLoading]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome Back!"
        description="Here's a summary of your health reporting activities for this month."
      />
      {isLoading || !dashboardData.stats ? (
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
                <MonthlyTopics topicsData={dashboardData.topicsData} />
                </div>
            </div>
        </>
      )}
    </div>
  );
}
