
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Mic, FileText } from "lucide-react";
import React from "react";

const StatCard = ({ title, value, icon: Icon, change, colorClass }) => (
    <Card className={`border-l-4 ${colorClass}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{change}</p>
        </CardContent>
    </Card>
);

export default function StatsCards({ stats }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    change={stat.change}
                    colorClass={stat.color}
                />
            ))}
        </div>
    );
}

const iconMap = {
    CalendarDays,
    Users,
    Mic,
    FileText,
};

export function StatsCardsContainer({ stats }) {
    const hydratedStats = stats.map(stat => ({
        ...stat,
        icon: iconMap[stat.icon],
    }));

    return <StatsCards stats={hydratedStats} />;
}
