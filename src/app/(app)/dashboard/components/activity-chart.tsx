
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { chartConfig } from "@/lib/chart-config";

export default function ActivityChart({ chartData }) {
  const isLoading = !chartData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities This Week</CardTitle>
        <CardDescription>A summary of outreach and reporting activities.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
            {isLoading ? (
                <div className="flex h-[350px] w-full items-center justify-center">
                    <p className="text-muted-foreground">Loading chart data...</p>
                </div>
            ) : chartData && chartData.length > 0 && chartData.some(d => d.total > 0) ? (
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    allowDecimals={false}
                    />
                    <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            ) : (
                <div className="flex h-[350px] w-full items-center justify-center">
                    <p className="text-muted-foreground">No activities recorded this week...</p>
                </div>
            )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
