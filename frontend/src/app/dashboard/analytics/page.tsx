'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Key metrics and insights will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Analytics content is under development.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            This page will soon feature charts, graphs, and data visualizations
            to help you understand your farm&apos;s performance.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Last updated: N/A</p>
        </CardFooter>
      </Card>
    </div>
  );
} 