import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal } from "lucide-react";
import { loadVehicles, loadRecords, saveRecords } from "@/lib/storage";
import { loadVehicleFilter, saveVehicleFilter } from "@/lib/storage";
import { toCsv, downloadCsv, type CsvRow } from "@/lib/csv";

type Vehicle = {
  id: string;
  nickname?: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
};

type ServiceType =
  | "oil_change"
  | "tire_rotation"
  | "brake_pads"
  | "brake_fluid"
  | "coolant"
  | "transmission_fluid"
  | "battery"
  | "spark_plugs"
  | "air_filter"
  | "cabin_filter"
  | "alignment"
  | "inspection"
  | "registration"
  | "other";

type ServiceRecord = {
  id: string;
  vehicleId: string;
  type: ServiceType | "other";
  serviceDate: string; // YYYY-MM-DD
  mileage: number;
  costCents?: number;
  shopName?: string;
  notes?: string;
};

const TYPES: { value: ServiceType; label: string }[] = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tire_rotation", label: "Tire Rotation" },
  { value: "brake_pads", label: "Brake Pads" },
  { value: "brake_fluid", label: "Brake Fluid" },
  { value: "coolant", label: "Coolant" },
  { value: "transmission_fluid", label: "Transmission Fluid" },
  { value: "battery", label: "Battery" },
  { value: "spark_plugs", label: "Spark Plugs" },
  { value: "air_filter", label: "Air Filter" },
  { value: "cabin_filter", label: "Cabin Filter" },
  { value: "alignment", label: "Alignment" },
  { value: "inspection", label: "Inspection" },
  { value: "registration", label: "Registration" },
  { value: "other", label: "Other" },
];

export default function Records() {
  // vehicles (to populate vehicle selector)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // records state with localStorage persistence
  const [records, setRecords] = useState<ServiceRecord[]>(() => loadRecords<ServiceRecord>());
  // dialogs
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [vehicleId, setVehicleId] = useState<string>("");
  const [type, setType] = useState<ServiceType | "other">("oil_change");
  const [serviceDate, setServiceDate] = useState<string>("");
  const [mileage, setMileage] = useState<number | undefined>(undefined);
  const [cost, setCost] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [vehicleFilter, setVehicleFilter] = useState<string>(() => loadVehicleFilter());

  // load vehicles + records on mount
  useEffect(() => {
    setVehicles(loadVehicles<Vehicle>());
    //setRecords(loadRecords<ServiceRecord>());
  }, []);

  // persist records whenever they change
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => { saveVehicleFilter(vehicleFilter); }, [vehicleFilter]);

  const canSubmit = useMemo(() => {
    return (
      vehicleId &&
      serviceDate &&
      typeof mileage === "number" &&
      !Number.isNaN(mileage) &&
      mileage >= 0 &&
      type
    );
  }, [vehicleId, serviceDate, mileage, type]);

  function resetForm() {
    setVehicleId("");
    setType("oil_change");
    setServiceDate("");
    setMileage(undefined);
    setCost("");
    setShopName("");
    setNotes("");
    setEditingId(null);
  }

  function startCreate() {
    resetForm();
    if (vehicleFilter !== "all") {
      setVehicleId(vehicleFilter);
    }
    setOpen(true);
  }

  function startEdit(r: ServiceRecord) {
    setEditingId(r.id);
    setVehicleId(r.vehicleId);
    setType(r.type);
    setServiceDate(r.serviceDate);
    setMileage(r.mileage);
    setCost(
      typeof r.costCents === "number" ? (r.costCents / 100).toFixed(2) : ""
    );
    setShopName(r.shopName ?? "");
    setNotes(r.notes ?? "");
    setOpen(true);
  }

  function handleSave() {
    if (!canSubmit) return;

    const costCents =
      cost.trim() === ""
        ? undefined
        : Math.round(parseFloat(cost.replace(/[^0-9.]/g, "")) * 100);

    if (editingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                vehicleId,
                type,
                serviceDate,
                mileage: mileage!,
                costCents,
                shopName: shopName.trim() || undefined,
                notes: notes.trim() || undefined,
              }
            : r
        )
      );
    } else {
      const rec: ServiceRecord = {
        id: crypto.randomUUID(),
        vehicleId,
        type,
        serviceDate,
        mileage: mileage!,
        costCents,
        shopName: shopName.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      setRecords((prev) => [rec, ...prev]);
    }

    setOpen(false);
    resetForm();
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  function handleDelete() {
    if (!deleteId) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  }

  // helper: label for vehicle
  function vehicleLabel(id: string) {
    const v = vehicles.find((x) => x.id === id);
    if (!v) return "Unknown vehicle";
    return `${v.nickname ? v.nickname + " • " : ""}${v.year} ${v.make} ${
      v.model
    }`;
  }

  function buildCsvRows(list: ServiceRecord[]): CsvRow[] {
  return list.map((r) => ({
    Vehicle: vehicleLabel(r.vehicleId),
    Type: TYPES.find((t) => t.value === r.type)?.label ?? r.type,
    Date: r.serviceDate,
    Mileage: r.mileage,
    CostUSD:
      typeof r.costCents === "number" ? (r.costCents / 100).toFixed(2) : "",
    Shop: r.shopName ?? "",
    Notes: r.notes ?? "",
  }));
}

function handleExportCsv() {
  const rows = buildCsvRows(visibleRecords); // use your filtered list
  const csv = toCsv(rows);
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  const name =
    vehicleFilter === "all"
      ? `service-records-${stamp}.csv`
      : `service-records-${vehicleLabel(vehicleFilter).replace(/\s+/g,"_")}-${stamp}.csv`;
  downloadCsv(csv, name);
}

  const visibleRecords = useMemo(() => {
  if (vehicleFilter === "all") return records;
  return records.filter(r => r.vehicleId === vehicleFilter);
}, [records, vehicleFilter]);

  return (
    <div className="grid gap-4">
      {/* Header row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Service Records</h2>
        
        {/* Controls group */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Vehicle filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nickname ? `${v.nickname} • ` : ""}
                  {v.year} {v.make} {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

         <Button variant="outline" onClick={handleExportCsv}>Export CSV</Button>

        <Dialog
          open={open}
          onOpenChange={(o) => (o ? startCreate() : setOpen(false))}
        >
          <DialogTrigger asChild>
            <Button onClick={startCreate}>Add Record</Button>
          </DialogTrigger>
          

          <DialogContent className="sm:max-w-lg max-w-[min(100vw-1rem,36rem)] max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Record" : "Add Record"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              {/* Vehicle */}
              <div className="grid gap-1.5">
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {vehicles.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No vehicles found. Add one on the Vehicles page.
                      </div>
                    )}
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.nickname ? `${v.nickname} • ` : ""}
                        {v.year} {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="grid gap-1.5">
                <Label>Service Type</Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as ServiceType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date + Mileage */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="date">Service Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    inputMode="numeric"
                    placeholder="e.g., 126400"
                    value={mileage?.toString() ?? ""}
                    onChange={(e) =>
                      setMileage(
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value.replace(/\D/g, ""), 10)
                      )
                    }
                  />
                </div>
              </div>

              {/* Cost + Shop */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="cost">Cost (USD)</Label>
                  <Input
                    id="cost"
                    inputMode="decimal"
                    placeholder="e.g., 49.99"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="shop">Shop (optional)</Label>
                  <Input
                    id="shop"
                    placeholder="e.g., Jiffy Lube"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any details worth remembering…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button disabled={!canSubmit} onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Empty state */}
      {visibleRecords.length === 0 && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No service records yet. Click{" "}
            <span className="font-medium">Add Record</span> to create your first
            one.
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleRecords.map((r) => (
          <Card key={r.id} className="hover:shadow-sm transition">
            <CardHeader className="pb-2 flex-row items-start justify-between">
              <CardTitle className="text-base">
                {vehicleLabel(r.vehicleId)}
              </CardTitle>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => startEdit(r)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => confirmDelete(r.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <CardContent className="text-sm text-muted-foreground grid gap-1.5">
              <div>
                <span className="font-medium">Type:</span>{" "}
                {TYPES.find((t) => t.value === r.type)?.label ?? r.type}
              </div>
              <div>
                <span className="font-medium">Date:</span> {r.serviceDate}
              </div>
              <div>
                <span className="font-medium">Mileage:</span>{" "}
                {r.mileage.toLocaleString()} miles
              </div>
              {typeof r.costCents === "number" && (
                <div>
                  <span className="font-medium">Cost:</span> $
                  {(r.costCents / 100).toFixed(2)}
                </div>
              )}
              {r.shopName && (
                <div>
                  <span className="font-medium">Shop:</span> {r.shopName}
                </div>
              )}
              {r.notes && (
                <div className="text-muted-foreground">{r.notes}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the service record from local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-600/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
