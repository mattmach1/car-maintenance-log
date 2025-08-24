import { Button } from "@/components/ui/button";
export default function Records() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Service Records</h2>
        <Button>Add Record</Button>
      </div>
      <p className="text-sm text-muted-foreground">No records yet.</p>
    </div>
  );
}