export const STATUS = { ok: "Dispo", maybe: "Peut-être", no: "Pas dispo" };
export const COLORS = ["#3B6FE0", "#E0703B", "#8A4FD8", "#1E9E8F", "#D13F7A", "#B08A00", "#4C8C2B", "#6B7A90"];

const pad = (n) => String(n).padStart(2, "0");
export const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function colorOf(uid) {
  let h = 0;
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function fmtLong(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
}

export function newUid() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
