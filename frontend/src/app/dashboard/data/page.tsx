'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Import Table components if you were to implement a table immediately
// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableFooter,
//   TableRow,
//   TableHead,
//   TableCell,
//   TableCaption,
// } from "@/components/ui/table";

export default function DataPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Data Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Data Overview</CardTitle>
          <CardDescription>View and manage your farm&apos;s data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Data table and management features are under development.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            This page will soon feature sortable and filterable tables to display sensor readings, harvest data, and other important metrics.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Currently showing placeholder content.</p>
        </CardFooter>
      </Card>
    </div>
  );
} 