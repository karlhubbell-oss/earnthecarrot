import React, { useState, useEffect, useRef, useMemo } from "react";
import { toEarningsPlan } from "./lib/planAdapter.js";

/*
  DealBreakdown - Strategy Step 2, deal tiers as a compact table.

  One row per tier (a tier is a deal type: New Logo, Expansion, Renewal, and so on).
  Rows stay compact so every tier is visible together with the running stretch total.
  Four columns per row: Deal Size (a single dollar amount), Deal Quantity (a stepper),
  Sales Cycle Length (whole months, stored for a later build), and Total Revenue
  (Deal Size times Deal Quantity).

  We reuse the real plan and engine: totalQuota comes from toEarningsPlan, and
  everything measures toward the rep's STRETCH quota (totalQuota times stretch %), with
  TARGET shown as a milestone tick.

  This is planning data, not the penny exact comp math, and it feeds a later timeline.

  Props:
    plan, targetPct, stretchPct   -> the rep's real plan and goals
    stored                        -> persisted deal_plan (v3 tiers, or an older blob)
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

// Round to a sensible planning step for its magnitude (used only when we have to
// collapse an old range down to a single midpoint size).
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

// ── visual system: ONE config map, so a different plan's tiers and components flow
// through with no code change. Icon by tier RANK (size), color by type tag. ─────────
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
    _default: { fg: "#7A6A55", chipBg: "#F1EADF", chipBd: "#E0D2BF" },
  },
};
const typeStyle = (type) => VISUAL.typeColor[type] || VISUAL.typeColor._default;
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

function InfoDot({ text }) {
  return (
    <span className="dbk-info" tabIndex={0} aria-label={text}>
      i<span className="dbk-bub">{text}</span>
    </span>
  );
}

// ── tier models ────────────────────────────────────────────────────────────
function freshTier(id, type) {
  return { id, type: type || "", size: "", quantity: 0, cycle: "" };
}

// Resolve a stored tier of any past shape down to a single size. v3 carries `size`
// directly; the older range shape carried typical_size (or size_low/size_high, which
// we collapse to their midpoint).
function sizeFromStored(t) {
  if (t.size != null && t.size !== "") return num(t.size);
  if (t.typical_size != null) return num(t.typical_size);
  const lo = t.size_low, hi = t.size_high;
  if (lo != null && hi != null) return niceRound((num(lo) + num(hi)) / 2);
  if (lo != null) return num(lo);
  if (hi != null) return num(hi);
  return 0;
}

// Build the editable tier list, preferring the rep's SAVED plan. Paths:
//  1. blob with tiers -> load, collapsing any old range to a single size. When the
//     blob is the older range shape we treat the load as a conversion and drop
//     zero-quantity tiers; a native v3 blob keeps the rep's rows as they are.
//  2. old v1 blob with components/bands -> one tier per real band (size and quantity
//     both present), tagged with its component. Drops zero-quantity bands.
//  3. nothing usable -> start blank. We do not invent tiers the plan cannot ground.
function buildTiers(plan, targetPct, stretchPct, stored) {
  if (stored && Array.isArray(stored.tiers)) {
    const isRangeBlob = stored.tiers.some((t) => t.size == null && (t.typical_size != null || t.size_low != null || t.size_high != null));
    const out = [];
    for (const t of stored.tiers) {
      const size = sizeFromStored(t);
      const qty = Number.isFinite(Number(t.quantity)) ? Number(t.quantity) : 0;
      if (isRangeBlob && qty <= 0) continue;
      out.push({
        id: `tier-${out.length}`,
        type: t.type || "",
        size: size ? String(size) : "",
        quantity: qty,
        cycle: t.cycle_months == null ? "" : String(t.cycle_months),
      });
    }
    return out;
  }
  if (stored && Array.isArray(stored.components)) {
    const out = [];
    for (const c of stored.components) {
      for (const b of Array.isArray(c.bands) ? c.bands : []) {
        const s = num(b.quota_per_deal);
        const qty = num(b.count);
        if (s <= 0 || qty <= 0) continue;
        out.push({ id: `tier-${out.length}`, type: c.name || "", size: String(s), quantity: qty, cycle: "" });
      }
    }
    return out;
  }
  return [];
}

// The persisted shape (v3). A flat tier list; each tier is { id, type, size, quantity,
// cycle_months }. Structured so a later timeline can expand each tier into `quantity`
// individual deals carrying size, cycle, and type.
function serialize(tiers, ctx) {
  return {
    version: 3,
    target_pct: ctx.targetPct,
    stretch_pct: ctx.stretchPct,
    total_quota: ctx.totalQuota,
    tiers: tiers.map((t) => ({
      id: t.id,
      type: t.type || null,
      size: t.size === "" ? null : num(t.size),
      quantity: t.quantity,
      cycle_months: t.cycle === "" ? null : num(t.cycle),
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
          <div className="dbk-tick" style={{ left: tickFrac * 100 + "%" }}>
            <span className="dbk-tick-lbl">Target</span>
          </div>
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

  const typeOptions = useMemo(() => {
    const names = (plan && plan.quota && Array.isArray(plan.quota.components) ? plan.quota.components : [])
      .map((c) => c && c.name).filter(Boolean);
    return [...new Set(names)];
  }, [plan]);

  const [tiers, setTiers] = useState(() => buildTiers(plan, targetPct, stretchPct, stored));
  const idCounter = useRef(tiers.length);

  // ── persistence: debounced save on change, flush on navigate away, backward
  // compatible loads. No auto-save of a blank first render, and no overwrite of a
  // stored blob until the rep actually edits. ──
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const saveTimer = useRef(null);
  const pendingSave = useRef(null);
  const firstRender = useRef(true);
  const hadStored = useRef(!!(stored && (Array.isArray(stored.tiers) || Array.isArray(stored.components))));

  useEffect(() => {
    const obj = serialize(tiers, { targetPct, stretchPct, totalQuota });
    pendingSave.current = obj;
    if (firstRender.current) {
      firstRender.current = false;
      if (hadStored.current || tiers.length === 0) { pendingSave.current = null; return; }
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (pendingSave.current) { onPersistRef.current(pendingSave.current); pendingSave.current = null; }
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [tiers, targetPct, stretchPct, totalQuota]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (pendingSave.current) { onPersistRef.current(pendingSave.current); pendingSave.current = null; }
  }, []);

  // ── edit helpers ───────────────────────────────────────────────────────
  const patchTier = (id, patch) => setTiers((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const addTier = () => {
    const id = `tier-${idCounter.current++}`;
    setTiers((ts) => [...ts, freshTier(id, typeOptions[0] || "")]);
  };
  const removeTier = (id) => setTiers((ts) => ts.filter((t) => t.id !== id));

  // ── derived math ───────────────────────────────────────────────────────
  const revenueOf = (t) => num(t.size) * t.quantity;
  const grandBooked = tiers.reduce((s, t) => s + revenueOf(t), 0);
  const grandMet = stretchQuota > 0 && grandBooked >= stretchQuota - 0.5;
  const gap = stretchQuota - grandBooked;

  const rankById = useMemo(() => {
    const order = [...tiers].sort((a, b) => num(b.size) - num(a.size));
    const m = {};
    order.forEach((t, i) => { m[t.id] = i; });
    return m;
  }, [tiers]);

  return (
    <div className="dbk-root">
      <style>{CSS}</style>

      <div className="dbk-head">
        <div className="dbk-crumb">Strategy · Step 2</div>
        <h1 className="dbk-title">Set Up Your Deal Tiers</h1>
        <p className="dbk-sub">
          Let's lay out the deals behind your stretch number. Add a row for each kind of deal you run, set the size, how
          many you expect, and roughly how long each takes to close. We keep the running total against your stretch quota
          in view, with your target marked along the way. These are planning estimates, not penny exact comp math.
        </p>
      </div>

      {/* GRAND TOTAL: sum of all tiers vs the rep's stretch quota, kept in view */}
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
            <div className="dbk-grand-booked">{fmt(grandBooked)}</div>
            <div className="dbk-grand-cap">across your tiers</div>
          </div>
        </div>
        <Meter booked={grandBooked} target={stretchQuota} tickFrac={tickFrac} />
        <div className="dbk-recon">
          {tiers.length === 0 ? (
            <>Add your rows below and we will track them against your stretch quota of <b>{fmt(stretchQuota)}</b>.</>
          ) : grandMet ? (
            <>Your tiers cover your stretch quota, with <b>{fmt(grandBooked - stretchQuota)}</b> to spare.</>
          ) : (
            <>Your tiers add up to <b>{fmt(grandBooked)}</b>. That leaves <b>{fmt(gap)}</b> to go before we reach stretch.</>
          )}
        </div>
      </div>

      {/* TIER TABLE */}
      {tiers.length === 0 ? (
        <div className="dbk-empty">
          <div className="dbk-empty-h">No tiers yet</div>
          <p>We do not have enough in your plan to fill these in for you, so let's build them together. Add a row for each size of deal you tend to run.</p>
          <button className="dbk-add big" type="button" onClick={addTier}>Add your first tier</button>
        </div>
      ) : (
        <div className="dbk-tbl">
          <div className="dbk-tbl-head">
            <span className="c-type">Deal type</span>
            <span className="c-size">Deal Size <InfoDot text="The amount of each deal that counts toward your quota, not necessarily the full contract value. All of the deal count math runs on this number." /></span>
            <span className="c-qty">Deal Quantity</span>
            <span className="c-cycle">Sales Cycle Length</span>
            <span className="c-rev">Total Revenue</span>
            <span className="c-rm" />
          </div>

          {tiers.map((t) => {
            const st = typeStyle(t.type);
            const bucket = sizeBucket(rankById[t.id] || 0, tiers.length);
            return (
              <div key={t.id} className="dbk-row" style={{ borderLeft: `3px solid ${st.fg}` }}>
                <div className="dbk-typecell">
                  <span className="dbk-ico"><SizeIcon bucket={bucket} color={st.fg} /></span>
                  <select className="dbk-type" value={t.type} onChange={(e) => patchTier(t.id, { type: e.target.value })}
                    style={{ color: st.fg, background: st.chipBg, borderColor: st.chipBd }}>
                    <option value="">Untagged</option>
                    {typeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                    {t.type && !typeOptions.includes(t.type) ? <option value={t.type}>{t.type}</option> : null}
                  </select>
                </div>

                <div className="c-size">
                  <input className="dbk-field money" type="text" inputMode="numeric" placeholder="Deal size"
                    value={moneyDisplay(t.size)} onChange={(e) => patchTier(t.id, { size: digitsOf(e.target.value) })} />
                </div>

                <div className="c-qty">
                  <Stepper value={t.quantity} onChange={(v) => patchTier(t.id, { quantity: v })} />
                </div>

                <div className="c-cycle">
                  <div className="dbk-cycle">
                    <input type="text" inputMode="numeric" placeholder="0"
                      value={digitsOf(t.cycle)} onChange={(e) => patchTier(t.id, { cycle: digitsOf(e.target.value) })} />
                    <span className="dbk-cycle-suf">mo</span>
                  </div>
                </div>

                <div className="c-rev">
                  <span className="dbk-rev" title={`${t.quantity} × ${fmt(num(t.size))}`}>{fmt(revenueOf(t))}</span>
                </div>

                <div className="c-rm">
                  <button type="button" className="dbk-rm" aria-label="Remove this tier" onClick={() => removeTier(t.id)}>×</button>
                </div>
              </div>
            );
          })}

          <button className="dbk-add" type="button" onClick={addTier}>Add a tier</button>
        </div>
      )}

      <div className="dbk-cta-wrap">
        <button className="dbk-cta" onClick={() => onContinue({ tiers, grandBooked })}>
          <span className="dbk-cta-main">Place these deals across the year <span aria-hidden>→</span></span>
          <span className="dbk-cta-sub">Next we will lay these deals across your year</span>
        </button>
      </div>
    </div>
  );
}

// ── scoped styles (laptop-first; base rules are the phone fallback) ─────────
const CSS = `
.dbk-root{ font-family:'DM Sans',sans-serif; color:var(--ink); }
.dbk-root *{ box-sizing:border-box; }

.dbk-head{ margin-bottom:18px; }
.dbk-crumb{ font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--carrot-dark); font-weight:700; }
.dbk-title{ font-family:'Playfair Display',serif; font-size:28px; font-weight:900; line-height:1.1; margin:6px 0 0; color:var(--ink); }
.dbk-sub{ font-size:15px; color:var(--muted); margin-top:8px; line-height:1.5; max-width:760px; }

/* grand total, sticky so the running stretch total stays in view */
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

.dbk-meter{ margin-top:11px; }
.dbk-track{ position:relative; height:14px; border-radius:999px; background:rgba(255,255,255,.18); }
.dbk-fill{ position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:linear-gradient(90deg,var(--gold),var(--carrot)); transition:width .35s ease; }
.dbk-fill.met{ background:linear-gradient(90deg,#7BD493,#B7F0C6); }
.dbk-tick{ position:absolute; top:-5px; bottom:-5px; width:2px; background:rgba(255,255,255,.7); transform:translateX(-50%); }
.dbk-tick-lbl{ position:absolute; top:-16px; left:50%; transform:translateX(-50%); font-size:8.5px; letter-spacing:.06em; text-transform:uppercase; font-weight:800; color:rgba(255,255,255,.85); white-space:nowrap; }

/* empty state */
.dbk-empty{ background:#fff; border:1.5px dashed #E7C9AE; border-radius:18px; padding:24px; text-align:center; margin-bottom:20px; }
.dbk-empty-h{ font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--ink); }
.dbk-empty p{ font-size:14px; color:var(--muted); line-height:1.55; max-width:520px; margin:8px auto 16px; }

/* table */
.dbk-tbl{ background:#fff; border:1.5px solid var(--border); border-radius:16px; padding:6px 14px 14px; }
.dbk-tbl-head, .dbk-row{ display:grid; grid-template-columns:minmax(150px,1.3fr) minmax(120px,1fr) 128px minmax(104px,0.8fr) minmax(112px,1fr) 34px; gap:14px; align-items:center; }
.dbk-tbl-head{ padding:10px 6px 8px; border-bottom:1px solid var(--border); }
.dbk-tbl-head span{ font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-tbl-head .c-rev{ text-align:right; }
.dbk-row{ padding:9px 6px; border-bottom:1px solid var(--border); }
.dbk-row:last-of-type{ border-bottom:none; }

.dbk-typecell{ display:flex; align-items:center; gap:8px; min-width:0; }
.dbk-ico{ display:flex; align-items:center; flex:none; }
.dbk-type{ font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:700; border:1.5px solid; border-radius:100px; padding:5px 10px; cursor:pointer; appearance:none; min-width:0; }
.dbk-type:focus{ outline:none; }

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
.dbk-rm{ width:28px; height:28px; border:none; border-radius:8px; background:none; color:var(--muted); font-size:20px; line-height:1; cursor:pointer; }
.dbk-rm:hover{ background:#FBEBE6; color:#B0532A; }

.dbk-add{ margin-top:12px; background:#fff; border:1.5px dashed #E7C9AE; border-radius:12px; padding:10px 16px; font-size:14px; font-weight:700; color:var(--carrot-dark); cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-add:hover{ border-color:var(--carrot); }
.dbk-add.big{ background:linear-gradient(135deg,var(--carrot),#FF8A4C); color:#fff; border:none; padding:13px 22px; font-size:15px; }

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

@media(min-width:760px){
  .dbk-title{ font-size:34px; }
  .dbk-sub{ font-size:16px; }
  .dbk-grand-booked{ font-size:36px; }
}
/* phone: the grid would be too tight, so let each row wrap into a stacked block */
@media(max-width:720px){
  .dbk-grand{ position:static; }
  .dbk-tbl-head{ display:none; }
  .dbk-row{ grid-template-columns:1fr 1fr; gap:10px 14px; }
  .dbk-typecell{ grid-column:1 / -1; }
  .c-rev{ text-align:left; }
}
`;
