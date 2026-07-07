import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { toEarningsPlan } from "./lib/planAdapter.js";

/*
  DealBreakdown - Strategy Step 2, deal tiers grouped by component.

  Each component is a section: New Logo, Expansion, Renewal, and so on. Plan-derived
  components are read from the comp plan (origin "plan"), carry the plan quota, and
  cannot be renamed or deleted. A rep can also add their own component (origin
  "custom"): free-text name, renamable and deletable, no plan quota.

  Inside a section, each SIZE ROW has four columns: Deal Size (a single dollar amount),
  Deal Quantity (a stepper), Sales Cycle Length (whole months, stored for a later
  build), and Total Revenue (Deal Size times Deal Quantity).

  We reuse the real plan and engine: totalQuota comes from toEarningsPlan, and the plan
  work measures toward the rep's STRETCH quota with TARGET as a milestone tick. Custom
  components have no plan quota, so their revenue is shown as a clearly separate line
  and is NOT folded into the plan based reconciliation.

  Props:
    plan, targetPct, stretchPct   -> the rep's real plan and goals
    stored                        -> persisted deal_plan (v4 components, or an older blob)
    onPersist(obj)                -> save the structured deal_plan
    onBack(), onContinue()        -> navigation
*/

// ── formatting: all money routes through fmt, no hardcoded currency ─────────
const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
const digitsOf = (s) => String(s == null ? "" : s).replace(/[^\d]/g, "");
const num = (s) => Number(digitsOf(s)) || 0;
const moneyDisplay = (s) => {
  const d = digitsOf(s);
  return d ? fmt(Number(d)) : "";
};

function niceRound(v) {
  if (!v || v <= 0) return 0;
  let step;
  if (v < 10000) step = 500;
  else if (v < 50000) step = 1000;
  else if (v < 250000) step = 5000;
  else if (v < 1000000) step = 10000;
  else step = 25000;
  return Math.max(step, Math.round(v / step) * step);
}

// ── visual system: ONE config map. Size icon by row RANK within its section, color
// by component type. Custom components use the neutral _default entry. ──────────────
const VISUAL = {
  typeColor: {
    "New Logo": { fg: "#2D6A4F", chipBg: "#E4F3EA", chipBd: "#B7E0C5" },
    "New Business": { fg: "#2D6A4F", chipBg: "#E4F3EA", chipBd: "#B7E0C5" },
    Expansion: { fg: "#1F5FA8", chipBg: "#E3EEFA", chipBd: "#B9D4F0" },
    Upsell: { fg: "#1F5FA8", chipBg: "#E3EEFA", chipBd: "#B9D4F0" },
    Renewal: { fg: "#9A6A00", chipBg: "#FBF0D6", chipBd: "#EAD6A0" },
    "Multi-Year": { fg: "#6D4AA8", chipBg: "#EFE8FA", chipBd: "#D6C6F0" },
    Services: { fg: "#B0532A", chipBg: "#FBE9DF", chipBd: "#EFC9B4" },
    _default: { fg: "#7A6A55", chipBg: "#F1EADF", chipBd: "#E0D2BF" }, // neutral, used for custom
  },
};
const typeStyle = (type, origin) => (origin === "custom" ? VISUAL.typeColor._default : VISUAL.typeColor[type] || VISUAL.typeColor._default);
function CustomIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function InfoDot({ text }) {
  return (
    <span className="dbk-info" tabIndex={0} aria-label={text}>
      i<span className="dbk-bub">{text}</span>
    </span>
  );
}

// ── loading past shapes ─────────────────────────────────────────────────────
// Resolve a stored size entry of any past shape down to a single size number.
function sizeFromStored(t) {
  if (t.size != null && t.size !== "") return num(t.size);
  if (t.typical_size != null) return num(t.typical_size);
  const lo = t.size_low, hi = t.size_high;
  if (lo != null && hi != null) return niceRound((num(lo) + num(hi)) / 2);
  if (lo != null) return num(lo);
  if (hi != null) return num(hi);
  return 0;
}

// Pull a normalized list of stored sections from any past blob:
//   [{ type, origin|null, sizes: [{ size, quantity, cycle }] }]
// v4 grouped, v1 component/band, and v2/v3 flat tiers are all handled.
function extractStored(stored) {
  if (!stored) return [];
  // v6 free deal list (components carry a `deals` array). name -> label, value -> size.
  if (Array.isArray(stored.components) && stored.components.some((c) => Array.isArray(c.deals))) {
    return stored.components.map((c) => ({
      type: c.type || c.name || "",
      origin: c.origin || null,
      sizes: (Array.isArray(c.deals) ? c.deals : []).map((d) => ({
        id: d.id,
        label: typeof d.name === "string" ? d.name : "",
        size: d.value == null ? "" : String(num(d.value)),
        quantity: num(d.quantity),
        cycle: d.cycle_months == null ? "" : String(d.cycle_months),
        closePeriod: d.close_period == null ? "" : String(d.close_period),
      })),
    }));
  }
  // v4/v5 grouped components (carry a `sizes` array)
  if (Array.isArray(stored.components) && stored.components.some((c) => Array.isArray(c.sizes))) {
    return stored.components.map((c) => ({
      type: c.type || c.name || "",
      origin: c.origin || null,
      sizes: (Array.isArray(c.sizes) ? c.sizes : []).map((s) => ({
        id: s.id,
        label: typeof s.label === "string" ? s.label : "",
        size: String(sizeFromStored(s)),
        quantity: num(s.quantity),
        cycle: s.cycle_months == null ? "" : String(s.cycle_months),
      })),
    }));
  }
  // v1 component/band blob (drop zero-size or zero-quantity bands on conversion)
  if (Array.isArray(stored.components)) {
    return stored.components.map((c) => ({
      type: c.name || "",
      origin: null,
      sizes: (Array.isArray(c.bands) ? c.bands : [])
        .filter((b) => num(b.quota_per_deal) > 0 && num(b.count) > 0)
        .map((b) => ({ label: "", size: String(num(b.quota_per_deal)), quantity: num(b.count), cycle: "" })),
    }));
  }
  // v2/v3 flat tiers -> group by type. Drop zero-quantity rows only for the older
  // range shape (a conversion); native single-size tiers keep their rows.
  if (Array.isArray(stored.tiers)) {
    const isRangeBlob = stored.tiers.some((t) => t.size == null && (t.typical_size != null || t.size_low != null || t.size_high != null));
    const byType = new Map();
    for (const t of stored.tiers) {
      const qty = num(t.quantity);
      if (isRangeBlob && qty <= 0) continue;
      const key = t.type || "";
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key).push({ label: typeof t.label === "string" ? t.label : "", size: String(sizeFromStored(t)), quantity: qty, cycle: t.cycle_months == null ? "" : String(t.cycle_months) });
    }
    return [...byType.entries()].map(([type, sizes]) => ({ type, origin: null, sizes }));
  }
  return [];
}

// Build the editable sections. Plan components always come first (origin "plan",
// authoritative name and quota from the plan, never removable). Then any stored
// section whose name is not a plan component becomes a custom section. Nothing is
// invented: a plan component with no saved sizes simply starts with no rows.
function buildSections(plan, stored) {
  const planComps = (plan && plan.quota && Array.isArray(plan.quota.components) ? plan.quota.components : [])
    .filter((c) => c && c.name)
    .map((c) => ({ name: c.name, quota: c.quota_amount != null ? Number(c.quota_amount) : null }));
  const storedSecs = extractStored(stored);
  const byType = new Map(storedSecs.map((s) => [s.type, s]));

  const sections = [];
  let sid = 0, rid = 0;
  // Reuse a row's stored id so chip ids stay stable across reloads. Only rows that never
  // had one (v1/v2/v3 conversions, scaffold) get a fresh sequential id.
  const withRowIds = (rows) => rows.map((r) => ({ id: r.id || `row-${rid++}`, label: r.label || "", size: r.size === "0" ? "" : r.size, quantity: r.quantity == null ? "" : String(num(r.quantity)), cycle: r.cycle, closePeriod: r.closePeriod || "" }));

  const planNames = new Set(planComps.map((c) => c.name));
  for (const pc of planComps) {
    const s = byType.get(pc.name);
    sections.push({ id: `sec-${sid++}`, type: pc.name, origin: "plan", quota: pc.quota, sizes: withRowIds(s ? s.sizes : []) });
  }
  for (const s of storedSecs) {
    if (planNames.has(s.type)) continue; // already placed as a plan section
    sections.push({ id: `sec-${sid++}`, type: s.type || "Custom component", origin: "custom", quota: null, sizes: withRowIds(s.sizes) });
  }
  return sections;
}

// Largest numeric suffix across all section and row ids. New ids are seeded above this,
// so a fresh id can never collide with a loaded one regardless of prefix.
function maxIdNum(sections) {
  let m = 0;
  const scan = (id) => { const g = String(id).match(/(\d+)\s*$/); if (g) m = Math.max(m, Number(g[1])); };
  for (const s of sections) { scan(s.id); for (const r of s.sizes) scan(r.id); }
  return m;
}

function serialize(sections, ctx) {
  return {
    version: 6,
    target_pct: ctx.targetPct,
    stretch_pct: ctx.stretchPct,
    total_quota: ctx.totalQuota,
    // Free deal list per component. Internal state keeps the v5 field names; the v6 shape
    // maps label -> name (the editable deal name) and size -> value (the dollar amount),
    // and adds close_period (the line's picked period; null = unset, deals on the bench).
    components: sections.map((s) => ({
      type: s.type || null,
      origin: s.origin,
      quota: s.origin === "plan" ? s.quota : null,
      deals: s.sizes.map((r) => ({
        id: r.id,
        name: r.label || "",
        value: r.size === "" ? null : num(r.size),
        quantity: num(r.quantity),
        cycle_months: r.cycle === "" ? null : num(r.cycle),
        close_period: r.closePeriod === "" || r.closePeriod == null ? null : num(r.closePeriod),
      })),
    })),
    // Timeline placements keyed by stable chip id. Missing = unplaced, missing name = TBD.
    placements: ctx.placements || {},
  };
}

// Derive size bands by clustering deal-line VALUES plan-wide (relative, not fixed dollar
// thresholds). A tight spread (or one value) collapses to a single band; otherwise split
// at the largest relative gaps into up to three bands, biggest values = "big". The rep
// declares no tiers; this is what the Gantt labels and colors by. Returns lineId -> band.
function deriveSizeBands(lines) {
  const withVal = lines.filter((l) => l.value > 0);
  if (!withVal.length) return {};
  const vals = [...new Set(withVal.map((l) => l.value))].sort((a, b) => a - b);
  const band = {};
  if (vals.length === 1 || vals[vals.length - 1] <= vals[0] * 1.6) {
    for (const l of withVal) band[l.id] = "solo";
    return band;
  }
  const gaps = [];
  for (let i = 1; i < vals.length; i++) gaps.push({ i, ratio: vals[i] / vals[i - 1] });
  const splits = gaps.filter((g) => g.ratio > 1.3).sort((a, b) => b.ratio - a.ratio).slice(0, 2).map((g) => g.i).sort((a, b) => a - b);
  const bounds = [0, ...splits, vals.length];
  const clusters = [];
  for (let c = 0; c < bounds.length - 1; c++) clusters.push(new Set(vals.slice(bounds[c], bounds[c + 1])));
  const n = clusters.length;
  const labelAt = (ci) => (n === 1 ? "solo" : n === 2 ? (ci === 0 ? "small" : "big") : ci === 0 ? "small" : ci === 1 ? "medium" : "big");
  clusters.forEach((set, ci) => { for (const l of withVal) if (set.has(l.value)) band[l.id] = labelAt(ci); });
  return band;
}
// The size word shown for a band (the derived Gantt label and a line's default name).
function sizeWord(band) {
  return band === "big" ? "Big" : band === "medium" ? "Medium" : band === "small" ? "Small" : "Deal";
}

// ── timeline model (Blocks 1 and 3) ─────────────────────────────────────────
// The timeline READS the deal lines and never writes economics back. Each line expands
// into individual deal chips; a chip is a bar whose length is its cycle and whose start
// is computed backward from a rep-set close point; a start before today is late.

// Expand every size row into its individual deal chips with STABLE ids, so an unchanged
// chip keeps its id (and therefore its placement and name) when tiers re-expand.
function expandDeals(sections, bands) {
  const deals = [];
  for (const comp of sections) {
    const color = typeStyle(comp.type, comp.origin).fg;
    for (const row of comp.sizes) {
      const q = num(row.quantity);
      const band = (bands && bands[row.id]) || null;
      const sizeLabel = sizeWord(band); // DERIVED size word (from value clustering), not entered
      const lineName = row.label && row.label.trim() ? row.label : sizeLabel; // editable name, defaults to the size word
      const lineClose = row.closePeriod === "" || row.closePeriod == null ? null : num(row.closePeriod);
      for (let i = 0; i < q; i++) {
        deals.push({
          id: `${comp.id}#${row.id}#${i}`,
          componentId: comp.id,
          componentType: comp.type || "Untagged",
          origin: comp.origin,
          color,
          band,
          sizeLabel,
          lineName,
          size: num(row.size),
          cycle: num(row.cycle),
          lineClose,
        });
      }
    }
  }
  return deals;
}

// The plan's period as month math. Month index 0 is the first month of the period.
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function planPeriod(plan) {
  const meta = (plan && plan.meta) || {};
  const pp = meta.plan_period || {};
  const parse = (d) => { const m = /^(\d{4})-(\d{2})/.exec(String(d || "")); return m ? { y: +m[1], mo: +m[2] - 1 } : null; };
  const s = parse(pp.start_date);
  const e = parse(pp.end_date);
  const year = meta.plan_year != null ? Number(meta.plan_year) : (s ? s.y : null);
  const startY = s ? s.y : year;
  const startMo = s ? s.mo : 0;
  const endY = e ? e.y : year;
  const endMo = e ? e.mo : 11;
  const P = startY != null && endY != null ? (endY - startY) * 12 + (endMo - startMo) + 1 : 12;
  return { startY: startY == null ? null : startY, startMo, P: Math.max(1, P), quarterly: /quarter/i.test(pp.type || "") };
}
// Fractional month index of a date within the period (by day for a smooth today line).
function monthIndexOf(period, date) {
  if (period.startY == null) return 0;
  const idx = (date.getFullYear() - period.startY) * 12 + (date.getMonth() - period.startMo);
  const dim = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return idx + (date.getDate() - 1) / dim;
}
function monthLabel(period, idx) {
  const total = (period.startMo || 0) + idx;
  const y = (period.startY || 0) + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  // Show the year whenever a month falls outside the plan year (a long-cycle deal can
  // start in a prior year, a negative index), so it never reads as wrapping forward.
  const showYear = period.P > 12 || y !== period.startY;
  return MON[m] + (showYear ? " '" + String(y).slice(2) : "");
}

// Bar geometry. A deal closes at the END of its close month and runs backward by its
// cycle. Positions are month units (0 = period start). Late when start is before today.
function dealBar(closePoint, cycle) {
  const closePos = closePoint + 1;
  const startPos = closePos - Math.max(cycle, 0);
  return { startPos, closePos };
}

// ── small controls ─────────────────────────────────────────────────────────
// Type-or-step numeric control: the rep can type a number OR nudge with the -/+
// buttons. `value` is a string; "" means unset (rendered blank, never as a "0"),
// so a field that needs input reads as empty rather than a real zero.
function StepInput({ value, onChange, suffix = null, unset = false, minusLabel, plusLabel }) {
  const n = num(value);
  const dec = () => onChange(value === "" ? "" : String(Math.max(0, n - 1)));
  const inc = () => onChange(String(n + 1));
  return (
    <div className={`dbk-stepinput${unset ? " unset" : ""}`}>
      <button type="button" className="si-btn" aria-label={minusLabel} onClick={dec}>−</button>
      <div className="si-mid">
        <input type="text" inputMode="numeric" value={digitsOf(value)} onChange={(e) => onChange(digitsOf(e.target.value))} />
        {suffix ? <span className="si-suf">{suffix}</span> : null}
      </div>
      <button type="button" className="si-btn" aria-label={plusLabel} onClick={inc}>+</button>
    </div>
  );
}
function Meter({ booked, target, tickFrac }) {
  const met = target > 0 && booked >= target - 0.5;
  const fillFrac = target > 0 ? Math.min(booked / target, 1) : 0;
  return (
    <div className="dbk-meter">
      <div className="dbk-track">
        <div className={`dbk-fill${met ? " met" : ""}`} style={{ width: fillFrac * 100 + "%" }} />
        {tickFrac > 0 && tickFrac < 1 && (
          <div className="dbk-tick" style={{ left: tickFrac * 100 + "%" }}><span className="dbk-tick-lbl">Target</span></div>
        )}
      </div>
    </div>
  );
}

export default function DealBreakdown({
  plan = null,
  targetPct = 110,
  stretchPct = 150,
  stored = null,
  onPersist = () => {},
  onBack = () => {},
  onContinue = () => {},
}) {
  const ep = toEarningsPlan(plan) || {};
  const totalQuota = ep.totalQuota || 0;
  const stretchMult = stretchPct / 100;
  const targetMult = targetPct / 100;
  const stretchQuota = totalQuota * stretchMult;
  const targetQuota = totalQuota * targetMult;
  const tickFrac = stretchPct > 0 ? Math.min(Math.max(targetMult / stretchMult, 0), 1) : 0;

  // A genuinely new rep (no saved deal_plan) gets a render-only teaching scaffold:
  // the first plan component seeded with Big/Medium/Small label-only rows, every
  // other plan component seeded with one blank row. No numbers are fabricated, and
  // none of this is persisted until the rep actually edits (see the `edited` gate).
  const hadStoredInit = !!(stored && (Array.isArray(stored.components) || Array.isArray(stored.tiers)));
  const [sections, setSections] = useState(() => {
    const base = buildSections(plan, stored);
    if (hadStoredInit) return base;
    let rc = 0;
    const rid = () => `srow-${rc++}`;
    const firstPlan = base.find((s) => s.origin === "plan");
    return base.map((s) => {
      if (s.origin !== "plan") return s;
      if (firstPlan && s.id === firstPlan.id) {
        return { ...s, sizes: [
          { id: rid(), label: "Big", size: "", quantity: "", cycle: "", closePeriod: "" },
          { id: rid(), label: "Medium", size: "", quantity: "", cycle: "", closePeriod: "" },
          { id: rid(), label: "Small", size: "", quantity: "", cycle: "", closePeriod: "" },
        ] };
      }
      return { ...s, sizes: [{ id: rid(), label: "", size: "", quantity: "", cycle: "", closePeriod: "" }] };
    });
  });
  // Monotonic id source seeded above every loaded id, so new rows/components never
  // collide with a stored id and chip ids stay stable across reloads.
  const seq = useRef(1 + maxIdNum(sections));
  const newId = () => `d-${seq.current++}`;
  // First-run state ends the moment the rep touches anything. It gates BOTH the
  // helper/scaffold framing and persistence, so land-and-leave never saves a blob.
  const [edited, setEdited] = useState(false);
  const firstRun = !hadStoredInit && !edited;

  // ── timeline (Blocks 1-3): read-only expansion of tiers into deal chips ──
  const period = useMemo(() => planPeriod(plan), [plan]);
  const today = useMemo(() => new Date(), []);
  const todayIdx = monthIndexOf(period, today);
  // Size bands are derived plan-wide by clustering all deal-line values (not entered).
  const bands = useMemo(() => deriveSizeBands(sections.flatMap((s) => s.sizes.map((r) => ({ id: r.id, value: num(r.size) })))), [sections]);
  const deals = useMemo(() => expandDeals(sections, bands), [sections, bands]);

  // placements: chipId -> { close_point (null = bench), name }. Loaded from stored.
  const [placements, setPlacements] = useState(() => (stored && stored.placements && typeof stored.placements === "object" ? { ...stored.placements } : {}));
  const [selChip, setSelChip] = useState(null);

  // No auto-arrangement: a fresh or edited line's deals sit on the bench until the rep
  // picks a close period (Increment B) or places them by hand. We do not fabricate a
  // close date, same "no invented assumptions" rule as the rest of the screen.

  const closeOf = (chipId) => { const p = placements[chipId]; return p && p.close_point != null ? p.close_point : null; };
  const nameOf = (chipId) => { const p = placements[chipId]; return p && p.name ? p.name : ""; };
  const setClose = (chipId, cp) => { setEdited(true); setPlacements((p) => ({ ...p, [chipId]: { close_point: cp, name: (p[chipId] && p[chipId].name) || "" } })); };
  const benchChip = (chipId) => { setEdited(true); setPlacements((p) => ({ ...p, [chipId]: { close_point: null, name: (p[chipId] && p[chipId].name) || "" } })); };
  const setName = (chipId, name) => { setEdited(true); setPlacements((p) => ({ ...p, [chipId]: { close_point: (p[chipId] && p[chipId].close_point != null) ? p[chipId].close_point : null, name } })); };

  // Combined-timeline scroll geometry, so the today marker can stay fixed while scrolling.
  const combScrollRef = useRef(null);
  const combTodayRef = useRef(null);
  const combGeomRef = useRef(null);
  const combInitRef = useRef(false);
  const positionCombToday = () => {
    const sc = combScrollRef.current, tm = combTodayRef.current, g = combGeomRef.current;
    if (!sc || !tm || !g) return;
    const vis = g.todayX - sc.scrollLeft;
    tm.style.left = Math.max(0, Math.min(sc.clientWidth, vis)) + "px";
    tm.classList.toggle("off", vis < -1 || vis > sc.clientWidth + 1);
  };

  // ── persistence + save polish: one save path used by the debounce, the 60s autosave,
  // the Save button, and unmount. Only ever runs after the rep has edited, so the
  // first-run scaffold is never written to storage on its own. ──
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const saveTimer = useRef(null);
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const doSave = () => {
    if (!dirtyRef.current) return;
    onPersistRef.current(serialize(sections, { targetPct, stretchPct, totalQuota, placements }));
    dirtyRef.current = false;
    setDirty(false);
    setSavedAt(new Date());
  };
  const doSaveRef = useRef(doSave);
  doSaveRef.current = doSave;

  // Debounced save on any edit.
  useEffect(() => {
    if (!edited) return;
    dirtyRef.current = true;
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSaveRef.current(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [sections, placements, edited, targetPct, stretchPct, totalQuota]);

  // Autosave every 60 seconds when there are unsaved changes.
  useEffect(() => {
    const iv = setInterval(() => doSaveRef.current(), 60000);
    return () => clearInterval(iv);
  }, []);

  // Warn on leave with unsaved changes; flush on unmount.
  useEffect(() => {
    const warn = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      doSaveRef.current();
    };
  }, []);

  // Keep the combined-timeline today marker positioned, and scroll today into view once.
  useLayoutEffect(() => {
    const sc = combScrollRef.current, g = combGeomRef.current;
    if (sc && g && !combInitRef.current) {
      combInitRef.current = true;
      sc.scrollLeft = Math.max(0, g.todayX - sc.clientWidth * 0.3);
    }
    positionCombToday();
  });

  // ── edit helpers (each marks the screen edited, which unlocks persistence) ──
  const patchSection = (sid, patch) => { setEdited(true); setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, ...patch } : s))); };
  const patchRow = (sid, rid, patch) => { setEdited(true); setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, sizes: s.sizes.map((r) => (r.id === rid ? { ...r, ...patch } : r)) } : s))); };
  const addRow = (sid) => { setEdited(true); setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, sizes: [...s.sizes, { id: newId(), label: "", size: "", quantity: "", cycle: "", closePeriod: "" }] } : s))); };
  const removeRow = (sid, rid) => { setEdited(true); setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, sizes: s.sizes.filter((r) => r.id !== rid) } : s))); };
  const addComponent = () => { setEdited(true); setSections((ss) => [...ss, { id: newId(), type: "", origin: "custom", quota: null, sizes: [] }]); };
  const removeComponent = (sid) => { setEdited(true); setSections((ss) => ss.filter((s) => s.id !== sid)); };

  // ── derived math ───────────────────────────────────────────────────────
  const rowRevenue = (r) => num(r.size) * num(r.quantity);
  const sectionRevenue = (s) => s.sizes.reduce((n, r) => n + rowRevenue(r), 0);
  // Plan revenue drives the meter and reconciliation. Custom revenue is tracked
  // separately so it never breaks the plan based math.
  const planRevenue = sections.filter((s) => s.origin === "plan").reduce((n, s) => n + sectionRevenue(s), 0);
  const customRevenue = sections.filter((s) => s.origin === "custom").reduce((n, s) => n + sectionRevenue(s), 0);
  const met = stretchQuota > 0 && planRevenue >= stretchQuota - 0.5;
  const gap = stretchQuota - planRevenue;

  const typeOptions = useMemo(() => sections.filter((s) => s.origin === "plan").map((s) => s.type), [sections]);

  // Per-component mini-timeline (Blocks 2-3): the component's own chips on a small month
  // axis. Bars run backward from a close point; a start before today is loud late.
  const renderMiniTimeline = (s) => {
    const compDeals = deals.filter((d) => d.componentId === s.id);
    if (compDeals.length === 0) return null;
    const maxCycle = Math.max(1, ...compDeals.map((d) => d.cycle || 0));
    const axisLo = Math.min(Math.floor(todayIdx) - 1, period.P - maxCycle - 1);
    const span = Math.max(1, period.P - axisLo);
    const x = (pos) => ((pos - axisLo) / span) * 100;
    const months = []; for (let m = axisLo; m < period.P; m++) months.push(m);
    // Only deals with a real cycle can be bars; a cycle-less deal has no bar length and
    // waits on the bench (never scattered on the axis) until a cycle is set on its row.
    const cycled = compDeals.filter((d) => d.cycle > 0);
    const noCycle = compDeals.filter((d) => d.cycle <= 0);
    const placed = cycled.filter((d) => closeOf(d.id) != null);
    const bench = cycled.filter((d) => closeOf(d.id) == null);
    const lateCount = placed.filter((d) => dealBar(closeOf(d.id), d.cycle).startPos < todayIdx).length;
    const minClose = Math.floor(todayIdx); // cannot close before the current month
    const localSel = compDeals.some((d) => d.id === selChip) ? selChip : null;
    return (
      <div className="dbk-mini">
        <div className="dbk-mini-head">
          <span className="dbk-mini-title">These deals on your calendar</span>
          {lateCount > 0 && <span className="dbk-mini-late">{lateCount === 1 ? "1 already late" : `${lateCount} already late`}</span>}
        </div>
        {localSel ? (
          <div className="dbk-selbar">Tap a highlighted month to set the close for the deal you picked. Its details are open below.</div>
        ) : (
          <div className="dbk-selbar muted">Tap a deal, then tap a month to place it.</div>
        )}
        {(bench.length > 0 || noCycle.length > 0) && (
          <div className="dbk-bench">
            <span className="dbk-bench-lbl">Bench</span>
            {bench.map((d) => (
              <button key={d.id} type="button" className={`dbk-pill${selChip === d.id ? " sel" : ""}`} style={{ borderColor: d.color, color: d.color }} onClick={() => setSelChip(selChip === d.id ? null : d.id)}>{d.sizeLabel} {fmt(d.size)}</button>
            ))}
            {noCycle.map((d) => (
              <span key={d.id} className="dbk-pill nocycle" title="Add a sales cycle length to place this deal">{d.sizeLabel} {fmt(d.size)}</span>
            ))}
          </div>
        )}
        {noCycle.length > 0 && (
          <div className="dbk-nocycle-note">Add a sales cycle length to these rows to place them on your calendar.</div>
        )}
        <div className="dbk-months">
          {months.map((m) => (
            <button key={m} type="button" className={`dbk-cell${localSel ? " target" : ""}${m < minClose ? " past" : ""}`} disabled={!localSel || m < minClose} onClick={() => localSel && setClose(localSel, m)}>{monthLabel(period, m)}</button>
          ))}
        </div>
        <div className="dbk-bars" style={{ height: Math.max(placed.length, 1) * 32 + 4 }}>
          <div className="dbk-today2" style={{ left: Math.max(0, Math.min(100, x(todayIdx))) + "%" }}><span>Today</span></div>
          {placed.map((d, i) => {
            const cp = closeOf(d.id);
            const { startPos, closePos } = dealBar(cp, d.cycle);
            const late = startPos < todayIdx;
            const leftRaw = x(startPos), rightRaw = x(closePos);
            const left = Math.max(0, leftRaw), right = Math.min(100, rightRaw);
            const offLeft = leftRaw < -0.01;
            return (
              <button key={d.id} type="button"
                className={`dbk-bar${late ? " late" : ""}${offLeft ? " offleft" : ""}${selChip === d.id ? " sel" : ""}`}
                style={{ top: i * 32, left: left + "%", width: Math.max(right - left, 3) + "%", ...(late ? {} : { background: d.color }), borderColor: late ? undefined : d.color }}
                onClick={() => setSelChip(selChip === d.id ? null : d.id)}
                title={`${d.sizeLabel} ${fmt(d.size)}, ${d.cycle || 0} month cycle, closes ${monthLabel(period, cp)}`}>
                <span className="dbk-bar-lbl">{d.sizeLabel} {fmt(d.size)}</span>
                {late && <span className="dbk-bar-late">late</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSection = (s) => {
    const st = typeStyle(s.type, s.origin);
    return (
      <div key={s.id} className="dbk-sec" style={{ borderLeft: `4px solid ${st.fg}` }}>
        <div className="dbk-sec-head">
          {s.origin === "plan" ? (
            <>
              <span className="dbk-sec-name" style={{ color: st.fg }}>{s.type}</span>
              <span className="dbk-sec-from">from your plan</span>
              {s.quota != null ? <span className="dbk-sec-quota">Quota {fmt(s.quota)}</span> : null}
            </>
          ) : (
            <>
              <input className="dbk-sec-nameinp" type="text" placeholder="Name this component"
                value={s.type} onChange={(e) => patchSection(s.id, { type: e.target.value })} />
              <span className="dbk-custom-tag" style={{ color: st.fg, background: st.chipBg, borderColor: st.chipBd }}>
                <CustomIcon color={st.fg} /> Custom
              </span>
              <button type="button" className="dbk-sec-remove" aria-label="Remove this component" onClick={() => removeComponent(s.id)}>Remove</button>
            </>
          )}
        </div>

        {s.sizes.length > 0 && (
          <div className="dbk-rowhead">
            <span className="c-label">Name</span>
            <span className="c-size">Deal Value <InfoDot text="The dollar amount of one deal on this line. We size and group your deals from these values, and the total is value times quantity." /></span>
            <span className="c-qty">Deal Quantity</span>
            <span className="c-cycle">Sales Cycle Length</span>
            <span className="c-rev">Total Revenue</span>
            <span className="c-rm" />
          </div>
        )}

        {s.sizes.map((r) => (
          <div key={r.id} className="dbk-row">
            <div className="c-label">
              <input className="dbk-label-inp" type="text" placeholder="Name"
                value={r.label && r.label.trim() ? r.label : sizeWord(bands[r.id])}
                onChange={(e) => patchRow(s.id, r.id, { label: e.target.value })} />
            </div>
            <div className="c-size">
              <input className="dbk-field money" type="text" inputMode="numeric" placeholder="Deal value"
                value={moneyDisplay(r.size)} onChange={(e) => patchRow(s.id, r.id, { size: digitsOf(e.target.value) })} />
            </div>
            <div className="c-qty">
              <StepInput value={r.quantity} onChange={(v) => patchRow(s.id, r.id, { quantity: v })} minusLabel="One fewer deal" plusLabel="One more deal" />
            </div>
            <div className="c-cycle">
              <StepInput value={r.cycle} onChange={(v) => patchRow(s.id, r.id, { cycle: v })} suffix="mo" unset={r.cycle === ""} minusLabel="One fewer month" plusLabel="One more month" />
            </div>
            <div className="c-rev"><span className="dbk-rev" title={`${num(r.quantity)} × ${fmt(num(r.size))}`}>{fmt(rowRevenue(r))}</span></div>
            <div className="c-rm"><button type="button" className="dbk-rm" aria-label="Remove this size" onClick={() => removeRow(s.id, r.id)}>×</button></div>
          </div>
        ))}

        <button className="dbk-add-size" type="button" onClick={() => addRow(s.id)}>Add a size</button>

        {renderMiniTimeline(s)}
      </div>
    );
  };

  // Combined timeline (Block 4): all placeable chips on one shared, scrolling axis with
  // a fixed today marker. The bar mechanic is the same as the per-component view.
  const renderCombinedTimeline = () => {
    if (deals.length === 0) return null;
    const cycled = deals.filter((d) => d.cycle > 0);
    const placed = cycled.filter((d) => closeOf(d.id) != null);
    const noCycleCount = deals.filter((d) => d.cycle <= 0).length;
    const benchCount = cycled.filter((d) => closeOf(d.id) == null).length;
    const off = noCycleCount + benchCount;
    const maxCycle = Math.max(1, ...cycled.map((d) => d.cycle));
    const starts = placed.map((d) => dealBar(closeOf(d.id), d.cycle).startPos);
    const axisLo = Math.floor(Math.min(todayIdx - 1, period.P - maxCycle - 1, ...(starts.length ? starts : [0]), 0));
    const PXM = 66; // pixels per month
    const totalPx = (period.P - axisLo) * PXM;
    const xpx = (pos) => (pos - axisLo) * PXM;
    combGeomRef.current = { todayX: xpx(todayIdx) };
    const months = []; for (let m = axisLo; m < period.P; m++) months.push(m);
    const minClose = Math.floor(todayIdx);
    const maxSize = Math.max(1, ...cycled.map((d) => d.size));
    const localSel = cycled.some((d) => d.id === selChip) ? selChip : null;
    return (
      <div className="dbk-combined">
        <div className="dbk-combined-head">
          <h2 className="dbk-combined-title">Your whole year on one calendar</h2>
          <p className="dbk-combined-sub">Every deal from every component competes for the same months. Scroll to see the longer deals reach back in time, and watch the today line.</p>
        </div>
        {off > 0 && (
          <div className="dbk-offcal">
            {off === 1 ? "1 deal is not on your calendar yet." : `${off} deals are not on your calendar yet.`}
            {noCycleCount > 0 ? ` Add a sales cycle length to those rows to place them.` : ""}
            {benchCount > 0 ? ` ${benchCount === 1 ? "One is" : `${benchCount} are`} waiting on a component bench for a close month.` : ""}
          </div>
        )}
        <div className="dbk-cscroll" ref={combScrollRef} onScroll={positionCombToday}>
          <div className="dbk-ccanvas" style={{ width: totalPx }}>
            <div className="dbk-cmonths">
              {months.map((m) => (
                <button key={m} type="button" style={{ width: PXM }} className={`dbk-ccell${localSel ? " target" : ""}${m < minClose ? " past" : ""}`}
                  disabled={!localSel || m < minClose} onClick={() => localSel && setClose(localSel, m)}>{monthLabel(period, m)}</button>
              ))}
            </div>
            <div className="dbk-cbars" style={{ height: Math.max(placed.length, 1) * 30 + 8 }}>
              {placed.map((d, i) => {
                const cp = closeOf(d.id);
                const { startPos, closePos } = dealBar(cp, d.cycle);
                const late = startPos < todayIdx;
                const left = xpx(startPos), right = xpx(closePos);
                const mk = 8 + Math.round(12 * (d.size / maxSize)); // literal graduated size marker
                return (
                  <button key={d.id} type="button" className={`dbk-cbar${late ? " late" : ""}${selChip === d.id ? " sel" : ""}`}
                    style={{ top: i * 30, left, width: Math.max(right - left, 8), ...(late ? {} : { background: d.color }), borderColor: late ? undefined : d.color }}
                    onClick={() => setSelChip(selChip === d.id ? null : d.id)}
                    title={`${d.componentType}, ${d.sizeLabel} ${fmt(d.size)}, ${d.cycle} month cycle, closes ${monthLabel(period, cp)}`}>
                    <span className="dbk-cmk" style={{ width: mk, height: mk, borderColor: late ? "#8E2A20" : d.color }} />
                    <span className="dbk-cbar-lbl">{d.sizeLabel} {fmt(d.size)}</span>
                    {late && <span className="dbk-cbar-late">late</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="dbk-ctoday" ref={combTodayRef}><span>Today</span></div>
        </div>
      </div>
    );
  };

  // Chip panel (Block 5): facts read-only, one editable name. Opens for the selected chip
  // from either timeline. Numbers are never edited here; the tiers stay source of truth.
  const renderChipPanel = () => {
    const d = deals.find((x) => x.id === selChip);
    if (!d) return null;
    const cp = closeOf(d.id);
    const bar = cp != null && d.cycle > 0 ? dealBar(cp, d.cycle) : null;
    const late = bar ? bar.startPos < todayIdx : false;
    const status = d.cycle <= 0 ? "Needs a sales cycle length" : cp == null ? "On the bench" : late ? "Already late to start" : "On track";
    const Fact = ({ label, value }) => (<div className="dbk-fact"><span className="dbk-fact-l">{label}</span><span className="dbk-fact-v">{value}</span></div>);
    return (
      <div className="dbk-panel">
        <div className="dbk-panel-head">
          <span className="dbk-panel-title" style={{ color: d.color }}>{d.sizeLabel} {fmt(d.size)}</span>
          <button type="button" className="dbk-panel-x" aria-label="Close" onClick={() => setSelChip(null)}>×</button>
        </div>
        <div className="dbk-panel-facts">
          <Fact label="Component" value={d.componentType} />
          <Fact label="Size label" value={d.sizeLabel} />
          <Fact label="Typical size" value={fmt(d.size)} />
          <Fact label="Sales cycle" value={d.cycle > 0 ? `${d.cycle} months` : "not set"} />
          <Fact label="Closes" value={cp != null ? monthLabel(period, cp) : "unplaced"} />
          <Fact label="Starts" value={bar ? monthLabel(period, bar.startPos) : "n/a"} />
          <Fact label="Status" value={<span className={late ? "dbk-fact-late" : ""}>{status}</span>} />
        </div>
        <label className="dbk-panel-namelbl">Name this deal</label>
        <input className="dbk-panel-name" type="text" placeholder="TBD" value={nameOf(d.id)} onChange={(e) => setName(d.id, e.target.value)} />
        <div className="dbk-panel-note">A name is just a label to help you find this deal. The size, cycle, and count live in the tier above.</div>
        <div className="dbk-panel-actions">
          {cp != null && <button type="button" className="dbk-panel-bench" onClick={() => benchChip(d.id)}>Send to bench</button>}
          <button type="button" className="dbk-panel-done" onClick={() => setSelChip(null)}>Done</button>
        </div>
      </div>
    );
  };

  return (
    <div className="dbk-root">
      <style>{CSS}</style>

      <div className="dbk-head">
        <div className="dbk-crumb">Strategy · Step 2</div>
        <h1 className="dbk-title">Set Up Your Deal Tiers</h1>
        <p className="dbk-sub">
          Let's lay out the deals behind your stretch number. For each component of your plan, add the sizes of deal you
          run, how many you expect, and roughly how long each takes to close. Add your own component if you plan work that
          is not in your comp plan. We keep the running total against your stretch quota in view.
        </p>
      </div>

      {/* GRAND TOTAL: plan revenue vs stretch quota, kept in view. Custom is separate. */}
      <div className="dbk-grand">
        <div className="dbk-grand-top">
          <div>
            <div className="dbk-grand-lbl">Your whole year</div>
            <div className="dbk-grand-q">
              Stretch quota <b>{fmt(stretchQuota)}</b>
              <span className="dbk-grand-tgt"> · target milestone {fmt(targetQuota)}</span>
            </div>
          </div>
          <div className="dbk-grand-num">
            <div className="dbk-grand-booked">{fmt(planRevenue)}</div>
            <div className="dbk-grand-cap">from your plan components</div>
          </div>
        </div>
        <Meter booked={planRevenue} target={stretchQuota} tickFrac={tickFrac} />
        <div className="dbk-recon">
          {planRevenue === 0 ? (
            <>Add deal sizes to your plan components and we will track them against your stretch quota of <b>{fmt(stretchQuota)}</b>.</>
          ) : met ? (
            <>Your plan components cover your stretch quota, with <b>{fmt(planRevenue - stretchQuota)}</b> to spare.</>
          ) : (
            <>Your plan components add up to <b>{fmt(planRevenue)}</b>. That leaves <b>{fmt(gap)}</b> to go before we reach stretch.</>
          )}
        </div>
        {customRevenue > 0 && (
          <div className="dbk-custom-line">
            Plus <b>{fmt(customRevenue)}</b> planned in custom components. We track it here, but it sits outside your plan quota, so it does not count toward stretch.
          </div>
        )}
        <div className="dbk-savebar">
          <span className="dbk-saveinfo">{dirty ? "Unsaved changes" : savedAt ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Your work saves as you go"}</span>
          <button type="button" className="dbk-savebtn" onClick={() => doSaveRef.current()} disabled={!dirty}>Save</button>
        </div>
      </div>

      {/* FIRST-RUN helper: supporting text only, appears and disappears with the scaffold */}
      {firstRun && (
        <div className="dbk-helper">
          <p>
            Most reps close a mix of deal sizes over a year. A few big ones, some in the middle, a handful of small. Each
            size tends to have its own rhythm: a big deal might close once or twice a year after a long cycle, while
            smaller deals close faster and more often. We've set up your first component with a big, medium, and small
            example to show the idea. Rename them, change the numbers, or delete any you don't need.
          </p>
        </div>
      )}

      {/* SECTIONS */}
      <div className="dbk-secs">
        {sections.map(renderSection)}
        <button className="dbk-add-comp" type="button" onClick={addComponent}>Add a component</button>
      </div>

      {renderCombinedTimeline()}

      <div className="dbk-cta-wrap">
        <button className="dbk-cta" onClick={() => onContinue({ sections, planRevenue, customRevenue })}>
          <span className="dbk-cta-main">Save your plan of attack <span aria-hidden>→</span></span>
          <span className="dbk-cta-sub">Your deals and their timing are saved as you go</span>
        </button>
      </div>

      {renderChipPanel()}
    </div>
  );
}

const CSS = `
.dbk-root{ font-family:'DM Sans',sans-serif; color:var(--ink); }
.dbk-root *{ box-sizing:border-box; }

.dbk-head{ margin-bottom:18px; }
.dbk-crumb{ font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--carrot-dark); font-weight:700; }
.dbk-title{ font-family:'Playfair Display',serif; font-size:28px; font-weight:900; line-height:1.1; margin:6px 0 0; color:var(--ink); }
.dbk-sub{ font-size:15px; color:var(--muted); margin-top:8px; line-height:1.5; max-width:760px; }

.dbk-grand{ position:sticky; top:80px; z-index:20; background:linear-gradient(150deg,#1F3D2A,#2D6A4F); color:#F4FBF5; border-radius:18px;
  padding:16px 20px; box-shadow:0 16px 34px -20px rgba(45,106,79,.6); margin-bottom:18px; }
.dbk-grand-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.dbk-grand-lbl{ font-size:11.5px; letter-spacing:.12em; text-transform:uppercase; color:#A7D6B5; font-weight:700; }
.dbk-grand-q{ font-size:13.5px; color:#D7EEDD; margin-top:3px; } .dbk-grand-q b{ color:#fff; font-weight:700; }
.dbk-grand-tgt{ color:#9FC9AC; }
.dbk-grand-num{ text-align:right; }
.dbk-grand-booked{ font-family:'Playfair Display',serif; font-size:30px; font-weight:900; line-height:1; color:#fff; }
.dbk-grand-cap{ font-size:11px; color:#A7D6B5; letter-spacing:.04em; text-transform:uppercase; font-weight:600; margin-top:3px; }
.dbk-recon{ font-size:12.5px; color:#CDE7D4; margin-top:11px; line-height:1.5; } .dbk-recon b{ color:#fff; }
.dbk-custom-line{ font-size:12px; color:#EAD9C4; margin-top:9px; padding-top:9px; border-top:1px solid rgba(255,255,255,.16); line-height:1.5; } .dbk-custom-line b{ color:#FFE7C7; }

/* first-run helper: soft supporting text, deliberately lighter than the cards */
.dbk-helper{ background:#FBF6EF; border:1px solid #EFE3D2; border-radius:12px; padding:13px 16px; margin-bottom:16px; }
.dbk-helper p{ font-size:13px; line-height:1.55; color:var(--muted); margin:0; }

.dbk-meter{ margin-top:11px; }
.dbk-track{ position:relative; height:14px; border-radius:999px; background:rgba(255,255,255,.18); }
.dbk-fill{ position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:linear-gradient(90deg,var(--gold),var(--carrot)); transition:width .35s ease; }
.dbk-fill.met{ background:linear-gradient(90deg,#7BD493,#B7F0C6); }
.dbk-tick{ position:absolute; top:-5px; bottom:-5px; width:2px; background:rgba(255,255,255,.7); transform:translateX(-50%); }
.dbk-tick-lbl{ position:absolute; top:-16px; left:50%; transform:translateX(-50%); font-size:8.5px; letter-spacing:.06em; text-transform:uppercase; font-weight:800; color:rgba(255,255,255,.85); white-space:nowrap; }

.dbk-secs{ display:flex; flex-direction:column; gap:16px; }
.dbk-sec{ background:#fff; border:1.5px solid var(--border); border-radius:16px; padding:14px 16px; }
.dbk-sec-head{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:6px; }
.dbk-sec-name{ font-family:'Playfair Display',serif; font-size:19px; font-weight:700; }
.dbk-sec-from{ font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-sec-quota{ margin-left:auto; font-size:13px; font-weight:700; color:var(--ink); background:var(--cream); border:1px solid var(--border); border-radius:100px; padding:4px 12px; }
.dbk-sec-nameinp{ font-family:'Playfair Display',serif; font-size:19px; font-weight:700; color:var(--ink); border:1.5px solid var(--border); border-radius:10px; padding:6px 12px; min-width:220px; }
.dbk-sec-nameinp:focus{ outline:none; border-color:var(--carrot); }
.dbk-custom-tag{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; border:1.5px solid; border-radius:100px; padding:4px 10px; }
.dbk-sec-remove{ margin-left:auto; background:none; border:1.5px solid var(--border); border-radius:9px; padding:5px 12px; font-size:12.5px; font-weight:600; color:var(--muted); cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-sec-remove:hover{ border-color:#C86B4B; color:#B0532A; }

.dbk-rowhead, .dbk-row{ display:grid; grid-template-columns:minmax(104px,0.85fr) minmax(120px,1fr) 126px minmax(104px,0.8fr) minmax(110px,1fr) 32px; gap:12px; align-items:center; }
.dbk-rowhead{ padding:8px 4px 6px; border-bottom:1px solid var(--border); margin-top:6px; }
.dbk-rowhead span{ font-size:10px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-rowhead .c-rev{ text-align:right; }
.dbk-row{ padding:8px 4px; border-bottom:1px solid var(--border); }
.dbk-label-inp{ width:100%; border:1.5px solid var(--border); border-radius:9px; background:#fff; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; color:var(--ink); padding:8px 10px; }
.dbk-label-inp:focus{ outline:none; border-color:var(--carrot); }
.dbk-label-inp::placeholder{ color:#C0AE97; font-weight:600; }

.dbk-field{ border:1.5px solid var(--border); border-radius:10px; background:#fff; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--ink); padding:9px 11px; width:100%; }
.dbk-field:focus{ outline:none; border-color:var(--carrot); }
.dbk-field.money{ font-weight:700; }
.dbk-stepinput{ display:inline-flex; align-items:center; gap:2px; border:1.5px solid var(--border); border-radius:10px; background:#fff; padding:3px; width:fit-content; }
.dbk-stepinput:focus-within{ border-color:var(--carrot); }
.dbk-stepinput.unset{ border-color:#E6C79E; background:#FFFBF3; }
.dbk-stepinput .si-btn{ width:28px; height:30px; border:none; border-radius:8px; background:var(--cream); color:var(--carrot-dark); font-size:19px; font-weight:700; line-height:1; cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-stepinput .si-btn:hover{ background:var(--carrot-light); }
.dbk-stepinput .si-mid{ display:flex; align-items:center; gap:3px; padding:0 4px; }
.dbk-stepinput .si-mid input{ width:34px; border:none; background:none; text-align:center; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:800; color:var(--ink); padding:0; }
.dbk-stepinput .si-mid input:focus{ outline:none; }
.dbk-stepinput .si-suf{ font-size:12.5px; color:var(--muted); font-weight:600; }
.dbk-stepinput.unset .si-suf{ color:#C39A5F; }
.c-rev{ text-align:right; }
.dbk-rev{ font-family:'Playfair Display',serif; font-size:18px; font-weight:900; color:var(--carrot-dark); white-space:nowrap; }
.dbk-rm{ width:26px; height:26px; border:none; border-radius:8px; background:none; color:var(--muted); font-size:19px; line-height:1; cursor:pointer; }
.dbk-rm:hover{ background:#FBEBE6; color:#B0532A; }

.dbk-add-size{ margin-top:10px; background:none; border:none; color:var(--carrot-dark); font-size:13.5px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; padding:4px 0; }
.dbk-add-size:hover{ text-decoration:underline; }
.dbk-add-comp{ align-self:flex-start; background:#fff; border:1.5px dashed #E7C9AE; border-radius:12px; padding:11px 18px; font-size:14px; font-weight:700; color:var(--carrot-dark); cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-add-comp:hover{ border-color:var(--carrot); }

/* per-component mini-timeline */
.dbk-mini{ margin-top:14px; border-top:1px dashed var(--border); padding-top:12px; }
.dbk-mini-head{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:8px; flex-wrap:wrap; }
.dbk-mini-title{ font-size:11px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:var(--muted); }
.dbk-mini-late{ font-size:11px; font-weight:800; letter-spacing:.03em; text-transform:uppercase; color:#fff; background:#C0392B; border-radius:100px; padding:3px 10px; }
.dbk-selbar{ font-size:12.5px; color:var(--ink); background:var(--carrot-light); border:1px solid #F0CBB4; border-radius:10px; padding:8px 12px; margin-bottom:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.dbk-selbar.muted{ background:var(--cream); border-color:var(--border); color:var(--muted); }
.dbk-selbench, .dbk-selcancel{ font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; border-radius:8px; padding:4px 11px; cursor:pointer; background:#fff; }
.dbk-selbench{ border:1.5px solid #D9C3AC; color:#9A6A3E; } .dbk-selbench:hover{ border-color:var(--carrot); color:var(--carrot-dark); }
.dbk-selcancel{ border:1.5px solid var(--border); color:var(--muted); }
.dbk-bench{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-bottom:10px; }
.dbk-bench-lbl{ font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-pill{ font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; background:#fff; border:1.5px solid; border-radius:100px; padding:5px 11px; cursor:pointer; }
.dbk-pill.sel{ box-shadow:0 0 0 2px rgba(232,100,44,.35); }
.dbk-pill.nocycle{ border-color:var(--border) !important; color:var(--muted) !important; background:#F6F0E8; border-style:dashed; cursor:default; }
.dbk-nocycle-note{ font-size:12px; color:var(--muted); font-style:italic; margin-bottom:10px; line-height:1.5; }
.dbk-months{ display:flex; gap:2px; }
.dbk-cell{ flex:1; min-width:0; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:var(--ink); background:var(--cream); border:1px solid var(--border); border-radius:7px; padding:6px 2px; text-align:center; cursor:default; }
.dbk-cell.target:not(.past):not(:disabled){ cursor:pointer; border-color:#E7C9AE; }
.dbk-cell.target:not(.past):not(:disabled):hover{ background:var(--carrot-light); border-color:var(--carrot); }
.dbk-cell.past{ color:#B8A88F; background:#F6F0E8; }
.dbk-bars{ position:relative; margin-top:14px; }
.dbk-today2{ position:absolute; top:-4px; bottom:-4px; width:2px; background:#1F3D2A; z-index:3; }
.dbk-today2 span{ position:absolute; top:-13px; left:50%; transform:translateX(-50%); font-size:8px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#1F3D2A; background:#fff; padding:0 3px; white-space:nowrap; }
.dbk-bar{ position:absolute; height:28px; border:1.5px solid; border-radius:7px; color:#fff; font-family:'DM Sans',sans-serif; cursor:pointer; display:flex; align-items:center; padding:0 8px; overflow:hidden; box-shadow:0 2px 6px -3px rgba(0,0,0,.35); }
.dbk-bar-lbl{ font-size:11px; font-weight:700; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,.25); }
.dbk-bar.late{ background:repeating-linear-gradient(45deg,#C0392B,#C0392B 6px,#A93226 6px,#A93226 12px); border-color:#8E2A20; color:#fff; }
.dbk-bar.offleft{ border-top-left-radius:0; border-bottom-left-radius:0; border-left:3px dashed #F6B7AD; }
.dbk-bar.sel{ box-shadow:0 0 0 2px rgba(26,18,8,.55); }
.dbk-bar-late{ font-size:8.5px; font-weight:800; letter-spacing:.03em; text-transform:uppercase; margin-left:7px; color:#FFE3DE; white-space:nowrap; }

/* save bar (inside the sticky header) */
.dbk-savebar{ display:flex; align-items:center; justify-content:flex-end; gap:12px; margin-top:11px; padding-top:10px; border-top:1px solid rgba(255,255,255,.16); }
.dbk-saveinfo{ font-size:12px; color:#CDE7D4; }
.dbk-savebtn{ font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:800; color:#1F3D2A; background:#EAF6ED; border:none; border-radius:9px; padding:6px 16px; cursor:pointer; }
.dbk-savebtn:disabled{ opacity:.5; cursor:default; }

/* combined timeline */
.dbk-combined{ margin-top:24px; background:#fff; border:1.5px solid var(--border); border-radius:18px; padding:18px; }
.dbk-combined-title{ font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--ink); margin:0; }
.dbk-combined-sub{ font-size:13.5px; color:var(--muted); margin:5px 0 0; line-height:1.5; max-width:640px; }
.dbk-offcal{ margin-top:12px; font-size:13px; font-weight:600; color:#9A5B00; background:#FBF0D6; border:1px solid #EAD6A0; border-radius:12px; padding:10px 14px; line-height:1.5; }
.dbk-cscroll{ position:relative; margin-top:14px; overflow-x:auto; overflow-y:hidden; padding-bottom:6px; }
.dbk-cmonths{ display:flex; }
.dbk-ccell{ flex:none; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:var(--ink); background:var(--cream); border:1px solid var(--border); border-radius:7px; margin-right:2px; padding:6px 2px; text-align:center; cursor:default; }
.dbk-ccell.target:not(.past):not(:disabled){ cursor:pointer; border-color:#E7C9AE; }
.dbk-ccell.target:not(.past):not(:disabled):hover{ background:var(--carrot-light); border-color:var(--carrot); }
.dbk-ccell.past{ color:#B8A88F; background:#F6F0E8; }
.dbk-cbars{ position:relative; margin-top:14px; }
.dbk-cbar{ position:absolute; height:26px; border:1.5px solid; border-radius:7px; color:#fff; font-family:'DM Sans',sans-serif; cursor:pointer; display:flex; align-items:center; gap:6px; padding:0 8px; overflow:hidden; box-shadow:0 2px 6px -3px rgba(0,0,0,.35); }
.dbk-cbar.late{ background:repeating-linear-gradient(45deg,#C0392B,#C0392B 6px,#A93226 6px,#A93226 12px); border-color:#8E2A20; }
.dbk-cbar.sel{ box-shadow:0 0 0 2px rgba(26,18,8,.55); }
.dbk-cmk{ flex:none; border:2px solid; border-radius:3px; background:rgba(255,255,255,.92); }
.dbk-cbar-lbl{ font-size:11px; font-weight:700; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,.25); }
.dbk-cbar-late{ font-size:8.5px; font-weight:800; letter-spacing:.03em; text-transform:uppercase; color:#FFE3DE; white-space:nowrap; }
.dbk-ctoday{ position:absolute; top:0; bottom:6px; width:2px; background:#1F3D2A; z-index:5; pointer-events:none; }
.dbk-ctoday span{ position:absolute; top:0; left:3px; font-size:8.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#fff; background:#1F3D2A; padding:1px 4px; border-radius:4px; white-space:nowrap; }
.dbk-ctoday.off{ opacity:.4; }

/* chip naming panel */
.dbk-panel{ position:fixed; right:20px; bottom:20px; width:300px; max-width:calc(100vw - 40px); background:#fff; border:1.5px solid var(--border); border-radius:16px; box-shadow:0 20px 50px -18px rgba(0,0,0,.45); padding:16px; z-index:80; }
.dbk-panel-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
.dbk-panel-title{ font-family:'Playfair Display',serif; font-size:18px; font-weight:700; }
.dbk-panel-x{ border:none; background:none; font-size:22px; line-height:1; color:var(--muted); cursor:pointer; }
.dbk-panel-facts{ border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:12px; }
.dbk-fact{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:7px 12px; border-bottom:1px solid var(--border); }
.dbk-fact:last-child{ border-bottom:none; }
.dbk-fact-l{ font-size:10.5px; letter-spacing:.04em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-fact-v{ font-size:13px; font-weight:700; color:var(--ink); text-align:right; }
.dbk-fact-late{ color:#C0392B; }
.dbk-panel-namelbl{ display:block; font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; font-weight:800; color:var(--carrot-dark); margin-bottom:5px; }
.dbk-panel-name{ width:100%; border:1.5px solid var(--border); border-radius:10px; background:#fff; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:var(--ink); padding:9px 11px; }
.dbk-panel-name:focus{ outline:none; border-color:var(--carrot); }
.dbk-panel-note{ font-size:11px; color:var(--muted); font-style:italic; line-height:1.45; margin-top:8px; }
.dbk-panel-actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
.dbk-panel-bench, .dbk-panel-done{ font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:700; border-radius:9px; padding:7px 14px; cursor:pointer; }
.dbk-panel-bench{ background:#fff; border:1.5px solid #D9C3AC; color:#9A6A3E; }
.dbk-panel-done{ background:linear-gradient(135deg,var(--carrot),#FF8A4C); border:none; color:#fff; }

.dbk-info{ position:relative; display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; border-radius:50%;
  border:1px solid #C9B49E; color:#9A8775; font-size:9px; font-style:italic; font-weight:700; cursor:help; font-family:Georgia,serif; text-transform:none; letter-spacing:0; }
.dbk-info .dbk-bub{ position:absolute; bottom:150%; left:0; transform:translateX(-8%); width:230px; background:var(--ink); color:#F7EFE6; font-size:11px;
  line-height:1.45; letter-spacing:0; text-transform:none; font-weight:500; padding:9px 11px; border-radius:8px; box-shadow:0 8px 20px -6px rgba(0,0,0,.5);
  opacity:0; visibility:hidden; transition:opacity .15s; z-index:6; pointer-events:none; }
.dbk-info:hover .dbk-bub, .dbk-info:focus .dbk-bub{ opacity:1; visibility:visible; }

.dbk-cta-wrap{ margin-top:22px; }
.dbk-cta{ width:100%; border:none; cursor:pointer; padding:15px 18px; border-radius:16px; color:#fff; font-family:'DM Sans',sans-serif;
  background:linear-gradient(135deg,var(--carrot),#FF8A4C); box-shadow:0 14px 30px -14px rgba(232,100,44,.7); transition:.18s;
  display:flex; flex-direction:column; align-items:center; gap:3px; }
.dbk-cta:hover{ transform:translateY(-1px); }
.dbk-cta-main{ font-size:17px; font-weight:700; display:flex; align-items:center; gap:8px; }
.dbk-cta-sub{ font-size:12.5px; font-weight:500; color:#FFE7D5; }

@media(min-width:760px){ .dbk-title{ font-size:34px; } .dbk-sub{ font-size:16px; } .dbk-grand-booked{ font-size:36px; } }
@media(max-width:720px){
  .dbk-grand{ position:static; }
  .dbk-rowhead{ display:none; }
  .dbk-row{ grid-template-columns:1fr 1fr; gap:9px 12px; }
  .c-label{ grid-column:1 / -1; }
  .c-rev{ text-align:left; }
}
`;
