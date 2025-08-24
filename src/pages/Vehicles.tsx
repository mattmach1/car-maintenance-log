import { Button } from "@/components/ui/button";
export default function Vehicles() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vehicles</h2>
        <Button>Add Vehicle</Button>
      </div>
      <p className="text-sm text-muted-foreground">No vehicles yet.</p>
    </div>
  );
}