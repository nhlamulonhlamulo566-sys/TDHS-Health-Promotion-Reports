
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, Users } from "lucide-react";

export default function MonthlyTopics({ topicsData }) {
  const isLoading = !topicsData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Topics This Month</CardTitle>
        <CardDescription>Health talk topics with the most engagement.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex h-60 items-center justify-center">
                <p className="text-muted-foreground">Loading topics...</p>
            </div>
        ) : (
          <div className="space-y-4">
            {topicsData.map((item) => (
                <div key={item.topic} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                            <Mic className="h-5 w-5" />
                        </div>
                        <p className="font-semibold truncate">{item.topic}</p>
                    </div>
                    <div className="flex items-center text-sm font-medium min-w-[50px] justify-end">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {item.count.toLocaleString()}
                    </div>
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
