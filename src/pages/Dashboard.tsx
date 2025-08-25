import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ServiceRecord, Vehicle, ServiceType } from "@/lib/maintenance";
import { computeDue, formatMoneyCents, vehicleDisplay } from "@/lib/maintenance";
import { loadVehicles, loadRecords } from "@/lib/storage";

const SHOW_TYPES: ServiceType[] = [
  "oil_change",
  "tire_rotation",
  "air_filter",
  "cabin_filter",
  "inspection",
];

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  useEffect(() => {
    setVehicles(loadVehicles<Vehicle>());
    setRecords(loadRecords<ServiceRecord>());
  }, []);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Recent activity (last 5)
  const recent = useMemo(() => {
    return [...records]
      .sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : a.serviceDate > b.serviceDate ? -1 : 0))
      .slice(0, 5);
  }, [records]);

  // Spend YTD
  const spendYTD = useMemo(() => {
    const year = new Date().getFullYear();
    return records.reduce((sum, r) => {
      if (r.costCents && new Date(r.serviceDate).getFullYear() === year) {
        return sum + r.costCents;
      }
      return sum;
    }, 0);
  }, [records]);

  // Build due/overdue lists
  const dueItems = useMemo(() => {
    const items = [];
    for (const v of vehicles) {
      for (const t of SHOW_TYPES) {
        const res = computeDue(v, t, records, todayISO);
        if (!res) continue; // no default schedule for this type
        if (res.status === "DUE_SOON") items.push(res);
      }
    }
    // Sort: earliest by daysToDue/miles
    return items.sort((a, b) => {
      const aKey = (a.daysToDue ?? Infinity) + (a.distanceToDue ?? Infinity);
      const bKey = (b.daysToDue ?? Infinity) + (b.distanceToDue ?? Infinity);
      return aKey - bKey;
    });
  }, [vehicles, records, todayISO]);

  const overdueItems = useMemo(() => {
    const items = [];
    for (const v of vehicles) {
      for (const t of SHOW_TYPES) {
        const res = computeDue(v, t, records, todayISO);
        if (res && res.status === "OVERDUE") items.push(res);
      }
    }
    // Sort most overdue first (negative days or miles)
    return items.sort((a, b) => {
      const aKey = (a.daysToDue ?? 0) + (a.distanceToDue ?? 0);
      const bKey = (b.daysToDue ?? 0) + (b.distanceToDue ?? 0);
      return aKey - bKey;
    });
  }, [vehicles, records, todayISO]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Upcoming */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {dueItems.length === 0 && (
            <p className="text-muted-foreground">Nothing due soon. 🎉</p>
          )}
          {dueItems.map((d) => (
            <div key={`${d.vehicleId}-${d.type}`} className="flex items-start justify-between">
              <div>
                <div className="font-medium">{vehicleDisplay(vehicles.find(v => v.id === d.vehicleId)!)} </div>
                <div className="text-muted-foreground">
                  {labelForType(d.type)} —{" "}
                  {d.dueByMiles !== undefined ? `due at ${d.dueByMiles.toLocaleString()} mi` : ""}
                  {d.dueByMiles !== undefined && d.dueByDate ? " · " : ""}
                  {d.dueByDate ? `by ${d.dueByDate}` : ""}
                </div>
              </div>
              <div className="text-right text-muted-foreground">
                {d.distanceToDue !== undefined && d.distanceToDue >= 0
                  ? `${d.distanceToDue.toLocaleString()} mi`
                  : d.daysToDue !== undefined
                  ? `${d.daysToDue} days`
                  : ""}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {overdueItems.length === 0 && (
            <p className="text-muted-foreground">Nothing overdue. ✅</p>
          )}
          {overdueItems.map((d) => (
            <div key={`${d.vehicleId}-${d.type}`} className="flex items-start justify-between">
              <div>
                <div className="font-medium">{vehicleDisplay(vehicles.find(v => v.id === d.vehicleId)!)} </div>
                <div className="text-muted-foreground">
                  {labelForType(d.type)} —{" "}
                  {d.dueByMiles !== undefined ? `was due at ${d.dueByMiles.toLocaleString()} mi` : ""}
                  {d.dueByMiles !== undefined && d.dueByDate ? " · " : ""}
                  {d.dueByDate ? `by ${d.dueByDate}` : ""}
                </div>
              </div>
              <div className="text-right text-red-600">
                {d.distanceToDue !== undefined && d.distanceToDue < 0
                  ? `${Math.abs(d.distanceToDue).toLocaleString()} mi over`
                  : d.daysToDue !== undefined
                  ? `${Math.abs(d.daysToDue)} days over`
                  : ""}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {recent.length === 0 && (
            <p className="text-muted-foreground">Add your first record to see it here.</p>
          )}
          {recent.map((r) => (
            <div key={r.id} className="flex items-start justify-between">
              <div>
                <div className="font-medium">{vehicleDisplay(vehicles.find(v => v.id === r.vehicleId)!)} </div>
                <div className="text-muted-foreground">
                  {labelForType(r.type as ServiceType)} • {r.serviceDate} • {r.mileage.toLocaleString()} mi
                </div>
              </div>
              <div className="text-right">
                {typeof r.costCents === "number" ? `$${formatMoneyCents(r.costCents)}` : ""}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Spend YTD */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Total Spend (YTD)</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          ${formatMoneyCents(spendYTD)}
        </CardContent>
      </Card>
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