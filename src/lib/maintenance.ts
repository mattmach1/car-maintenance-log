export type ServiceType =
  | "oil_change" | "tire_rotation" | "brake_pads" | "brake_fluid" | "coolant"
  | "transmission_fluid" | "battery" | "spark_plugs" | "air_filter"
  | "cabin_filter" | "alignment" | "inspection" | "registration" | "other";

export interface Vehicle {
  id: string;
  nickname?: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  type: ServiceType | "other";
  serviceDate: string; // YYYY-MM-DD
  mileage: number;
  costCents?: number;
  shopName?: string;
  notes?: string;
}

// Default “schedules”
export const DEFAULT_SCHEDULES: Partial<Record<ServiceType, { miles?: number; months?: number }>> = {
  oil_change: { miles: 5000, months: 6 },
  tire_rotation: { miles: 6000, months: 12 },
  air_filter: { miles: 12000, months: 12 },
  cabin_filter: { miles: 12000, months: 12 },
  inspection: { months: 12 },
  brake_pads: { miles: 30000 },
};

export type DueStatus = "OK" | "DUE_SOON" | "OVERDUE";

export interface DueItem {
  vehicleId: string;
  vehicleLabel: string;
  type: ServiceType | "other";
  dueByMiles?: number;
  dueByDate?: string; // YYYY-MM-DD
  status: DueStatus;
  // for sorting / display
  distanceToDue?: number; // miles remaining (negative => overdue)
  daysToDue?: number;     // days remaining (negative => overdue)
}

// Utils
const DAY = 24 * 60 * 60 * 1000;
function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / DAY);
}
function addMonthsISO(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function vehicleDisplay(v: Vehicle) {
  return `${v.nickname ? v.nickname + " • " : ""}${v.year} ${v.make} ${v.model}`;
}

export function lastRecordOfType(records: ServiceRecord[], vehicleId: string, type: ServiceType | "other") {
  return records
    .filter(r => r.vehicleId === vehicleId && r.type === type)
    .sort((a, b) => {
      // sort by date desc then mileage desc
      if (a.serviceDate < b.serviceDate) return 1;
      if (a.serviceDate > b.serviceDate) return -1;
      return b.mileage - a.mileage;
    })[0];
}

/**
 * Compute due status for a (vehicle, type) pair using DEFAULT_SCHEDULES and last service record.
 * leadMiles/leadDays define the "DUE_SOON" window before due.
 */
export function computeDue(
  v: Vehicle,
  type: ServiceType,
  records: ServiceRecord[],
  todayISO: string,
  leadMiles = 300,
  leadDays = 14
): DueItem | null {
  const sched = DEFAULT_SCHEDULES[type];
  if (!sched) return null; // no default schedule for this type → skip

  const last = lastRecordOfType(records, v.id, type);
  const dueByMiles = (sched.miles && last) ? last.mileage + sched.miles : undefined;
  const dueByDate = (sched.months && last) ? addMonthsISO(last.serviceDate, sched.months) : undefined;

  // If neither baseline (no record yet), consider it OK (could also mark as DUE_SOON to prompt first entry)
  if (!dueByMiles && !dueByDate) {
    return {
      vehicleId: v.id,
      vehicleLabel: vehicleDisplay(v),
      type,
      status: "OK",
    };
  }

  const today = new Date(todayISO);
  const // comparisons
    overMiles = (dueByMiles !== undefined) && (v.currentMileage >= dueByMiles),
    overDate = (dueByDate !== undefined) && (today >= new Date(dueByDate));

  if (overMiles || overDate) {
    return {
      vehicleId: v.id,
      vehicleLabel: vehicleDisplay(v),
      type,
      dueByMiles,
      dueByDate,
      status: "OVERDUE",
      distanceToDue: dueByMiles !== undefined ? v.currentMileage - dueByMiles : undefined,
      daysToDue: dueByDate ? daysBetween(today, new Date(dueByDate)) : undefined,
    };
  }

  const nearMiles = (dueByMiles !== undefined) && (v.currentMileage >= (dueByMiles - leadMiles));
  const nearDate = (dueByDate !== undefined) && (daysBetween(today, new Date(dueByDate)) <= leadDays);

  const status: DueStatus = (nearMiles || nearDate) ? "DUE_SOON" : "OK";

  return {
    vehicleId: v.id,
    vehicleLabel: vehicleDisplay(v),
    type,
    dueByMiles,
    dueByDate,
    status,
    distanceToDue: dueByMiles !== undefined ? (dueByMiles - v.currentMileage) : undefined,
    daysToDue: dueByDate ? daysBetween(today, new Date(dueByDate)) : undefined,
  };
}

export function formatMoneyCents(cents?: number) {
  if (typeof cents !== "number") return "";
  return (cents / 100).toFixed(2);
}