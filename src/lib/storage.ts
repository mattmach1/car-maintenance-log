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