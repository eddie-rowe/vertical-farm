import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Review your latest alerts and updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Notification display and management features are under development.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            This page will soon show a list of notifications, allow you to mark them as read, or dismiss them.
          </p>
          {/* Example of how a notification list might look later */}
          {/* <ul className="space-y-2 mt-4">
            <li className="p-3 border rounded-md bg-secondary/50">New sensor alert: Temperature high in Rack A1.</li>
            <li className="p-3 border rounded-md">Maintenance scheduled for Shelf B2.</li>
          </ul> */}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Currently showing placeholder content.</p>
        </CardFooter>
      </Card>
    </div>
  );
} 