import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
   return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No upcoming items yet.
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Overdue</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nothing overdue. 🎉
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add your first record to see recent activity.
        </CardContent>
      </Card>
    </div>
  );
}