import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Help & Support" size="md" />
      <Card className="bg-farm-white card-shadow state-active">
        <CardHeader>
          <CardTitle className="text-control-label">
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-control-secondary">
            Find answers to common questions below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-control-label">
            Help content and FAQs are under development.
          </p>
          <p className="mt-4 text-sm text-control-secondary">
            This page will soon provide helpful information, guides, and
            troubleshooting tips.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-control-tertiary">
            Currently showing placeholder content.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
