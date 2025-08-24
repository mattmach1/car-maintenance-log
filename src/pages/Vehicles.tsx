import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Vehicle = {
  id: string;
  nickname?: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
};

const YEARS = Array.from({ length: 75 }, (_, i) => new Date().getFullYear() - i);

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [open, setOpen] = useState(false);

   // simple form state (UI only)
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [currentMileage, setCurrentMileage] = useState<number | undefined>(undefined);
  const [nickname, setNickname] = useState("");

  const canSubmit = useMemo(() => {
    return (
      make.trim().length > 0 &&
      model.trim().length > 0 &&
      typeof year === "number" &&
      !Number.isNaN(year) &&
      typeof currentMileage === "number" &&
      !Number.isNaN(currentMileage) &&
      currentMileage >= 0
    );
  }, [make, model, year, currentMileage]);

   function resetForm() {
    setMake("");
    setModel("");
    setYear(undefined);
    setCurrentMileage(undefined);
    setNickname("");
  }

  function handleAddVehicle() {
    if (!canSubmit) return;

    const v: Vehicle = {
      id: crypto.randomUUID(),
      make: make.trim(),
      model: model.trim(),
      year: year!,
      currentMileage: currentMileage!,
      nickname: nickname.trim() || undefined,
    };

    setVehicles((prev) => [v, ...prev]);
    setOpen(false);
    resetForm();
  }

   return (
    <div className="grid gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vehicles</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Vehicle</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              {/* Nickname (optional) */}
              <div className="grid gap-1.5">
                <Label htmlFor="nickname">Nickname (optional)</Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Tundra"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              {/* Make */}
              <div className="grid gap-1.5">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  placeholder="e.g., Toyota"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                />
              </div>

              {/* Model */}
              <div className="grid gap-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., Tundra"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              {/* Year + Mileage (two-column on md+) */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Year</Label>
                  <Select
                    value={year?.toString() ?? ""}
                    onValueChange={(val) => setYear(parseInt(val, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="mileage">Current Mileage</Label>
                  <Input
                    id="mileage"
                    inputMode="numeric"
                    placeholder="e.g., 126400"
                    value={currentMileage?.toString() ?? ""}
                    onChange={(e) =>
                      setCurrentMileage(
                        e.target.value === "" ? undefined : parseInt(e.target.value.replace(/\D/g, ""), 10)
                      )
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!canSubmit} onClick={handleAddVehicle}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {vehicles.length === 0 && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No vehicles yet. Click <span className="font-medium">Add Vehicle</span> to create your first one.
          </CardContent>
        </Card>
      )}

      {/* Vehicle list */}
      <div className="grid gap-3">
        {vehicles.map((v) => (
          <Card key={v.id} className="hover:shadow-sm transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {v.nickname ? `${v.nickname} • ` : ""}
                {v.year} {v.make} {v.model}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Odometer: <span className="font-medium">{v.currentMileage.toLocaleString()}</span> miles
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}