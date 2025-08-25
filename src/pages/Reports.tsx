import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { loadVehicles, loadRecords } from "@/lib/storage";
import { downloadCsv, toCsv, type CsvRow } from "@/lib/csv";
import type { Vehicle, ServiceRecord, ServiceType } from "@/lib/maintenance";
import { vehicleDisplay, formatMoneyCents } from "@/lib/maintenance";

type Range = { from?: string; to?: string };

const TYPE_LABEL: Record<string, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_pads: "Brake Pads",
  brake_fluid: "Brake Fluid",
  coolant: "Coolant",
  transmission_fluid: "Transmission Fluid",
  battery: "Battery",
  spark_plugs: "Spark Plugs",
  air_filter: "Air Filter",
  cabin_filter: "Cabin Filter",
  alignment: "Alignment",
  inspection: "Inspection",
  registration: "Registration",
  other: "Other",
};

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  // filters
  const [vehicleId, setVehicleId] = useState<string>("all");
  const [range, setRange] = useState<Range>(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1); // Jan 1 this year
    return { from: toISO(start), to: toISO(today) };
  });

  useEffect(() => {
    setVehicles(loadVehicles<Vehicle>());
    setRecords(loadRecords<ServiceRecord>());
  }, []);

  // filtered records
  const filtered = useMemo(() => {
    const from = range.from ? new Date(range.from) : null;
    const to = range.to ? new Date(range.to) : null;
    return records.filter((r) => {
      if (vehicleId !== "all" && r.vehicleId !== vehicleId) return false;
      const d = new Date(r.serviceDate);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [records, vehicleId, range]);

  // KPIs
  const kpi = useMemo(() => {
    const totalCents = filtered.reduce((s, r) => s + (r.costCents ?? 0), 0);
    const count = filtered.length;
    const avgCents = count ? Math.round(totalCents / count) : 0;
    return { totalCents, count, avgCents };
  }, [filtered]);

  // Spend by type
  const byType = useMemo(() => {
    const map = new Map<ServiceType | "other", number>();
    for (const r of filtered) {
      map.set(r.type, (map.get(r.type) ?? 0) + (r.costCents ?? 0));
    }
    return [...map.entries()]
      .sort((a, b) => (b[1] - a[1]));
  }, [filtered]);

  // Spend by month (YYYY-MM)
  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const ym = r.serviceDate.slice(0, 7); // YYYY-MM
      map.set(ym, (map.get(ym) ?? 0) + (r.costCents ?? 0));
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [filtered]);

  // CSV export of filtered
  function buildCsvRows(list: ServiceRecord[]): CsvRow[] {
    return list.map((r) => ({
      Vehicle: vehicleDisplay(vehicles.find(v => v.id === r.vehicleId)!),
      Type: TYPE_LABEL[r.type] ?? r.type,
      Date: r.serviceDate,
      Mileage: r.mileage,
      CostUSD: typeof r.costCents === "number" ? (r.costCents / 100).toFixed(2) : "",
      Shop: r.shopName ?? "",
      Notes: r.notes ?? "",
    }));
  }
  function handleExport() {
    const rows = buildCsvRows(filtered);
    const csv = toCsv(rows);
    const base = vehicleId === "all" ? "all-vehicles" : safeName(vehicleDisplay(vehicles.find(v => v.id === vehicleId)!));
    const name = `reports-${base}-${(range.from ?? "start")}_to_${(range.to ?? "end")}.csv`;
    downloadCsv(csv, name);
  }

  return (
    <div className="grid gap-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {/* Vehicle */}
          <div className="grid gap-1.5">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nickname ? `${v.nickname} • ` : ""}{v.year} {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From */}
          <div className="grid gap-1.5">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={range.from ?? ""}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value || undefined }))}
            />
          </div>

          {/* To */}
          <div className="grid gap-1.5">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={range.to ?? ""}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value || undefined }))}
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button variant="outline" onClick={() => setDefaults(setRange)}>Reset dates</Button>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Total Spend" value={`$${formatMoneyCents(kpi.totalCents)}`} />
        <KpiCard title="Records" value={kpi.count.toString()} />
        <KpiCard title="Avg Cost / Record" value={`$${formatMoneyCents(kpi.avgCents)}`} />
      </div>

      {/* Spend by Type */}
      <Card>
        <CardHeader><CardTitle>Spend by Type</CardTitle></CardHeader>
        <CardContent>
          {byType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data in the selected range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Type</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {byType.map(([t, cents]) => (
                  <tr key={String(t)} className="border-t">
                    <td className="py-2">{TYPE_LABEL[t] ?? t}</td>
                    <td className="py-2">${formatMoneyCents(cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Spend by Month */}
      <Card>
        <CardHeader><CardTitle>Spend by Month</CardTitle></CardHeader>
        <CardContent>
          {byMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data in the selected range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Month</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.map(([ym, cents]) => (
                  <tr key={ym} className="border-t">
                    <td className="py-2">{ym}</td>
                    <td className="py-2">${formatMoneyCents(cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===== helpers ===== */

function toISO(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function setDefaults(setRange: (updater: (r: Range) => Range) => void) {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  setRange(() => ({ from: toISO(start), to: toISO(today) }));
}

function safeName(s: string) {
  return s.replace(/[^\w.-]+/g, "_");
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}