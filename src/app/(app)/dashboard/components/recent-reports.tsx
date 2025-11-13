
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function RecentReports({ recentActivities }) {
  const isLoading = !recentActivities;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>An overview of the latest reports filed.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex h-60 items-center justify-center">
                <p className="text-muted-foreground">Loading recent reports...</p>
            </div>
        ) : recentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.type}</TableCell>
                    <TableCell>{format(new Date(activity.date), 'MM/dd/yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
            <div className="flex h-60 items-center justify-center rounded-md border border-dashed text-center">
                <p className="text-muted-foreground">No reports filed yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
