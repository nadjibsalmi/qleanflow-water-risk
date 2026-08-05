import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-lg text-center" title="This view is not available">
        <p className="text-sm leading-relaxed text-muted">
          The QleanFlow route you requested does not exist. Return to the overview to
          continue exploring Ghana water-risk indicators.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to overview
        </Link>
      </Card>
    </main>
  );
}
