import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, ArrowLeft } from "lucide-react";

import { loadVehicles, loadRecords, saveRecords } from "@/lib/storage";
import type { Vehicle, ServiceRecord, ServiceType } from "@/lib/maintenance";
import { vehicleDisplay, formatMoneyCents } from "@/lib/maintenance";

const TYPES: { value: ServiceType | "other"; label: string }[] = [
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

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>(() => loadRecords<ServiceRecord>());

  // dialogs/state
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state (vehicleId is fixed to this vehicle)
  const [type, setType] = useState<ServiceType | "other">("oil_change");
  const [serviceDate, setServiceDate] = useState<string>("");
  const [mileage, setMileage] = useState<number | undefined>(undefined);
  const [cost, setCost] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // load vehicle + all records
  useEffect(() => {
    const vs = loadVehicles<Vehicle>();
    const v = vs.find((x) => x.id === id);
    if (!v) {
      // if vehicle not found, go back to list
      navigate("/vehicles");
      return;
    }
    setVehicle(v);
    setRecords(loadRecords<ServiceRecord>());
  }, [id, navigate]);

  // persist records
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const vehicleRecords = useMemo(
    () =>
      records
        .filter((r) => r.vehicleId === id)
        .sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : a.serviceDate > b.serviceDate ? -1 : 0)),
    [records, id]
  );

  const canSubmit = useMemo(() => {
    return (
      !!vehicle &&
      serviceDate &&
      typeof mileage === "number" &&
      !Number.isNaN(mileage) &&
      mileage >= 0 &&
      type
    );
  }, [vehicle, serviceDate, mileage, type]);

  function resetForm() {
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
    setOpen(true);
  }

  function startEdit(r: ServiceRecord) {
    setEditingId(r.id);
    setType(r.type);
    setServiceDate(r.serviceDate);
    setMileage(r.mileage);
    setCost(typeof r.costCents === "number" ? (r.costCents / 100).toFixed(2) : "");
    setShopName(r.shopName ?? "");
    setNotes(r.notes ?? "");
    setOpen(true);
  }

  function handleSave() {
    if (!canSubmit || !vehicle) return;
    const costCents =
      cost.trim() === "" ? undefined : Math.round(parseFloat(cost.replace(/[^0-9.]/g, "")) * 100);

    if (editingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                vehicleId: vehicle.id,
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
        vehicleId: vehicle.id,
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

  if (!vehicle) return null;

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{vehicleDisplay(vehicle)}</h2>
        </div>

        <Dialog open={open} onOpenChange={(o) => (o ? startCreate() : setOpen(false))}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}>Add Record</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Record" : "Add Record"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              {/* Type */}
              <div className="grid gap-1.5">
                <Label>Service Type</Label>
                <Select value={type} onValueChange={(val) => setType(val as ServiceType)}>
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
              <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button disabled={!canSubmit} onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Records list for this vehicle */}
      {vehicleRecords.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No records yet for this vehicle. Click <span className="font-medium">Add Record</span> to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vehicleRecords.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition">
              <CardHeader className="pb-2 flex-row items-start justify-between">
                <CardTitle className="text-base">
                  {labelForType(r.type)} • {r.serviceDate} • {r.mileage.toLocaleString()} mi
                </CardTitle>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => startEdit(r)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(r.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="text-sm text-muted-foreground grid gap-1.5">
                {typeof r.costCents === "number" && (
                  <div><span className="font-medium">Cost:</span> ${formatMoneyCents(r.costCents)}</div>
                )}
                {r.shopName && <div><span className="font-medium">Shop:</span> {r.shopName}</div>}
                {r.notes && <div className="text-muted-foreground">{r.notes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the service record from local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-600/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function labelForType(t: ServiceType | "other") {
  const map: Record<string, string> = {
    oil_change: "Oil Change",
    tire_rotation: "Tire Rotation",
    air_filter: "Air Filter",
    cabin_filter: "Cabin Filter",
    inspection: "Inspection",
    brake_pads: "Brake Pads",
    brake_fluid: "Brake Fluid",
    coolant: "Coolant",
    transmission_fluid: "Transmission Fluid",
    battery: "Battery",
    spark_plugs: "Spark Plugs",
    alignment: "Alignment",
    registration: "Registration",
    other: "Other",
  };
  return map[t] ?? t;
}