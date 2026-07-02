import React, { useState, useEffect, useRef, useMemo } from "react";
import { toEarningsPlan } from "./lib/planAdapter.js";

/*
  DealBreakdown - Strategy Step 2, tier setup.

  The evolution of the old big/medium/small deal breakdown. Tiers are now flexible
  (1 to many), a tier is defined by SIZE plus CYCLE, and deal type (New Logo /
  Expansion / Renewal) is a tag a tier carries, not the axis that organizes tiers.

  We reuse the real plan and engine: totalQuota comes from toEarningsPlan (the same
  adapter the payout curve and goals screens use), and everything measures toward the
  rep's STRETCH quota (totalQuota x stretch%), with TARGET shown as a milestone.

  This build is the clean data foundation the planning timeline sits on later. It does
  NOT build the timeline, quarter placement, or deal dependencies.

  Props:
    plan        -> the rep's real comp plan (get-plan shape)
    targetPct   -> rep's target attainment %  (default 110)
    stretchPct  -> rep's stretch attainment % (default 150), the finish line
    stored      -> the persisted deal_plan (v2 tiers, or old v1 component/band blob)
    onPersist(obj) -> save the structured deal_plan (debounced by the caller pattern)
    onBack()    -> back to Step 1 (goals)
    onContinue()-> the "place these deals across the year" CTA (planner, a later build)
*/

// ── formatting: all money routes through fmt, no hardcoded currency ─────────
const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
const digitsOf = (s) => String(s == null ? "" : s).replace(/[^\d]/g, "");
const num = (s) => Number(digitsOf(s)) || 0;
const moneyDisplay = (s) => {
  const d = digitsOf(s);
  return d ? fmt(Number(d)) : "";
};

// Round to a sensible planning step for its magnitude. These are estimates, so a
// derived range reads as "$280k to $420k", never "$281,930 to $418,070".
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
// through with no code change. Icon is chosen by tier RANK (size), color by type. ──
const VISUAL = {
  // size buckets, assigned by a tier's rank among its siblings (largest -> "large").
  sizeIcon: {
    solo: { paths: ["M12 2 22 8.5v7L12 22 2 15.5v-7Z", "M12 2v20", "M2 8.5 12 15l10-6.5"], box: 24 }, // hexagon prism, lone tier
    large: { paths: ["M6 3h12l3.5 5.5L12 22 2.5 8.5Z", "M2.5 8.5h19", "M9.5 3 7 8.5 12 22l5-13.5L14.5 3"], box: 24 }, // gem
    medium: { paths: ["M12 2 21 12l-9 10L3 12Z"], box: 22 }, // diamond
    small: { paths: ["M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"], box: 18 }, // circle
  },
  // type colors, legible + distinct. Unknown types fall to _default. Karl adjusts live.
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
// Bucket a tier by its rank (0 = largest) among `total` tiers. Any tier count flows
// through: a lone tier is "solo", otherwise the rank position picks large/medium/small.
function sizeBucket(rank, total) {
  if (total <= 1) return "solo";
  const q = rank / (total - 1); // 0 (largest) .. 1 (smallest)
  if (q <= 0.34) return "large";
  if (q <= 0.67) return "medium";
  return "small";
}

function SizeIcon({ bucket, color }) {
  const spec = VISUAL.sizeIcon[bucket] || VISUAL.sizeIcon.medium;
  return (
    <svg width={spec.box} height={spec.box} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
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
// A tier's UI shape. Money fields carry raw digit strings (for the input display);
// quantity is a number; cycle is a string ("" means not yet set).
function freshTier(id, type) {
  return { id, type: type || "", low: "", high: "", typical: "", quantity: 0, cycle: "", typicalTouched: false };
}

// Build the editable tier list, preferring the rep's SAVED plan. Three paths:
//  1. v2 blob with tiers -> load directly (fill any missing fields).
//  2. old v1 blob with components/bands -> convert each real band (size > 0) into a
//     tier tagged with its component. Range derived from the single size; cycle unset
//     so we can surface it as needing input. Backward compatible, nothing crashes.
//  3. nothing usable -> propose only if the plan grounds tiers; today it does not, so
//     we start blank and let the rep build tiers. No invented defaults.
function buildTiers(plan, targetPct, stretchPct, stored) {
  if (stored && Array.isArray(stored.tiers)) {
    return stored.tiers.map((t, i) => ({
      id: t.id || `tier-${i}`,
      type: t.type || "",
      low: t.size_low != null ? String(t.size_low) : "",
      high: t.size_high != null ? String(t.size_high) : "",
      typical: t.typical_size != null ? String(t.typical_size) : "",
      quantity: Number.isFinite(Number(t.quantity)) ? Number(t.quantity) : 0,
      cycle: t.cycle_months == null ? "" : String(t.cycle_months),
      typicalTouched: true,
    }));
  }
  if (stored && Array.isArray(stored.components)) {
    const tiers = [];
    let i = 0;
    for (const c of stored.components) {
      for (const b of Array.isArray(c.bands) ? c.bands : []) {
        const s = num(b.quota_per_deal);
        if (s <= 0) continue; // no size means it was never a real deal definition
        tiers.push({
          id: `tier-${i++}`,
          type: c.name || "",
          low: String(niceRound(s * 0.8)),
          high: String(niceRound(s * 1.2)),
          typical: String(s),
          quantity: num(b.count),
          cycle: "", // old blobs have no cycle; surfaced as needing input
          typicalTouched: true,
        });
      }
    }
    return tiers;
  }
  return proposeTiers(plan, targetPct, stretchPct);
}

// Propose tiers ONLY when the plan grounds them (real deal-size data). The structured
// facts we have today carry component quotas and rates, not deal sizes, so there is
// nothing to ground a tier's size or count. We return blank rather than invent numbers.
function proposeTiers(/* plan, targetPct, stretchPct */) {
  return [];
}

// The persisted shape (v2). A flat tier list, each tier standing on its own. Structured
// so a later timeline can expand each tier into `quantity` individual deals carrying
// size (typical), cycle, and type.
function serialize(tiers, ctx) {
  return {
    version: 2,
    target_pct: ctx.targetPct,
    stretch_pct: ctx.stretchPct,
    total_quota: ctx.totalQuota,
    tiers: tiers.map((t) => ({
      id: t.id,
      type: t.type || null,
      size_low: t.low === "" ? null : num(t.low),
      size_high: t.high === "" ? null : num(t.high),
      typical_size: num(t.typical),
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

// Draggable "typical" thumb bounded by the tier's low and high. Typical is the number
// all the deal count math runs on; the range is display and agreement only.
function TypicalSlider({ low, high, value, onChange }) {
  const trackRef = useRef(null);
  const active = high > low;
  const frac = active ? Math.min(Math.max((value - low) / (high - low), 0), 1) : 0;
  const fromX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.min(Math.max(f, 0), 1);
    return niceRound(low + f * (high - low));
  };
  const dragging = useRef(false);
  const down = (e) => { if (!active) return; e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; onChange(fromX(e.clientX)); };
  const move = (e) => { if (dragging.current) onChange(fromX(e.clientX)); };
  const up = (e) => { dragging.current = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} };
  return (
    <div className={`dbk-slider${active ? "" : " off"}`} ref={trackRef} onPointerDown={down} onPointerMove={move} onPointerUp={up}>
      <div className="dbk-slider-fill" style={{ width: frac * 100 + "%" }} />
      <div className="dbk-slider-thumb" style={{ left: frac * 100 + "%" }} />
    </div>
  );
}

// ── meter ──────────────────────────────────────────────────────────────────
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

  // Type options come from the plan's own components, so tagging flows through per plan.
  const typeOptions = useMemo(() => {
    const names = (plan && plan.quota && Array.isArray(plan.quota.components) ? plan.quota.components : [])
      .map((c) => c && c.name).filter(Boolean);
    return [...new Set(names)];
  }, [plan]);

  const [tiers, setTiers] = useState(() => buildTiers(plan, targetPct, stretchPct, stored));
  const idCounter = useRef(tiers.length);

  // ── persistence: same pattern as before. Debounced save on change, flush on
  // navigate away, backward compatible loads. We do NOT auto-save an empty first
  // render, and we do NOT overwrite a stored blob until the rep actually edits. ──
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
      // Skip the initial save when we loaded stored data (nothing new) or when there is
      // nothing to save yet (a fresh, blank screen).
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
  const editBound = (id, field, rawDigits) => {
    setTiers((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, [field]: rawDigits };
      // Typical defaults to the midpoint until the rep sets it themselves.
      if ((field === "low" || field === "high") && !next.typicalTouched) {
        const lo = num(next.low), hi = num(next.high);
        if (lo > 0 && hi > 0) next.typical = String(niceRound((lo + hi) / 2));
      }
      return next;
    }));
  };
  const setTypical = (id, v) => patchTier(id, { typical: String(v), typicalTouched: true });
  const addTier = () => {
    const id = `tier-${idCounter.current++}`;
    setTiers((ts) => [...ts, freshTier(id, typeOptions[0] || "")]);
  };
  const removeTier = (id) => setTiers((ts) => ts.filter((t) => t.id !== id));

  // ── derived math ───────────────────────────────────────────────────────
  const retiresOf = (t) => num(t.typical) * t.quantity;
  const grandBooked = tiers.reduce((s, t) => s + retiresOf(t), 0);
  const grandMet = stretchQuota > 0 && grandBooked >= stretchQuota - 0.5;
  const gap = stretchQuota - grandBooked;

  // Ranks for the size icon: largest typical size -> rank 0.
  const rankById = useMemo(() => {
    const order = [...tiers].sort((a, b) => num(b.typical) - num(a.typical));
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
          Let's shape the deals behind your stretch number. Group them into tiers by size, tell us how many of each you
          expect to close, and roughly how long each one takes. We measure it all against your stretch quota, with your
          target marked along the way. These are planning estimates, not penny exact comp math.
        </p>
      </div>

      {/* GRAND TOTAL: sum of all tiers vs the rep's stretch quota */}
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
            <>Add your tiers below and we will track them against your stretch quota of <b>{fmt(stretchQuota)}</b>.</>
          ) : grandMet ? (
            <>Your tiers cover your stretch quota, with <b>{fmt(grandBooked - stretchQuota)}</b> to spare.</>
          ) : (
            <>Your tiers add up to <b>{fmt(grandBooked)}</b>. That leaves <b>{fmt(gap)}</b> to go before we reach stretch.</>
          )}
        </div>
      </div>

      {/* TIERS */}
      {tiers.length === 0 ? (
        <div className="dbk-empty">
          <div className="dbk-empty-h">No tiers yet</div>
          <p>
            We do not have enough in your plan to guess your deal tiers, so let's build them together. Add a tier for each
            size of deal you tend to run, from your biggest to your smallest.
          </p>
          <button className="dbk-add big" type="button" onClick={addTier}>Add your first tier</button>
        </div>
      ) : (
        <div className="dbk-tiers">
          {tiers.map((t) => {
            const st = typeStyle(t.type);
            const bucket = sizeBucket(rankById[t.id] || 0, tiers.length);
            const cycleUnset = t.cycle === "";
            return (
              <div key={t.id} className="dbk-tier" style={{ borderLeft: `4px solid ${st.fg}` }}>
                <div className="dbk-tier-head">
                  <span className="dbk-tier-ico" style={{ color: st.fg }}><SizeIcon bucket={bucket} color={st.fg} /></span>
                  <select
                    className="dbk-type"
                    value={t.type}
                    onChange={(e) => patchTier(t.id, { type: e.target.value })}
                    style={{ color: st.fg, background: st.chipBg, borderColor: st.chipBd }}
                  >
                    <option value="">Untagged</option>
                    {typeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                    {t.type && !typeOptions.includes(t.type) ? <option value={t.type}>{t.type}</option> : null}
                  </select>
                  <span className="dbk-tier-cap" style={{ color: st.fg }}>{bucket === "solo" ? "Your deals" : `${bucket[0].toUpperCase()}${bucket.slice(1)} deals`}</span>
                  <button type="button" className="dbk-remove" aria-label="Remove this tier" onClick={() => removeTier(t.id)}>Remove</button>
                </div>

                {/* deal size: range plus draggable typical (typical drives the math) */}
                <div className="dbk-size">
                  <div className="dbk-size-lbl">
                    Deal size range
                    <span className="dbk-size-help">the low and high of a deal in this tier</span>
                  </div>
                  <div className="dbk-range">
                    <input className="dbk-field money" type="text" inputMode="numeric" placeholder="Low"
                      value={moneyDisplay(t.low)} onChange={(e) => editBound(t.id, "low", digitsOf(e.target.value))} />
                    <span className="dbk-range-to">to</span>
                    <input className="dbk-field money" type="text" inputMode="numeric" placeholder="High"
                      value={moneyDisplay(t.high)} onChange={(e) => editBound(t.id, "high", digitsOf(e.target.value))} />
                  </div>
                  <div className="dbk-typical">
                    <TypicalSlider low={num(t.low)} high={num(t.high)} value={num(t.typical)} onChange={(v) => setTypical(t.id, v)} />
                    <div className="dbk-typical-side">
                      <label className="dbk-typical-lbl">
                        Typical <InfoDot text="Typical is the amount of a deal in this tier that counts toward your quota, not necessarily the full contract value. All of the deal count math runs on this number." />
                      </label>
                      <input className="dbk-field money typical" type="text" inputMode="numeric" placeholder="Typical"
                        value={moneyDisplay(t.typical)} onChange={(e) => setTypical(t.id, digitsOf(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* quantity, cycle, retires */}
                <div className="dbk-metrics">
                  <div className="dbk-metric">
                    <label>Deal Quantity</label>
                    <Stepper value={t.quantity} onChange={(v) => patchTier(t.id, { quantity: v })} />
                  </div>
                  <div className="dbk-metric">
                    <label>Sales cycle</label>
                    <div className={`dbk-cycle${cycleUnset ? " unset" : ""}`}>
                      <input type="text" inputMode="numeric" placeholder="0"
                        value={digitsOf(t.cycle)} onChange={(e) => patchTier(t.id, { cycle: digitsOf(e.target.value) })} />
                      <span className="dbk-cycle-suf">months</span>
                    </div>
                    {cycleUnset ? <div className="dbk-cycle-hint">we will use this for your timeline</div> : null}
                  </div>
                  <div className="dbk-metric right">
                    <label>Retires</label>
                    <div className="dbk-retires" title={`${t.quantity} × ${fmt(num(t.typical))}`}>{fmt(retiresOf(t))}</div>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="dbk-add" type="button" onClick={addTier}>Add a tier</button>
        </div>
      )}

      {/* CTA: the planner is a later build, so this does not navigate yet */}
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

/* grand total */
.dbk-grand{ background:linear-gradient(150deg,#1F3D2A,#2D6A4F); color:#F4FBF5; border-radius:22px; padding:20px 22px;
  box-shadow:0 18px 40px -20px rgba(45,106,79,.6); margin-bottom:22px; }
.dbk-grand-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.dbk-grand-lbl{ font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:#A7D6B5; font-weight:700; }
.dbk-grand-q{ font-size:14px; color:#D7EEDD; margin-top:3px; } .dbk-grand-q b{ color:#fff; font-weight:700; }
.dbk-grand-tgt{ color:#9FC9AC; }
.dbk-grand-num{ text-align:right; }
.dbk-grand-booked{ font-family:'Playfair Display',serif; font-size:34px; font-weight:900; line-height:1; color:#fff; }
.dbk-grand-cap{ font-size:11.5px; color:#A7D6B5; letter-spacing:.04em; text-transform:uppercase; font-weight:600; margin-top:3px; }
.dbk-recon{ font-size:12.5px; color:#CDE7D4; margin-top:13px; line-height:1.5; } .dbk-recon b{ color:#fff; }

/* meter */
.dbk-meter{ margin-top:12px; }
.dbk-track{ position:relative; height:16px; border-radius:999px; background:rgba(255,255,255,.18); }
.dbk-fill{ position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:linear-gradient(90deg,var(--gold),var(--carrot)); transition:width .35s ease; }
.dbk-fill.met{ background:linear-gradient(90deg,#7BD493,#B7F0C6); }
.dbk-tick{ position:absolute; top:-5px; bottom:-5px; width:2px; background:rgba(255,255,255,.7); transform:translateX(-50%); }
.dbk-tick-lbl{ position:absolute; top:-16px; left:50%; transform:translateX(-50%); font-size:8.5px; letter-spacing:.06em; text-transform:uppercase; font-weight:800; color:rgba(255,255,255,.85); white-space:nowrap; }

/* empty state */
.dbk-empty{ background:#fff; border:1.5px dashed #E7C9AE; border-radius:20px; padding:26px; text-align:center; margin-bottom:22px; }
.dbk-empty-h{ font-family:'Playfair Display',serif; font-size:21px; font-weight:700; color:var(--ink); }
.dbk-empty p{ font-size:14px; color:var(--muted); line-height:1.55; max-width:520px; margin:8px auto 16px; }

/* tiers */
.dbk-tiers{ display:flex; flex-direction:column; gap:16px; }
.dbk-tier{ background:#fff; border:1.5px solid var(--border); border-radius:18px; padding:16px 18px; }
.dbk-tier-head{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.dbk-tier-ico{ display:flex; align-items:center; }
.dbk-type{ font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; border:1.5px solid; border-radius:100px; padding:5px 12px; cursor:pointer; appearance:none; }
.dbk-type:focus{ outline:none; }
.dbk-tier-cap{ font-size:11px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; opacity:.85; }
.dbk-remove{ margin-left:auto; background:none; border:1.5px solid var(--border); border-radius:9px; padding:5px 12px; font-size:12.5px;
  font-weight:600; color:var(--muted); cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-remove:hover{ border-color:#C86B4B; color:#B0532A; }

.dbk-size{ margin-bottom:14px; }
.dbk-size-lbl{ font-size:11px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); margin-bottom:8px; display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.dbk-size-help{ text-transform:none; letter-spacing:0; font-weight:500; font-size:12px; color:var(--muted); opacity:.85; }
.dbk-range{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.dbk-range-to{ font-size:13px; color:var(--muted); font-weight:600; }
.dbk-field{ border:1.5px solid var(--border); border-radius:10px; background:#fff; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--ink); padding:10px 12px; }
.dbk-field:focus{ outline:none; border-color:var(--carrot); }
.dbk-field.money{ font-weight:700; width:150px; }
.dbk-typical{ display:flex; align-items:center; gap:16px; }
.dbk-slider{ position:relative; flex:1; height:8px; border-radius:999px; background:#EADBC9; cursor:pointer; touch-action:none; min-width:120px; }
.dbk-slider.off{ opacity:.5; cursor:not-allowed; }
.dbk-slider-fill{ position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:linear-gradient(90deg,var(--gold),var(--carrot)); }
.dbk-slider-thumb{ position:absolute; top:50%; width:20px; height:20px; border-radius:50%; transform:translate(-50%,-50%); background:var(--carrot); border:3px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,.25); }
.dbk-typical-side{ display:flex; flex-direction:column; gap:5px; }
.dbk-typical-lbl{ font-size:11px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); display:flex; align-items:center; gap:4px; }
.dbk-field.typical{ width:150px; color:var(--carrot-dark); }

.dbk-metrics{ display:flex; align-items:flex-end; gap:24px; flex-wrap:wrap; border-top:1px solid var(--border); padding-top:14px; }
.dbk-metric{ display:flex; flex-direction:column; gap:6px; }
.dbk-metric.right{ margin-left:auto; text-align:right; align-items:flex-end; }
.dbk-metric label{ font-size:11px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-step{ display:flex; align-items:center; gap:4px; border:1.5px solid var(--border); border-radius:10px; background:#fff; padding:3px; }
.dbk-step button{ width:32px; height:32px; border:none; border-radius:8px; background:var(--cream); color:var(--carrot-dark); font-size:20px; font-weight:700; line-height:1; cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-step button:hover{ background:var(--carrot-light); }
.dbk-step-n{ min-width:38px; text-align:center; font-size:16px; font-weight:800; color:var(--ink); }
.dbk-cycle{ display:flex; align-items:center; gap:7px; border:1.5px solid var(--border); border-radius:10px; background:#fff; padding:0 12px 0 12px; }
.dbk-cycle:focus-within{ border-color:var(--carrot); }
.dbk-cycle.unset{ border-color:#E0B88A; background:#FFFaf2; }
.dbk-cycle input{ border:none; background:none; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:var(--ink); width:42px; padding:9px 0; }
.dbk-cycle input:focus{ outline:none; }
.dbk-cycle-suf{ font-size:13px; color:var(--muted); font-weight:600; }
.dbk-cycle-hint{ font-size:11px; color:#9A6A3E; font-style:italic; }
.dbk-retires{ font-family:'Playfair Display',serif; font-size:22px; font-weight:900; color:var(--carrot-dark); white-space:nowrap; }

.dbk-add{ align-self:flex-start; background:#fff; border:1.5px dashed #E7C9AE; border-radius:12px; padding:11px 18px; font-size:14px; font-weight:700;
  color:var(--carrot-dark); cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-add:hover{ border-color:var(--carrot); }
.dbk-add.big{ background:linear-gradient(135deg,var(--carrot),#FF8A4C); color:#fff; border:none; padding:13px 22px; font-size:15px; }

/* info dot */
.dbk-info{ position:relative; display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; border-radius:50%;
  border:1px solid #C9B49E; color:#9A8775; font-size:9px; font-style:italic; font-weight:700; cursor:help; font-family:Georgia,serif; text-transform:none; letter-spacing:0; }
.dbk-info .dbk-bub{ position:absolute; bottom:150%; left:0; transform:translateX(-8%); width:230px; background:var(--ink); color:#F7EFE6; font-size:11px;
  line-height:1.45; letter-spacing:0; text-transform:none; font-weight:500; padding:9px 11px; border-radius:8px; box-shadow:0 8px 20px -6px rgba(0,0,0,.5);
  opacity:0; visibility:hidden; transition:opacity .15s; z-index:5; pointer-events:none; }
.dbk-info:hover .dbk-bub, .dbk-info:focus .dbk-bub{ opacity:1; visibility:visible; }

/* CTA */
.dbk-cta-wrap{ margin-top:24px; }
.dbk-cta{ width:100%; border:none; cursor:pointer; padding:15px 18px; border-radius:16px; color:#fff; font-family:'DM Sans',sans-serif;
  background:linear-gradient(135deg,var(--carrot),#FF8A4C); box-shadow:0 14px 30px -14px rgba(232,100,44,.7); transition:.18s;
  display:flex; flex-direction:column; align-items:center; gap:3px; }
.dbk-cta:hover{ transform:translateY(-1px); }
.dbk-cta-main{ font-size:17px; font-weight:700; display:flex; align-items:center; gap:8px; }
.dbk-cta-sub{ font-size:12.5px; font-weight:500; color:#FFE7D5; }

@media(min-width:760px){
  .dbk-title{ font-size:34px; }
  .dbk-sub{ font-size:16px; }
  .dbk-grand-booked{ font-size:42px; }
}
@media(max-width:560px){
  .dbk-typical{ flex-direction:column; align-items:stretch; gap:10px; }
  .dbk-field.money, .dbk-field.typical{ width:100%; }
  .dbk-metrics{ gap:16px; }
  .dbk-metric.right{ margin-left:0; }
}
`;
