import React, { useState, useRef } from "react";

/*
  SeeWhatMoreIsWorth — production screen component for Earn The Carrot.

  Personal by default: pass in the rep's real earnings functions and plan
  facts. Sample values are ONLY a fallback so the component renders before
  the comp engine is wired.

  Props:
    grossAt(pct)      -> gross earnings at an attainment %   (from comp engine)
    takeHomeAt(pct)   -> take-home at an attainment %        (from comp engine)
    planMin           -> slider floor          (default 75)
    planMax           -> slider ceiling / cap  (default 200)
    minSeparation     -> min gap between markers (default 10)
    milestones        -> tick %s the plan calls out (default [75,100,125,150,175,200])
    topTierName       -> plan's name for its top tier, e.g. "President's Club"
                         (drives the dynamic title; null = generic title)
    defaultTarget     -> initial target % (default 110)
    defaultStretch    -> initial stretch % (default 150)
    onContinue()      -> called by the CTA to move into territory strategy

  All CSS is scoped under .swmiw-root so it will not touch app-wide styles.
*/

// ---- sample fallback engine (replaced by real comp engine via props) ----
const SAMPLE = {
  base: 80000, ratePerPct: 800,
  tiers: [{ from: 0, to: 100, mult: 1 }, { from: 100, to: 125, mult: 1.5 }, { from: 125, to: 200, mult: 2 }],
  cap: 200, k401: 0.06, healthcare: 4800, tax: 0.28,
};
function sampleGross(pct) {
  const p = Math.min(pct, SAMPLE.cap); let v = 0;
  for (const t of SAMPLE.tiers) if (p > t.from) v += (Math.min(p, t.to) - t.from) * SAMPLE.ratePerPct * t.mult;
  return SAMPLE.base + v;
}
function sampleTakeHome(pct) {
  const g = sampleGross(pct), r = g * SAMPLE.k401, taxable = g - r - SAMPLE.healthcare;
  return Math.round(g - r - SAMPLE.healthcare - taxable * SAMPLE.tax);
}
const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");

function CarrotMark({ size = 22, color = "#E8642C" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 8c-3.2 1-6 4.4-7.4 9.2-.3 1 .6 1.9 1.6 1.6C10 17.4 13.4 14.6 14.4 11.4" />
      <path d="M14.5 9.5 19 5" />
      <path d="M14.2 7.6c.5-1.7 2-2.6 3.6-2.4M16.6 10.2c1.7-.4 2.8-1.7 2.9-3.3" />
    </svg>
  );
}

export default function SeeWhatMoreIsWorth({
  grossAt: grossProp,
  takeHomeAt: thProp,
  planMin = 75,
  planMax = 200,
  minSeparation = 10,
  milestones = [75, 100, 125, 150, 175, 200],
  topTierName = null,
  defaultTarget = 110,
  defaultStretch = 150,
  crumb = "Step 5 of 8",
  onContinue = () => {},
  onCommit = () => {},   // called when a marker drag ends, so the parent can persist
}) {
  const grossAt = grossProp || sampleGross;
  const takeHomeAt = thProp || sampleTakeHome;
  const MIN = planMin, MAX = planMax, SEP = minSeparation;

  const [target, setTarget] = useState(Math.max(MIN, Math.min(defaultTarget, defaultStretch - SEP)));
  const [stretch, setStretch] = useState(Math.min(MAX, Math.max(defaultStretch, defaultTarget + SEP)));
  const dragRef = useRef(null);
  const trackRef = useRef(null);

  const toPct = (v) => ((v - MIN) / (MAX - MIN)) * 100;
  const fromClientX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.max(0, Math.min(1, f));
    return Math.round(MIN + f * (MAX - MIN));
  };
  const down = (which) => (e) => { e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = which; };
  const move = (e) => {
    if (!dragRef.current) return;
    const v = fromClientX(e.clientX);
    if (dragRef.current === "target") setTarget(Math.max(MIN, Math.min(v, stretch - SEP)));
    else setStretch(Math.min(MAX, Math.max(v, target + SEP)));
  };
  const up = (e) => { dragRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} onCommit({ target, stretch }); };

  // Net / Gross definitions, shown on hover.
  const NET_DEF = "Estimated take-home after taxes, 401k, healthcare, and other deductions. Real withholding varies; load a pay statement later to make it exact.";
  const GROSS_DEF = "Your total earnings before any deductions. Base salary plus commission.";
  const Info = ({ text }) => (
    <span className="info" tabIndex={0} aria-label={text}>i<span className="bub">{text}</span></span>
  );

  const baseQuota = takeHomeAt(100);
  const tGross = grossAt(target), tTH = takeHomeAt(target);
  const sGross = grossAt(stretch), sTH = takeHomeAt(stretch);
  const tVsQuota = tTH - baseQuota;
  const sVsQuota = sTH - baseQuota;
  const gap = sTH - tTH;
  const title = topTierName ? `What Is ${topTierName} Worth?` : "How Much More Is On The Table?";

  return (
    <div className="swmiw-root">
      <style>{`
        .swmiw-root{ font-family:'Hanken Grotesk',sans-serif; color:#1A1410; max-width:520px; margin:0 auto; }
        .swmiw-root *{ box-sizing:border-box; }
        .swmiw-root .topbar{ padding:4px 0 8px; }
        .swmiw-root .crumb{ font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:#B07A4E; font-weight:600; }
        .swmiw-root .screen-title{ font-family:'Playfair Display',serif; font-size:26px; line-height:1.1; font-weight:700; margin-top:5px; }
        .swmiw-root .screen-sub{ font-size:13px; color:#6E5B49; margin-top:7px; line-height:1.4; }

        .swmiw-root .sliderbox{ padding:48px 6px 8px; }
        .swmiw-root .stage{ position:relative; height:56px; }
        .swmiw-root .track{ position:absolute; top:26px; left:0; right:0; height:8px; border-radius:999px; background:#EADBC9; }
        .swmiw-root .band{ position:absolute; top:26px; height:8px; border-radius:999px; background:linear-gradient(90deg,#E8642C,#5AA66E); }
        .swmiw-root .bandtag{ position:absolute; top:-42px; transform:translateX(-50%); white-space:nowrap;
          font-family:'Playfair Display',serif; font-weight:700; font-size:14px; color:#2E7D43;
          background:#EAF6ED; border:1px solid #BFE0C9; padding:4px 12px; border-radius:999px; box-shadow:0 5px 12px -5px rgba(46,125,67,.45); }
        .swmiw-root .thumb{ position:absolute; top:14px; width:30px; height:30px; border-radius:50%; transform:translateX(-50%);
          cursor:grab; touch-action:none; display:flex; align-items:center; justify-content:center;
          box-shadow:0 5px 14px rgba(0,0,0,.28); border:4px solid #FFFDFA; }
        .swmiw-root .thumb:active{ cursor:grabbing; } .swmiw-root .thumb.t{ background:#E8642C; } .swmiw-root .thumb.s{ background:#5AA66E; }
        .swmiw-root .thumb i{ width:6px; height:6px; border-radius:50%; background:#FFFDFA; }
        .swmiw-root .flag{ position:absolute; top:-14px; transform:translateX(-50%); white-space:nowrap; text-align:center; }
        .swmiw-root .flag .pc{ font-family:'Playfair Display',serif; font-weight:700; font-size:17px; line-height:1; }
        .swmiw-root .flag .nm{ font-size:9px; letter-spacing:.06em; text-transform:uppercase; font-weight:700; }
        .swmiw-root .flag.t .pc{ color:#E8642C } .swmiw-root .flag.t .nm{ color:#C25A28 }
        .swmiw-root .flag.s .pc{ color:#2E7D43 } .swmiw-root .flag.s .nm{ color:#2E7D43 }
        .swmiw-root .miles{ position:relative; height:18px; margin-top:4px; }
        .swmiw-root .mile{ position:absolute; transform:translateX(-50%); text-align:center; }
        .swmiw-root .mile .dot{ width:4px; height:4px; border-radius:50%; background:#CBB6A0; margin:0 auto 3px; }
        .swmiw-root .mile .mv{ font-size:9.5px; font-weight:600; color:#8A7460; }
        .swmiw-root .mile .ml{ font-size:8.5px; color:#B09A82; margin-top:1px; }

        .swmiw-root .pair{ display:flex; gap:11px; margin-top:6px; }
        .swmiw-root .gcard{ flex:1; border-radius:16px; padding:13px; border:1.5px solid; }
        .swmiw-root .gcard.t{ border-color:#F0CBB4; background:#FFF6EF; }
        .swmiw-root .gcard.s{ border-color:#C6E3CE; background:#F1F8F2; }
        .swmiw-root .gcard .h{ display:flex; align-items:center; gap:6px; font-weight:700; font-size:13px; }
        .swmiw-root .gcard.t .h{ color:#C25A28; } .swmiw-root .gcard.s .h{ color:#2E7D43; }
        .swmiw-root .gcard .pc{ font-size:10.5px; color:#8A7460; margin-top:1px; }
        .swmiw-root .gcard .lab{ font-size:9.5px; letter-spacing:.04em; text-transform:uppercase; color:#9A8775; display:flex; align-items:center; gap:4px; }
        /* Net is the hero number; gross sits below it, smaller and muted. */
        .swmiw-root .gcard .netblock{ margin-top:10px; }
        .swmiw-root .gcard .netval{ font-family:'Playfair Display',serif; font-size:30px; font-weight:700; line-height:1.05; margin-top:1px; }
        .swmiw-root .gcard.t .netval{ color:#C25A28; } .swmiw-root .gcard.s .netval{ color:#2E7D43; }
        .swmiw-root .gcard .grossblock{ margin-top:9px; }
        .swmiw-root .gcard .grossval{ font-family:'Playfair Display',serif; font-size:16px; font-weight:600; color:#7A6A55; margin-top:1px; }
        /* Info dot + hover bubble for the Net / Gross definitions. */
        .swmiw-root .info{ position:relative; display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; border-radius:50%;
          border:1px solid #C9B49E; color:#9A8775; font-size:9px; font-style:italic; font-weight:700; cursor:help; font-family:Georgia,serif; }
        .swmiw-root .info .bub{ position:absolute; bottom:140%; left:50%; transform:translateX(-50%); width:190px; background:#1A1410; color:#F7EFE6;
          font-size:11px; line-height:1.4; letter-spacing:0; text-transform:none; font-weight:500; padding:8px 10px; border-radius:8px; box-shadow:0 8px 20px -6px rgba(0,0,0,.5);
          opacity:0; visibility:hidden; transition:opacity .15s; z-index:5; pointer-events:none; }
        .swmiw-root .info:hover .bub, .swmiw-root .info:focus .bub{ opacity:1; visibility:visible; }
        .swmiw-root .gcard .add{ font-size:12px; font-weight:700; margin-top:10px; }
        .swmiw-root .gcard.t .add{ color:#C25A28; } .swmiw-root .gcard.s .add{ color:#2E7D43; }
        .swmiw-root .gcard .add.hero{ background:#E9F7EC; border-radius:8px; padding:6px 9px; font-size:13px; }

        .swmiw-root .hero{ margin-top:12px; border-radius:18px; padding:18px; text-align:center; color:#F4FBF5;
          background:linear-gradient(150deg,#1F3D2A,#2E7D43); box-shadow:0 14px 32px -16px rgba(46,125,67,.6); }
        .swmiw-root .hero .lab{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#A7D6B5; font-weight:600; }
        .swmiw-root .hero .big{ font-family:'Playfair Display',serif; font-size:44px; font-weight:700; line-height:1; margin:6px 0; color:#fff; }
        .swmiw-root .hero .desc{ font-size:12px; color:#C8E6CF; line-height:1.45; max-width:300px; margin:0 auto; }

        .swmiw-root .coach{ margin-top:14px; border:1px solid #EFE0CF; border-radius:16px; padding:15px; background:#FBF4EC; }
        .swmiw-root .coach .ttl{ display:flex; align-items:center; gap:7px; font-family:'Playfair Display',serif; font-weight:600; font-size:14.5px; }
        .swmiw-root .coach p{ font-size:12.5px; color:#5C4A3A; line-height:1.5; margin-top:8px; }
        .swmiw-root .coach b{ color:#1A1410; }

        .swmiw-root .confidence{ margin-top:12px; padding:15px; border:1px solid #C6E3CE; background:#F1F8F2; border-radius:16px; }
        .swmiw-root .confidence .lead{ font-size:12.5px; font-weight:700; color:#1F3D2A; }
        .swmiw-root .confidence ul{ list-style:none; margin:10px 0 0; padding:0; display:flex; flex-direction:column; gap:8px; }
        .swmiw-root .confidence li{ display:flex; align-items:center; gap:9px; font-size:12.5px; color:#37503F; font-weight:500; }
        .swmiw-root .confidence li svg{ flex:none; }
        .swmiw-root .confidence .note{ margin-top:11px; padding-top:10px; border-top:1px dashed #C6E3CE; font-size:12px; color:#2E7D43; line-height:1.5; font-weight:500; }

        .swmiw-root .ctaWrap{ padding:16px 0 4px; }
        .swmiw-root .cta{ width:100%; border:none; cursor:pointer; padding:14px 18px; border-radius:15px; font-family:'Hanken Grotesk'; color:#fff;
          background:linear-gradient(135deg,#E8642C,#FF8A4C); box-shadow:0 12px 26px -12px rgba(232,100,44,.7); transition:.18s;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
        .swmiw-root .cta:hover{ transform:translateY(-1px); }
        .swmiw-root .cta .ctaMain{ font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px; }
        .swmiw-root .cta .ctaSub{ font-size:11.5px; font-weight:500; color:#FFE7D5; }
      `}</style>

      <div className="topbar">
        <div className="crumb">{crumb}</div>
        <div className="screen-title">{title}</div>
        <div className="screen-sub">Move your Target and Stretch goals to see how much additional take-home income is possible.</div>
      </div>

      <div className="sliderbox">
        <div className="stage" ref={trackRef}>
          <div className="track" />
          <div className="band" style={{ left: toPct(target) + "%", width: (toPct(stretch) - toPct(target)) + "%" }} />
          <div className="bandtag" style={{ left: (toPct(target) + toPct(stretch)) / 2 + "%" }}>+{fmt(gap)}</div>
          <div className="flag t" style={{ left: toPct(target) + "%" }}><div className="pc">{target}%</div><div className="nm">Target</div></div>
          <div className="thumb t" style={{ left: toPct(target) + "%" }} onPointerDown={down("target")} onPointerMove={move} onPointerUp={up}><i /></div>
          <div className="flag s" style={{ left: toPct(stretch) + "%" }}><div className="pc">{stretch}%</div><div className="nm">Stretch</div></div>
          <div className="thumb s" style={{ left: toPct(stretch) + "%" }} onPointerDown={down("stretch")} onPointerMove={move} onPointerUp={up}><i /></div>
        </div>
        <div className="miles">
          {milestones.map((m) => {
            const v = typeof m === "object" ? m.v : m;
            const label = typeof m === "object" ? m.label : "";
            return (
              <div key={v} className="mile" style={{ left: toPct(v) + "%" }}>
                <div className="dot" /><div className="mv">{v}%</div>
                {label ? <div className="ml">{label}</div> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pair">
        <div className="gcard t">
          <div className="h"><CarrotMark size={14} color="#E8642C" /> Target Goal</div>
          <div className="pc">{target}% of plan</div>
          <div className="netblock">
            <div className="lab">Estimated take-home <Info text={NET_DEF} /></div>
            <div className="netval">{fmt(tTH)}</div>
          </div>
          <div className="grossblock">
            <div className="lab">Gross <Info text={GROSS_DEF} /></div>
            <div className="grossval">{fmt(tGross)}</div>
          </div>
          <div className="add">+{fmt(tVsQuota)} net vs quota</div>
        </div>
        <div className="gcard s">
          <div className="h"><CarrotMark size={14} color="#2E7D43" /> Stretch Goal</div>
          <div className="pc">{stretch}% of plan</div>
          <div className="netblock">
            <div className="lab">Estimated take-home <Info text={NET_DEF} /></div>
            <div className="netval">{fmt(sTH)}</div>
          </div>
          <div className="grossblock">
            <div className="lab">Gross <Info text={GROSS_DEF} /></div>
            <div className="grossval">{fmt(sGross)}</div>
          </div>
          <div className="add hero">+{fmt(gap)} net vs target</div>
        </div>
      </div>

      <div className="hero">
        <div className="lab">Additional Take Home</div>
        <div className="big">+{fmt(gap)}</div>
        <div className="desc">The difference between your Target and Stretch goals, after taxes, deductions, healthcare, and 401k.</div>
      </div>

      <div className="coach">
        <div className="ttl"><CarrotMark size={16} color="#E8642C" /> Coach Observation</div>
        <p>Moving from <b>{target}%</b> to <b>{stretch}%</b> of plan is worth an additional <b>{fmt(gap)}</b> in take-home income. Most reps know what their quota is. Very few know what missing their stretch goal actually costs them. The next step is figuring out whether your territory can realistically support that goal.</p>
      </div>

      <div className="confidence">
        <div className="lead">To reach {stretch}%, Coach will work with you to:</div>
        <ul>
          {["Build a territory strategy", "Identify pipeline gaps", "Focus on the highest-value activities", "Track progress against your goals"].map((t) => (
            <li key={t}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              {t}
            </li>
          ))}
        </ul>
        <div className="note">Getting from {target}% to {stretch}% is doable. Coach works with you to find the simplest, fastest paths to reach it, and where your territory allows, the ways to push past it.</div>
      </div>

      <div className="ctaWrap">
        <button className="cta" onClick={() => onContinue({ target, stretch, gap })}>
          <span className="ctaMain">Build My Territory Strategy <span style={{ fontSize: 17, lineHeight: 1 }}>→</span></span>
          <span className="ctaSub">Coach will work with you to build out your plan of attack</span>
        </button>
      </div>
    </div>
  );
}
