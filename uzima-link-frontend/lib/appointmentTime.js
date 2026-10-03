export function toDate(iso) {
  if (!iso) return null;
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

export function formatDay(iso) {
  return toDate(iso)?.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(iso) {
  return toDate(iso)?.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}