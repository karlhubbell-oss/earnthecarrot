import React, { useState } from "react";
import { toEarningsPlan } from "./lib/planAdapter.js";

/*
  DealBreakdown — Strategy Step 2 for Earn The Carrot.

  Turns the rep's stretch goal into the concrete deals it takes to get there,
  component by component. This is "Coach's adjustable answer": Coach pre-populates
  every number from the rep's REAL comp plan (via toEarningsPlan, the same engine
  that drives the payout curve and goals screens) and the rep nudges what's off.

  Everything measures toward the rep's STRETCH number; TARGET shows up as a
  milestone tick along each bar. These are planning estimates (round numbers),
  not the penny-exact comp math.

  Pass one: UI + live math only. Persistence and the hand-off to the planner
  come in pass two, so all edits live in local component state.

  Props:
    plan        -> the rep's real comp plan (get-plan shape)
    targetPct   -> rep's target attainment %  (default 110)
    stretchPct  -> rep's stretch attainment % (default 150)  <- the finish line
    onBack()    -> back to Step 1 (goals)
    onContinue()-> the "place these deals across the year" CTA (planner, next build)
*/

// ── formatting ────────────────────────────────────────────────────────────
const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
const digitsOf = (s) => String(s == null ? "" : s).replace(/[^\d]/g, "");
const num = (s) => Number(digitsOf(s)) || 0;
// Display a raw digit string as currency ("1500000" -> "$1,500,000"); empty stays empty.
const moneyDisplay = (s) => {
  const d = digitsOf(s);
  return d ? "$" + Number(d).toLocaleString("en-US") : "";
};

// Round to a sensible planning step for its magnitude. These are estimates, so
// we never show $1,503,250 where "$1.5M" is the honest precision.
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

// A friendly one-liner for a component, inferred from its name. Falls back to a
// generic line so an unrecognized component still reads warmly.
function describe(name) {
  const s = String(name || "").toLowerCase();
  if (/new logo|new business|net.?new|acquisition/.test(s)) return "Net-new customers you win from scratch.";
  if (/expansion|upsell|cross.?sell|growth/.test(s)) return "Growing the accounts you already have.";
  if (/renew/.test(s)) return "Keeping current customers on board.";
  if (/services|professional/.test(s)) return "Services and implementation revenue.";
  if (/multi.?year|term/.test(s)) return "Longer-term commitments that lock in revenue.";
  return "Revenue you book in this part of your plan.";
}

// Propose Big / Medium / Small deal sizes and starting counts that land a
// component near its stretch target. Coach's opening offer, fully editable.
function proposeSizes(target) {
  const avg = niceRound(target / 12) || niceRound(target / 8) || 1000;
  const big = niceRound(avg * 2) || avg * 2;
  const medium = avg;
  const small = niceRound(avg / 2) || Math.max(1, Math.round(avg / 2));
  const c = (share, size) => (size > 0 ? Math.max(1, Math.round((target * share) / size)) : 0);
  const bigCount = c(0.4, big);
  const medCount = c(0.35, medium);
  const smallCount = c(0.25, small);
  return [
    { label: "Big", size: String(big), typical: String(bigCount), count: bigCount },
    { label: "Medium", size: String(medium), typical: String(medCount), count: medCount },
    { label: "Small", size: String(small), typical: String(smallCount), count: smallCount },
  ];
}

// Build the editable component models from the REAL plan. Reads the raw component
// list (so a weight-only multi-component plan keeps all its components instead of
// collapsing), but takes totalQuota from the engine adapter.
function deriveComponents(plan, targetPct, stretchPct) {
  const ep = toEarningsPlan(plan) || {};
  const totalQuota = ep.totalQuota || 0;
  const stretchMult = stretchPct / 100;
  const stretchQuota = totalQuota * stretchMult;

  let raw = plan && plan.quota && Array.isArray(plan.quota.components) ? plan.quota.components : [];
  raw = raw.filter((c) => c && (c.name || c.quota_amount != null || c.weight_pct != null));
  if (!raw.length) raw = [{ name: "Your Quota", quota_amount: totalQuota || null, weight_pct: 100 }];

  const sumQuota = raw.reduce((s, c) => s + (Number(c.quota_amount) || 0), 0);
  const n = raw.length;

  return raw.map((c, i) => {
    const q = Number(c.quota_amount) || 0;
    const w = c.weight_pct != null ? Number(c.weight_pct) / 100 : sumQuota > 0 ? q / sumQuota : 1 / n;

    let target, source;
    if (q > 0) {
      target = niceRound(q * stretchMult);
      source = "quota";
    } else if (c.weight_pct != null) {
      target = niceRound(w * stretchQuota);
      source = "weight";
    } else {
      target = niceRound((1 / n) * stretchQuota);
      source = "even";
    }

    const sizes = proposeSizes(target);
    const note =
      source === "quota"
        ? `Your 100% ${c.name || "component"} quota is ${fmt(q)}. This target is that quota scaled to your ${stretchPct}% stretch goal — higher on purpose, because everything here measures toward stretch. Adjust if you know the real number.`
        : source === "weight"
        ? `Estimated from this component's ${Math.round(w * 100)}% weight in your plan, scaled to your ${stretchPct}% stretch goal — that's why it runs above a 100% number. Adjust if you know the real number.`
        : `Estimated by splitting your stretch quota evenly across components, so it's scaled to your ${stretchPct}% stretch goal. Adjust if you know the real number.`;

    return {
      key: `${c.name || "component"}-${i}`,
      name: c.name || "Component",
      desc: describe(c.name),
      source,
      sourceNote: note,
      target: String(target),
      sizes,
      proposed: { big: sizes[0].count, medium: sizes[1].count, small: sizes[2].count },
    };
  });
}

// ── icons ─────────────────────────────────────────────────────────────────
function MicIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </svg>
  );
}
function CarrotMark({ size = 16, color = "#E8642C" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 8c-3.2 1-6 4.4-7.4 9.2-.3 1 .6 1.9 1.6 1.6C10 17.4 13.4 14.6 14.4 11.4" />
      <path d="M14.5 9.5 19 5" />
      <path d="M14.2 7.6c.5-1.7 2-2.6 3.6-2.4M16.6 10.2c1.7-.4 2.8-1.7 2.9-3.3" />
    </svg>
  );
}

// ── live meter ───────────────────────────────────────────────────────────
// Fills toward `target` (the finish line). `tickFrac` marks where the lower
// "target" milestone sits along the way. Turns green once the fill covers target.
function Meter({ booked, target, tickFrac, big }) {
  const met = target > 0 && booked >= target - 0.5;
  const fillFrac = target > 0 ? Math.min(booked / target, 1) : 0;
  const gap = target - booked;
  return (
    <div className={`dbk-meter${big ? " big" : ""}`}>
      <div className="dbk-track">
        <div className={`dbk-fill${met ? " met" : ""}`} style={{ width: fillFrac * 100 + "%" }} />
        {tickFrac > 0 && tickFrac < 1 && (
          <div className="dbk-tick" style={{ left: tickFrac * 100 + "%" }}>
            <span className="dbk-tick-lbl">Target</span>
          </div>
        )}
      </div>
      <div className="dbk-meter-foot">
        <span className="dbk-booked">{fmt(booked)} <span className="dbk-of">of {fmt(target)} stretch</span></span>
        {met ? (
          <span className="dbk-gap met"><CarrotMark size={13} color="#2E7D43" /> Stretch covered — {fmt(booked - target)} cushion</span>
        ) : (
          <span className="dbk-gap">{fmt(gap)} to go to reach stretch</span>
        )}
      </div>
    </div>
  );
}

// ── count stepper ──────────────────────────────────────────────────────────
function Stepper({ value, onChange }) {
  return (
    <div className="dbk-step">
      <button type="button" aria-label="One fewer" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="dbk-step-n">{value}</span>
      <button type="button" aria-label="One more" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export default function DealBreakdown({
  plan = null,
  targetPct = 110,
  stretchPct = 150,
  onBack = () => {},
  onContinue = () => {},
}) {
  const ep = toEarningsPlan(plan) || {};
  const totalQuota = ep.totalQuota || 0;
  const stretchMult = stretchPct / 100;
  const targetMult = targetPct / 100;
  const stretchQuota = totalQuota * stretchMult;
  const targetQuota = totalQuota * targetMult;
  // Where the target milestone sits along a stretch bar (same proportion everywhere).
  const tickFrac = stretchPct > 0 ? Math.min(Math.max(targetMult / stretchMult, 0), 1) : 0;

  const [comps, setComps] = useState(() => deriveComponents(plan, targetPct, stretchPct));

  // Edit helpers — pass one keeps it all in local state.
  const editComp = (ci, patch) => setComps((cs) => cs.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const editSize = (ci, si, patch) =>
    setComps((cs) => cs.map((c, i) => (i === ci ? { ...c, sizes: c.sizes.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : c)));

  const compBooked = (c) => c.sizes.reduce((s, r) => s + num(r.size) * r.count, 0);
  const sumBooked = comps.reduce((s, c) => s + compBooked(c), 0);
  const sumTargets = comps.reduce((s, c) => s + num(c.target), 0);

  const grandMet = stretchQuota > 0 && sumBooked >= stretchQuota - 0.5;
  // How the rep's per-component targets stack up against their overall stretch quota.
  const targetsDelta = sumTargets - stretchQuota;

  return (
    <div className="dbk-root">
      <style>{CSS}</style>

      <div className="dbk-head">
        <div className="dbk-crumb">Strategy · Step 2</div>
        <h1 className="dbk-title">Turn Your Stretch Into Deals</h1>
        <p className="dbk-sub">
          Here's what it takes to reach your stretch goal, broken down into the deals you actually have to close — Coach
          filled it in from your real plan. Nudge the deal sizes and counts until it matches how your year really runs.
          These are planning estimates, not penny-exact comp math.
        </p>
      </div>

      {/* GRAND TOTAL — the headline meter, sum of all deals vs the rep's stretch quota */}
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
            <div className="dbk-grand-booked">{fmt(sumBooked)}</div>
            <div className="dbk-grand-cap">in planned deals</div>
          </div>
        </div>
        <Meter booked={sumBooked} target={stretchQuota} tickFrac={tickFrac} big />
        <div className="dbk-recon">
          Your component targets add up to <b>{fmt(sumTargets)}</b>
          {Math.abs(targetsDelta) < Math.max(1, stretchQuota * 0.01) ? (
            <> — right in line with your stretch quota.</>
          ) : targetsDelta > 0 ? (
            <> — {fmt(targetsDelta)} <span className="over">above</span> your stretch quota. Ambitious; trim a component if it's too much.</>
          ) : (
            <> — {fmt(-targetsDelta)} <span className="under">below</span> your stretch quota. Raise a component target to close the gap.</>
          )}
        </div>
      </div>

      {/* PER COMPONENT */}
      <div className="dbk-grid">
        {comps.map((c, ci) => {
          const booked = compBooked(c);
          const target = num(c.target);
          return (
            <div key={c.key} className="dbk-card">
              <div className="dbk-card-head">
                <div className="dbk-c-name">{c.name}</div>
                <div className="dbk-c-desc">{c.desc}</div>
              </div>

              {/* editable stretch target + where it came from */}
              <div className="dbk-target">
                <label className="dbk-target-lbl">Stretch target</label>
                <input
                  className="dbk-target-inp"
                  type="text"
                  inputMode="numeric"
                  value={moneyDisplay(c.target)}
                  onChange={(e) => editComp(ci, { target: digitsOf(e.target.value) })}
                />
                <div className="dbk-source">{c.sourceNote}</div>
              </div>

              {/* deal-size rows: Big on top → Small on the bottom */}
              <div className="dbk-rows">
                <div className="dbk-rows-head">
                  <span className="rh-size">
                    Quota retired per deal
                    <span className="dbk-info" tabIndex={0} aria-label="The amount of each deal that counts toward your quota, not necessarily the full contract value.">
                      i<span className="dbk-bub">The amount of each deal that counts toward your quota — not necessarily the full contract value.</span>
                    </span>
                  </span>
                  <span className="rh-typ">Deals / yr</span>
                  <span className="rh-cnt">In your plan</span>
                  <span className="rh-total">Retires</span>
                </div>
                {c.sizes.map((r, si) => (
                  <div key={r.label} className="dbk-row">
                    <span className="dbk-row-tag">{r.label}</span>
                    <div className="dbk-field dbk-field-size">
                      <button type="button" className="dbk-mic" title="Voice entry coming soon" aria-label="Voice entry coming soon">
                        <MicIcon />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={moneyDisplay(r.size)}
                        onChange={(e) => editSize(ci, si, { size: digitsOf(e.target.value) })}
                      />
                    </div>
                    <input
                      className="dbk-field dbk-typ"
                      type="text"
                      inputMode="numeric"
                      value={digitsOf(r.typical)}
                      placeholder="—"
                      onChange={(e) => editSize(ci, si, { typical: digitsOf(e.target.value) })}
                    />
                    <Stepper value={r.count} onChange={(v) => editSize(ci, si, { count: v })} />
                    <div className="dbk-row-total" title={`${r.count} × ${fmt(num(r.size))}`}>{fmt(num(r.size) * r.count)}</div>
                  </div>
                ))}
              </div>

              <div className="dbk-coachmix">
                <CarrotMark size={14} color="#C25A28" />
                <span>
                  Coach started you at <b>{c.proposed.big} big · {c.proposed.medium} medium · {c.proposed.small} small</b> — a
                  mix that lands near your stretch target. Nudge it toward how your deals really break out.
                </span>
              </div>

              <Meter booked={booked} target={target} tickFrac={tickFrac} />
            </div>
          );
        })}
      </div>

      {/* CTA — planner is the next build, so this doesn't navigate yet */}
      <div className="dbk-cta-wrap">
        <button className="dbk-cta" onClick={() => onContinue({ comps, sumBooked })}>
          <span className="dbk-cta-main">Place these deals across the year <span aria-hidden>→</span></span>
          <span className="dbk-cta-sub">Coach will help you slot each deal into a month and build your plan of attack</span>
        </button>
        {grandMet ? (
          <div className="dbk-cta-note met">Your planned deals already cover your stretch quota. 🥕</div>
        ) : (
          <div className="dbk-cta-note">{fmt(stretchQuota - sumBooked)} of planned deals still to add to cover your stretch quota.</div>
        )}
      </div>
    </div>
  );
}

// ── scoped styles (laptop-first; the base rules are the phone fallback and the
// min-width:760px block is the laptop layout, matching the goals screen) ─────
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
.dbk-recon{ font-size:12.5px; color:#CDE7D4; margin-top:13px; line-height:1.5; }
.dbk-recon b{ color:#fff; } .dbk-recon .over{ color:#FFD9A8; font-weight:700; } .dbk-recon .under{ color:#FFC59A; font-weight:700; }

/* meter (shared) */
.dbk-meter{ margin-top:12px; }
.dbk-track{ position:relative; height:12px; border-radius:999px; background:rgba(0,0,0,.10); overflow:visible; }
.dbk-grand .dbk-track{ background:rgba(255,255,255,.18); }
.dbk-fill{ position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:linear-gradient(90deg,var(--gold),var(--carrot)); transition:width .35s ease; }
.dbk-fill.met{ background:linear-gradient(90deg,#5AA66E,#2D6A4F); }
.dbk-grand .dbk-fill.met{ background:linear-gradient(90deg,#7BD493,#B7F0C6); }
.dbk-meter.big .dbk-track{ height:16px; }
.dbk-tick{ position:absolute; top:-5px; bottom:-5px; width:2px; background:rgba(26,18,8,.45); transform:translateX(-50%); }
.dbk-grand .dbk-tick{ background:rgba(255,255,255,.7); }
.dbk-tick-lbl{ position:absolute; top:-16px; left:50%; transform:translateX(-50%); font-size:8.5px; letter-spacing:.06em; text-transform:uppercase;
  font-weight:800; color:rgba(26,18,8,.55); white-space:nowrap; }
.dbk-grand .dbk-tick-lbl{ color:rgba(255,255,255,.85); }
.dbk-meter-foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:9px; flex-wrap:wrap; }
.dbk-booked{ font-size:13px; font-weight:700; color:var(--ink); } .dbk-grand .dbk-booked{ color:#fff; }
.dbk-of{ font-weight:500; color:var(--muted); } .dbk-grand .dbk-of{ color:#A7D6B5; }
.dbk-gap{ font-size:12.5px; font-weight:700; color:var(--carrot-dark); display:inline-flex; align-items:center; gap:5px; }
.dbk-grand .dbk-gap{ color:#FFE7D5; }
.dbk-gap.met{ color:var(--green); } .dbk-grand .dbk-gap.met{ color:#B7F0C6; }

/* component cards */
.dbk-grid{ display:flex; flex-direction:column; gap:18px; }
.dbk-card{ background:#fff; border:1.5px solid var(--border); border-radius:20px; padding:18px 18px 16px; }
.dbk-card-head{ margin-bottom:14px; }
.dbk-c-name{ font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--ink); }
.dbk-c-desc{ font-size:13px; color:var(--muted); margin-top:2px; }

.dbk-target{ background:var(--carrot-light); border:1px solid #F0CBB4; border-radius:14px; padding:12px 14px; margin-bottom:14px; }
.dbk-target-lbl{ display:block; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; font-weight:800; color:var(--carrot-dark); margin-bottom:5px; }
.dbk-target-inp{ width:100%; max-width:220px; font-family:'Playfair Display',serif; font-size:26px; font-weight:900; color:var(--ink);
  border:1.5px solid transparent; border-radius:9px; background:rgba(255,255,255,.7); padding:4px 10px; }
.dbk-target-inp:focus{ outline:none; border-color:var(--carrot); background:#fff; }
.dbk-source{ font-size:11.5px; color:#9A6A3E; line-height:1.45; margin-top:7px; font-style:italic; }

.dbk-rows{ margin-bottom:12px; }
.dbk-rows-head{ display:grid; grid-template-columns:54px 1fr 72px 96px 84px; gap:9px; align-items:center; padding:0 2px 6px; }
.dbk-rows-head span{ font-size:10px; letter-spacing:.05em; text-transform:uppercase; font-weight:700; color:var(--muted); }
.dbk-rows-head .rh-size{ grid-column:1 / 3; } .dbk-rows-head .rh-typ{ text-align:center; } .dbk-rows-head .rh-cnt{ text-align:center; } .dbk-rows-head .rh-total{ text-align:right; }
.dbk-row{ display:grid; grid-template-columns:54px 1fr 72px 96px 84px; gap:9px; align-items:center; padding:6px 0; }
.dbk-row-tag{ font-size:12px; font-weight:800; color:var(--ink); }
.dbk-row-total{ text-align:right; font-size:14px; font-weight:800; color:var(--carrot-dark); white-space:nowrap; }
/* info dot + hover/focus bubble (matches the goals screen pattern) */
.dbk-info{ position:relative; display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; border-radius:50%;
  border:1px solid #C9B49E; color:#9A8775; font-size:9px; font-style:italic; font-weight:700; cursor:help; font-family:Georgia,serif;
  vertical-align:middle; margin-left:5px; text-transform:none; letter-spacing:0; }
.dbk-info .dbk-bub{ position:absolute; bottom:150%; left:0; transform:translateX(-8%); width:220px; background:var(--ink); color:#F7EFE6;
  font-size:11px; line-height:1.45; letter-spacing:0; text-transform:none; font-weight:500; padding:9px 11px; border-radius:8px;
  box-shadow:0 8px 20px -6px rgba(0,0,0,.5); opacity:0; visibility:hidden; transition:opacity .15s; z-index:5; pointer-events:none; }
.dbk-info:hover .dbk-bub, .dbk-info:focus .dbk-bub{ opacity:1; visibility:visible; }
.dbk-field{ border:1.5px solid var(--border); border-radius:10px; background:#fff; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--ink); }
.dbk-field:focus-within, .dbk-field:focus{ outline:none; border-color:var(--carrot); }
.dbk-field-size{ display:flex; align-items:center; gap:6px; padding:0 8px; }
.dbk-field-size input{ border:none; background:none; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:var(--ink); width:100%; padding:9px 0; }
.dbk-field-size input:focus{ outline:none; }
.dbk-mic{ flex:none; display:flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:7px; border:none;
  background:var(--carrot-light); color:var(--carrot-dark); cursor:pointer; }
.dbk-mic:hover{ background:#F8D5BD; }
.dbk-typ{ text-align:center; padding:9px 6px; font-weight:600; }
.dbk-step{ display:flex; align-items:center; justify-content:space-between; gap:4px; border:1.5px solid var(--border); border-radius:10px; background:#fff; padding:3px; }
.dbk-step button{ width:30px; height:30px; border:none; border-radius:8px; background:var(--cream); color:var(--carrot-dark); font-size:20px; font-weight:700;
  line-height:1; cursor:pointer; font-family:'DM Sans',sans-serif; }
.dbk-step button:hover{ background:var(--carrot-light); }
.dbk-step-n{ flex:1; text-align:center; font-size:16px; font-weight:800; color:var(--ink); }

.dbk-coachmix{ display:flex; gap:8px; align-items:flex-start; background:#FBF4EC; border:1px solid #EFE0CF; border-radius:12px; padding:10px 12px; margin-bottom:6px; }
.dbk-coachmix svg{ flex:none; margin-top:2px; }
.dbk-coachmix span{ font-size:12px; color:#5C4A3A; line-height:1.5; } .dbk-coachmix b{ color:var(--ink); }

/* CTA */
.dbk-cta-wrap{ margin-top:24px; }
.dbk-cta{ width:100%; border:none; cursor:pointer; padding:15px 18px; border-radius:16px; color:#fff; font-family:'DM Sans',sans-serif;
  background:linear-gradient(135deg,var(--carrot),#FF8A4C); box-shadow:0 14px 30px -14px rgba(232,100,44,.7); transition:.18s;
  display:flex; flex-direction:column; align-items:center; gap:3px; }
.dbk-cta:hover{ transform:translateY(-1px); }
.dbk-cta-main{ font-size:17px; font-weight:700; display:flex; align-items:center; gap:8px; }
.dbk-cta-sub{ font-size:12.5px; font-weight:500; color:#FFE7D5; }
.dbk-cta-note{ text-align:center; font-size:12.5px; color:var(--muted); margin-top:10px; }
.dbk-cta-note.met{ color:var(--green); font-weight:700; }

/* laptop layout: component cards go two-up and type steps up */
@media(min-width:760px){
  .dbk-title{ font-size:34px; }
  .dbk-sub{ font-size:16px; }
  .dbk-grand-booked{ font-size:42px; }
  .dbk-grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }
  .dbk-c-name{ font-size:22px; }
  .dbk-target-inp{ font-size:30px; }
}
@media(max-width:520px){
  .dbk-rows-head, .dbk-row{ grid-template-columns:40px minmax(66px,1fr) 50px 80px 64px; gap:5px; }
  .dbk-field-size input{ font-size:14px; }
  .dbk-row-total{ font-size:13px; }
}
`;
