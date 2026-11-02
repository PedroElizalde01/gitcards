/**
 * Card designs. Each one is drawn once as SVG (in Wallet points) and used twice:
 * inline in the web preview, and rendered to PNG by resvg for the pass. Same code, so they can't drift.
 * Isomorphic: no Node or browser APIs.
 */
import qrcode from "qrcode-generator";

/** A contribution calendar: the first day (YYYY-MM-DD) and one count per day from there. */
export interface Calendar {
  start: string;
  counts: number[];
}

export interface Profile {
  login: string;
  name: string | null;
  total: number;
  calendar: Calendar;
  /** GitHub account creation day, YYYY-MM-DD. */
  joined: string | null;
  /** When the card last changed, ISO. */
  updated: string;
  /** Avatar as a data URI. */
  avatar: string;
  /** Avatar luminance on a LUM×LUM grid, 0..1 (the pixel designs). */
  lum: number[];
}

export const LUM = 24;
export const POSTER_MIN_IOS = 27;
export const STRIP = { width: 375, height: 144 };
export const ARTWORK = { width: 358, height: 448 };

export type Mode = "light" | "dark";
export type Layout = "store" | "poster" | "generic";
export type Field = [label: string, value: string];
export const MODES: Mode[] = ["dark", "light"];

/** Colors of one design in one mode. bg/fg/label also become the pass colors. lv: 5 heat levels, a–d: design accents. */
export interface Pal {
  bg: string;
  fg: string;
  label: string;
  lv: string[];
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  px?: string[];
}

export interface Design {
  id: string;
  name: string;
  layout: Layout;
  pal: Record<Mode, Pal>;
  header: (s: Ctx) => Field;
  /** Store: up to 3 fields under the banner. */
  fields?: (s: Ctx) => Field[];
  /** Poster: the big bottom line and the footer under it. */
  primary?: (s: Ctx) => string;
  footer?: (s: Ctx) => string;
  /** Store: show the avatar as the logo (default true). */
  logo?: boolean;
  /** SVG body: 375×144 banner (store) or 358×448 artwork (poster). */
  art?: (s: Ctx, p: Pal) => string;
}

export function levels(counts: number[]): number[] {
  const nz = counts.filter((c) => c > 0).sort((a, b) => a - b);
  const q = [0.25, 0.5, 0.75].map((p) => nz[Math.floor(p * (nz.length - 1))] ?? 0);
  return counts.map((c) => (c <= 0 ? 0 : c <= q[0] ? 1 : c <= q[1] ? 2 : c <= q[2] ? 3 : 4));
}

const DAY = 864e5;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOWL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fmt = (n: number) => n.toLocaleString("en-US");
export const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const n2 = (v: number) => v.toFixed(2);

type HeatMode = "row" | "bands";
interface MonthBlock { m: number; y: number; days: number[]; total: number }

/** Everything a design draws from: real stats of the profile plus drawing helpers. `pre` keeps SVG ids unique per design. */
export function ctx(p: Profile, pre = "c") {
  const counts = p.calendar.counts;
  const N = counts.length;
  const t0 = Date.parse(`${p.calendar.start || "2000-01-02"}T00:00:00Z`);
  const OFF = new Date(t0).getUTCDay();
  const COLS = Math.max(1, Math.ceil((N + OFF) / 7));
  const dateOf = (i: number) => new Date(t0 + i * DAY);
  const LV = levels(counts);
  const max = Math.max(0, ...counts);
  const MAX = max || 1;
  const active = counts.filter((c) => c > 0).length;
  let longest = 0;
  let run = 0;
  for (const c of counts) longest = Math.max(longest, (run = c > 0 ? run + 1 : 0));
  const bestI = counts.indexOf(max);
  const weekly = Array.from({ length: COLS }, () => 0);
  counts.forEach((c, i) => (weekly[Math.floor((i + OFF) / 7)] += c));
  const wd = Array(7).fill(0) as number[];
  counts.forEach((c, i) => (wd[dateOf(i).getUTCDay()] += c));
  const months: MonthBlock[] = [];
  counts.forEach((c, i) => {
    const d = dateOf(i);
    let cur = months[months.length - 1];
    if (!cur || cur.m !== d.getUTCMonth() || cur.y !== d.getUTCFullYear()) months.push((cur = { m: d.getUTCMonth(), y: d.getUTCFullYear(), days: [], total: 0 }));
    cur.days.push(i);
    cur.total += c;
  });
  /** Full months only (the window's partial first and last month dropped). */
  const ML = months.filter((m) => m.days.length > 7).slice(-12);
  const topM = ML.reduce<MonthBlock | null>((a, b) => (!a || b.total > a.total ? b : a), null);
  const day = (d: Date) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const upd = new Date(p.updated);
  const S = {
    login: p.login,
    name: p.name || p.login,
    total: fmt(p.total),
    active: String(active),
    streak: `${longest} ${longest === 1 ? "day" : "days"}`,
    best: String(max),
    bestDay: bestI >= 0 && max ? day(dateOf(bestI)) : "—",
    since: p.joined ? p.joined.slice(0, 4) : "—",
    updated: `${day(upd)}, ${upd.getUTCFullYear()}`,
    weeksActive: weekly.filter(Boolean).length,
    bestWeek: fmt(Math.max(0, ...weekly)),
    monthsActive: ML.filter((m) => m.total).length,
    topWd: wd.indexOf(Math.max(...wd)),
    topMonth: topM && topM.total ? `${MONL[topM.m]} · ${fmt(topM.total)}` : "—",
  };

  let uid = 0;
  const id = (k: string) => `${pre}-${k}${++uid}`;

  function cells(mode: HeatMode) {
    const half = Math.ceil(COLS / 2);
    return counts.map((_, i) => {
      const k = i + OFF, w = Math.floor(k / 7), d = k % 7;
      return mode === "bands" ? { i, x: w % half, y: d + (w >= half ? 7.8 : 0) } : { i, x: w, y: d };
    });
  }
  const dims = (mode: HeatMode): [number, number] => (mode === "bands" ? [Math.ceil(COLS / 2), 14.8] : [COLS, 7]);

  /** Heatmap fitted and centered in a box. */
  function heat({ x = 0, y = 0, w, h, pal, mode = "row", gap = 0.18, r = 0.22 }: { x?: number; y?: number; w: number; h: number; pal: string[]; mode?: HeatMode; gap?: number; r?: number }) {
    const [gw, gh] = dims(mode);
    const p = Math.min(w / gw, h / gh), cell = p * (1 - gap);
    const ox = x + (w - p * gw) / 2 + (p - cell) / 2, oy = y + (h - p * gh) / 2 + (p - cell) / 2;
    return cells(mode).map((c) => `<rect x="${n2(ox + c.x * p)}" y="${n2(oy + c.y * p)}" width="${n2(cell)}" height="${n2(cell)}" rx="${n2(cell * r)}" fill="${pal[LV[c.i]]}"/>`).join("");
  }
  /** Where day i sits in a heat() box, for marking it. */
  function cellBox(i: number, { x = 0, y = 0, w, h, mode = "row" }: { x?: number; y?: number; w: number; h: number; mode?: HeatMode }) {
    const [gw, gh] = dims(mode), p = Math.min(w / gw, h / gh), c = cells(mode)[i];
    return { x: x + (w - p * gw) / 2 + c.x * p, y: y + (h - p * gh) / 2 + c.y * p, p };
  }
  /** Month names over the first week of each month, for the bands layout. */
  function bandLabels({ x = 0, y = 0, w, h, color, size = 8.5 }: { x?: number; y?: number; w: number; h: number; color: string; size?: number }) {
    const [gw, gh] = dims("bands"), half = Math.ceil(COLS / 2);
    const p = Math.min(w / gw, h / gh), ox = x + (w - p * gw) / 2, oy = y + (h - p * gh) / 2;
    return months
      .filter((m) => dateOf(m.days[0]).getUTCDate() === 1)
      .map((m) => {
        const wk = Math.floor((m.days[0] + OFF) / 7);
        return `<text x="${(ox + (wk % half) * p).toFixed(1)}" y="${(oy + (wk >= half ? 7.8 : 0) * p - p * 0.25).toFixed(1)}" font-family="Geist Mono" font-size="${size}" fill="${color}">${MON[m.m]}</text>`;
      })
      .join("");
  }
  function avatar(cx: number, cy: number, r: number, ring = "") {
    const c = id("av");
    return `<defs><clipPath id="${c}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>${ring ? `<circle cx="${cx}" cy="${cy}" r="${r + 2.5}" fill="${ring}"/>` : ""}<image href="${p.avatar}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${c})" preserveAspectRatio="xMidYMid slice"/>`;
  }
  function image(x: number, y: number, w: number, h: number, rx = 0, extra = "") {
    const c = id("im");
    return `<defs><clipPath id="${c}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath></defs><image href="${p.avatar}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${c})"${extra}/>`;
  }
  function grad(stops: string[], x2 = 1, y2 = 1): [string, string] {
    const g = id("g");
    return [`url(#${g})`, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((s, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${s}"/>`).join("")}</linearGradient></defs>`];
  }
  /** The 12 full months as small labelled calendars. */
  function monthGrid({ x, y, w, h, cols = 6, pal, label, size = 8 }: { x: number; y: number; w: number; h: number; cols?: number; pal: string[]; label: string; size?: number }) {
    const rows = Math.max(1, Math.ceil(ML.length / cols)), mw = w / cols, mh = h / rows;
    return ML.map((m, j) => {
      const bx = x + (j % cols) * mw, by = y + Math.floor(j / cols) * mh;
      const first = dateOf(m.days[0]).getUTCDay();
      const q = Math.min((mw - 6) / 7, (mh - size - 6) / 6), cell = q * 0.8, sx = bx + (mw - q * 7) / 2;
      return `<text x="${sx.toFixed(1)}" y="${(by + size).toFixed(1)}" font-family="Geist Mono" font-size="${size}" fill="${label}">${MON[m.m]}</text>` +
        m.days.map((i, n) => { const k = n + first; return `<rect x="${n2(sx + (k % 7) * q)}" y="${n2(by + size + 4 + Math.floor(k / 7) * q)}" width="${n2(cell)}" height="${n2(cell)}" rx="${n2(cell * 0.25)}" fill="${pal[LV[i]]}"/>`; }).join("");
    }).join("");
  }
  /** The avatar as LUM×LUM palette squares, dark to light. */
  function pixelArt({ x, y, size, pal }: { x: number; y: number; size: number; pal: string[] }) {
    const q = size / LUM;
    return p.lum.map((v, i) => `<rect x="${n2(x + (i % LUM) * q)}" y="${n2(y + Math.floor(i / LUM) * q)}" width="${n2(q + 0.05)}" height="${n2(q + 0.05)}" fill="${pal[Math.min(pal.length - 1, Math.floor(v * pal.length))]}"/>`).join("");
  }
  /** Handle split at a camelCase boundary into two balanced lines. */
  function splitHandle() {
    const parts = p.login.split(/(?=[A-Z])/);
    let cut = 1, best = Infinity;
    for (let k = 1; k < parts.length; k++) {
      const d = Math.abs(parts.slice(0, k).join("").length - parts.slice(k).join("").length);
      if (d < best) [best, cut] = [d, k];
    }
    return parts.length > 1 ? [parts.slice(0, cut).join(""), parts.slice(cut).join("")] : [p.login];
  }

  return { p, S, N, OFF, COLS, LV, MAX, active, weekly, wd, ML, dateOf, id, heat, cellBox, bandLabels, avatar, image, grad, monthGrid, pixelArt, splitHandle };
}
export type Ctx = ReturnType<typeof ctx>;

const GH_DARK = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const GH_LIGHT = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const GH = { dark: { bg: "#0d1117", fg: "#e6edf3", label: "#7d8590", lv: GH_DARK }, light: { bg: "#ffffff", fg: "#1f2328", label: "#59636e", lv: GH_LIGHT } };
const F3 = (s: Ctx): Field[] => [["Active days", s.S.active], ["Streak", s.S.streak], ["Best day", s.S.best]];
const total = (s: Ctx): Field => ["Contributions", s.S.total];
const rect = (p: Pal, w: number, h: number) => `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;

export const DESIGNS: Design[] = [
  {
    id: "classic", name: "Two-Row Classic", layout: "store", pal: GH, header: total, fields: F3,
    art: (s, p) => `${rect(p, 375, 144)}${s.heat({ x: 8, y: 8, w: 359, h: 134, pal: p.lv, mode: "bands" })}${s.bandLabels({ x: 8, y: 8, w: 359, h: 134, color: p.label })}`,
  },
  {
    id: "months", name: "Twelve Months", layout: "store", header: total,
    pal: { light: { bg: "#f3f5f2", fg: "#16201a", label: "#5d6a61", lv: ["#e1e6df", "#b5d8b9", "#6fbf7f", "#2f9a4f", "#16602f"] }, dark: GH.dark },
    fields: (s) => [["Active days", s.S.active], ["Best day", s.S.best], ["Since", s.S.since]],
    art: (s, p) => `${rect(p, 375, 144)}${s.monthGrid({ x: 10, y: 6, w: 355, h: 134, pal: p.lv, label: p.label })}`,
  },
  {
    id: "bars", name: "Weekly Bars", layout: "store", header: total,
    pal: { light: { bg: "#fafaf7", fg: "#111111", label: "#8a877f", lv: [], a: "#111111", b: "#1f9d4c", c: "#d8d6cf" }, dark: { bg: "#111111", fg: "#f2f2f2", label: "#8a8a85", lv: [], a: "#f2f2f2", b: "#39d353", c: "#333333" } },
    fields: (s) => [["Weeks active", String(s.S.weeksActive)], ["Best week", s.S.bestWeek], ["Since", s.S.since]],
    art: (s, p) => {
      const vmax = Math.max(...s.weekly, 1), bw = 347 / s.weekly.length;
      const bars = s.weekly.map((v, i) => { const h = Math.max(1.5, (v / vmax) * 104); return `<rect x="${n2(14 + i * bw)}" y="${n2(124 - h)}" width="${n2(bw * 0.7)}" height="${n2(h)}" rx="1.2" fill="${v === vmax ? p.b : p.a}"/>`; }).join("");
      return `${rect(p, 375, 144)}<line x1="14" y1="126" x2="361" y2="126" stroke="${p.c}" stroke-width="1"/>${bars}`;
    },
  },
  {
    id: "rings", name: "Activity Rings", layout: "store", header: total,
    pal: { dark: { bg: "#000000", fg: "#ffffff", label: "#8e8e93", lv: [] }, light: { bg: "#ffffff", fg: "#000000", label: "#6e6e73", lv: [] } },
    fields: (s) => [["Streak", s.S.streak], ["Best day", s.S.best], ["Since", s.S.since]],
    art: (s, p) => {
      const cx = 72, cy = 72, ml = s.ML.length || 1;
      const rings: [number, number, string, string, number, number][] = [
        [60, s.active / Math.max(1, s.N), "#fa114f", "Active days", s.active, s.N],
        [46, s.S.weeksActive / s.COLS, "#92e82a", "Active weeks", s.S.weeksActive, s.COLS],
        [32, s.S.monthsActive / ml, "#1eeaef", "Active months", s.S.monthsActive, ml],
      ];
      const arcs = rings.map(([r, f, col]) => { const c = 2 * Math.PI * r; return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-opacity=".22" stroke-width="12"/>${f > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>` : ""}`; }).join("");
      const text = rings.map(([, , col, lab, v, of], j) => `<text x="156" y="${24 + j * 42}" font-family="Geist" font-weight="600" font-size="9" letter-spacing=".6" fill="${col}">${lab.toUpperCase()}</text><text x="156" y="${46 + j * 42}" font-family="Geist" font-weight="600" font-size="21" fill="${p.fg}">${v}<tspan font-size="13" fill="${p.label}">/${of}</tspan></text>`).join("");
      return `${rect(p, 375, 144)}${arcs}${s.avatar(cx, cy, 21)}${text}`;
    },
  },
  {
    id: "weekday", name: "Weekday", layout: "store", header: total, fields: F3,
    pal: {
      light: { bg: "#fff7ed", fg: "#1c1917", label: "#c2410c", lv: [], a: "#ea580c", b: "#fdba74", c: "#9a3412", d: "#57534e" },
      dark: { bg: "#1c1917", fg: "#fafaf9", label: "#fb923c", lv: [], a: "#f97316", b: "#7c2d12", c: "#fdba74", d: "#a8a29e" },
    },
    art: (s, p) => {
      const top = s.S.topWd, m = Math.max(...s.wd, 1), share = Math.round((s.wd[top] / Math.max(1, s.p.total)) * 100);
      const bars = [1, 2, 3, 4, 5, 6, 0].map((d, j) => { const h = Math.max(2, (s.wd[d] / m) * 96); return `<rect x="${206 + j * 22.6}" y="${n2(118 - h)}" width="16" height="${n2(h)}" rx="3" fill="${d === top ? p.a : p.b}"/><text x="${214 + j * 22.6}" y="134" text-anchor="middle" font-family="Geist Mono" font-size="9" fill="${p.c}">${DOWL[d][0]}</text>`; }).join("");
      return `${rect(p, 375, 144)}<text x="16" y="40" font-family="Geist Mono" font-size="10" fill="${p.label}">YOU SHIP MOST ON</text><text x="15" y="76" font-family="Bricolage Grotesque" font-weight="800" font-size="34" fill="${p.fg}">${DOWL[top]}s</text><text x="16" y="100" font-family="Geist" font-size="12" fill="${p.d}">${share}% of your year</text>${bars}`;
    },
  },
  {
    id: "console", name: "Pocket Console", layout: "store", logo: false, fields: F3, header: (s) => ["XP", s.S.total],
    pal: {
      light: { bg: "#9bbc0f", fg: "#0f380f", label: "#306230", lv: ["#a9c64a", "#5e8a1c", "#306230", "#1f4a1f", "#0f380f"], px: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"], a: "#8bac0f", b: "#0f380f", c: "#0f380f", d: "#306230" },
      dark: { bg: "#0f380f", fg: "#9bbc0f", label: "#8bac0f", lv: ["#1f4a1f", "#306230", "#5e8a1c", "#8bac0f", "#9bbc0f"], px: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"], a: "#173f17", b: "#9bbc0f", c: "#9bbc0f", d: "#8bac0f" },
    },
    art: (s, p) => `<rect width="375" height="144" fill="${p.a}"/><rect x="10" y="10" width="124" height="124" fill="${p.b}"/>${s.pixelArt({ x: 14, y: 14, size: 116, pal: p.px! })}<text x="146" y="30" font-family="Press Start 2P" font-size="9" fill="${p.c}">${esc(s.S.login.toUpperCase().slice(0, 21))}</text><text x="146" y="54" font-family="Press Start 2P" font-size="14" fill="${p.c}">XP ${s.S.total}</text><text x="146" y="74" font-family="Press Start 2P" font-size="7" fill="${p.d}">STREAK ${s.S.streak.split(" ")[0]}  BEST ${s.S.best}</text>${s.heat({ x: 146, y: 84, w: 217, h: 46, pal: p.lv, r: 0, gap: 0.12 })}`,
  },
  {
    id: "portrait", name: "Portrait", layout: "poster", header: total, primary: (s) => `@${s.S.login}`, footer: (s) => `Last 12 months · Updated ${s.S.updated}`,
    pal: { dark: { ...GH.dark, fg: "#ffffff", label: "#9fb0c0" }, light: GH.light },
    art: (s, p) => {
      const [g, gd] = s.grad([`${p.bg}00`, `${p.bg}ee`, p.bg], 0, 1);
      return `${gd}${rect(p, 358, 448)}${s.image(0, 0, 358, 300)}<rect y="120" width="358" height="190" fill="${g}"/><rect y="300" width="358" height="148" fill="${p.bg}"/><text x="16" y="270" font-family="Bricolage Grotesque" font-weight="800" font-size="34" fill="${p.fg}">${esc(s.S.name.split(" ")[0])}</text>${s.heat({ x: 14, y: 282, w: 330, h: 80, pal: p.lv, mode: "bands" })}`;
    },
  },
  {
    id: "calendar", name: "Year Calendar", layout: "poster", header: total, primary: (s) => s.S.name, footer: (s) => `@${s.S.login} · Updated ${s.S.updated}`,
    pal: { light: { bg: "#f4f6f2", fg: "#16201a", label: "#5d6a61", lv: ["#e1e6df", "#b5d8b9", "#6fbf7f", "#2f9a4f", "#16602f"] }, dark: GH.dark },
    art: (s, p) => `${rect(p, 358, 448)}${s.avatar(36, 76, 20)}<text x="64" y="72" font-family="Bricolage Grotesque" font-weight="800" font-size="18" fill="${p.fg}">${esc(s.S.login)}</text><text x="64" y="90" font-family="Geist Mono" font-size="10" fill="${p.label}">${s.S.active} active days · ${s.S.streak} streak</text>${s.monthGrid({ x: 10, y: 108, w: 338, h: 262, cols: 3, pal: p.lv, label: p.label, size: 10 })}`,
  },
  {
    id: "clock", name: "Year Clock", layout: "poster", header: total, primary: (s) => `@${s.S.login}`, footer: (s) => `${s.S.active} active days · Updated ${s.S.updated}`,
    pal: {
      dark: { bg: "#1b1414", fg: "#fff3ec", label: "#ff9f6e", lv: ["#ffffff26", "#ff9f6e", "#ff7a59", "#ff5a5a", "#ffd0a8"], a: "#ff7a59", c: "#aa9999" },
      light: { bg: "#fff6f0", fg: "#2a1410", label: "#d4552e", lv: ["#2a14101f", "#ffb08a", "#ff8a5c", "#f2552e", "#b8321a"], a: "#ff7a59", c: "#9a7d72" },
    },
    art: (s, p) => {
      const cx = 179, cy = 196;
      const dots = s.LV.map((l, i) => { const k = i + s.OFF, w = Math.floor(k / 7), a = (w / s.COLS) * Math.PI * 2 - Math.PI / 2, r = 64 + (k % 7) * 13; return `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${[1.6, 2.6, 3.4, 4.2, 5][l]}" fill="${p.lv[l]}"/>`; }).join("");
      const labels = s.ML.map((m) => { const w = Math.floor((m.days[0] + s.OFF) / 7), a = (w / s.COLS) * Math.PI * 2 - Math.PI / 2; return `<text x="${(cx + Math.cos(a) * 160).toFixed(1)}" y="${(cy + Math.sin(a) * 160 + 3).toFixed(1)}" text-anchor="middle" font-family="Geist Mono" font-size="9" fill="${p.c}">${MON[m.m][0]}</text>`; }).join("");
      return `${rect(p, 358, 448)}${dots}${labels}${s.avatar(cx, cy, 46, p.a)}`;
    },
  },
  {
    id: "swiss", name: "Swiss", layout: "poster", header: total, primary: (s) => s.S.name, footer: (s) => `Member since ${s.S.since}`,
    pal: {
      light: { bg: "#fbfbf9", fg: "#111111", label: "#e2231a", lv: ["#e8e8e4", "#bdbdb8", "#8a8a85", "#4a4a47", "#111111"], a: "#e2231a" },
      dark: { bg: "#111111", fg: "#fbfbf9", label: "#ff4a3d", lv: ["#262626", "#4a4a47", "#8a8a85", "#c4c4bf", "#fbfbf9"], a: "#ff4a3d" },
    },
    art: (s, p) => {
      const lines = s.splitHandle(), size = Math.min(60, 334 / (Math.max(...lines.map((l) => l.length)) * 0.74));
      const box = { x: 14, y: 214, w: 330, h: 118, mode: "bands" as const };
      const best = s.MAX > 0 && s.p.total ? s.cellBox(s.p.calendar.counts.indexOf(s.MAX), box) : null;
      return `${rect(p, 358, 448)}${lines.map((l, k) => `<text x="12" y="${(104 + k * size * 1.02).toFixed(1)}" font-family="Archivo Black" font-size="${size.toFixed(1)}" fill="${p.fg}" letter-spacing="-1.5">${esc(l)}</text>`).join("")}<rect x="12" y="194" width="334" height="2" fill="${p.fg}"/>${s.heat({ ...box, pal: p.lv, r: 0 })}${best ? `<rect x="${n2(best.x + best.p * 0.09)}" y="${n2(best.y + best.p * 0.09)}" width="${n2(best.p * 0.82)}" height="${n2(best.p * 0.82)}" fill="${p.a}"/>` : ""}`;
    },
  },
  {
    id: "bento", name: "Bento", layout: "poster", header: (s) => ["Since", s.S.since], primary: (s) => s.S.name, footer: (s) => `@${s.S.login}`,
    pal: {
      light: { bg: "#f2f2ef", fg: "#111111", label: "#666666", lv: GH_LIGHT, a: "#0d1117", b: "#39d353", c: "#7d8590", d: "#ffffff" },
      dark: { bg: "#0d1117", fg: "#e6edf3", label: "#7d8590", lv: ["#21262d", ...GH_DARK.slice(1)], a: "#161b22", b: "#39d353", c: "#7d8590", d: "#161b22" },
    },
    art: (s, p) => {
      const tile = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}"/>`;
      const lab = (x: number, y: number, t: string, fill: string) => `<text x="${x}" y="${y}" font-family="Geist" font-weight="600" font-size="9" letter-spacing=".5" fill="${fill}">${t}</text>`;
      const stat = (x: number, t: string, v: string, fill: string, fg: string, lg: string) => `${tile(x, 176, 106, 84, fill)}${lab(x + 12, 196, t, lg)}<text x="${x + 12}" y="242" font-family="Bricolage Grotesque" font-weight="800" font-size="30" fill="${fg}">${v}</text>`;
      return `${rect(p, 358, 448)}${s.image(12, 48, 120, 120, 14)}${tile(140, 48, 206, 120, p.a!)}${lab(156, 72, "CONTRIBUTIONS", p.c!)}<text x="154" y="140" font-family="Archivo Black" font-size="${s.p.total > 99999 ? 40 : 56}" letter-spacing="-2" fill="${p.b}">${s.S.total}</text><text x="156" y="158" font-family="Geist" font-size="10" fill="${p.c}">last 12 months</text>${stat(12, "ACTIVE DAYS", s.S.active, p.d!, p.fg, p.label)}${stat(126, "STREAK", `${s.S.streak.split(" ")[0]}d`, p.d!, p.fg, p.label)}${stat(240, "BEST DAY", s.S.best, p.b!, "#0d1117", "#0d4a22")}${tile(12, 268, 334, 92, p.d!)}${lab(24, 287, "EVERY DAY", p.label)}${s.heat({ x: 22, y: 294, w: 314, h: 58, pal: p.lv })}`;
    },
  },
  {
    id: "ridges", name: "Ridgelines", layout: "poster", header: total, primary: (s) => s.S.name, footer: (s) => `Busiest: ${s.S.topMonth}`,
    pal: { dark: { bg: "#000000", fg: "#ffffff", label: "#888888", lv: [], c: "#777777" }, light: { bg: "#ffffff", fg: "#111111", label: "#777777", lv: [], c: "#888888" } },
    art: (s, p) => {
      const c = s.p.calendar.counts;
      const lines = s.ML.map((m, j) => {
        const y0 = 112 + j * 21;
        const pts = m.days.map((i, n) => { const v = (c[i - 1] ?? 0) * 0.25 + c[i] * 0.5 + (c[i + 1] ?? 0) * 0.25; return [44 + (n / 30) * 296, y0 - Math.sqrt(v / s.MAX) * 52]; });
        const d = pts.map((q, n) => `${n ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("");
        return `<path d="${d}L${pts[pts.length - 1][0].toFixed(1)},${y0 + 4}L44,${y0 + 4}Z" fill="${p.bg}"/><path d="${d}" fill="none" stroke="${p.fg}" stroke-width="1.3" stroke-linejoin="round"/><text x="14" y="${y0}" font-family="Geist Mono" font-size="8" fill="${p.c}">${MON[m.m].toUpperCase()}</text>`;
      }).join("");
      return `${rect(p, 358, 448)}${lines}`;
    },
  },
  {
    id: "paper", name: "The Daily Commit", layout: "poster", header: total, primary: (s) => s.S.name, footer: (s) => `Updated ${s.S.updated}`,
    pal: {
      light: { bg: "#f4f0e6", fg: "#1a1a1a", label: "#7a6f5a", lv: ["#e3dccb", "#bdb4a0", "#8c8370", "#544d40", "#1a1a1a"], a: "#3b372e" },
      dark: { bg: "#1a1814", fg: "#ece6d6", label: "#a39a85", lv: ["#2a2620", "#4a443a", "#7d7563", "#b3aa95", "#ece6d6"], a: "#cfc7b4" },
    },
    art: (s, p) => {
      const f = s.id("f"), lin = `type="linear" slope="1.25" intercept="-.1"`;
      return `${rect(p, 358, 448)}<defs><filter id="${f}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR ${lin}/><feFuncG ${lin}/><feFuncB ${lin}/></feComponentTransfer></filter></defs><text x="179" y="86" text-anchor="middle" font-family="UnifrakturMaguntia" font-size="36" fill="${p.fg}">The Daily Commit</text><rect x="14" y="96" width="330" height="1.6" fill="${p.fg}"/><rect x="14" y="99.5" width="330" height=".6" fill="${p.fg}"/><text x="179" y="111" text-anchor="middle" font-family="Geist Mono" font-size="7.5" letter-spacing="1" fill="${p.label}">EST. ${s.S.since} · ${s.S.updated.toUpperCase()} · LAST 12 MONTHS</text><text x="14" y="142" font-family="Instrument Serif" font-size="${Math.min(30, 560 / (s.S.login.length + 1))}" fill="${p.fg}">@${esc(s.S.login)}</text><text x="14" y="168" font-family="Instrument Serif" font-style="italic" font-size="21" fill="${p.a}">ships ${s.S.total} contributions</text>${s.image(14, 182, 150, 150, 0, ` filter="url(#${f})"`)}<text x="176" y="190" font-family="Geist Mono" font-size="7" letter-spacing=".5" fill="${p.label}">FIG. 1 · EVERY DAY OF THE YEAR</text>${s.heat({ x: 176, y: 196, w: 168, h: 96, pal: p.lv, mode: "bands", r: 0 })}<text x="176" y="312" font-family="Instrument Serif" font-size="12" fill="${p.fg}">Busiest day: ${s.S.bestDay}, with ${s.S.best}.</text><text x="176" y="328" font-family="Instrument Serif" font-size="12" fill="${p.fg}">Longest run: ${s.S.streak}.</text>`;
    },
  },
  { id: "id", name: "Native ID", layout: "generic", pal: GH, header: (s) => ["Since", s.S.since] },
];

const BY_ID = new Map(DESIGNS.map((d) => [d.id, d]));
export const DEFAULT_THEME = "classic:dark";

/** A saved theme is "<design>:<mode>". Anything unknown falls back to the default. */
export function pickTheme(theme: string | null | undefined): { design: Design; mode: Mode; theme: string } {
  const [id, m] = (theme ?? "").split(":");
  const design = BY_ID.get(id) ?? BY_ID.get("classic")!;
  const mode: Mode = m === "light" ? "light" : "dark";
  return { design, mode, theme: `${design.id}:${mode}` };
}
export const isTheme = (t: string | null | undefined): t is string => !!t && pickTheme(t).theme === t;

/** Can this design be added on this iOS major (null = not an iPhone, unknown)? Posters need iOS 27. */
export const fitsIOS = (d: Design, ios: number | null) => d.layout !== "poster" || ios === null || ios >= POSTER_MIN_IOS;

/** Fields of the generic layout: design "id", and what iOS 26 and older show for a poster. */
export function genericFields(s: Ctx) {
  return {
    header: ["Since", s.S.since] as Field,
    primary: ["Contributions", s.S.total] as Field,
    secondary: [["Developer", s.S.name], ["Handle", `@${s.S.login}`]] as Field[],
    auxiliary: F3(s),
  };
}

/** The design's image as a standalone SVG in points, or null for the generic layout. */
export function artSvg(d: Design, mode: Mode, s: Ctx): string | null {
  if (!d.art) return null;
  const { width: w, height: h } = d.layout === "poster" ? ARTWORK : STRIP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${d.art(s, d.pal[mode])}</svg>`;
}

/** Poster logo slot (126×30 pt): avatar and handle. */
export function chipSvg(s: Ctx, color: string): string {
  const size = Math.min(13, 92 / (s.S.login.length * 0.62 + 1));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="126" height="30" viewBox="0 0 126 30">${s.avatar(15, 15, 13)}<text x="34" y="${(15 + size * 0.36).toFixed(1)}" font-family="Geist" font-weight="600" font-size="${size.toFixed(1)}" fill="${color}">@${esc(s.S.login)}</text></svg>`;
}

/** Store logo (30×30 pt): the avatar in a circle. */
export function logoSvg(s: Ctx): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">${s.avatar(15, 15, 15)}</svg>`;
}

// ---------- web preview: the card as Wallet lays it out ----------

const fieldHtml = ([l, v]: Field, p: Pal) => `<div><div class="lab" style="color:${p.label}">${esc(l)}</div><div class="val">${esc(v)}</div></div>`;
const row = (fs: Field[], p: Pal) => `<div class="fields" style="--n:${fs.length}">${fs.map((f) => fieldHtml(f, p)).join("")}</div>`;
/** Real QR of the GitHub profile URL, same as the pass barcode. */
function qrHtml(s: Ctx) {
  const q = qrcode(0, "M");
  q.addData(`https://github.com/${s.S.login}`);
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x},${y}h1v1h-1z`;
  return `<div class="code"><div class="qr"><svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path d="${d}" fill="#000"/></svg></div></div>`;
}

/** The whole card front as HTML (styles in globals.css under .card). */
export function cardHtml(d: Design, mode: Mode, profile: Profile, pre = `${d.id}-${mode}`): string {
  const s = ctx(profile, pre), p = d.pal[mode];
  const style = `background:${p.bg};color:${p.fg}`;
  const hdr = `<div class="hdr">${fieldHtml(d.header(s), p)}</div>`;
  if (d.layout === "poster") {
    return `<div class="card poster" style="${style}">${artSvg(d, mode, s)!.replace("<svg ", '<svg class="art" ')}<div class="ptop"><div class="pchip"><img src="${profile.avatar}" alt=""><span>@${esc(s.S.login)}</span></div>${hdr}</div><div class="pbottom"><div class="pprimary">${esc(d.primary!(s))}</div><div class="pfoot">${esc(d.footer!(s))}</div></div></div>`;
  }
  if (d.layout === "generic") {
    const g = genericFields(s);
    return `<div class="card generic" style="${style}"><div class="top"><div class="logotext">gitcard</div><div class="hdr">${fieldHtml(g.header, p)}</div></div><div class="gprimary"><div><div class="lab" style="color:${p.label}">${g.primary[0]}</div><div class="val">${esc(g.primary[1])}</div></div><img class="thumb" src="${profile.avatar}" alt=""></div>${row(g.secondary, p)}${row(g.auxiliary, p).replace('class="fields"', 'class="fields rowb"')}${qrHtml(s)}</div>`;
  }
  const logo = d.logo === false ? "" : `<img class="logo" src="${profile.avatar}" alt="">`;
  return `<div class="card store" style="${style}"><div class="top">${logo}<div class="logotext">${esc(s.S.login)}</div>${hdr}</div>${artSvg(d, mode, s)!.replace("<svg ", '<svg class="strip" ')}${row(d.fields!(s), p)}${qrHtml(s)}</div>`;
}
