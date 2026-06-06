const STORAGE_KEY = "kealvi_interests";

/** Local cache of followed category ids (synced with server). */
export function getLocalInterests(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setLocalInterests(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
