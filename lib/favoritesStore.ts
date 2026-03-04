const KEY = "secretshop_favorites";

export function getFavorites(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: number): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: number): number[] {
  const cur = new Set(getFavorites());
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  const next = Array.from(cur);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}