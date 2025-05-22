'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FarmsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Farms Management</h1>
        <Link href="/dashboard/farms/new" passHref>
          <Button>Create New Farm</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Farms List</CardTitle>
          <CardDescription>Manage your existing farms or create a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Farm listing and management features are under development.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            This page will soon display a table or list of your farms with options to view details, edit, or delete them.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Currently showing placeholder content.</p>
        </CardFooter>
      </Card>
    </div>
  );
} 