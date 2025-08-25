const STORAGE_KEY = "vehicles";

export function loadVehicles<T>(): T[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function saveVehicles<T>(vehicles: T[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch (err) {
    console.error("Failed to save vehicles", err);
  }
}

const RECORDS_KEY = "service_records";

export function loadRecords<T>(): T[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function saveRecords<T>(records: T[]) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Failed to save records", err);
  }
}

const FILTER_KEY = "records_vehicle_filter";
export const loadVehicleFilter = () => localStorage.getItem(FILTER_KEY) ?? "all";
export const saveVehicleFilter = (val: string) => localStorage.setItem(FILTER_KEY, val);