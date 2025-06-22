import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions below.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Help content and FAQs are under development.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            This page will soon provide helpful information, guides, and troubleshooting tips.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Currently showing placeholder content.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
