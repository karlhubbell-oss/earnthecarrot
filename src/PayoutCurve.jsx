import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import { toEarningsPlan } from "./lib/planAdapter";
import { computeEarnings, buildPayoutCurve, reconcilePlan, summaryMetrics } from "./lib/earnings";

// Real payout curve screen. Reads the plan from get-plan (passed in as `plan`)
// via planAdapter, and runs the real engine in src/lib/earnings.js. No plan
// values are hardcoded. Markers, cap, and the conflict banner are all derived
// live from the plan.

const COL = { bg: "#0E1217", panel: "#151B23", line: "#222B36", base: "#6B7A8F", comm: "#E8A13A", total: "#34D399", text: "#E6EDF3", mut: "#8B98A5" };
const fmt = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");
const fmt0 = (n) => "$" + Math.round((n || 0) / 1000) + "k";

function Legend({ dot, text }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#C7D1DC" }}><span style={{ width: 18, height: 3, borderRadius: 2, background: dot }} />{text}</div>;
}
function Stat({ label, value, tone, note }) {
  return (
    <div>
      <div style={{ color: COL.mut, fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 700, color: tone, letterSpacing: -0.4, margin: "4px 0 2px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {note && <div style={{ color: COL.mut, fontSize: 12, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}
function Row({ dot, name, val }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COL.text, padding: "2px 0" }}>
      <span style={{ width: 8, height: 8, borderRadius: 8, background: dot }} />
      <span style={{ color: COL.mut, minWidth: 104 }}>{name}</span>
      <span style={{ marginLeft: "auto", fontWeight: 600 }}>{val}</span>
    </div>
  );
}
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = (k) => payload.find((p) => p.dataKey === k)?.value ?? 0;
  return (
    <div style={{ background: COL.panel, border: `1px solid ${COL.line}`, borderRadius: 10, padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>
      <div style={{ color: COL.mut, fontSize: 12, marginBottom: 6 }}>{label}% of quota</div>
      <Row dot={COL.total} name="Total earnings" val={fmt(row("total"))} />
      <Row dot={COL.comm} name="Commission" val={fmt(row("commission"))} />
      <Row dot={COL.base} name="Base salary" val={fmt(row("base"))} />
    </div>
  );
}

export default function PayoutCurve({ plan, attainment = null, onBack }) {
  const ep = useMemo(() => (plan ? toEarningsPlan(plan) : null), [plan]);

  // Empty / unusable plan: say so plainly, do not crash.
  if (!ep || !ep.totalQuota) {
    return (
      <div style={{ background: COL.bg, minHeight: "calc(100vh - 72px)", color: COL.text, fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif", padding: "28px clamp(16px, 4vw, 48px)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: COL.mut, cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 14 }}>‹ Back to Comp Plan</button>}
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Your payout curve</h1>
          <p style={{ color: COL.mut, marginTop: 8 }}>Load and confirm a comp plan first, then your curve will show here.</p>
        </div>
      </div>
    );
  }

  // Live derivation from the plan. Raw tiers carry the stated band rates and bounds.
  const rawTiers = (plan.commission && Array.isArray(plan.commission.tiers) ? [...plan.commission.tiers] : [])
    .filter((t) => t && t.from_attainment_pct != null)
    .sort((a, b) => a.from_attainment_pct - b.from_attainment_pct);
  const capA = ep.cap && ep.cap.attainment != null ? ep.cap.attainment : null;
  const topRaw = rawTiers.length ? rawTiers[rawTiers.length - 1] : null;
  const topEndsPct = topRaw && topRaw.to_attainment_pct != null ? topRaw.to_attainment_pct : null;
  const topA = capA != null ? capA : (topEndsPct != null ? topEndsPct / 100 : (ep.tiers[ep.tiers.length - 1].fromAttainment + 0.5));
  const maxA = topA;
  const maxPct = Math.round(maxA * 100);

  const sm = summaryMetrics(ep);
  const rec = reconcilePlan(ep);
  const showConflict = !rec.consistent;

  const at100 = computeEarnings(ep, 1.0);
  const atTop = computeEarnings(ep, topA);
  const computedTotal100 = at100.totalEarnings;
  const effRate = ep.totalQuota > 0 ? at100.commission / ep.totalQuota : 0;

  const curve = useMemo(() => buildPayoutCurve(ep, { maxAttainment: maxA, steps: 100 }).points.map((p) => ({
    pct: p.attainmentPct, base: p.baseSalary, commission: p.commission, total: p.totalEarnings,
  })), [ep, maxA]);

  // Markers, all live: floor, each accelerator threshold (labeled with its rate),
  // the 100% point, and a cap line only when the plan states a real cap.
  const markers = [];
  if (ep.floor && ep.floor.attainment != null) markers.push({ a: Math.round(ep.floor.attainment * 100), label: "Floor", tone: COL.mut });
  for (const t of rawTiers) {
    const fromPct = t.from_attainment_pct;
    if (fromPct == null || fromPct <= 0 || fromPct === 100) continue; // base band and 100% handled elsewhere
    markers.push({ a: fromPct, label: t.rate != null ? Math.round(t.rate * 1000) / 10 + "%" : "", tone: COL.comm });
  }
  markers.push({ a: 100, label: "On plan", tone: COL.total });
  if (capA != null) markers.push({ a: Math.round(capA * 100), label: "Cap, no commission above", tone: COL.mut, cap: true });
  else if (topEndsPct != null) markers.push({ a: topEndsPct, label: "Top tier ends, rates above need confirming", tone: COL.mut });

  const ticks = Array.from(new Set([0, ...markers.map((m) => m.a), maxPct])).sort((x, y) => x - y);

  // You are here: attainment to date is a prop for now. When it is not available,
  // do not fake a position. Hide the you-are-here marker and start the scrub at 100%.
  const hasHere = attainment != null && isFinite(attainment);
  const herePct = hasHere ? Math.round(attainment * 100) : null;
  const hereToday = hasHere ? computeEarnings(ep, attainment) : null;
  const nextToday = hasHere ? computeEarnings(ep, Math.min(attainment + 0.1, maxA)).commission - hereToday.commission : null;

  const [pct, setPct] = useState(hasHere ? Math.round(attainment * 100) : 100);
  const here = useMemo(() => computeEarnings(ep, pct / 100), [ep, pct]);
  const next = useMemo(() => {
    const a = Math.min(pct / 100, maxA - 0.1 > 0 ? maxA - 0.1 : pct / 100);
    return computeEarnings(ep, Math.min(a + 0.1, maxA)).commission - computeEarnings(ep, a).commission;
  }, [ep, pct, maxA]);

  const componentNames = (ep.components || []).map((c) => c.name).join(" / ");
  const topLabel = capA != null ? `At the cap (${Math.round(capA * 100)}%)` : `At the top tier (${maxPct}%)`;
  const topSub = capA != null ? "capped here, no commission earned above" : "highest defined point, rates above need confirming";

  const cards = [
    { label: "Your number at 100%", value: fmt(at100.totalEarnings), sub: `${fmt(at100.commission)} commission on ${fmt(ep.baseSalary)} base` },
    { label: topLabel, value: fmt(atTop.totalEarnings), sub: topSub },
    { label: "Upside above plan", value: "+" + fmt(atTop.totalEarnings - at100.totalEarnings), sub: `what climbing from 100% to ${maxPct}% adds` },
    { label: "Effective rate at plan", value: (effRate * 100).toFixed(1) + "%", sub: "every revenue dollar, blended, at 100%" },
  ];

  return (
    <div style={{ background: COL.bg, minHeight: "calc(100vh - 72px)", color: COL.text, fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif", padding: "28px clamp(16px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: COL.mut, cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 14 }}>‹ Back to Comp Plan</button>}

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ color: COL.mut, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase" }}>Your payout curve</div>
            <h1 style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 700, margin: "4px 0 0", letterSpacing: -0.5 }}>What your plan pays, all the way up</h1>
          </div>
          <div style={{ color: COL.mut, fontSize: 13, textAlign: "right" }}>
            {componentNames || "Your plan"}<br />{fmt(ep.totalQuota).replace(",000,000", ".0M").replace(",000", "k")} quota
          </div>
        </div>

        {/* you are here (only when we have a real attainment) */}
        {hasHere && (
          <div style={{ marginTop: 18, background: "linear-gradient(180deg, rgba(52,211,153,0.10), rgba(52,211,153,0.03))", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: COL.total, boxShadow: "0 0 0 4px rgba(52,211,153,0.18)" }} />
              <span style={{ color: COL.total, fontSize: 13, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>You are here today</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginTop: 14, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{herePct}%</div>
                <div style={{ color: COL.mut, fontSize: 13, marginTop: 4 }}>of quota, attainment to date</div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{fmt(hereToday.totalEarnings)}</div>
                <div style={{ color: COL.mut, fontSize: 13, marginTop: 4 }}>earned so far ({fmt(hereToday.commission)} commission)</div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: COL.comm, fontVariantNumeric: "tabular-nums" }}>+{fmt(nextToday)}</div>
                <div style={{ color: COL.mut, fontSize: 13, marginTop: 4 }}>what your next 10 points are worth from here</div>
              </div>
            </div>
          </div>
        )}

        {/* plan check: surfaced only when the engine total at 100% disagrees with the stated OTE */}
        {showConflict && (
          <div style={{ marginTop: 14, background: "rgba(232,161,58,0.08)", border: "1px solid rgba(232,161,58,0.3)", borderRadius: 12, padding: "12px 16px", fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ color: COL.comm, fontWeight: 600 }}>Worth a quick check. </span>
            <span style={{ color: COL.text }}>
              Your plan headlines {fmt(ep.ote)} on target. Following its own commission rules, the math at 100% lands at {fmt(computedTotal100)}. That {fmt(Math.abs(ep.ote - computedTotal100))} difference is the plan disagreeing with itself. We would confirm with your manager which figure actually pays before you count on it.
            </span>
          </div>
        )}

        {/* cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginTop: 18 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ background: COL.panel, border: `1px solid ${COL.line}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ color: COL.mut, fontSize: 13 }}>{c.label}</div>
              <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: -0.5, margin: "6px 0 4px", fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
              <div style={{ color: COL.mut, fontSize: 12, lineHeight: 1.4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* chart */}
        <div style={{ background: COL.panel, border: `1px solid ${COL.line}`, borderRadius: 16, padding: "20px 14px 8px", marginTop: 16 }}>
          <div style={{ display: "flex", gap: 18, padding: "0 8px 12px", flexWrap: "wrap" }}>
            <Legend dot={COL.total} text="Total earnings" />
            <Legend dot={COL.comm} text="Commission only" />
            <Legend dot={COL.base} text="Base salary" />
          </div>
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={curve} margin={{ top: 28, right: 22, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={COL.line} vertical={false} />
                <XAxis dataKey="pct" tick={{ fill: COL.mut, fontSize: 12 }} tickLine={false} axisLine={{ stroke: COL.line }} ticks={ticks} tickFormatter={(v) => v + "%"} type="number" domain={[0, maxPct]} />
                <YAxis tick={{ fill: COL.mut, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={fmt0} width={52} />
                <Tooltip content={<CustomTooltip />} />
                {markers.map((m) => (
                  <ReferenceLine key={m.a + m.label} x={m.a} stroke={m.tone} strokeDasharray={m.cap ? undefined : "4 4"} strokeOpacity={m.cap ? 0.8 : 0.55} strokeWidth={m.cap ? 2 : 1}
                    label={{ value: m.label, position: "top", fill: m.tone, fontSize: 11 }} />
                ))}
                {hasHere && <ReferenceLine x={herePct} stroke={COL.total} strokeOpacity={0.9} strokeWidth={2}
                  label={{ value: "You are here", position: "top", fill: COL.total, fontSize: 11, fontWeight: 600 }} />}
                {(!hasHere || pct !== herePct) && <ReferenceLine x={pct} stroke={COL.text} strokeOpacity={0.5} strokeDasharray="2 3" />}
                <Line type="monotone" dataKey="base" stroke={COL.base} strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="commission" stroke={COL.comm} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total" stroke={COL.total} strokeWidth={2.6} dot={false} />
                {hasHere && <ReferenceDot x={herePct} y={Math.round(hereToday.totalEarnings)} r={6} fill={COL.total} stroke={COL.bg} strokeWidth={2} />}
                {(!hasHere || pct !== herePct) && <ReferenceDot x={pct} y={Math.round(here.totalEarnings)} r={5} fill={COL.text} stroke={COL.bg} strokeWidth={2} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* scrub */}
        <div style={{ background: COL.panel, border: `1px solid ${COL.line}`, borderRadius: 16, padding: "18px 20px", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: COL.mut, fontSize: 13 }}>Drag to explore where you could land</div>
            <div style={{ fontWeight: 700, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
              {pct}% of quota
              {hasHere && pct !== herePct && <span style={{ color: COL.mut, fontWeight: 400, fontSize: 13 }}>  ·  {pct > herePct ? "+" : ""}{pct - herePct} from today</span>}
            </div>
          </div>
          <input type="range" min={0} max={maxPct} value={pct} onChange={(e) => setPct(Number(e.target.value))} style={{ width: "100%", marginTop: 12, accentColor: COL.total }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
            <Stat label="Total earnings here" value={fmt(here.totalEarnings)} tone={COL.total} note={hasHere ? (pct !== herePct ? `${pct > herePct ? "+" : ""}${fmt(here.totalEarnings - hereToday.totalEarnings)} vs today` : "right where you are now") : null} />
            <Stat label="Commission here" value={fmt(here.commission)} tone={COL.comm} note={here.belowFloor ? "below the floor, no commission yet" : null} />
            <Stat label="The next 10 points are worth" value={"+" + fmt(next)} tone={COL.text} note={pct < 100 ? "climbs as you cross each accelerator" : "up in the accelerator bands, every point counts more"} />
          </div>
        </div>

        <div style={{ color: COL.mut, fontSize: 12, textAlign: "center", marginTop: 18 }}>
          Built live from your plan. Where your plan stops defining rates, we say so rather than guessing.
        </div>
      </div>
    </div>
  );
}
