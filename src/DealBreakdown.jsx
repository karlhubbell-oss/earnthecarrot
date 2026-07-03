import React, { useState, useEffect, useRef, useMemo } from "react";
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
  sizeIcon: {
    solo: { paths: ["M12 2 22 8.5v7L12 22 2 15.5v-7Z"], box: 18 },
    large: { paths: ["M6 3h12l3.5 5.5L12 22 2.5 8.5Z", "M2.5 8.5h19"], box: 18 },
    medium: { paths: ["M12 2 21 12l-9 10L3 12Z"], box: 16 },
    small: { paths: ["M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"], box: 13 },
  },
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
function sizeBucket(rank, total) {
  if (total <= 1) return "solo";
  const q = rank / (total - 1);
  if (q <= 0.34) return "large";
  if (q <= 0.67) return "medium";
  return "small";
}

function SizeIcon({ bucket, color }) {
  const spec = VISUAL.sizeIcon[bucket] || VISUAL.sizeIcon.medium;
  return (
    <svg width={spec.box} height={spec.box} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {spec.paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
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
  // v4 grouped components (carry a `sizes` array)
  if (Array.isArray(stored.components) && stored.components.some((c) => Array.isArray(c.sizes))) {
    return stored.components.map((c) => ({
      type: c.type || c.name || "",
      origin: c.origin || null,
      sizes: (Array.isArray(c.sizes) ? c.sizes : []).map((s) => ({
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
        .map((b) => ({ size: String(num(b.quota_per_deal)), quantity: num(b.count), cycle: "" })),
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
      byType.get(key).push({ size: String(sizeFromStored(t)), quantity: qty, cycle: t.cycle_months == null ? "" : String(t.cycle_months) });
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
  const withRowIds = (rows) => rows.map((r) => ({ id: `row-${rid++}`, size: r.size === "0" ? "" : r.size, quantity: r.quantity, cycle: r.cycle }));

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

function serialize(sections, ctx) {
  return {
    version: 4,
    target_pct: ctx.targetPct,
    stretch_pct: ctx.stretchPct,
    total_quota: ctx.totalQuota,
    components: sections.map((s) => ({
      type: s.type || null,
      origin: s.origin,
      quota: s.origin === "plan" ? s.quota : null,
      sizes: s.sizes.map((r) => ({ id: r.id, size: r.size === "" ? null : num(r.size), quantity: r.quantity, cycle_months: r.cycle === "" ? null : num(r.cycle) })),
    })),
  };
}

// ── small controls ─────────────────────────────────────────────────────────
function Stepper({ value, onChange }) {
  return (
    <div className="dbk-step">
      <button type="button" aria-label="One fewer deal" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="dbk-step-n">{value}</span>
      <button type="button" aria-label="One more deal" onClick={() => onChange(value + 1)}>+</button>
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

  const [sections, setSections] = useState(() => buildSections(plan, stored));
  const ids = useRef({ sec: sections.length, row: 0 });

  // ── persistence: debounced save on change, flush on navigate, no save of the
  // pristine plan-only-empty first render, no overwrite of a stored blob on load. ──
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const saveTimer = useRef(null);
  const pendingSave = useRef(null);
  const firstRender = useRef(true);
  const hadStored = useRef(!!(stored && (Array.isArray(stored.components) || Array.isArray(stored.tiers))));

  const totalRows = sections.reduce((n, s) => n + s.sizes.length, 0);
  useEffect(() => {
    const obj = serialize(sections, { targetPct, stretchPct, totalQuota });
    pendingSave.current = obj;
    if (firstRender.current) {
      firstRender.current = false;
      if (hadStored.current || totalRows === 0) { pendingSave.current = null; return; }
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (pendingSave.current) { onPersistRef.current(pendingSave.current); pendingSave.current = null; }
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [sections, targetPct, stretchPct, totalQuota]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (pendingSave.current) { onPersistRef.current(pendingSave.current); pendingSave.current = null; }
  }, []);

  // ── edit helpers ───────────────────────────────────────────────────────
  const patchSection = (sid, patch) => setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const patchRow = (sid, rid, patch) => setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, sizes: s.sizes.map((r) => (r.id === rid ? { ...r, ...patch } : r)) } : s)));
  const addRow = (sid) => setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, sizes: [...s.sizes, { id: `row-${ids.current.row++}`, size: "", quantity: 0, cycle: "" }] } : s)));
  const removeRow = (sid, rid) => setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, sizes: s.sizes.filter((r) => r.id !== rid) } : s)));
  const addComponent = () => setSections((ss) => [...ss, { id: `sec-${ids.current.sec++}`, type: "", origin: "custom", quota: null, sizes: [] }]);
  const removeComponent = (sid) => setSections((ss) => ss.filter((s) => s.id !== sid));

  // ── derived math ───────────────────────────────────────────────────────
  const rowRevenue = (r) => num(r.size) * r.quantity;
  const sectionRevenue = (s) => s.sizes.reduce((n, r) => n + rowRevenue(r), 0);
  // Plan revenue drives the meter and reconciliation. Custom revenue is tracked
  // separately so it never breaks the plan based math.
  const planRevenue = sections.filter((s) => s.origin === "plan").reduce((n, s) => n + sectionRevenue(s), 0);
  const customRevenue = sections.filter((s) => s.origin === "custom").reduce((n, s) => n + sectionRevenue(s), 0);
  const met = stretchQuota > 0 && planRevenue >= stretchQuota - 0.5;
  const gap = stretchQuota - planRevenue;

  const typeOptions = useMemo(() => sections.filter((s) => s.origin === "plan").map((s) => s.type), [sections]);

  const renderSection = (s) => {
    const st = typeStyle(s.type, s.origin);
    const order = [...s.sizes].sort((a, b) => num(b.size) - num(a.size));
    const rank = {}; order.forEach((r, i) => { rank[r.id] = i; });
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
            <span className="c-ic" />
            <span className="c-size">Deal Size <InfoDot text="The amount of each deal that counts toward your quota, not necessarily the full contract value. All of the deal count math runs on this number." /></span>
            <span className="c-qty">Deal Quantity</span>
            <span className="c-cycle">Sales Cycle Length</span>
            <span className="c-rev">Total Revenue</span>
            <span className="c-rm" />
          </div>
        )}

        {s.sizes.map((r) => (
          <div key={r.id} className="dbk-row">
            <span className="c-ic"><SizeIcon bucket={sizeBucket(rank[r.id] || 0, s.sizes.length)} color={st.fg} /></span>
            <div className="c-size">
              <input className="dbk-field money" type="text" inputMode="numeric" placeholder="Deal size"
                value={moneyDisplay(r.size)} onChange={(e) => patchRow(s.id, r.id, { size: digitsOf(e.target.value) })} />
            </div>
            <div className="c-qty"><Stepper value={r.quantity} onChange={(v) => patchRow(s.id, r.id, { quantity: v })} /></div>
            <div className="c-cycle">
              <div className="dbk-cycle">
                <input type="text" inputMode="numeric" placeholder="0" value={digitsOf(r.cycle)} onChange={(e) => patchRow(s.id, r.id, { cycle: digitsOf(e.target.value) })} />
                <span className="dbk-cycle-suf">mo</span>
              </div>
            </div>
            <div className="c-rev"><span className="dbk-rev" title={`${r.quantity} × ${fmt(num(r.size))}`}>{fmt(rowRevenue(r))}</span></div>
            <div className="c-rm"><button type="button" className="dbk-rm" aria-label="Remove this size" onClick={() => removeRow(s.id, r.id)}>×</button></div>
          </div>
        ))}

        <button className="dbk-add-size" type="button" onClick={() => addRow(s.id)}>Add a size</button>
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
      </div>

      {/* SECTIONS */}
      <div className="dbk-secs">
        {sections.map(renderSection)}
        <button className="dbk-add-comp" type="button" onClick={addComponent}>Add a component</button>
      </div>

      <div className="dbk-cta-wrap">
        <button className="dbk-cta" onClick={() => onContinue({ sections, planRevenue, customRevenue })}>
          <span className="dbk-cta-main">Place these deals across the year <span aria-hidden>→</span></span>
          <span className="dbk-cta-sub">Next we will lay these deals across your year</span>
        </button>
      </div>
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

.dbk-rowhead, .dbk-row{ display:grid; grid-template-columns:26px minmax(120px,1fr) 126px minmax(104px,0.8fr) minmax(110px,1fr) 32px; gap:12px; align-items:center; }
.dbk-rowhead{ padding:8px 4px 6px; border-bottom:1px solid var(--border); margin-top:6px; }
.dbk-rowhead span{ font-size:10px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-rowhead .c-rev{ text-align:right; }
.dbk-row{ padding:8px 4px; border-bottom:1px solid var(--border); }
.c-ic{ display:flex; align-items:center; justify-content:center; }

.dbk-field{ border:1.5px solid var(--border); border-radius:10px; background:#fff; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--ink); padding:9px 11px; width:100%; }
.dbk-field:focus{ outline:none; border-color:var(--carrot); }
.dbk-field.money{ font-weight:700; }
.dbk-step{ display:flex; align-items:center; gap:3px; border:1.5px solid var(--border); border-radius:10px; background:#fff; padding:3px; width:fit-content; }
.dbk-step button{ width:30px; height:30px; border:none; border-radius:8px; background:var(--cream); color:var(--carrot-dark); font-size:19px; font-weight:700; line-height:1; cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-step button:hover{ background:var(--carrot-light); }
.dbk-step-n{ min-width:34px; text-align:center; font-size:16px; font-weight:800; color:var(--ink); }
.dbk-cycle{ display:flex; align-items:center; gap:6px; border:1.5px solid var(--border); border-radius:10px; background:#fff; padding:0 11px; width:fit-content; }
.dbk-cycle:focus-within{ border-color:var(--carrot); }
.dbk-cycle input{ border:none; background:none; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:var(--ink); width:34px; padding:9px 0; }
.dbk-cycle input:focus{ outline:none; }
.dbk-cycle-suf{ font-size:13px; color:var(--muted); font-weight:600; }
.c-rev{ text-align:right; }
.dbk-rev{ font-family:'Playfair Display',serif; font-size:18px; font-weight:900; color:var(--carrot-dark); white-space:nowrap; }
.dbk-rm{ width:26px; height:26px; border:none; border-radius:8px; background:none; color:var(--muted); font-size:19px; line-height:1; cursor:pointer; }
.dbk-rm:hover{ background:#FBEBE6; color:#B0532A; }

.dbk-add-size{ margin-top:10px; background:none; border:none; color:var(--carrot-dark); font-size:13.5px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; padding:4px 0; }
.dbk-add-size:hover{ text-decoration:underline; }
.dbk-add-comp{ align-self:flex-start; background:#fff; border:1.5px dashed #E7C9AE; border-radius:12px; padding:11px 18px; font-size:14px; font-weight:700; color:var(--carrot-dark); cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-add-comp:hover{ border-color:var(--carrot); }

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
  .dbk-row{ grid-template-columns:26px 1fr 1fr; gap:9px 12px; }
  .c-rev{ text-align:left; }
}
`;
