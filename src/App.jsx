// STYLE RULE: No hyphens or em dashes used as pauses in visible text.
// Use periods or commas instead. Numeric ranges like 10-15 are fine.
import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart, Label } from "recharts";
import SeeWhatMoreIsWorth from "./SeeWhatMoreIsWorth";
import DealBreakdown from "./DealBreakdown";
import AccountsImport from "./AccountsImport";
import PayoutCurveScreen from "./PayoutCurve";
import { toEarningsPlan } from "./lib/planAdapter";
import { computeEarnings } from "./lib/earnings";
import { authClient } from "./lib/auth";

const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --carrot:#F4711A;--carrot-dark:#C85A0D;--carrot-light:#FDE8D8;
  --green:#2D6A4F;--green-light:#D8F3DC;
  --gold:#E9C46A;--gold-light:#FFF9E6;
  --cream:#FFFAF4;--ink:#1A1208;--muted:#7A6A55;--border:#EDE0CC;
  --dark:#0F0A05;--dark2:#1A1208;
}
body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--ink);font-size:18px;}

@keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}

/* ── NAV ── */
.lnav{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 48px;
  background:rgba(15,10,5,0.7);
  transition:background 0.3s;
}
.lnav.scrolled{background:rgba(15,10,5,0.94);backdrop-filter:blur(14px);}
.nav-logo{
  font-family:'Playfair Display',serif;font-size:25px;font-weight:900;
  color:var(--carrot);cursor:pointer;background:none;border:none;
}
.nav-links{display:flex;align-items:center;gap:32px;}
.nav-link{
  color:rgba(255,255,255,0.65);font-size:18px;font-weight:500;
  cursor:pointer;transition:color 0.2s;background:none;border:none;
  font-family:'DM Sans',sans-serif;text-decoration:none;
}
.nav-link:hover{color:white;}
.nav-cta{
  background:var(--carrot);color:white;border:none;border-radius:100px;
  padding:10px 22px;font-size:18px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all 0.2s;
}
.nav-cta:hover{background:var(--carrot-dark);transform:translateY(-1px);box-shadow:0 6px 20px rgba(244,113,26,0.35);}

/* ── HERO ── */
.hero{background:var(--dark);padding:88px 24px 100px;text-align:center;}
.hero-badge{
  display:inline-flex;align-items:center;
  background:rgba(244,113,26,0.15);border:1px solid rgba(244,113,26,0.3);
  border-radius:100px;padding:6px 18px;font-size:18px;font-weight:700;
  color:#FDBA74;letter-spacing:0.5px;margin-bottom:28px;
}
.hero-carrot{
  font-size:85px;line-height:1;display:inline-block;
  margin-bottom:28px;animation:bounce 2.2s ease-in-out infinite;
}
.hero-title{
  font-family:'Playfair Display',serif;font-size:69px;font-weight:900;
  color:white;line-height:1.06;
  max-width:820px;margin:0 auto 24px;
}
.hero-title .hl{color:var(--carrot);}
.hero-sub{
  font-size:29px;color:rgba(255,255,255,0.6);line-height:1.5;
  max-width:560px;margin:0 auto 36px;
}
.hero-cta{
  display:inline-block;background:var(--carrot);color:white;border:none;
  border-radius:100px;padding:18px 42px;font-size:22px;font-weight:700;
  cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;
  margin-bottom:24px;
}
.hero-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.hero-hint{font-size:22px;color:rgba(255,255,255,0.65);line-height:1.8;}

/* ── CARROTS SECTION ── */
.carrots-section{background:var(--cream);padding:96px 24px;}
.sec-inner{max-width:900px;margin:0 auto;}
.sec-label{
  font-family:'Playfair Display',serif;font-size:33px;font-weight:700;
  color:var(--carrot);margin-bottom:8px;
}
.sec-title{
  font-family:'Playfair Display',serif;font-size:45px;font-weight:900;
  color:var(--ink);margin-bottom:40px;line-height:1.15;
}
.carrot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;}
.carrot-card{
  background:white;border:1.5px solid var(--border);border-radius:16px;
  padding:20px;display:flex;align-items:center;gap:14px;transition:all 0.2s;
}
.carrot-card:hover{border-color:var(--carrot);transform:translateY(-2px);box-shadow:0 6px 20px rgba(244,113,26,0.1);}
.carrot-card-emoji{font-size:29px;flex-shrink:0;}
.carrot-card-text{font-size:18px;font-weight:600;color:var(--ink);}
.carrots-p1{font-size:22px;color:var(--muted);line-height:1.65;margin-bottom:18px;}
.carrots-p2{font-size:24px;font-weight:700;color:var(--ink);line-height:1.55;margin-bottom:40px;}
.activities-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;}
.ac-step{font-size:18px;font-weight:600;color:var(--ink);}
.ac-step.last{color:var(--carrot);font-weight:800;}
.ac-arrow{color:var(--carrot);font-size:18px;font-weight:700;padding:0 6px;}

/* ── PROBLEM SECTION ── */
.problem-section{background:var(--dark2);padding:96px 24px;}
.problem-inner{max-width:960px;margin:0 auto;}
.prob-label{
  font-family:'Playfair Display',serif;font-size:33px;font-weight:700;
  color:var(--carrot);margin-bottom:8px;
}
.prob-title{
  font-family:'Playfair Display',serif;font-size:49px;font-weight:900;
  color:white;margin-bottom:40px;line-height:1.12;
}
.prob-lines{margin-bottom:36px;}
.prob-line{font-size:24px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:12px;}
.prob-line.bold{font-weight:700;color:white;font-size:25px;}
.prob-callout{
  border-left:3px solid var(--carrot);padding:22px 26px;margin-bottom:28px;
  background:rgba(255,255,255,0.03);border-radius:0 12px 12px 0;
}
.prob-callout-line{font-size:18px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:10px;}
.prob-callout-line:last-child{margin-bottom:0;}
.prob-bottom{
  background:rgba(244,113,26,0.1);border:1px solid rgba(244,113,26,0.22);
  border-radius:16px;padding:28px 32px;
}
.prob-bottom-bold{font-size:24px;font-weight:700;color:white;margin-bottom:10px;}
.prob-bottom-muted{font-size:18px;color:rgba(255,255,255,0.5);line-height:1.65;}
.prob-sub{font-size:22px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:36px;}
.prob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:28px;}
.prob-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;}
.prob-card.highlight{border-left:3px solid var(--carrot);}
.prob-card-label{font-size:16px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;}
.prob-card-label.orange{color:var(--carrot);}
.prob-card-label.red{color:#FCA5A5;}
.prob-card-line{font-size:18px;color:rgba(255,255,255,0.8);line-height:1.5;margin-bottom:10px;display:flex;gap:8px;align-items:flex-start;}
.prob-card-note{font-size:18px;color:rgba(255,255,255,0.45);line-height:1.6;margin-top:14px;}
.prob-final{background:rgba(15,10,5,0.6);border:1.5px solid rgba(244,113,26,0.4);border-radius:20px;padding:32px;text-align:center;}
.prob-final-title{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:white;margin-bottom:12px;}
.prob-final-sub{font-size:22px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:20px;}
.prob-final-line{font-size:18px;color:rgba(255,255,255,0.45);line-height:1.8;}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .lnav{padding:14px 20px;}
  .nav-links{display:none;}
  .hero-title{font-size:43px;}
  .hero-sub{font-size:24px;}
  .sec-title{font-size:35px;}
  .prob-title{font-size:37px;}
  .carrot-grid{grid-template-columns:repeat(2,1fr);}
  .prob-grid{grid-template-columns:1fr;}
}
@media(max-width:480px){
  .hero{padding:60px 20px 72px;}
  .hero-title{font-size:43px;}
  .hero-sub{font-size:22px;}
  .carrots-section,.problem-section{padding:64px 20px;}
  .carrot-grid{grid-template-columns:1fr;}
  .prob-title{font-size:33px;}
}
`;

const CARROT_CARDS = [
  { emoji: "✈️", text: "A family vacation" },
  { emoji: "⛳", text: "A new set of golf clubs" },
  { emoji: "💳", text: "Paying off debt" },
  { emoji: "🎓", text: "College tuition" },
  { emoji: "⛵", text: "A new boat" },
  { emoji: "🏠", text: "Financial freedom" },
];

const ACTIVITY_STEPS = ["Calls", "Meetings", "Opportunities", "Deals", "Commission"];

// ── ONBOARDING DATA / HELPERS ────────────────────────────────────────
const STATE_TAXES = {
  "Alabama":2.5,"Alaska":0,"Arizona":2.5,"Arkansas":4.4,"California":9.3,
  "Colorado":4.4,"Connecticut":5.0,"Delaware":5.2,"Florida":0,"Georgia":5.49,
  "Hawaii":7.9,"Idaho":5.8,"Illinois":4.95,"Indiana":3.05,"Iowa":4.4,
  "Kansas":5.2,"Kentucky":4.0,"Louisiana":3.0,"Maine":7.15,"Maryland":5.1,
  "Massachusetts":5.0,"Michigan":4.25,"Minnesota":6.8,"Mississippi":4.7,
  "Missouri":4.8,"Montana":6.75,"Nebraska":5.2,"Nevada":0,"New Hampshire":0,
  "New Jersey":6.37,"New Mexico":4.9,"New York":6.85,"North Carolina":4.5,
  "North Dakota":2.5,"Ohio":3.5,"Oklahoma":4.75,"Oregon":9.9,"Pennsylvania":3.07,
  "Rhode Island":4.75,"South Carolina":6.4,"South Dakota":0,"Tennessee":0,
  "Texas":0,"Utah":4.65,"Vermont":6.6,"Virginia":5.75,"Washington":0,
  "West Virginia":5.12,"Wisconsin":5.3,"Wyoming":0,"Washington D.C.":8.5,
};
const STATES = Object.keys(STATE_TAXES).sort();
const AGE_BRACKETS = ["Under 50", "50-59", "60-63", "64+"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const K401_LIMITS = { "Under 50": 23500, "50-59": 31000, "60-63": 34750, "64+": 31000 };

function getFedBracket(income) {
  if (income <= 11925)  return { rate: 10 };
  if (income <= 48475)  return { rate: 12 };
  if (income <= 103350) return { rate: 22 };
  if (income <= 197300) return { rate: 24 };
  if (income <= 250525) return { rate: 32 };
  if (income <= 626350) return { rate: 35 };
  return { rate: 37 };
}
const fmt = (n) => "$" + Math.round(n || 0).toLocaleString();

// Display title for a parsed plan: source file name, then plan_name, then a fallback.
const planTitle = (p) => {
  const sf = p && p.provenance && p.provenance.source_files;
  if (Array.isArray(sf) && sf.length > 0 && sf[0]) return sf[0];
  if (p && p.meta && p.meta.plan_name) return p.meta.plan_name;
  return "Your plan";
};

// Collect the questions the rep flagged for their manager, across all plans.
// Each item carries its question text and the plan source_quote (or null).
const collectFlaggedQuestions = (plans, flags) => {
  const out = [];
  plans.forEach((p) => {
    const heading = planTitle(p);
    const qs = Array.isArray(p && p.provenance && p.provenance.needs_clarification)
      ? p.provenance.needs_clarification
      : [];
    qs.forEach((q, qi) => {
      const key = heading + "::" + (q && q.field ? q.field : qi);
      if (flags[key] && q && q.question) {
        out.push({ question: q.question, source_quote: q.source_quote || null });
      }
    });
  });
  return out;
};

const FLOW = ["confirm", "summary", "real_pay_motivation", "create_account", "build_strategy"];
const FLOW_LABELS = ["Confirm", "Summary", "Real Pay", "Account", "Strategy"];
const DASH_TABS = [
  { key: "home", ico: "🏠", lbl: "Home" },
  { key: "update", ico: "✏️", lbl: "Update" },
  { key: "carrots", ico: "🥕", lbl: "Carrots" },
  { key: "plan", ico: "📋", lbl: "My Plan" },
  { key: "settings", ico: "⚙️", lbl: "Settings" },
];

const OB_STYLES = `
.ob{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.ob-top{position:sticky;top:0;z-index:50;background:rgba(255,250,244,0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;padding:14px 20px;}
.ob-back{background:white;border:1.5px solid var(--border);border-radius:100px;padding:7px 16px;font-size:18px;font-weight:600;color:var(--muted);cursor:pointer;font-family:'DM Sans',sans-serif;}
.ob-back:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-progress{flex:1;display:flex;gap:6px;align-items:center;justify-content:center;}
.ob-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all 0.3s;}
.ob-dot.active{background:var(--carrot);width:26px;border-radius:4px;}
.ob-dot.done{background:var(--green);}
.ob-steplbl{font-size:18px;font-weight:700;color:var(--muted);min-width:48px;text-align:right;}
.ob-screen{max-width:1240px;margin:0 auto;padding:34px 40px 70px;animation:fadeUp 0.35s ease;}
.ob-eyebrow{font-size:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--carrot);margin-bottom:8px;}
.ob-h1{font-family:'Playfair Display',serif;font-size:35px;font-weight:900;color:var(--ink);margin-bottom:8px;line-height:1.15;}
.ob-subt{font-size:18px;color:var(--muted);line-height:1.55;margin-bottom:26px;}
.ob-field{margin-bottom:18px;}
.ob-label{display:block;font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.ob-inp{width:100%;padding:13px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:18px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);}
.ob-inp:focus{outline:none;border-color:var(--carrot);}
select.ob-inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A6A55' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}
.ob-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.ob-btn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:22px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;margin-top:10px;}
.ob-btn:hover{background:var(--carrot-dark);}
.ob-btn:disabled{opacity:0.4;cursor:not-allowed;}
.ob-card{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:16px;}
.ob-note{background:var(--green-light);border:1px solid var(--green);border-radius:12px;padding:12px 16px;font-size:18px;color:var(--green);line-height:1.5;margin-bottom:20px;display:flex;gap:10px;}
.ob-drop{border:2px dashed var(--border);border-radius:18px;padding:44px 24px;text-align:center;cursor:pointer;background:white;transition:all 0.2s;margin-bottom:16px;}
.ob-drop:hover{border-color:var(--carrot);background:var(--carrot-light);}
.ob-drop.has{border-style:solid;border-color:var(--green);background:var(--green-light);}
.ob-coach{background:linear-gradient(145deg,#0F0A05,#2D1A0A);border-radius:20px;padding:22px;color:white;margin-bottom:18px;}
.ob-coach-badge{display:inline-block;font-size:16px;font-weight:700;padding:3px 10px;border-radius:100px;background:rgba(244,113,26,0.25);color:#FDBA74;margin-bottom:12px;}
.ob-coach-line{font-size:18px;line-height:1.65;color:rgba(255,255,255,0.85);margin-bottom:8px;}
.ob-coach-line:last-child{margin-bottom:0;}
.ob-ote{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:20px;padding:26px;color:white;margin-bottom:18px;text-align:center;}
.ob-ote-lbl{font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.85;margin-bottom:6px;}
.ob-ote-val{font-family:'Playfair Display',serif;font-size:51px;font-weight:900;line-height:1;}
.ob-split{display:flex;gap:12px;margin-top:18px;}
.ob-split-item{flex:1;background:rgba(255,255,255,0.16);border-radius:12px;padding:12px;}
.ob-split-k{font-size:16px;opacity:0.85;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.ob-split-v{font-size:23px;font-weight:800;}
.ob-stat{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid var(--border);}
.ob-stat:last-child{border-bottom:none;}
.ob-stat-lbl{font-size:18px;color:var(--muted);}
.ob-stat-sub{font-size:16px;color:var(--muted);opacity:0.8;}
.ob-stat-val{font-size:22px;font-weight:700;color:var(--ink);text-align:right;}
.ob-stat-val.green{color:var(--green);}
.ob-stat-val.red{color:#DC2626;}
.ob-tabs{display:flex;gap:6px;background:var(--cream);border:1.5px solid var(--border);border-radius:14px;padding:5px;margin-bottom:22px;}
.ob-tab{flex:1;padding:11px 6px;border:none;background:none;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:700;font-size:18px;color:var(--muted);}
.ob-tab.on{background:white;color:var(--carrot);box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.ob-slider{width:100%;accent-color:var(--carrot);cursor:pointer;margin:8px 0 4px;}
.ob-target{font-family:'Playfair Display',serif;font-size:59px;font-weight:900;color:var(--carrot);text-align:center;line-height:1;}
.ob-target-sub{text-align:center;font-size:18px;color:var(--muted);margin-bottom:10px;}
.ob-add{width:100%;padding:13px;border:2px dashed var(--border);border-radius:14px;background:white;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--muted);font-size:18px;}
.ob-add:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-add:disabled{opacity:0.45;cursor:not-allowed;}
.ob-del{background:none;border:none;color:var(--muted);font-size:25px;cursor:pointer;line-height:1;}
.ob-del:hover{color:#DC2626;}
.ob-pill-row{display:flex;gap:8px;flex-wrap:wrap;}
.ob-pill{padding:8px 14px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.ob-pill.on{border-color:var(--carrot);background:var(--carrot);color:white;}
.ob-toggle{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:18px;color:var(--ink);font-weight:600;}
.ob-track{width:44px;height:25px;border-radius:100px;background:var(--border);position:relative;transition:all 0.2s;flex-shrink:0;}
.ob-track.on{background:var(--green);}
.ob-knob{position:absolute;top:2.5px;left:2.5px;width:20px;height:20px;border-radius:50%;background:white;transition:all 0.2s;}
.ob-track.on .ob-knob{left:21.5px;}
.ob-opt{border:2px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;background:white;margin-bottom:10px;transition:all 0.2s;}
.ob-opt:hover{border-color:var(--carrot);}
.ob-opt.on{border-color:var(--carrot);background:var(--carrot-light);}
.ob-money-line{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:12px;background:rgba(244,113,26,0.1);border:1px solid rgba(244,113,26,0.3);margin-bottom:14px;}
.ob-money-line .v{font-family:'Playfair Display',serif;font-size:27px;font-weight:900;color:var(--carrot-dark);}
.ob-sec-h{font-family:'Playfair Display',serif;font-size:25px;font-weight:700;margin:26px 0 4px;}
.ob-sec-sub{font-size:18px;color:var(--muted);margin-bottom:14px;line-height:1.5;}
/* dashboard */
.ob-dash{max-width:560px;margin:0 auto;padding:20px 16px 170px;animation:fadeUp 0.35s ease;}
.ob-dash-hero{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:22px;padding:26px;color:white;margin-bottom:20px;position:relative;overflow:hidden;}
.ob-dash-hero::after{content:'🥕';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:77px;opacity:0.13;}
.ob-dash-name{font-size:18px;opacity:0.9;margin-bottom:6px;}
.ob-dash-pct{font-family:'Playfair Display',serif;font-size:51px;font-weight:900;line-height:1;}
.ob-prog-bar{height:12px;background:var(--border);border-radius:6px;overflow:hidden;margin:8px 0 6px;}
.ob-prog-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot));border-radius:6px;transition:width 0.6s ease;}
.ob-metric{background:white;border:1.5px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;}
.ob-metric-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.ob-status{font-size:16px;font-weight:700;padding:3px 10px;border-radius:100px;}
.st-stretch{background:var(--green-light);color:var(--green);}
.st-floor{background:#EFF6FF;color:#1D4ED8;}
.st-below{background:#FEE2E2;color:#DC2626;}
.ob-carrotbar{position:fixed;bottom:62px;left:0;right:0;z-index:60;background:linear-gradient(135deg,#1A1208,#2D1A0A);color:white;padding:10px 16px;border-top:1px solid rgba(244,113,26,0.25);}
.ob-carrotbar-inner{max-width:560px;margin:0 auto;}
.ob-cb-top{display:flex;justify-content:space-between;align-items:center;font-size:18px;color:rgba(255,255,255,0.7);}
.ob-cb-amt{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:var(--carrot);}
.ob-cb-track{height:8px;background:rgba(255,255,255,0.15);border-radius:5px;overflow:hidden;margin-top:6px;}
.ob-cb-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot),var(--green));border-radius:5px;transition:width 0.6s ease;}
.ob-tabbar{position:fixed;bottom:0;left:0;right:0;z-index:70;display:flex;background:rgba(255,250,244,0.98);backdrop-filter:blur(10px);border-top:1px solid var(--border);}
.ob-tabbar-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 11px;border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.ob-tabbar-tab.on{color:var(--carrot);}
.ob-tabbar-ico{font-size:24px;line-height:1;}
.ob-tabbar-lbl{font-size:16px;font-weight:700;}
/* summary — comp fields */
.ob-card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.ob-card-title{font-size:18px;font-weight:700;color:var(--ink);}
.ob-badge-green{background:var(--green-light);color:var(--green);font-size:16px;font-weight:700;padding:4px 12px;border-radius:100px;}
.ob-frow{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);}
.ob-frow:last-child{border-bottom:none;}
.ob-fname{flex:1;font-size:18px;color:var(--ink);font-weight:600;}
.ob-fval{font-size:18px;font-weight:700;color:var(--ink);}
.ob-ebtn{background:none;border:1.5px solid var(--border);border-radius:8px;padding:5px 12px;font-size:18px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;}
.ob-ebtn:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-erow{display:flex;gap:8px;align-items:center;}
.ob-einp{width:120px;padding:8px 12px;border:1.5px solid var(--carrot);border-radius:8px;font-size:18px;font-family:'DM Sans',sans-serif;color:var(--ink);}
.ob-einp:focus{outline:none;}
.ob-save{background:var(--carrot);color:white;border:none;border-radius:8px;padding:8px 14px;font-weight:700;font-size:18px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.ob-cancel{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;font-family:'DM Sans',sans-serif;}
/* summary — tax box */
.ob-tax{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:20px;padding:24px;margin-bottom:20px;}
.ob-tax-title{font-size:18px;font-weight:800;color:#1D4ED8;margin-bottom:8px;}
.ob-tax-note{font-size:18px;color:#3B5BA5;line-height:1.5;margin-bottom:16px;}
.ob-tax-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #BFDBFE;gap:10px;}
.ob-tax-row:last-child{border-bottom:none;}
.ob-tax-lbl{font-size:18px;color:#1E3A8A;font-weight:600;}
.ob-tax-sub{font-size:16px;color:#3B5BA5;margin-top:2px;}
.ob-tax-val{font-size:18px;font-weight:700;color:#1E3A8A;text-align:right;}
.ob-tax-override{background:none;border:none;color:#1D4ED8;font-size:18px;font-weight:700;cursor:pointer;text-decoration:underline;font-family:'DM Sans',sans-serif;padding:0;margin-top:2px;}
.ob-tax-total{display:flex;align-items:center;justify-content:space-between;background:white;border-radius:12px;padding:14px 16px;margin-top:14px;}
.ob-tax-total-v{font-size:18px;font-weight:800;color:#1E3A8A;text-align:right;}
/* summary — 401k box */
.ob-401k{background:var(--green-light);border:1.5px solid var(--green);border-radius:16px;padding:18px 20px;margin-bottom:20px;}
.ob-401k-msg{font-size:18px;font-weight:700;color:var(--green);margin-bottom:6px;}
.ob-401k-sub{font-size:18px;color:#2D6A4F;opacity:0.9;line-height:1.5;}
/* confirm screen */
.cf-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.cf-top{position:sticky;top:0;z-index:50;background:rgba(255,250,244,0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;padding:14px 20px;}
.cf-step{font-size:16px;font-weight:700;color:var(--muted);}
.cf-screen{max-width:1160px;margin:0 auto;padding:30px 40px 90px;animation:fadeUp 0.35s ease;}
.cf-h1{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:var(--ink);margin-bottom:24px;line-height:1.15;}
.cf-card{background:white;border:1.5px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:20px;}
.cf-card-hdr{padding:18px 20px;border-bottom:1px solid var(--border);background:var(--cream);}
.cf-card-title{font-size:18px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;}
.cf-card-sub{font-size:16px;color:var(--muted);margin-top:4px;}
.cf-badge{font-size:15px;font-weight:700;padding:4px 12px;border-radius:100px;}
.cf-badge.green{background:var(--green-light);color:var(--green);}
.cf-row{display:flex;align-items:flex-start;gap:14px;padding:14px 20px;border-bottom:1px solid var(--border);}
.cf-row:last-child{border-bottom:none;}
.cf-row-body{flex:1;min-width:0;}
.cf-row-label{font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.cf-row-val{font-size:18px;font-weight:700;color:var(--ink);}
.cf-row-val.missing{font-size:18px;font-weight:500;font-style:italic;color:var(--carrot);}
.cf-tag{display:inline-flex;align-items:center;gap:4px;font-size:15px;font-weight:600;padding:2px 8px;border-radius:100px;margin-top:5px;}
.cf-tag.found{background:var(--green-light);color:var(--green);}
.cf-tag.verify{background:#FFF9E6;color:#7A5C00;}
.cf-ebtn{flex-shrink:0;background:none;border:1.5px solid var(--border);border-radius:10px;padding:7px 14px;font-size:16px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;}
.cf-ebtn:hover{border-color:var(--carrot);color:var(--carrot);}
.cf-edit{display:flex;gap:8px;align-items:center;margin-top:8px;}
.cf-einp{flex:1;min-width:0;padding:9px 12px;border:1.5px solid var(--carrot);border-radius:10px;font-size:18px;font-family:'DM Sans',sans-serif;color:var(--ink);}
.cf-einp:focus{outline:none;}
.cf-save{background:var(--carrot);color:white;border:none;border-radius:8px;padding:9px 14px;font-size:16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;}
.cf-cancel{background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.cf-q{padding:18px 20px;border-bottom:1px solid var(--border);}
.cf-q:last-child{border-bottom:none;}
.cf-q-label{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:4px;}
.cf-q-hint{font-size:16px;color:var(--muted);margin-bottom:10px;}
.cf-q-calc{font-size:16px;font-weight:700;color:var(--green);margin-top:8px;}
.cf-info{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:16px;padding:16px 20px;font-size:18px;color:#1E3A8A;line-height:1.6;margin-bottom:20px;}
.cf-cta{width:100%;padding:18px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:18px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.cf-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.cf-cta:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
/* real pay motivation screen */
.rpm-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.rpm-screen{max-width:600px;margin:0 auto;padding:30px 20px 90px;animation:fadeUp 0.35s ease;}
.rpm-h1{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:var(--ink);margin-bottom:24px;line-height:1.15;}
.rpm-dark{background:#0F0A05;border-radius:24px;padding:28px;margin-bottom:24px;}
.rpm-eyebrow{font-size:15px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--carrot);margin-bottom:10px;}
.rpm-dark-h{font-family:'Playfair Display',serif;font-size:31px;font-weight:900;color:white;line-height:1.2;margin-bottom:8px;}
.rpm-dark-sub{font-size:18px;color:rgba(255,255,255,0.6);margin-bottom:22px;line-height:1.5;}
.rpm-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.rpm-mcard{background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;}
.rpm-mcard.quota{border-color:var(--carrot);}
.rpm-mcard.stretch{border-color:#86EFAC;}
.rpm-mpct{font-family:'Playfair Display',serif;font-size:25px;font-weight:900;color:white;line-height:1;}
.rpm-mlabel{font-size:15px;color:rgba(255,255,255,0.6);margin-bottom:14px;font-weight:600;}
.rpm-mline{margin-bottom:8px;}
.rpm-mk{font-size:15px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
.rpm-mk.gross{color:rgba(255,255,255,0.55);}
.rpm-mk.net{color:#86EFAC;}
.rpm-mv{font-size:18px;font-weight:700;color:white;}
.rpm-mv.net{font-size:23px;font-weight:800;color:#86EFAC;}
.rpm-mbar{height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:12px;}
.rpm-mbar-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot));border-radius:3px;}
.rpm-stretchbox{background:rgba(244,113,26,0.12);border:1.5px solid rgba(244,113,26,0.35);border-radius:16px;padding:18px 20px;margin-top:18px;}
.rpm-stretchbox-big{font-family:'Playfair Display',serif;font-size:25px;font-weight:900;color:#FDBA74;margin-bottom:4px;}
.rpm-stretchbox-sub{font-size:18px;color:rgba(255,255,255,0.7);line-height:1.5;}
.rpm-slider-pct{font-family:'Playfair Display',serif;font-size:47px;font-weight:900;color:var(--carrot);text-align:center;line-height:1;margin-bottom:22px;}
.rpm-nums{display:flex;justify-content:space-around;gap:16px;margin-bottom:24px;text-align:center;flex-wrap:wrap;}
.rpm-num{flex:1;min-width:130px;}
.rpm-num-k{font-size:15px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px;}
.rpm-num-k.net{color:#86EFAC;}
.rpm-num-v{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:white;line-height:1;}
.rpm-num-v.net{font-size:41px;color:#86EFAC;}
.rpm-num-sub{font-size:15px;color:rgba(255,255,255,0.5);margin-top:8px;line-height:1.4;}
.rpm-range{width:100%;accent-color:var(--carrot);cursor:pointer;height:24px;margin:8px 0 4px;-webkit-appearance:none;appearance:none;background:transparent;}
.rpm-range::-webkit-slider-runnable-track{height:8px;border-radius:4px;background:rgba(255,255,255,0.15);}
.rpm-range::-moz-range-track{height:8px;border-radius:4px;background:rgba(255,255,255,0.15);}
.rpm-range::-moz-range-progress{height:8px;border-radius:4px;background:var(--carrot);}
.rpm-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:24px;height:24px;border-radius:50%;background:var(--carrot);margin-top:-8px;cursor:pointer;}
.rpm-range::-moz-range-thumb{width:24px;height:24px;border:none;border-radius:50%;background:var(--carrot);cursor:pointer;}
.rpm-track{height:10px;background:rgba(255,255,255,0.12);border-radius:5px;overflow:hidden;}
.rpm-track-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot));border-radius:5px;transition:width 0.15s ease;}
.rpm-markers{position:relative;height:44px;margin-top:10px;}
.rpm-marker{position:absolute;transform:translateX(-50%);text-align:center;}
.rpm-marker-pct{font-size:16px;font-weight:800;color:rgba(255,255,255,0.5);}
.rpm-marker-lbl{font-size:15px;color:rgba(255,255,255,0.4);font-weight:600;margin-top:2px;white-space:nowrap;}
.rpm-marker.on .rpm-marker-pct,.rpm-marker.on .rpm-marker-lbl{color:var(--carrot);}
.rpm-carrot-sub{font-size:18px;color:#7A6A55;line-height:1.6;padding:0 20px 14px;}
.rpm-amt{color:var(--carrot);font-weight:800;}
.rpm-pad{padding:0 20px 20px;}
.rpm-input{width:100%;padding:16px 18px;border:1.5px solid #EDE0CC;border-radius:14px;font-size:18px;font-family:'DM Sans',sans-serif;color:#1A1208;background:white;}
.rpm-input:focus{outline:none;border-color:var(--carrot);}
.rpm-input::placeholder{color:#B0A090;}
.rpm-q-label{font-size:18px;font-weight:700;color:#1A1208;margin-bottom:8px;}
.rpm-q-hint{font-size:16px;color:#7A6A55;margin-top:6px;}
.rpm-money{display:flex;align-items:center;border:1.5px solid #EDE0CC;border-radius:14px;overflow:hidden;background:white;}
.rpm-money span{padding:0 4px 0 16px;color:#7A6A55;font-weight:700;font-size:18px;}
.rpm-money input{flex:1;min-width:0;border:none;background:transparent;padding:16px 16px 16px 4px;font-size:18px;font-family:'DM Sans',sans-serif;color:#1A1208;}
.rpm-money input:focus{outline:none;}
.rpm-money input::placeholder{color:#B0A090;}
.rpm-pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;}
.rpm-pill{padding:9px 16px;border-radius:100px;border:1.5px solid #EDE0CC;background:white;font-size:18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:#7A6A55;}
.rpm-pill:hover{border-color:var(--carrot);color:var(--carrot);}
.rpm-pill.on{background:var(--carrot);border-color:var(--carrot);color:white;}
.rpm-img-label{font-size:16px;font-weight:700;color:#1A1208;margin:18px 0 10px;}
.rpm-findbtn{width:100%;background:white;border:1.5px solid var(--carrot);color:var(--carrot);border-radius:12px;padding:14px;font-weight:600;font-size:18px;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:18px;display:flex;align-items:center;justify-content:center;gap:8px;}
.rpm-findbtn:hover{background:var(--carrot-light);}
.rpm-findbtn:disabled{opacity:0.75;cursor:default;}
.rpm-findhint{font-size:16px;color:#7A6A55;text-align:center;margin-top:8px;}
.rpm-imgbox{position:relative;width:100%;height:200px;border-radius:16px;overflow:hidden;margin-top:18px;background:linear-gradient(135deg,#F4711A,#E9C46A,#2D6A4F);display:flex;align-items:center;justify-content:center;}
.rpm-imgbox img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.rpm-imgbox-fallback{position:relative;z-index:1;color:white;font-weight:800;font-size:18px;text-align:center;padding:16px;text-shadow:0 1px 4px rgba(0,0,0,0.4);}
.rpm-imgcap{text-align:center;color:var(--carrot);font-weight:700;font-size:18px;margin-top:10px;}
.rpm-retry{display:block;margin:6px auto 0;background:none;border:none;color:#7A6A55;font-size:16px;cursor:pointer;text-decoration:underline;font-family:'DM Sans',sans-serif;}
.rpm-goals{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;}
.rpm-goal{background:white;border:1px solid #EDE0CC;border-radius:20px;padding:24px;text-align:center;}
.rpm-goal.target{border-top:3px solid var(--carrot);}
.rpm-goal.stretch{border-top:3px solid var(--green);}
.rpm-goal-lbl{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;}
.rpm-goal.target .rpm-goal-lbl{color:var(--carrot);}
.rpm-goal.stretch .rpm-goal-lbl{color:var(--green);}
.rpm-goal-inrow{display:flex;align-items:baseline;justify-content:center;gap:6px;}
.rpm-goal-input{font-family:'Playfair Display',serif;font-size:51px;font-weight:900;color:#1A1208;text-align:center;border:none;width:110px;background:transparent;padding:0;}
.rpm-goal-input:focus{outline:none;}
.rpm-goal-input::placeholder{color:#D8C8B0;}
.rpm-goal-suffix{font-size:18px;color:#7A6A55;font-weight:600;}
.rpm-lockbtn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:18px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:20px;}
.rpm-lockbtn:hover:not(:disabled){background:var(--carrot-dark);}
.rpm-lockbtn:disabled{opacity:0.4;cursor:not-allowed;}
.rpm-locked{background:var(--green-light);border:1.5px solid var(--green);border-radius:14px;padding:14px 18px;font-size:18px;font-weight:700;color:var(--green);text-align:center;margin-bottom:16px;}
.rpm-result{border-radius:14px;padding:16px 18px;margin-bottom:12px;font-size:18px;line-height:1.5;}
.rpm-result.target{background:rgba(244,113,26,0.08);border:1px solid rgba(244,113,26,0.25);color:#1A1208;}
.rpm-result.stretch{background:var(--green-light);border:1px solid rgba(45,106,79,0.3);color:#1A1208;}
.rpm-result-amt{font-family:'Playfair Display',serif;font-weight:900;font-size:27px;}
.rpm-result.target .rpm-result-amt{color:var(--carrot);}
.rpm-result.stretch .rpm-result-amt{color:var(--green);}
@media(max-width:600px){.rpm-goals{grid-template-columns:1fr;}}
.rpm-goldbox{background:var(--gold-light);border:1.5px solid var(--gold);border-radius:16px;padding:16px 20px;font-size:18px;color:#7A5C00;line-height:1.6;margin-bottom:20px;}
.rpm-card{background:white;border:1px solid #EDE0CC;border-radius:20px;overflow:hidden;margin-bottom:20px;}
.rpm-card-hdr{padding:18px 20px 0;}
.rpm-card-title{font-size:18px;font-weight:700;color:#1A1208;}
.rpm-explain{background:white;border:1px solid #EDE0CC;border-left:3px solid var(--carrot);border-radius:0 14px 14px 0;padding:24px;margin:20px 0;}
.rpm-explain-1{font-size:18px;color:#1A1208;line-height:1.7;margin-bottom:12px;}
.rpm-explain-2{font-size:18px;font-weight:700;color:#1A1208;line-height:1.7;margin-bottom:12px;}
.rpm-explain-3{font-size:18px;color:#7A6A55;line-height:1.7;}
.rpm-nudge{background:#FFF7ED;border:1.5px solid var(--carrot);border-radius:16px;padding:20px;margin-top:18px;}
.rpm-nudge-lbl{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);margin-bottom:10px;}
.rpm-nudge-txt{font-size:18px;font-style:italic;color:#1A1208;line-height:1.7;}
/* carrot image box */
.cib-box{border:2px dashed var(--border);border-radius:16px;min-height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--cream);overflow:hidden;}
.cib-box.has{border-style:solid;border-color:var(--carrot-light);}
.cib-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.cib-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 8px;border-radius:12px;border:1.5px solid var(--border);background:white;cursor:pointer;font-size:16px;font-weight:600;color:var(--muted);font-family:'DM Sans',sans-serif;}
.cib-btn:hover{border-color:var(--carrot);color:var(--carrot);}
.cib-row{display:flex;gap:8px;margin-top:10px;align-items:center;}
.cib-inp{flex:1;min-width:0;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:18px;font-family:'DM Sans',sans-serif;}
.cib-inp:focus{outline:none;border-color:var(--carrot);}
.cib-add{background:var(--carrot);color:white;border:none;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:18px;}
.cib-cancel{background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;font-family:'DM Sans',sans-serif;}
@keyframes azspin{to{transform:rotate(360deg);}}
@keyframes micpulse{0%,100%{box-shadow:0 0 0 0 rgba(244,113,26,0.5);}50%{box-shadow:0 0 0 6px rgba(244,113,26,0);}}
/* create account screen */
.ca-wrap{min-height:100vh;background:var(--dark);color:white;font-family:'DM Sans',sans-serif;}
.ca-screen{max-width:760px;margin:0 auto;padding:30px 20px 90px;animation:fadeUp 0.35s ease;}
.ca-callout{background:rgba(244,113,26,0.12);border:1px solid rgba(244,113,26,0.35);border-radius:14px;padding:16px 20px;}
.ca-callout-c{font-size:18px;font-weight:700;color:#FDBA74;}
.ca-callout-sub{font-size:18px;color:rgba(255,255,255,0.65);margin-top:4px;line-height:1.5;}
.ca-h1{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:white;margin:18px 0 22px;line-height:1.15;}
.ca-plans{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
.ca-plan{cursor:pointer;}
.ca-plan.sel{box-shadow:0 0 0 3px rgba(244,113,26,0.5);}
.ca-form{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px;margin-bottom:20px;}
.ca-flabel{font-size:16px;font-weight:700;color:white;margin-bottom:6px;display:block;}
.ca-finp{width:100%;padding:13px 16px;border:1.5px solid rgba(255,255,255,0.2);border-radius:12px;font-size:18px;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.06);color:white;margin-bottom:16px;}
.ca-finp:focus{outline:none;border-color:var(--carrot);}
.ca-finp::placeholder{color:rgba(255,255,255,0.35);}
.ca-hint{font-size:16px;color:rgba(255,255,255,0.55);}
/* build strategy screen */
.bs-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.bs-screen{max-width:760px;margin:0 auto;padding:24px 20px 90px;animation:fadeUp 0.35s ease;}
.bs-pill{display:inline-flex;align-items:center;gap:6px;background:var(--carrot-light);color:var(--carrot-dark);border-radius:100px;padding:8px 16px;font-size:18px;font-weight:700;margin-bottom:16px;}
.bs-h1{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:var(--ink);margin-bottom:6px;line-height:1.15;}
.bs-prog{font-size:16px;font-weight:700;color:var(--muted);margin-bottom:20px;}
.bs-cols{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;align-items:start;}
.bs-q{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px;animation:fadeUp 0.4s ease;}
.bs-q-num{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);margin-bottom:6px;}
.bs-q-label{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.bs-q-hint{font-size:16px;color:var(--muted);margin-bottom:12px;}
.bs-inp-money{display:flex;align-items:center;border:1.5px solid var(--border);border-radius:12px;overflow:hidden;background:white;}
.bs-inp-money span{padding:0 4px 0 14px;color:var(--muted);font-weight:700;}
.bs-inp-money input{flex:1;min-width:0;border:none;padding:13px 14px 13px 4px;font-size:18px;font-family:'DM Sans',sans-serif;color:var(--ink);background:transparent;}
.bs-inp-money input:focus{outline:none;}
.bs-pills{display:flex;flex-wrap:wrap;gap:10px;}
.bs-opt{padding:9px 16px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.bs-opt:hover{border-color:var(--carrot);color:var(--carrot);}
.bs-opt.on{background:var(--carrot);border-color:var(--carrot);color:white;}
.bs-slider{width:100%;accent-color:var(--carrot);cursor:pointer;}
.bs-slider-val{font-family:'Playfair Display',serif;font-size:33px;font-weight:900;color:var(--carrot);text-align:center;margin-bottom:6px;}
.bs-strat{background:#0F0A05;border-radius:18px;padding:22px;position:sticky;top:20px;}
.bs-strat-h{font-size:16px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);margin-bottom:16px;}
.bs-strat-row{padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);}
.bs-strat-row:last-child{border-bottom:none;}
.bs-strat-k{font-size:15px;color:rgba(255,255,255,0.6);margin-bottom:4px;}
.bs-strat-v{font-family:'Playfair Display',serif;font-size:25px;font-weight:900;color:white;}
.bs-strat-v.pending{font-family:'DM Sans',sans-serif;font-size:18px;font-weight:600;color:rgba(255,255,255,0.45);font-style:italic;}
.bs-done{background:var(--green-light);border:1.5px solid var(--green);border-radius:16px;padding:18px 20px;margin-top:20px;}
.bs-done-t{font-size:18px;font-weight:700;color:var(--green);margin-bottom:12px;}
@media(max-width:680px){.bs-cols{grid-template-columns:1fr;}.ca-plans{grid-template-columns:1fr;}.bs-strat{position:static;}}
/* upload screen */
.up-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.up-screen{max-width:1240px;margin:0 auto;padding:30px 40px 90px;animation:fadeUp 0.35s ease;}
.up-h1{font-family:'Playfair Display',serif;font-size:39px;font-weight:900;color:var(--ink);line-height:1.15;margin-bottom:12px;}
.up-sub{font-size:18px;color:var(--muted);line-height:1.6;max-width:500px;margin-bottom:26px;}
.up-zone{border:2px dashed var(--border);border-radius:20px;min-height:200px;background:white;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;cursor:pointer;transition:all 0.2s;}
.up-zone:hover{border-color:var(--carrot);background:var(--carrot-light);}
.up-zone-ico{font-size:51px;margin-bottom:12px;}
.up-zone-t{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.up-zone-s{font-size:18px;color:var(--muted);line-height:1.5;margin-bottom:10px;max-width:440px;margin-left:auto;margin-right:auto;}
.up-zone-hint{font-size:16px;color:var(--muted);margin-bottom:8px;}
.up-zone-link{font-size:18px;color:var(--carrot);font-weight:700;}
.up-list{margin-top:16px;display:flex;flex-direction:column;gap:8px;}
.up-file{display:flex;align-items:center;gap:12px;padding:12px 16px;background:white;border:1.5px solid var(--border);border-radius:12px;}
.up-file-ico{font-size:18px;flex-shrink:0;}
.up-file-name{flex:1;min-width:0;font-size:18px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.up-file-size{font-size:16px;color:var(--muted);flex-shrink:0;}
.up-file-x{flex-shrink:0;background:none;border:none;color:#DC2626;font-size:23px;line-height:1;cursor:pointer;padding:0 4px;}
.up-priv{display:flex;gap:10px;background:var(--green-light);border:1px solid var(--green);border-radius:14px;padding:16px;font-size:18px;color:var(--green);line-height:1.55;margin-top:20px;}
.up-next{background:var(--carrot-light);border:1.5px solid rgba(244,113,26,0.3);border-radius:14px;padding:16px;margin-top:12px;}
.up-next-t{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot-dark);margin-bottom:10px;}
.up-next-line{display:flex;gap:8px;font-size:18px;color:var(--ink);line-height:1.5;margin-bottom:6px;}
.up-next-line:last-child{margin-bottom:0;}
.up-next-num{color:var(--carrot);font-weight:800;flex-shrink:0;}
.up-cta{width:100%;padding:18px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:18px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;margin-top:24px;}
.up-cta:hover:not(:disabled){background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.up-cta:disabled{background:rgba(244,113,26,0.4);cursor:not-allowed;}
/* carrot bridge */
.cb-wrap{min-height:100vh;background:var(--dark);color:white;display:flex;align-items:center;justify-content:center;padding:40px 24px;}
.cb-inner{max-width:560px;width:100%;animation:fadeUp 0.4s ease;}
.cb-label{font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--carrot);margin-bottom:16px;}
.cb-headline{font-family:'Playfair Display',serif;font-size:39px;font-weight:900;color:white;line-height:1.2;margin-bottom:14px;}
.cb-amt{color:var(--carrot);}
.cb-sub{font-size:22px;color:rgba(255,255,255,0.6);margin-bottom:28px;}
.cb-input{width:100%;padding:16px 18px;border:1.5px solid rgba(255,255,255,0.2);border-radius:14px;font-size:23px;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.06);color:white;margin-bottom:16px;}
.cb-input:focus{outline:none;border-color:var(--carrot);}
.cb-input::placeholder{color:rgba(255,255,255,0.35);}
.cb-pills{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:30px;}
.cb-pill{padding:9px 16px;border-radius:100px;border:1.5px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.8);font-size:18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.cb-pill:hover{border-color:var(--carrot);color:white;}
.cb-pill.on{background:var(--carrot);border-color:var(--carrot);color:white;}
.cb-btn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:22px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.cb-btn:hover{background:var(--carrot-dark);}
.cb-btn:disabled{opacity:0.4;cursor:not-allowed;}
/* pitch */
.pitch-wrap{min-height:100vh;background:var(--dark);color:white;padding:48px 24px;}
.pitch-inner{max-width:560px;margin:0 auto;animation:fadeUp 0.4s ease;}
.pitch-carrot-callout{background:rgba(244,113,26,0.12);border:1px solid rgba(244,113,26,0.35);border-radius:14px;padding:14px 18px;font-size:18px;color:#FDBA74;font-weight:700;margin-bottom:24px;}
.pitch-headline{font-family:'Playfair Display',serif;font-size:37px;font-weight:900;color:white;line-height:1.2;margin-bottom:22px;}
.pitch-contrast{margin-bottom:24px;}
.pitch-mgr{font-size:18px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:10px;}
.pitch-coach{font-size:22px;font-weight:700;color:white;line-height:1.6;}
.pitch-checks{margin-bottom:28px;}
.pitch-check{display:flex;align-items:flex-start;gap:12px;padding:11px 0;font-size:18px;color:rgba(255,255,255,0.85);border-bottom:1px solid rgba(255,255,255,0.06);}
.pitch-check:last-child{border-bottom:none;}
.pitch-check-ico{color:#86EFAC;font-weight:800;flex-shrink:0;}
.pitch-cta{width:100%;padding:18px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:22px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.pitch-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.pitch-note{text-align:center;font-size:18px;color:rgba(255,255,255,0.45);margin-top:14px;}
@media(max-width:480px){.ob-row{grid-template-columns:1fr;}.cb-headline{font-size:32px;}.pitch-headline{font-size:31px;}}
`;

// Day-one setup tasks pre-loaded onto the rep's first week.
const DAY_ONE_TASKS = {
  Mon: ["Upload your comp plan", "Add any SPIFF or quota emails", "Review what Coach found"],
  Tue: ["Set your take-home details", "Pick your big carrot"],
  Wed: ["Upload your account list", "Upload your pipeline export"],
  Thu: ["Build your strategy with Coach"],
  Fri: ["Set medium and small carrots", "Review your first action plan"],
};

// Home base area squares. Only Comp Plan is active for now.
const AREAS = [
  { key: "comp", icon: "📄", name: "Comp Plan", desc: "Understand exactly how you get paid.", status: "Ready", active: true },
  { key: "accounts", icon: "🏢", name: "Account Strategies", desc: "Plan your top accounts with Coach.", status: "Coming soon", active: false },
  { key: "territory", icon: "🗺️", name: "Territory Strategies", desc: "Map your territory and find the gaps.", status: "Coming soon", active: false },
  { key: "qbr", icon: "📊", name: "QBR", desc: "Prep quarterly business reviews.", status: "Coming soon", active: false },
  { key: "goals", icon: "🥕", name: "Goals & Carrots", desc: "Set the rewards you are working toward.", status: "Coming soon", active: false },
  { key: "calendar", icon: "🗓️", name: "Full Calendar", desc: "See your whole plan of attack.", status: "Coming soon", active: false },
];

const HOME_STYLES = `
.hb-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.hb-main{max-width:1160px;margin:0 auto;padding:32px 40px 80px;}
.hb-h1{font-family:'Playfair Display',serif;font-size:37px;font-weight:900;margin-bottom:4px;}
.hb-sub{font-size:18px;color:var(--muted);margin-bottom:26px;}
.hb-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;}
.hb-cal-title{font-family:'Playfair Display',serif;font-size:25px;font-weight:700;}
.hb-toggle{display:flex;gap:4px;background:white;border:1.5px solid var(--border);border-radius:12px;padding:4px;}
.hb-toggle button{border:none;background:none;padding:8px 16px;border-radius:9px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:18px;color:var(--muted);cursor:pointer;}
.hb-toggle button.on{background:var(--carrot);color:white;}
.hb-week{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:42px;}
.hb-day{background:white;border:1.5px solid var(--border);border-radius:16px;padding:14px;min-height:190px;}
.hb-day.today{border-color:var(--carrot);box-shadow:0 0 0 3px rgba(244,113,26,0.15);}
.hb-day-name{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);}
.hb-day.today .hb-day-name{color:var(--carrot);}
.hb-day-date{font-family:'Playfair Display',serif;font-size:23px;font-weight:700;margin-bottom:8px;}
.hb-task{display:flex;align-items:flex-start;gap:8px;padding:7px 0;cursor:pointer;font-size:16px;line-height:1.4;}
.hb-task input{margin-top:2px;accent-color:var(--carrot);cursor:pointer;flex:none;width:15px;height:15px;}
.hb-task.done span{text-decoration:line-through;color:var(--muted);}
.hb-empty{font-size:16px;color:var(--muted);font-style:italic;}
.hb-month{background:white;border:1.5px solid var(--border);border-radius:16px;padding:18px;margin-bottom:42px;}
.hb-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.hb-dow{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:center;padding:6px 0;}
.hb-cell{min-height:74px;border:1px solid var(--border);border-radius:10px;padding:6px 8px;background:var(--cream);}
.hb-cell.blank{background:transparent;border:none;}
.hb-cell.today{border-color:var(--carrot);background:var(--carrot-light);}
.hb-cell-n{font-size:16px;font-weight:700;}
.hb-dot{display:inline-block;margin-top:6px;font-size:15px;font-weight:700;color:var(--carrot);}
.hb-areas-h{font-family:'Playfair Display',serif;font-size:25px;font-weight:700;margin-bottom:14px;}
.hb-areas{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.hb-area{background:white;border:1.5px solid var(--border);border-radius:18px;padding:22px;min-height:170px;display:flex;flex-direction:column;}
.hb-area.active{cursor:pointer;transition:all .2s;}
.hb-area.active:hover{border-color:var(--carrot);transform:translateY(-2px);box-shadow:0 10px 28px -12px rgba(244,113,26,0.35);}
.hb-area.hot{border-color:var(--carrot);background:var(--carrot-light);cursor:pointer;transition:all .2s;}
.hb-area.hot:hover{transform:translateY(-2px);box-shadow:0 10px 28px -12px rgba(244,113,26,0.35);}
.hb-area.soon{opacity:0.6;}
.hb-area-icon{font-size:33px;margin-bottom:12px;}
.hb-area-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:4px;}
.hb-area-desc{font-size:16px;color:var(--muted);line-height:1.5;flex:1;}
.hb-area-status{margin-top:14px;align-self:flex-start;font-size:15px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:4px 10px;border-radius:100px;}
.hb-area-status.ready{background:var(--green-light);color:var(--green);}
.hb-area-status.soon{background:var(--border);color:var(--muted);}
@media(max-width:1024px){.hb-areas{grid-template-columns:repeat(2,1fr);}}
`;

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [scrolled, setScrolled] = useState(false);

  // ── AUTH STATE (front-end stub, in-memory only) ──
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [authFirst, setAuthFirst] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authPass2, setAuthPass2] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState(null); // Neon Auth user id (login flag)
  const [currentName, setCurrentName] = useState("");
  const [currentRepId, setCurrentRepId] = useState(null); // real reps.id from the database
  const [postAuthDest, setPostAuthDest] = useState(null); // where to land after sign in (e.g. upload)
  const [dbPlanLoading, setDbPlanLoading] = useState(false); // loading the rep's plan from the DB
  const planFetchedRef = useRef(null); // repId we've already loaded a plan for this session

  // Neon Auth (Better Auth). The session persists across reloads via cookie.
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const sessionUser = sessionData && sessionData.user ? sessionData.user : null;
  const ensureRepRef = useRef(null); // auth user id we've already resolved a rep for
  const bootedRef = useRef(false);   // ran the on-load rehydrate for this session yet

  // ── HOME BASE STATE ──
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [homeView, setHomeView] = useState("week"); // "week" | "month"
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [weekTasks, setWeekTasks] = useState(() => {
    const o = {};
    Object.keys(DAY_ONE_TASKS).forEach((d) => { o[d] = DAY_ONE_TASKS[d].map((text, i) => ({ id: d + "-" + i, text, done: false })); });
    return o;
  });

  // ── ONBOARDING STATE ──
  const [suName, setSuName]   = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suState, setSuState] = useState("");
  const [suAge, setSuAge]     = useState("Under 50");
  const [suPass, setSuPass]   = useState("");
  const [planFile, setPlanFile] = useState(null);
  const [planFiles, setPlanFiles] = useState([]);
  // Parsed comp plan returned by /api/ingest. Shared top-level state so
  // downstream screens (confirm, summary, etc.) can read it later.
  const [compPlan, setCompPlan] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  // Rep's typed answers to clarification questions, keyed by "<source file>::<field>".
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  // Which clarification input is currently dictating (its answer key), or null.
  const [listeningKey, setListeningKey] = useState(null);
  const recognitionRef = useRef(null);
  // Questions the rep flagged to ask their manager, keyed like clarificationAnswers.
  const [askManagerFlags, setAskManagerFlags] = useState({});
  // Manager email drafting state (manager_email screen).
  const [emailDrafting, setEmailDrafting] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  // Inline corrections the rep makes on the plan summary, keyed by field path.
  // Append-only: compPlan itself is never mutated.
  const [planEdits, setPlanEdits] = useState({});
  const [correctionNote, setCorrectionNote] = useState(""); // free form "tell us what to fix" on the confirm step
  const [editPath, setEditPath] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  // Effective value for a field path: the rep's edit if present, else the original.
  // Available to any screen so downstream can read corrected values too.
  const effectivePlanValue = (path, original) =>
    (path && Object.prototype.hasOwnProperty.call(planEdits, path)) ? planEdits[path] : original;
  // Coach's narrative read of the plan (plan_summary), fetched once per loaded plan.
  const [coachRead, setCoachRead] = useState(null);
  const [coachReadLoading, setCoachReadLoading] = useState(false);
  const coachReadForRef = useRef(null); // plan_id the current coachRead was generated/cached for
  const coachReqRef = useRef(0);        // request token so a superseded coach-read cannot clobber a newer one
  const coachTakeCacheRef = useRef({}); // plan_id -> take; synchronous cache so a cold-boot seed serves without depending on coachRead state timing
  // Plan comparison (Phase 1): the rep's plans by year, which year-tab is selected on
  // the plan summary, and a per-id cache of reconstructed plans (the current plan is
  // compPlan; priors are fetched on demand via get-plan?planId=).
  const [comparePlans, setComparePlans] = useState([]);          // [{id, name, plan_year, effective_from, effective_to, is_current, received_at}], newest year first
  const [selectedPlanId, setSelectedPlanId] = useState(null);    // null = current/default tab
  const [comparePlanCache, setComparePlanCache] = useState({});  // plan_id -> full reconstructed plan
  const comparePlansFetchedRef = useRef(null);                   // repId we've fetched the plan list for
  const pendingProfileSaveRef = useRef(false);                   // just signed up: persist the take-home profile once the rep is created
  const [comparePlansLoadedFor, setComparePlansLoadedFor] = useState(null); // repId whose plan list has resolved (so we know whether a prior exists before generating a take)
  // True once the rep has confirmed the plan summary; gates Coach's Take.
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [saveError, setSaveError] = useState(false);     // upload-time persistence failed
  const [confirming, setConfirming] = useState(false);   // confirm action is awaiting a save
  const [confirmError, setConfirmError] = useState("");  // shown on the review step if confirm fails to save
  // Which loaded-document row is awaiting remove confirmation (index), or null.
  const [docRemoveIdx, setDocRemoveIdx] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  // The document currently being read in place on the Loaded Documents view.
  const [pendingDoc, setPendingDoc] = useState(null);
  const [readProgress, setReadProgress] = useState(0); // 0..100, fills while reading
  const [coachProgress, setCoachProgress] = useState(0); // 0..100, fills while Coach reads
  const compUploadRef = useRef(null);
  // Gentle unconfirmed-file reminder (session-scoped, never a hard block).
  const [railCollapsed, setRailCollapsed] = useState(false); // left nav rail collapsed (session)
  const [reminder, setReminder] = useState(null);          // { fileName, proceed } or null
  const [usageNotice, setUsageNotice] = useState(null);    // { level: "half"|"threeq"|"blocked", used, limit } or null
  const usageShownRef = useRef(new Set());                 // thresholds already shown this session (dedup)
  const [remindDontAsk, setRemindDontAsk] = useState(false);
  const [remindSuppressed, setRemindSuppressed] = useState(false);
  const [remindedFiles, setRemindedFiles] = useState({});  // filename -> already nudged this session
  const [comp, setComp] = useState({ base: 150000, quota: 1500000, commissionRate: 8, accelerator: 1.5 });
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [taxOverrides, setTaxOverrides] = useState({});
  const [spiffs] = useState([]);
  const [k401Pct, setK401Pct]   = useState(6);
  const [healthMo, setHealthMo] = useState(200);
  const [otherMonthly, setOtherMonthly] = useState(0);
  const [repName, setRepName] = useState("");
  const [payFreq, setPayFreq] = useState("Semi-monthly (24x/year)");
  const [carrotTab, setCarrotTab] = useState("big");
  const [bigCarrots, setBigCarrots] = useState([{ id: 1, name: "Family trip to Hawaii", cost: 12000 }]);
  const [medCarrots, setMedCarrots] = useState([{ id: 1, name: "Weekend getaway", cost: 2500, period: "Quarterly" }]);
  const [targetPct, setTargetPct] = useState(110);
  const [stretchPct, setStretchPct] = useState(150);
  // Carrots: what the rep is fighting for at each goal (name + estimated cost).
  const [carrots, setCarrots] = useState({ target: { name: "", cost: "", locked: false }, stretch: { name: "", cost: "", locked: false } });
  // Strategy Step 2: the rep's deal-breakdown plan (structured object, persisted to
  // reps.deal_plan). Null until the rep visits Step 2 or it loads from the profile.
  const [dealPlan, setDealPlan] = useState(null);
  const [metrics, setMetrics] = useState([
    { id: 1, emoji: "📞", label: "Cold calls", freq: "Daily", floor: 10, stretch: 15, reminder: true, treat: "" },
    { id: 2, emoji: "🤝", label: "Discovery meetings", freq: "Weekly", floor: 5, stretch: 8, reminder: false, treat: "" },
  ]);
  const [trackingMethod, setTrackingMethod] = useState("manual");
  const [activeTab, setActiveTab] = useState("home");
  const [todayLog, setTodayLog] = useState({});
  const [carrotAnswer, setCarrotAnswer] = useState("");
  const [carrotImage, setCarrotImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [carrotCost, setCarrotCost] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [stretchGoal, setStretchGoal] = useState("");
  const [goalsLocked, setGoalsLocked] = useState(false);
  const [stretchCarrot, setStretchCarrot] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [dealSize, setDealSize] = useState("");
  const [salesCycle, setSalesCycle] = useState("");
  const [closeRate, setCloseRate] = useState(20);
  const [closeRateSet, setCloseRateSet] = useState(false);
  const [pipeline, setPipeline] = useState("");
  const [territoryFocus, setTerritoryFocus] = useState([]);
  const [sliderValue, setSliderValue] = useState(100);

  // ── ONBOARDING CALCULATIONS ──
  const k401Limit = K401_LIMITS[suAge] ?? 23500;
  const stateTaxPct = STATE_TAXES[suState] ?? 0;
  const rate = comp.commissionRate / 100;
  function calcGross(pct) {
    const att = pct / 100;
    const commission = att <= 1
      ? comp.quota * att * rate
      : comp.quota * rate + comp.quota * (att - 1) * rate * comp.accelerator;
    return comp.base + commission;
  }
  function calcNet(gross) {
    const k = Math.min(gross * k401Pct / 100, k401Limit);
    const health = healthMo * 12;
    const other = otherMonthly * 12;
    const taxable = Math.max(0, gross - k - health);
    const fed = taxable * (taxOverrides.fed ?? getFedBracket(gross).rate) / 100;
    const st = taxable * (taxOverrides.state ?? stateTaxPct) / 100;
    const fica = gross * 0.0765;
    return gross - fed - st - fica - k - health - other;
  }
  const grossAt100 = useMemo(() => calcGross(100), [comp, suAge, k401Pct, healthMo, suState]);
  const commAt100 = comp.quota * rate;
  const carrotMoney = useMemo(
    () => Math.max(0, calcNet(calcGross(targetPct)) - calcNet(grossAt100)),
    [targetPct, comp, suAge, k401Pct, healthMo, suState]
  );
  function pctToFund(cost) {
    if (!cost) return null;
    const base = calcNet(grossAt100);
    for (let p = 101; p <= 300; p++) {
      if (calcNet(calcGross(p)) - base >= cost) return p;
    }
    return null;
  }
  const bigCarrotGoal = bigCarrots.reduce((s, c) => s + (+c.cost || 0), 0);

  function updateMetric(id, patch) {
    setMetrics((p) => p.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function metricStatus(count, m) {
    const c = +count || 0;
    if (c >= (+m.stretch || 0)) return { label: "Stretch hit", cls: "st-stretch" };
    if (c >= (+m.floor || 0))   return { label: "Floor cleared", cls: "st-floor" };
    return { label: "Below floor", cls: "st-below" };
  }

  const goToScreen = (name) => { window.history.pushState({ screen: name }, ""); setScreen(name); window.scrollTo(0, 0); };
  const goFlow = (s) => goToScreen(s);
  // One canonical upload entry: the Comp Documents screen. Uploading saves under a
  // real rep, so anyone not signed in is sent to sign in first and lands here after.
  const goUpload = () => {
    if (currentUser) { goFlow("comp_documents"); return; }
    setPostAuthDest("comp_documents");
    goAuth("signup");
  };

  // Read a file as base64, stripping the data URL prefix.
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const r = String(reader.result || ""); const c = r.indexOf(","); resolve(c >= 0 ? r.slice(c + 1) : r); };
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  // Authorization header carrying the Neon Auth session JWT, so the server can
  // verify the caller and derive their rep. getAccessToken() returns empty when the
  // in-memory session is not hydrated (on a rehydrated plan, or right after a fresh
  // login before the client populates), so we fall back to the now first-party
  // /api/auth/token endpoint, which mints a token straight from the session cookie.
  // Every authenticated call goes through here, so this single path is what keeps
  // them from firing bare and 401ing. Empty only when neither source yields a token
  // (the rep is genuinely signed out).
  const authHeaders = async () => {
    let t = null;
    try {
      const r = await authClient.getAccessToken();
      t = r && r.data ? (r.data.token || r.data.accessToken || null) : null;
    } catch (e) { /* fall through to the cookie-backed endpoint */ }
    if (!t) {
      try {
        const tr = await fetch("/api/auth/token", { credentials: "include" });
        const td = tr.ok ? await tr.json().catch(() => null) : null;
        t = (td && (td.token || td.accessToken)) || null;
      } catch (e) { /* leave t null; caller gets no Authorization */ }
    }
    return t ? { Authorization: `Bearer ${t}` } : {};
  };
  // Persist a parsed plan to the database. The server derives the rep from the
  // verified token, so no repId is sent. Fire-and-forget: never blocks the UI.
  const savePlanToDb = async (plan, filename) => {
    if (!plan) return;
    try {
      const headers = { "content-type": "application/json", ...(await authHeaders()) };
      const r = await fetch("/api/save-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ plan, filename: filename || null, originalFilename: filename || null }),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d && d.ok) {
        // Stamp the new plan's id so confirm knows it is persisted and can archive it.
        if (d.planId) setCompPlan((prev) => (prev ? { ...prev, meta: { ...(prev.meta || {}), plan_id: d.planId } } : prev));
        setSaveError(false);
        console.log("save-plan ok:", d);
      } else {
        // No longer silent: flag it so confirm knows persistence has not happened.
        setSaveError(true);
        console.error("save-plan failed:", d);
      }
    } catch (e) {
      setSaveError(true);
      console.error("save-plan error:", e);
    }
  };

  // Persist on confirm: never let a rep confirm a plan that is not actually saved.
  // If the upload-time save already persisted it (meta.plan_id present), we do not
  // re-insert (no duplicate); we only advance. If it did not persist, we save now
  // and advance only on success, otherwise we surface the failure and stay put.
  const confirmPlan = async () => {
    if (!compPlan) return;
    setConfirmError("");
    setConfirming(true);
    try {
      let planId = compPlan.meta && compPlan.meta.plan_id;
      if (!planId) {
        // authHeaders() now obtains a token even when getAccessToken() is empty (it
        // falls back to the first-party /api/auth/token endpoint), so confirm just
        // needs to refuse to save bare if the rep is genuinely signed out.
        const auth = await authHeaders();
        if (!auth.Authorization) {
          setConfirmError("Please sign in again to save your plan. Nothing was lost.");
          setConfirming(false);
          return;
        }
        const headers = { "content-type": "application/json", ...auth };
        const filename = (compPlan.provenance && Array.isArray(compPlan.provenance.source_files) && compPlan.provenance.source_files[0]) || null;
        const r = await fetch("/api/save-plan", {
          method: "POST",
          headers,
          body: JSON.stringify({ plan: compPlan, filename, originalFilename: filename }),
        });
        const d = await r.json().catch(() => null);
        if (!r.ok || !d || !d.ok || !d.planId) {
          setConfirmError("We could not save your plan just now. Nothing was lost. Please try confirming again in a moment.");
          setConfirming(false);
          return;
        }
        planId = d.planId;
        setCompPlan((prev) => (prev ? { ...prev, meta: { ...(prev.meta || {}), plan_id: planId } } : prev));
        setSaveError(false);
      }
      setPlanConfirmed(true);
      setConfirming(false);
      goFlow("coach_take");
    } catch (e) {
      setConfirmError("We could not save your plan just now. Nothing was lost. Please try confirming again in a moment.");
      setConfirming(false);
    }
  };

  // Comp-path ingestion: read in place on the Loaded Documents view (no overlay).
  const ingestFile = async (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) { setIngestError("Please add a PDF of your comp plan so Coach can read it."); return; }
    // Uploading saves under a real rep, so make sure they are signed in first.
    if (!currentUser) { setPostAuthDest("comp_documents"); goAuth("signup"); return; }
    setIngestError("");
    setReadProgress(0);
    setPendingDoc({ name: file.name });
    setIngesting(true);
    goFlow("comp_documents");
    try {
      const pdfBase64 = await fileToBase64(file);
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ pdfBase64, filename: file.name }),
      });
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      // Daily usage limit reached: surface the friendly block, stop here.
      if (res.status === 429) {
        noteUsageBlocked(data && data.usage);
        setIngestError("You've reached your daily usage limit. It resets at midnight Pacific.");
        setReadProgress(0);
        setIngesting(false);
        return;
      }
      if (!res.ok || !data || !data.ok) {
        // A 422 means the model could not read this as a comp plan, so retrying the
        // same file will not help. Anything else is a server or timeout problem.
        setIngestError(res.status === 422
          ? "Coach could not read this as a comp plan. Please make sure it is your compensation plan saved as a PDF, then try a different file."
          : "Coach had trouble reading your plan and that one is on us. Please give it another try in a moment.");
        setReadProgress(0);
        setIngesting(false);
        return; // keep the file row so the message shows with a way to dismiss
      }
      noteUsage(data.usage); // reflect the true server count in the usage popups
      setReadProgress(100);
      setCompPlan(data.plan);
      await savePlanToDb(data.plan, file.name); // persist now so confirm sees plan_id (no later double-write)
      setCoachRead(null);
      coachReadForRef.current = null;
      setClarificationAnswers({});
      setAskManagerFlags({});
      setPlanEdits({});
      setPlanConfirmed(false);
      setIngesting(false);
      setPendingDoc(null);
    } catch (err) {
      setReadProgress(0);
      setIngesting(false);
      setIngestError("Coach could not reach the server to read your plan. Please check your connection and try again.");
    }
  };

  // Filling progress circle, shared by the document-reading and Coach-reading states.
  const fillCircle = (progress, size = 28) => {
    const sw = 3, r = (size - sw) / 2 - 1, c = 2 * Math.PI * r, mid = size / 2;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none" }}>
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--carrot)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress / 100)} transform={`rotate(-90 ${mid} ${mid})`} style={{ transition: "stroke-dashoffset 0.2s linear" }} />
      </svg>
    );
  };

  // Name of the current (possibly unconfirmed) plan's document.
  const planFileName = () => {
    const sf = compPlan && compPlan.provenance && compPlan.provenance.source_files;
    if (Array.isArray(sf) && sf[0]) return sf[0];
    return (compPlan && compPlan.meta && compPlan.meta.plan_name) || "your plan";
  };
  // Nudge (not a block) before a meaningful action when a plan is unconfirmed.
  // Fires at most once per unconfirmed file per session, unless suppressed.
  const maybeRemind = (proceed) => {
    if (!compPlan || planConfirmed || remindSuppressed) { proceed(); return; }
    const fname = planFileName();
    if (remindedFiles[fname]) { proceed(); return; }
    setRemindedFiles((m) => ({ ...m, [fname]: true }));
    setReminder({ fileName: fname, proceed });
  };
  const dismissReminder = (runProceed) => {
    if (remindDontAsk) setRemindSuppressed(true);
    const r = reminder;
    setReminder(null);
    setRemindDontAsk(false);
    if (runProceed && r) r.proceed();
  };
  const reviewFromReminder = () => {
    if (remindDontAsk) setRemindSuppressed(true);
    setReminder(null);
    setRemindDontAsk(false);
    goFlow("plan_summary");
  };
  // Usage popups read the TRUE server count from API responses (used/limit/remaining).
  // Gentle "heads up" at 50% and 75% (once each per session), clear block at 100%.
  const noteUsage = (usage) => {
    if (!usage || !usage.limit) return;
    if (usage.remaining <= 0) { setUsageNotice({ level: "blocked", used: usage.used, limit: usage.limit }); return; }
    const pct = usage.used / usage.limit;
    if (pct >= 0.75 && !usageShownRef.current.has("threeq")) {
      usageShownRef.current.add("threeq");
      setUsageNotice({ level: "threeq", used: usage.used, limit: usage.limit });
    } else if (pct >= 0.5 && !usageShownRef.current.has("half")) {
      usageShownRef.current.add("half");
      setUsageNotice({ level: "half", used: usage.used, limit: usage.limit });
    }
  };
  // Called when an op is blocked server-side (HTTP 429). Surfaces the friendly block.
  const noteUsageBlocked = (usage) => {
    setUsageNotice({ level: "blocked", used: usage && usage.used != null ? usage.used : null, limit: usage && usage.limit != null ? usage.limit : null });
  };
  const renderUsageNotice = () => {
    if (!usageNotice) return null;
    const blocked = usageNotice.level === "blocked";
    const { used, limit } = usageNotice;
    const accent = blocked ? "#B91C1C" : "var(--carrot)";
    const bg = blocked ? "#FEF2F2" : "#FFF6EF";
    const border = blocked ? "#FCA5A5" : "#F0D9C6";
    const title = blocked ? "That's your day on Coach" : "Heads up";
    const body = blocked
      ? `You've used all ${limit != null ? limit : "your"} of today's Coach actions. It resets at midnight Pacific. Tomorrow's a fresh batch.`
      : `You've used ${used} of your ${limit} Coach actions today.${usageNotice.level === "threeq" ? " A few left before it resets at midnight Pacific." : " Plenty left for today."}`;
    return (
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 24, zIndex: 210, display: "flex", justifyContent: "center", padding: "0 16px", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 460, background: bg, border: `1.5px solid ${border}`, borderRadius: 16, padding: "16px 18px", boxShadow: "0 18px 44px -18px rgba(26,18,8,0.4)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: "none", fontSize: 22, lineHeight: 1 }}>🥕</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 18, color: accent, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.5 }}>{body}</div>
          </div>
          <button onClick={() => setUsageNotice(null)} aria-label="Dismiss" style={{ flex: "none", background: "none", border: "none", color: "var(--muted)", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 2 }}>×</button>
        </div>
      </div>
    );
  };

  const renderReminder = () => {
    if (!reminder) return null;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,10,5,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 460, background: "white", border: "1.5px solid var(--border)", borderRadius: 18, padding: 28, boxShadow: "0 24px 60px -20px rgba(26,18,8,0.4)" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Quick check</h3>
          <p style={{ fontSize: 16, color: "var(--ink)", lineHeight: 1.55, marginBottom: 16 }}>You haven't confirmed my read of {reminder.fileName} yet. I may have misread something. Want to review it first?</p>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: "var(--muted)", marginBottom: 18, cursor: "pointer" }}>
            <input type="checkbox" checked={remindDontAsk} onChange={(e) => setRemindDontAsk(e.target.checked)} style={{ accentColor: "var(--carrot)", width: 16, height: 16 }} />
            Don't ask again
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button onClick={() => dismissReminder(true)} style={{ background: "white", color: "var(--muted)", border: "1.5px solid var(--border)", borderRadius: 100, padding: "11px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Keep going</button>
            <button onClick={reviewFromReminder} style={{ background: "var(--carrot)", color: "white", border: "none", borderRadius: 100, padding: "11px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Review it</button>
          </div>
        </div>
      </div>
    );
  };

  // Persist the rep's take-home profile (the signup + Step-3 fields) to their reps
  // row. Used by signup (after the rep is created) and the Step-3 edit screen. Best
  // effort; the values also live in React state so the UI never blocks on this.
  const saveRepProfile = async (extra = {}) => {
    try {
      const headers = { "content-type": "application/json", ...(await authHeaders()) };
      // save-rep-profile hard-writes every field, so always send the full profile from
      // state; `extra` overrides just-changed values that may not have committed yet.
      const body = {
        home_state: suState, age_bracket: suAge, k401_pct: k401Pct, health_monthly: healthMo, other_monthly: otherMonthly,
        target_pct: targetPct, stretch_pct: stretchPct,
        target_carrot_name: carrots.target.name, target_carrot_cost: carrots.target.cost === "" ? null : carrots.target.cost,
        stretch_carrot_name: carrots.stretch.name, stretch_carrot_cost: carrots.stretch.cost === "" ? null : carrots.stretch.cost,
        target_locked: !!carrots.target.locked, stretch_locked: !!carrots.stretch.locked,
        deal_plan: dealPlan,
        ...extra,
      };
      await fetch("/api/save-rep-profile", { method: "POST", headers, body: JSON.stringify(body) });
    } catch (e) { /* non-fatal: profile stays in state, retryable on next save */ }
  };

  // ── AUTH helpers (front-end stub) ──
  const goAuth = (mode) => { setAuthMode(mode); setAuthError(""); setAuthFirst(""); setAuthPass(""); setAuthPass2(""); goFlow("auth"); };
  const toggleAuthMode = () => { setAuthMode((m) => (m === "login" ? "signup" : "login")); setAuthError(""); setAuthFirst(""); setAuthPass(""); setAuthPass2(""); };
  // Sign up / log in through Neon Auth (Better Auth). It owns password hashing,
  // rules, and the session. The effect below resolves the identity to a rep.
  const submitAuth = async () => {
    const email = authUser.trim();
    const fn = authFirst.trim();
    if (authMode === "signup") {
      if (!fn) { setAuthError("Please enter your first name."); return; }
      if (!email || !authPass) { setAuthError("Please enter your email and a password."); return; }
      if (authPass !== authPass2) { setAuthError("Those passwords do not match. Please try again."); return; }
      // State is the only take-home field with no usable default and it drives the
      // tax math, so it is required. The rest are pre-filled and accepted as-is.
      if (!suState) { setAuthError("Please select your state so Coach can calculate your take-home pay."); return; }
      setAuthError("");
      let error;
      try {
        ({ error } = await authClient.signUp.email({ email, password: authPass, name: fn }));
      } catch (e) { setAuthError("We could not create your account right now. Please try again."); return; }
      if (error) {
        const blob = (error.code || "") + " " + (error.message || "") + " " + String(error.status || "");
        if (/exist|already/i.test(blob)) setAuthError("That email already has an account. Try logging in instead.");
        else if (/password|weak|short|requirement|length/i.test(blob)) setAuthError("That password does not meet the requirements. Please choose a longer, stronger one.");
        else setAuthError("We could not create your account. Please try again.");
        return;
      }
      // Persist the take-home profile once the ensure-rep effect has created the rep.
      pendingProfileSaveRef.current = true;
      const dest = postAuthDest; setPostAuthDest(null); goFlow(dest || "home_base");
    } else {
      if (!email || !authPass) { setAuthError("Please enter your email and password."); return; }
      setAuthError("");
      let error;
      try {
        ({ error } = await authClient.signIn.email({ email, password: authPass }));
      } catch (e) { setAuthError("We could not log you in right now. Please try again."); return; }
      if (error) { setAuthError("We could not log you in. Check your email and password."); return; }
      const dest = postAuthDest; setPostAuthDest(null); goFlow(dest || "home_base");
    }
  };
  const logout = async () => {
    try { await authClient.signOut(); } catch (e) {}
    ensureRepRef.current = null;
    setCurrentUser(null); setCurrentName(""); setCurrentRepId(null); setCompPlan(null); setCoachRead(null); coachReadForRef.current = null; coachTakeCacheRef.current = {}; setComparePlans([]); setSelectedPlanId(null); setComparePlanCache({}); comparePlansFetchedRef.current = null; setComparePlansLoadedFor(null); setPlanConfirmed(false); planFetchedRef.current = null; setDealPlan(null); setAvatarMenuOpen(false); goFlow("landing");
  };
  // Shared top bar. full=true (signed in) shows Upload + profile avatar; full=false is brand only.
  const renderTopBar = (full) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid var(--border)", background: "rgba(255,250,244,0.97)", backdropFilter: "blur(8px)", position: "fixed", top: 0, left: 0, right: 0, height: 72, boxSizing: "border-box", zIndex: 60 }}>
      <button onClick={() => goFlow(full ? "home_base" : "landing")} style={{ fontFamily: "'Playfair Display',serif", fontSize: 25, fontWeight: 900, color: "var(--carrot)", background: "none", border: "none", cursor: "pointer" }}>🥕 Earn The Carrot</button>
      {full && (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => goFlow("comp_documents")} style={{ background: "var(--carrot)", color: "white", border: "none", borderRadius: 100, padding: "10px 22px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>↑ Upload</button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setAvatarMenuOpen((o) => !o)} aria-label="Account menu" style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "var(--dark2)", color: "white", fontSize: 18, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{(currentName || currentUser || "?").charAt(0).toUpperCase()}</button>
            {avatarMenuOpen && (
              <>
                <div onClick={() => setAvatarMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", right: 0, top: 48, background: "white", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 30px -12px rgba(0,0,0,0.3)", minWidth: 170, zIndex: 60, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", fontSize: 16, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>Signed in as <b style={{ color: "var(--ink)" }}>{currentName || (sessionUser && sessionUser.email) || "your account"}</b></div>
                  <button onClick={logout} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600, color: "var(--ink)", fontFamily: "'DM Sans',sans-serif" }}>Log out</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── Persistent left navigation rail (shared layout) ──
  const TOPBAR_H = 72;
  const railW = railCollapsed ? 64 : 234;
  const compAreaScreens = ["comp_dashboard", "comp_documents", "plan_summary", "coach_take", "payout_curve"];
  const accountAreaScreens = ["accounts_import"];
  const railActiveArea = compAreaScreens.indexOf(screen) >= 0 ? "comp" : accountAreaScreens.indexOf(screen) >= 0 ? "accounts" : null;
  const railIcon = {
    comp: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z M14 3v5h5 M9 13h6 M9 17h4" />,
    accounts: <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16 M15 9h3a2 2 0 0 1 2 2v10 M8 7h3 M8 11h3 M8 15h3" />,
    territory: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14" />,
    qbr: <path d="M3 3v18h18 M7 15l3-4 3 3 4-6" />,
    goals: <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 12m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0 M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />,
    calendar: <path d="M4 5h16v15H4Z M4 9h16 M8 3v4 M16 3v4" />,
    home: <path d="M4 11 12 4l8 7 M6 10v9h12v-9" />,
    menu: <path d="M4 7h16 M4 12h16 M4 17h16" />,
  };
  const railSvg = (name) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>{railIcon[name]}</svg>
  );
  const RAIL_AREAS = [
    { key: "comp", label: "Comp Plan", active: true, dest: "comp_dashboard" },
    { key: "accounts", label: "Account Strategies", active: true, dest: "accounts_import" },
    { key: "territory", label: "Territory Strategies", active: false },
    { key: "qbr", label: "QBR", active: false },
    { key: "goals", label: "Goals & Carrots", active: false },
    { key: "calendar", label: "Calendar", active: false },
  ];
  const renderRail = () => (
    <nav style={{ position: "fixed", top: TOPBAR_H, left: 0, bottom: 0, width: railW, background: "white", borderRight: "1px solid var(--border)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column", padding: "12px 10px", gap: 4, transition: "width .15s ease" }}>
      <button onClick={() => setRailCollapsed((c) => !c)} title="Menu" aria-label="Toggle menu" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, borderRadius: 10 }}>
        {railSvg("menu")}{!railCollapsed && <span>Menu</span>}
      </button>
      <div style={{ height: 6 }} />
      {RAIL_AREAS.map((a) => {
        const isActive = a.active && railActiveArea === a.key;
        return (
          <button key={a.key} disabled={!a.active} onClick={a.active ? () => goFlow(a.dest) : undefined} title={a.label}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", border: "none", borderRadius: 10, cursor: a.active ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, textAlign: "left", background: isActive ? "var(--carrot-light)" : "transparent", color: !a.active ? "var(--muted)" : (isActive ? "var(--carrot-dark)" : "var(--ink)"), opacity: a.active ? 1 : 0.7 }}>
            {railSvg(a.key)}
            {!railCollapsed && <span style={{ flex: 1 }}>{a.label}</span>}
            {!railCollapsed && !a.active && <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--muted)", background: "var(--border)", borderRadius: 100, padding: "2px 8px" }}>Soon</span>}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button onClick={() => goFlow("home_base")} title="Home" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", border: "none", borderTop: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--ink)", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, borderRadius: 0 }}>
        {railSvg("home")}{!railCollapsed && <span>Home</span>}
      </button>
    </nav>
  );

  const startEdit = (f, v) => { setEditField(f); setEditVal(String(v)); };
  const saveComp = () => { setComp((c) => ({ ...c, [editField]: parseFloat(editVal) || 0 })); setEditField(null); };
  const saveTax = (key) => { setTaxOverrides((t) => ({ ...t, [key]: parseFloat(editVal) || 0 })); setEditField(null); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stop any active dictation when leaving the plan clarification screen.
  useEffect(() => {
    if (screen !== "plan_clarification" && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
      setListeningKey(null);
    }
  }, [screen]);

  // When the manager email screen opens, draft the email from the flagged questions.
  useEffect(() => {
    if (screen !== "manager_email") return;
    const plans = compPlan ? [compPlan] : [];
    const flagged = collectFlaggedQuestions(plans, askManagerFlags);
    setDraftedEmail("");
    setEmailError(false);
    setEmailCopied(false);
    if (flagged.length === 0) { setEmailDrafting(false); return; }

    const meta = (compPlan && compPlan.meta) || {};
    // planYear derives from plan_period (an object); use its start year if present.
    const pp = meta.plan_period || null;
    let planYear = null;
    if (pp) {
      if (typeof pp === "string") planYear = pp;
      else if (pp.start_date) planYear = String(pp.start_date).slice(0, 4);
      else if (pp.type) planYear = pp.type;
    }

    let cancelled = false;
    setEmailDrafting(true);
    fetch("/api/draft-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questions: flagged,
        repName: meta.rep_name || null,
        planName: meta.plan_name || null,
        planYear,
      }),
    })
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        if (cancelled) return;
        if (data && data.ok && data.email) setDraftedEmail(data.email);
        else setEmailError(true);
        setEmailDrafting(false);
      })
      .catch(() => {
        if (cancelled) return;
        setEmailError(true);
        setEmailDrafting(false);
      });
    return () => { cancelled = true; };
  }, [screen]);

  useEffect(() => {
    window.history.replaceState({ screen: "landing" }, "");
    const onPop = (e) => setScreen(e.state && e.state.screen ? e.state.screen : "landing");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // While a document is being read, fill the progress circle from 0 toward ~90%
  // over about 30 seconds (a typical read). It completes to 100% when ingestion returns.
  useEffect(() => {
    if (!pendingDoc || ingestError) return;
    const id = setInterval(() => {
      setReadProgress((p) => (p >= 90 ? 90 : p + 90 / (30000 / 200)));
    }, 200);
    return () => clearInterval(id);
  }, [pendingDoc, ingestError]);

  // Fill the Coach's read progress circle from 0 toward ~90% over about 30 seconds.
  useEffect(() => {
    if (!coachReadLoading) return;
    const id = setInterval(() => {
      setCoachProgress((p) => (p >= 90 ? 90 : p + 90 / (30000 / 200)));
    }, 200);
    return () => clearInterval(id);
  }, [coachReadLoading]);

  // Resolve the Neon Auth identity to exactly one rep. Runs on login and on every
  // reload (the session persists), so currentRepId is derived from the identity
  // rather than held only in memory. Clears everything on logout / no session.
  useEffect(() => {
    if (sessionPending) return; // session still loading; do not treat as logged out
    if (!sessionUser) {
      ensureRepRef.current = null;
      setCurrentUser(null); setCurrentName(""); setCurrentRepId(null);
      setCompPlan(null); setCoachRead(null); coachReadForRef.current = null; coachTakeCacheRef.current = {}; setComparePlans([]); setSelectedPlanId(null); setComparePlanCache({}); comparePlansFetchedRef.current = null; setComparePlansLoadedFor(null); setDealPlan(null);
      setPlanConfirmed(false); planFetchedRef.current = null;
      return;
    }
    setCurrentUser(sessionUser.id);
    setCurrentName(sessionUser.name || "");
    if (ensureRepRef.current === sessionUser.id) return; // already resolved this identity
    ensureRepRef.current = sessionUser.id;
    let cancelled = false;
    (async () => {
      try {
        const headers = { "content-type": "application/json", ...(await authHeaders()) };
        const r = await fetch("/api/ensure-rep", {
          method: "POST",
          headers,
          body: JSON.stringify({ email: sessionUser.email || null, name: sessionUser.name || null }),
        });
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (d && d.ok && d.repId) {
          setCurrentRepId(d.repId);
          if (pendingProfileSaveRef.current) {
            // Just signed up: write the take-home profile the rep entered on signup.
            pendingProfileSaveRef.current = false;
            saveRepProfile();
          } else if (d.profile) {
            // Returning rep: seed the take-home inputs from the stored profile so the
            // values (and the take-home math) survive a reload. Only fill what exists.
            const p = d.profile;
            if (p.home_state) setSuState(p.home_state);
            if (p.age_bracket) setSuAge(p.age_bracket);
            if (p.k401_pct != null) setK401Pct(Number(p.k401_pct));
            if (p.health_monthly != null) setHealthMo(Number(p.health_monthly));
            if (p.other_monthly != null) setOtherMonthly(Number(p.other_monthly));
            if (p.target_pct != null) setTargetPct(Number(p.target_pct));
            if (p.stretch_pct != null) setStretchPct(Number(p.stretch_pct));
            setCarrots({
              target: { name: p.target_carrot_name || "", cost: p.target_carrot_cost == null ? "" : String(p.target_carrot_cost), locked: p.target_locked === true },
              stretch: { name: p.stretch_carrot_name || "", cost: p.stretch_carrot_cost == null ? "" : String(p.stretch_carrot_cost), locked: p.stretch_locked === true },
            });
            if (p.deal_plan) setDealPlan(p.deal_plan);
          }
        } else { console.error("ensure-rep failed:", d); }
      } catch (e) {
        if (!cancelled) console.error("ensure-rep error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionUser, sessionPending]);

  // Rehydrate on load: a returning rep's confirmed plan lives in the database, but
  // the client boots from empty in-memory state, so without this a reload shows
  // nothing and dumps the rep back to the landing page. Once per session, fetch the
  // rep-resolved current plan; if one exists, restore it and mark it confirmed, then
  // land on the home base hub (which populates from compPlan/planConfirmed). A rep
  // with no plan also lands on home base, which is the existing new-rep onboarding
  // hub (upload CTA). Coach's Take and the payout curve are intentionally NOT cached
  // here; they refetch/regenerate when the rep opens them, exactly as before.
  useEffect(() => {
    if (sessionPending) return;
    if (!sessionUser) { bootedRef.current = false; return; } // logged out: re-boot on next login
    if (bootedRef.current) return;
    bootedRef.current = true; // run once per session (guards against StrictMode double-invoke)
    (async () => {
      try {
        const headers = await authHeaders();
        const r = await fetch("/api/get-plan", { headers });
        const d = await r.json().catch(() => null);
        if (d && d.ok && d.plan) {
          setCompPlan(d.plan);    // restore the rep's current plan
          setPlanConfirmed(true); // a saved current plan is the rep's confirmed plan
          // Seed the cached Coach's Take so the view opens instantly with no regen.
          // Write the synchronous cache too, so runCoachRead serves it on cold boot.
          if (d.coachTake && d.plan.meta && d.plan.meta.plan_id) {
            coachTakeCacheRef.current[d.plan.meta.plan_id] = d.coachTake;
            setCoachRead(d.coachTake);
            coachReadForRef.current = d.plan.meta.plan_id;
          }
        }
      } catch (e) {
        // Non-fatal: the rep can still navigate, and the comp-area effect will fetch.
      }
      // Move a fresh load off the marketing landing page onto the home base hub.
      // `screen` is read once at boot (it is "landing" on a fresh load); the bootedRef
      // guard keeps this to a single run, so the closed-over value is intentional.
      if (screen === "landing") {
        window.history.replaceState({ screen: "home_base" }, ""); // so Back is not a logged-in landing
        setScreen("home_base");
        window.scrollTo(0, 0);
      }
    })();
  }, [sessionUser, sessionPending]);

  // Load the rep's current plan from the database when they enter the comp area.
  // Skips when a plan is already in memory (fresh upload or already loaded) so there
  // is no double-display, and only fetches once per rep per session.
  useEffect(() => {
    const inCompArea = ["comp_dashboard", "comp_documents", "plan_summary", "coach_take", "payout_curve"].indexOf(screen) >= 0;
    if (!inCompArea || !currentRepId) return;
    if (compPlan) { planFetchedRef.current = currentRepId; return; }
    if (planFetchedRef.current === currentRepId) return;
    planFetchedRef.current = currentRepId;
    let cancelled = false;
    setDbPlanLoading(true);
    (async () => {
      try {
        const headers = await authHeaders();
        const r = await fetch("/api/get-plan", { headers });
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (d && d.ok && d.plan) {
          setCompPlan(d.plan);
          // Seed the cached Coach's Take so the view opens instantly with no regen.
          // Write the synchronous cache too, so runCoachRead serves it on cold boot.
          if (d.coachTake && d.plan.meta && d.plan.meta.plan_id) {
            coachTakeCacheRef.current[d.plan.meta.plan_id] = d.coachTake;
            setCoachRead(d.coachTake);
            coachReadForRef.current = d.plan.meta.plan_id;
          }
        }
        setDbPlanLoading(false);
      } catch (e) {
        if (!cancelled) setDbPlanLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [screen, currentRepId, compPlan]);

  // Comparison: load the rep's plan list (for the year tabs) once they're in the comp
  // area. Default-selects the newest year (the current plan). Lightweight rows only;
  // a prior plan's full detail is fetched on demand when its tab is opened.
  useEffect(() => {
    const inCompArea = ["comp_dashboard", "comp_documents", "plan_summary", "coach_take", "payout_curve"].indexOf(screen) >= 0;
    if (!inCompArea || !currentRepId) return;
    if (comparePlansFetchedRef.current === currentRepId) return;
    comparePlansFetchedRef.current = currentRepId;
    let cancelled = false;
    (async () => {
      let plans = [];
      try {
        const headers = await authHeaders();
        const r = await fetch("/api/list-plans", { headers });
        const d = await r.json().catch(() => null);
        if (d && d.ok && Array.isArray(d.plans)) plans = d.plans;
      } catch (e) { /* non-fatal: leave plans empty */ }
      if (cancelled) return;
      setComparePlans(plans);
      setSelectedPlanId((prev) => prev || (plans[0] && plans[0].id) || null); // default: newest year (current)
      // Mark the list resolved (even if empty/failed) so the take generator knows
      // whether a prior exists and can proceed instead of waiting forever.
      setComparePlansLoadedFor(currentRepId);
    })();
    return () => { cancelled = true; };
  }, [screen, currentRepId]);

  // Keep the current plan in the comparison cache so its own tab renders instantly.
  useEffect(() => {
    const pid = compPlan && compPlan.meta && compPlan.meta.plan_id;
    if (pid) setComparePlanCache((prev) => (prev[pid] ? prev : { ...prev, [pid]: compPlan }));
  }, [compPlan]);

  // Select a year tab; fetch + cache that plan's full detail on first open (rep-scoped
  // on the server). The current plan is already cached, so it shows with no fetch.
  const selectComparePlan = async (planId) => {
    setSelectedPlanId(planId);
    if (!planId || comparePlanCache[planId]) return;
    try {
      const headers = await authHeaders();
      const r = await fetch(`/api/get-plan?planId=${encodeURIComponent(planId)}`, { headers });
      const d = await r.json().catch(() => null);
      if (d && d.ok && d.plan) setComparePlanCache((prev) => ({ ...prev, [planId]: d.plan }));
    } catch (e) { /* non-fatal: the tab will show its loading state */ }
  };

  // Gate Coach's Take: it is step 3 and is only reachable once the plan is
  // confirmed in step 2. If a rep lands here without a confirmed plan (back
  // button, direct nav), send them to the review and confirm step.
  useEffect(() => {
    if (screen === "coach_take" && !planConfirmed) goFlow("plan_summary");
  }, [screen, planConfirmed]);

  // Generate Coach's read for a plan and cache it. Takes are keyed to the plan's id
  // (every material change mints a new plan_id in save-plan), so when we already hold
  // the take for this plan version we skip regeneration unless forced. On success the
  // take is persisted via /api/save-coach-take so reopening the plan is instant; a
  // newer call supersedes an in-flight one via coachReqRef.
  const runCoachRead = async (plan, force) => {
    if (!plan) return;
    const planId = (plan.meta && plan.meta.plan_id) || null;
    // Synchronous cache hit (covers a take seeded from get-plan on cold boot/refresh):
    // serve the stored take and never call coach-read. This does not depend on the
    // coachRead state having committed yet, which is what made a refresh regenerate.
    if (!force && planId && coachTakeCacheRef.current[planId]) {
      coachReadForRef.current = planId;
      setCoachRead(coachTakeCacheRef.current[planId]);
      setCoachProgress(100);
      setCoachReadLoading(false);
      return;
    }
    if (!force && coachReadForRef.current === planId && coachRead) return; // already in hand
    coachReadForRef.current = planId;
    const reqId = ++coachReqRef.current;
    setCoachRead(null);
    setCoachProgress(0);
    setCoachReadLoading(true);
    try {
      // Resolve the immediate prior plan (if any) so the take includes year-over-year
      // comparison. comparePlans is newest-first, so the first entry that is not the
      // current plan is the prior. Use the cache, fetching the prior's full detail once.
      let priorPlan = null;
      const priorMeta = comparePlans.find((p) => p.id && p.id !== planId);
      if (priorMeta) {
        priorPlan = comparePlanCache[priorMeta.id] || null;
        if (!priorPlan) {
          try {
            const ph = await authHeaders();
            const pr = await fetch(`/api/get-plan?planId=${encodeURIComponent(priorMeta.id)}`, { headers: ph });
            const pd = await pr.json().catch(() => null);
            if (pd && pd.ok && pd.plan) { priorPlan = pd.plan; setComparePlanCache((prev) => ({ ...prev, [priorMeta.id]: pd.plan })); }
          } catch (e) { /* no prior available; the take just won't include a comparison */ }
        }
      }
      const r = await fetch("/api/coach-read", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify(priorPlan ? { plan, priorPlan } : { plan }),
      });
      const data = await r.json().catch(() => null);
      if (reqId !== coachReqRef.current) return; // a newer run superseded this one
      if (r.status === 429) {
        // Daily usage limit reached: surface the friendly block, clear the spinner.
        noteUsageBlocked(data && data.usage);
        setCoachRead(null);
        coachReadForRef.current = null;
        setCoachProgress(100);
        setCoachReadLoading(false);
        return;
      }
      if (data && data.ok && data.read) {
        noteUsage(data.usage); // reflect the true server count in the usage popups
        setCoachRead(data.read);
        // Persist onto this plan version so reopening shows it instantly. Best-effort.
        if (planId) {
          coachTakeCacheRef.current[planId] = data.read; // remember for this session (survives nav)
          try {
            const headers = { "content-type": "application/json", ...(await authHeaders()) };
            fetch("/api/save-coach-take", { method: "POST", headers, body: JSON.stringify({ planId, take: data.read }) });
          } catch (e) { /* cache write is non-fatal */ }
        }
      } else {
        setCoachRead(null);
        coachReadForRef.current = null; // allow retry on reopen
      }
      setCoachProgress(100);
      setCoachReadLoading(false);
    } catch (e) {
      if (reqId !== coachReqRef.current) return;
      setCoachRead(null);
      coachReadForRef.current = null; // allow retry on reopen
      setCoachProgress(100);
      setCoachReadLoading(false);
    }
  };

  // When the Coach's Take view opens, show the cached take instantly if we already
  // hold one for this plan version (seeded from get-plan or generated earlier this
  // session); only call coach-read when there is none. The cache key is plan_id, so a
  // re-uploaded or amended plan (new plan_id) regenerates. We wait until the plan list
  // has resolved (comparePlansLoadedFor) so a first generation knows whether a prior
  // exists and includes the comparison rather than racing to generate without it.
  useEffect(() => {
    if (screen !== "coach_take" || !compPlan) return;
    if (comparePlansLoadedFor !== currentRepId) return;
    runCoachRead(compPlan, false);
  }, [screen, compPlan, comparePlansLoadedFor, currentRepId]);

  // ══ AUTH (login / signup, front-end stub) ════════════════════════════
  if (screen === "auth") {
    const isSignup = authMode === "signup";
    const tabStyle = (on) => ({
      flex: 1, padding: "11px", border: "none", borderRadius: 10, cursor: "pointer",
      fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 18,
      background: on ? "white" : "transparent", color: on ? "var(--carrot)" : "var(--muted)",
      boxShadow: on ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
    });
    const lblStyle = { display: "block", fontSize: 18, fontWeight: 700, marginBottom: 6, marginTop: 4 };
    const inpStyle = { width: "100%", padding: "13px 16px", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 18, fontFamily: "'DM Sans',sans-serif", background: "white", color: "var(--ink)", marginBottom: 16, boxSizing: "border-box" };
    const onEnter = (e) => { if (e.key === "Enter") submitAuth(); };
    // Two-column signup layout helpers (laptop-first; the grid collapses to one
    // column on narrow screens via auto-fit).
    const fieldsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", columnGap: 28, rowGap: 0, marginBottom: 4 };
    const colHdr = { fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--carrot)", marginBottom: 12 };
    const helpLine = { color: "var(--muted)", fontSize: 14, lineHeight: 1.4, margin: "-10px 0 14px" };
    // Evenly-spaced segmented control for the age / 401k bracket.
    const segWrap = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: 6 };
    const segBtn = (on) => ({ padding: "13px 8px", borderRadius: 10, border: on ? "1.5px solid var(--carrot)" : "1.5px solid var(--border)", background: on ? "var(--carrot)" : "white", color: on ? "white" : "var(--muted)", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "center", whiteSpace: "nowrap" });
    const circle = (cur) => ({ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flex: "none", background: cur ? "var(--carrot)" : "white", color: cur ? "white" : "var(--muted)", border: cur ? "none" : "1.5px solid var(--border)" });
    const greenCoach = <span style={{ color: "var(--green)", fontWeight: 700 }}>Coach</span>;
    const steps = [
      { n: 1, title: "Create your account", body: "A name, your email, and a password. That's all we need to begin.", current: true },
      { n: 2, title: "Load your plan and meet Coach", body: <>Drop in your comp plan. {greenCoach} reads every line and shows you what it's really worth.</> },
      { n: 3, title: "Build your strategy", body: "Coach helps you turn your number into a real plan of attack, account by account." },
      { n: 4, title: "Keep going all season", body: "Come back to stay on track, update your plan, and walk into every QBR ready." },
    ];
    const panelTint = { flex: "1 1 400px", background: "#FFF6EF", border: "1.5px solid #F0D9C6", borderRadius: 24, padding: "42px 38px" };
    return (
      <div className="auth-root" style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "'DM Sans',sans-serif", color: "var(--ink)", paddingTop: 72 }}>
        <style>{S}</style>
        <style>{`
          .auth-root :focus{ outline:none; }
          .auth-root :focus-visible{ outline:none; box-shadow:0 0 0 3px rgba(244,113,26,0.35); }
          .auth-root input:focus-visible{ border-color:var(--carrot); }
        `}</style>
        {renderTopBar(false)}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", minHeight: "calc(100vh - 75px)" }}>
          <div style={{ display: "flex", gap: 28, width: "100%", maxWidth: isSignup ? 1200 : 1000, flexWrap: "wrap", alignItems: "stretch" }}>

            {/* LEFT: form card. Wider on signup so the credentials and take-home
                details sit side by side instead of one tall scrolling column. */}
            <div style={{ flex: isSignup ? "1 1 600px" : "1 1 440px", maxWidth: isSignup ? 820 : 500, background: "white", border: "1.5px solid var(--border)", borderRadius: 24, padding: "42px 40px", boxShadow: "0 20px 50px -24px rgba(26,18,8,0.25)" }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 35, fontWeight: 900, marginBottom: 6, lineHeight: 1.15 }}>{isSignup ? "Let's get you started" : "Welcome back"}</h1>
              <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 24, lineHeight: 1.5 }}>{isSignup ? "Just a couple of details and we'll get to work." : "Let's keep going."}</p>

              <div style={{ display: "flex", gap: 6, background: "var(--cream)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 5, marginBottom: 24 }}>
                <button onClick={() => { if (authMode !== "login") toggleAuthMode(); }} style={tabStyle(!isSignup)}>Log in</button>
                <button onClick={() => { if (authMode !== "signup") toggleAuthMode(); }} style={tabStyle(isSignup)}>Sign up</button>
              </div>

              {isSignup ? (
                /* Laptop-first: two balanced columns inside the card. Account on the
                   left, take-home details on the right. auto-fit collapses to one
                   column on a phone. */
                <div style={fieldsGrid}>
                  {/* Column 1 — account */}
                  <div>
                    <div style={colHdr}>Your account</div>
                    <label style={lblStyle}>First name</label>
                    <input value={authFirst} onChange={(e) => setAuthFirst(e.target.value)} placeholder="Karl" style={inpStyle} autoComplete="given-name" onKeyDown={onEnter} />

                    <label style={lblStyle}>Email</label>
                    <input type="email" value={authUser} onChange={(e) => setAuthUser(e.target.value)} placeholder="you@company.com" style={inpStyle} autoComplete="email" onKeyDown={onEnter} />

                    <label style={lblStyle}>Password</label>
                    <input type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="••••••••" style={inpStyle} autoComplete="new-password" onKeyDown={onEnter} />

                    <label style={lblStyle}>Confirm password</label>
                    <input type="password" value={authPass2} onChange={(e) => setAuthPass2(e.target.value)} placeholder="••••••••" style={inpStyle} autoComplete="new-password" onKeyDown={onEnter} />
                  </div>

                  {/* Column 2 — take-home profile (persisted to the rep, editable later
                      in the Step-3 take-home screen). State is required; rest default. */}
                  <div>
                    <div style={colHdr}>Take-home details</div>

                    <label style={lblStyle}>What state do you live in?</label>
                    <select value={suState} onChange={(e) => setSuState(e.target.value)} style={inpStyle}>
                      <option value="">Select state</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <label style={lblStyle}>401k Age Bracket</label>
                    <div style={segWrap}>
                      {AGE_BRACKETS.map((b) => (
                        <button key={b} type="button" style={segBtn(suAge === b)} onClick={() => setSuAge(b)}>{b}</button>
                      ))}
                    </div>
                    <p style={helpLine}>Your age bracket. Sets your 401k contribution limit.</p>

                    <label style={lblStyle}>401k contribution: {k401Pct}%</label>
                    <input className="ob-slider" type="range" min="0" max="100" step="0.5" value={k401Pct} onChange={(e) => setK401Pct(+e.target.value)} style={{ marginBottom: 16 }} />

                    <label style={lblStyle}>Monthly benefits / medical premium</label>
                    <input type="number" value={healthMo} onChange={(e) => setHealthMo(+e.target.value)} placeholder="200" style={inpStyle} />

                    <label style={lblStyle}>Other monthly deductions</label>
                    <input type="number" value={otherMonthly} onChange={(e) => setOtherMonthly(+e.target.value)} placeholder="0" style={inpStyle} />
                  </div>
                </div>
              ) : (
                <>
                  <label style={lblStyle}>Email</label>
                  <input type="email" value={authUser} onChange={(e) => setAuthUser(e.target.value)} placeholder="you@company.com" style={inpStyle} autoComplete="email" onKeyDown={onEnter} />

                  <label style={lblStyle}>Password</label>
                  <input type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="••••••••" style={inpStyle} autoComplete="current-password" onKeyDown={onEnter} />
                </>
              )}

              {authError && (
                <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", borderRadius: 12, padding: "10px 14px", fontSize: 18, lineHeight: 1.45, marginBottom: 16 }}>{authError}</div>
              )}

              <button onClick={submitAuth} style={{ width: "100%", padding: 16, borderRadius: 100, border: "none", background: "var(--carrot)", color: "white", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                {isSignup ? "Let's go" : "Log in"}
              </button>

              <div style={{ textAlign: "center", marginTop: 18, fontSize: 18, color: "var(--muted)" }}>
                {isSignup ? "Already have an account? " : "New to Earn The Carrot? "}
                <button onClick={toggleAuthMode} style={{ background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, cursor: "pointer", fontSize: 18, fontFamily: "'DM Sans',sans-serif", padding: 0 }}>{isSignup ? "Log in" : "Sign up"}</button>
              </div>
            </div>

            {/* RIGHT: journey panel */}
            {isSignup ? (
              <div style={panelTint}>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--carrot)", marginBottom: 8 }}>Here's how we start</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 29, fontWeight: 900, lineHeight: 1.2, marginBottom: 24 }}>Your first few steps with Coach</h2>
                <div>
                  {steps.map((s, i) => (
                    <div key={s.n} style={{ display: "flex", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={circle(s.current)}>{s.n}</div>
                        {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: "#E7D2BF", marginTop: 6, minHeight: 18 }} />}
                      </div>
                      <div style={{ paddingBottom: i < steps.length - 1 ? 22 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{s.title}</div>
                          {s.current && <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--carrot)", background: "var(--carrot-light)", border: "1px solid rgba(244,113,26,0.4)", borderRadius: 100, padding: "2px 9px" }}>You're here</span>}
                        </div>
                        <div style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginTop: 4 }}>{s.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ ...panelTint, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--carrot)", marginBottom: 10 }}>Good to see you</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 31, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>Welcome back</h2>
                <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.6 }}>Let's pick up right where you left off and keep your plan moving. {greenCoach} has been holding your spot.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ══ COMP PLAN DASHBOARD ══════════════════════════════════════════════
  if (screen === "comp_dashboard") {
    const hasPlan = !!compPlan;
    const backLink = { background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0 };
    const orangePill = { background: "var(--carrot)", color: "white", border: "none", borderRadius: 100, padding: "13px 26px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    const FolderIcon = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" /></svg>;
    const SummaryIcon = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></svg>;
    const TakeIcon = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20l1.3-4.4A8 8 0 1 1 21 11.5Z" /></svg>;
    const CurveIcon = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M6 15c4 0 5-8 9-8 3 0 3 4 6 4" /></svg>;
    const GoalIcon = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>;
    const cards = hasPlan
      ? [
          { key: "docs", icon: FolderIcon, name: "Comp Plan Documents", desc: "Your comp plan, SPIFF notes, and anything you've dropped in.", cls: "hb-area active", onClick: () => goFlow("comp_documents"), badge: "ready" },
          { key: "summary", icon: SummaryIcon, name: "Your Plan Summary", desc: "The numbers Coach pulled out, ready to review and edit.", cls: "hb-area active", onClick: () => goFlow("plan_summary"), badge: "ready" },
          planConfirmed
            ? { key: "take", icon: TakeIcon, name: "Coach's Take", desc: "Coach's read on what this plan is really built to make you do.", cls: "hb-area active", onClick: () => goFlow("coach_take"), badge: "ready" }
            : { key: "take", icon: TakeIcon, name: "Coach's Take", desc: "Coach's read on what your plan is really built to do.", cls: "hb-area soon", hint: "Review your plan first" },
          { key: "curve", icon: CurveIcon, name: "Payout Curve", desc: "See what your plan pays at every level of attainment.", cls: "hb-area active", onClick: () => goFlow("payout_curve"), badge: "ready" },
          { key: "goals", icon: GoalIcon, name: "Target & Stretch Goals", desc: "Set your target and stretch attainment and see net and gross take-home for each.", cls: "hb-area active", onClick: () => goFlow("earnings_goals"), badge: "ready" },
        ]
      : [
          { key: "docs", icon: FolderIcon, name: "Comp Plan Documents", desc: "Drop in your comp plan and I'll show you what it's really worth.", cls: "hb-area hot", onClick: () => goFlow("comp_documents"), cue: "Start here", button: "Upload your comp plan" },
          { key: "summary", icon: SummaryIcon, name: "Your Plan Summary", desc: "The numbers Coach pulls out, ready to review and edit.", cls: "hb-area soon", hint: "Once your plan is loaded" },
          { key: "take", icon: TakeIcon, name: "Coach's Take", desc: "Coach's read on what your plan is really built to do.", cls: "hb-area soon", hint: "Once your plan is loaded" },
        ];
    const cuePill = { alignSelf: "flex-start", fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--carrot)", background: "white", border: "1px solid var(--carrot)", borderRadius: 100, padding: "3px 10px", marginBottom: 12 };
    const cardBtn = { marginTop: 14, alignSelf: "flex-start", background: "var(--carrot)", color: "white", border: "none", borderRadius: 100, padding: "10px 18px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    return (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        <div className="hb-main">
          <button style={backLink} onClick={() => maybeRemind(() => goFlow("home_base"))}>‹ Back to home</button>
          {renderReminder()}
          <h1 className="hb-h1" style={{ marginTop: 12 }}>Your Comp Plan</h1>
          <p className="hb-sub">Everything that defines how you get paid, in one place. Open a card to dig in.</p>

          {dbPlanLoading && !compPlan ? (
            <div className="ob-card" style={{ padding: 20, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Loading your plan...</div>
          ) : (
          <>
          <div className="hb-areas">
            {cards.map((c) => (
              <div key={c.key} className={c.cls} onClick={c.onClick}>
                {c.cue && <span style={cuePill}>{c.cue}</span>}
                <div className="hb-area-icon">{c.icon}</div>
                <div className="hb-area-name">{c.name}</div>
                <div className="hb-area-desc">{c.desc}</div>
                {c.button
                  ? <button style={cardBtn} onClick={(e) => { e.stopPropagation(); goFlow("comp_documents"); }}>{c.button}</button>
                  : c.badge === "ready"
                    ? <span className="hb-area-status ready">Ready</span>
                    : c.hint
                      ? <span className="hb-area-status soon">{c.hint}</span>
                      : null}
              </div>
            ))}
          </div>

          {hasPlan && (
            <div onClick={() => goFlow("comp_documents")} style={{ cursor: "pointer", border: "2px dashed #E7C9AE", background: "#FFF6EF", marginTop: 28, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Got something new?</div>
                <div style={{ fontSize: 18, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>Drop in a revised plan, last year's plan, or a SPIFF email and I'll read it in.</div>
              </div>
              <button style={orangePill} onClick={(e) => { e.stopPropagation(); goFlow("comp_documents"); }}>Add a document</button>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    );
  }

  // ══ COMP PLAN DOCUMENTS ══════════════════════════════════════════════
  if (screen === "comp_documents") {
    const backLink = { background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0 };
    const prov = (compPlan && compPlan.provenance) || {};
    const sf = Array.isArray(prov.source_files) ? prov.source_files : [];
    const readyPill = { fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "4px 10px", borderRadius: 100, background: "var(--green-light)", color: "var(--green)", flex: "none" };
    const orangePill = { background: "var(--carrot)", color: "white", border: "none", borderRadius: 100, padding: "12px 22px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    const removeBtn = { background: "none", border: "none", color: "var(--muted)", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: "4px 6px", textDecoration: "underline", flex: "none" };
    const keepBtn = { background: "white", border: "1.5px solid var(--border)", color: "var(--muted)", borderRadius: 100, padding: "8px 16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    const confirmRemoveBtn = { background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", borderRadius: 100, padding: "8px 16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    const actionPrimary = { background: "var(--carrot)", color: "white", border: "none", borderRadius: 14, padding: "12px 22px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    const actionSecondary = { background: "white", color: "var(--carrot)", border: "1.5px solid var(--carrot)", borderRadius: 14, padding: "12px 22px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
    // Removing a document clears the current plan and all state learned from it.
    // Archive (soft-delete) the current plan in the database, then clear local
    // state only on success. The append-only facts ledger is never deleted.
    const removePlan = async () => {
      const planId = compPlan && compPlan.meta && compPlan.meta.plan_id;
      setArchiveError("");
      setArchiving(true);
      try {
        if (planId) {
          const headers = { "content-type": "application/json", ...(await authHeaders()) };
          const r = await fetch("/api/archive-plan", { method: "POST", headers, body: JSON.stringify({ planId }) });
          const d = await r.json().catch(() => null);
          if (!d || !d.ok) { setArchiveError("We could not remove this just now. Please try again."); setArchiving(false); return; }
        }
        setCompPlan(null);
        setCoachRead(null);
        coachReadForRef.current = null;
        setClarificationAnswers({});
        setAskManagerFlags({});
        setPlanEdits({});
        setPlanConfirmed(false);
        planFetchedRef.current = null; // force a fresh read so the archived plan stays gone
        setDocRemoveIdx(null);
        setArchiving(false);
        goFlow("comp_dashboard");
      } catch (e) {
        setArchiveError("We could not remove this just now. Please try again.");
        setArchiving(false);
      }
    };

    // Derive the structured fields for the current plan's document(s).
    const meta = (compPlan && compPlan.meta) || {};
    const pp = meta.plan_period || null;
    let planYear = "Year not stated";
    const yearMatch = String((pp && (pp.start_date || pp.end_date)) || (typeof pp === "string" ? pp : "")).match(/\d{4}/);
    if (yearMatch) planYear = "FY" + yearMatch[0];
    const description = meta.plan_name || (meta.rep_role ? `${meta.rep_role} Comp Plan` : "Comp plan");
    const now = new Date();
    const dateLoaded = `${MONTHS[now.getMonth()].slice(0, 3)} ${now.getDate()}, ${now.getFullYear()}`;
    // Plan Year is its own field so we can sort or filter on it later.
    const docs = sf.map((name) => ({ name, dateLoaded, planYear, description }));

    const field = (label, value, grow) => (
      <div style={{ flex: grow ? "1 1 200px" : "0 0 auto", minWidth: grow ? 160 : 110 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--muted)", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", wordBreak: "break-word" }}>{value}</div>
      </div>
    );

    // Confirm-status treatment, shown directly with the Confirm button.
    const needsReviewPill = { fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "5px 10px", borderRadius: 100, background: "var(--gold-light)", color: "#7A5C00", border: "1px solid var(--gold)", textAlign: "center" };
    const confirmedTag = { fontSize: 15, fontWeight: 700, color: "var(--green)", textAlign: "center" };
    const nudgeLine = { fontSize: 16, fontWeight: 700, color: "var(--carrot-dark)", lineHeight: 1.4, textAlign: "center" };
    const confirmBtnStyle = planConfirmed
      ? { background: "white", color: "var(--muted)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "12px 22px", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }
      : actionPrimary;
    const onPick = (file) => { if (file) maybeRemind(() => ingestFile(file)); };
    const R = 11, C = 2 * Math.PI * R;

    return (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        <style>{`@keyframes azspin{to{transform:rotate(360deg);}}@keyframes confirmpulse{0%{box-shadow:0 0 0 0 rgba(244,113,26,0.45);}70%{box-shadow:0 0 0 10px rgba(244,113,26,0);}100%{box-shadow:0 0 0 0 rgba(244,113,26,0);}}`}</style>
        {renderReminder()}
        {renderUsageNotice()}
        {renderTopBar(true)}
        {renderRail()}
        <div className="hb-main">
          <button style={backLink} onClick={() => maybeRemind(() => goFlow("comp_dashboard"))}>‹ Back to Comp Plan</button>
          <h1 className="hb-h1" style={{ marginTop: 12 }}>Your Comp Documents</h1>
          <p className="hb-sub">The files Coach has read for this plan. Full document history is coming soon.</p>

          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "16px 20px", marginBottom: 12, maxWidth: 1040 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>How this works</div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[["1", "Load your file"], ["2", "Confirm Coach's understanding"], ["3", "Review Coach's thoughts"]].map(([n, label]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--carrot-light)", color: "var(--carrot-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flex: "none" }}>{n}</span>
                  <span style={{ fontSize: 16, color: "var(--ink)", fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 18, lineHeight: 1.5, maxWidth: 1040 }}>Not sure about something? When you <button onClick={() => goFlow("plan_summary")} style={{ background: "none", border: "none", padding: 0, color: "var(--carrot-dark)", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "inherit", textDecoration: "underline" }}>review</button>, I can draft an email to your manager with the key questions.</div>

          {/* Upload lives here now: drop or browse, files appear in the list below. */}
          <div
            onClick={() => compUploadRef.current && compUploadRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files && e.dataTransfer.files[0]); }}
            style={{ cursor: "pointer", border: "2px dashed #E7C9AE", borderRadius: 16, background: "white", padding: "20px 24px", marginBottom: 10, maxWidth: 1200, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
          >
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Drop your comp documents here</div>
              <div style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5 }}>Your comp plan, a revised plan, last year's plan, or a SPIFF email. PDF works best.</div>
            </div>
            <button style={orangePill} onClick={(e) => { e.stopPropagation(); compUploadRef.current && compUploadRef.current.click(); }}>Browse files</button>
          </div>
          <input ref={compUploadRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; onPick(f); }} />
          {ingestError && !pendingDoc && <div style={{ maxWidth: 1200, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", borderRadius: 12, padding: "10px 14px", fontSize: 18, lineHeight: 1.45, marginBottom: 8 }}>{ingestError}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 1200, marginTop: 12 }}>
            {/* In-place reading row with a filling progress circle. */}
            {pendingDoc && (
              <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                {ingestError ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, wordBreak: "break-word" }}>{pendingDoc.name}</div>
                      <div style={{ fontSize: 16, color: "#B91C1C", marginTop: 2 }}>{ingestError || "Coach had trouble reading this. Please try again."}</div>
                    </div>
                    <button style={removeBtn} onClick={() => { setPendingDoc(null); setIngestError(""); }}>Dismiss</button>
                  </>
                ) : (
                  <>
                    {fillCircle(readProgress)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, wordBreak: "break-word" }}>{pendingDoc.name}</div>
                      <div style={{ fontSize: 16, color: "var(--muted)", marginTop: 2 }}>Coach is reading this... {Math.round(readProgress)}%</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {docs.length === 0 && !pendingDoc && dbPlanLoading && (
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Loading your plan...</div>
            )}
            {docs.length === 0 && !pendingDoc && !dbPlanLoading && (
              <div style={{ fontSize: 18, color: "var(--muted)", fontStyle: "italic" }}>No documents yet. Drop one in above and Coach will read it.</div>
            )}

            {docs.map((doc, i) => (
              <div key={i} style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", flex: "1 1 320px", minWidth: 260 }}>
                    {field("Plan year", doc.planYear)}
                    {field("Date loaded", doc.dateLoaded)}
                    {field("File name", doc.name, true)}
                    {field("Description", doc.description, true)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", flex: "0 0 440px", maxWidth: 480 }}>
                    {planConfirmed
                      ? <span style={confirmedTag}>✓ Confirmed</span>
                      : <span style={needsReviewPill}>Needs review</span>}
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 4 }}>
                        <button style={{ ...confirmBtnStyle, width: "100%", lineHeight: 1.25, animation: planConfirmed ? "none" : "confirmpulse 1.4s ease-out 2" }} onClick={() => goFlow("plan_summary")}>Confirm Coach's Understanding</button>
                        {!planConfirmed && <span style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>Review first</span>}
                      </div>
                      {planConfirmed ? (
                        <button style={{ ...actionSecondary, flex: 1, minWidth: 200, lineHeight: 1.25 }} onClick={() => goFlow("coach_take")}>What Coach Thinks of This File</button>
                      ) : (
                        <button style={{ ...actionSecondary, flex: 1, minWidth: 200, lineHeight: 1.25, opacity: 0.45, cursor: "default" }} disabled>What Coach Thinks of This File</button>
                      )}
                    </div>
                    {docRemoveIdx !== i && <button style={{ ...removeBtn, alignSelf: "center" }} onClick={() => setDocRemoveIdx(i)}>Remove</button>}
                  </div>
                </div>
                {docRemoveIdx === i && (
                  <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,10,5,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div style={{ width: "100%", maxWidth: 480, background: "white", border: "1.5px solid var(--border)", borderRadius: 18, padding: 28, boxShadow: "0 24px 60px -20px rgba(26,18,8,0.4)" }}>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Are you sure?</h3>
                      <p style={{ fontSize: 16, color: "var(--ink)", lineHeight: 1.55, marginBottom: 16 }}>We recommend keeping your plans loaded so your history and earnings stay accurate. Removing this is unusual. Coach will forget what it learned from this file, and it will stop showing in your payout curve.</p>
                      {archiveError && <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", borderRadius: 12, padding: "10px 14px", fontSize: 15, lineHeight: 1.45, marginBottom: 14 }}>{archiveError}</div>}
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button style={{ ...keepBtn, opacity: archiving ? 0.6 : 1 }} disabled={archiving} onClick={() => { setDocRemoveIdx(null); setArchiveError(""); }}>Keep it loaded</button>
                        <button style={{ ...confirmRemoveBtn, opacity: archiving ? 0.6 : 1 }} disabled={archiving} onClick={removePlan}>{archiving ? "Removing..." : "Remove anyway"}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══ COACH'S TAKE (narrative read, generated on demand) ═══════════════
  if (screen === "coach_take") {
    if (!planConfirmed) return null; // gated: the effect above redirects to plan_summary
    const backLink = { background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0 };
    const cr = coachRead || {};
    const crMoney = Array.isArray(cr.where_money_is) ? cr.where_money_is : [];
    const crBlind = Array.isArray(cr.blind_spots) ? cr.blind_spots : [];
    const hasReadContent = !!(cr.thesis || crMoney.length || cr.pushing_toward || crBlind.length || cr.bridge);
    const secH = { fontFamily: "'Playfair Display',serif", fontSize: 23, fontWeight: 700, margin: "0 0 8px" };
    const tintThesis = { background: "var(--carrot-light)", border: "1.5px solid rgba(244,113,26,0.35)" };
    const tintMoney = { background: "var(--green-light)", border: "1.5px solid rgba(45,106,79,0.30)" };
    const tintPush = { background: "var(--gold-light)", border: "1.5px solid var(--gold)" };
    const tintBlind = { background: "#FFF1F2", border: "1.5px solid #FBB6CE" };
    const secHGreen = { ...secH, color: "var(--green)" };
    const secHGold = { ...secH, color: "#7A5C00" };
    const secHRose = { ...secH, color: "#9F1239" };
    const signalPill = (sig) => {
      if (!sig) return null;
      const green = sig === "highest" || sig === "uncapped" || sig === "steady";
      return (
        <span style={{ fontSize: 15, fontWeight: 700, padding: "2px 9px", borderRadius: 100, textTransform: "capitalize", whiteSpace: "nowrap", background: green ? "var(--green-light)" : "#FFE4E6", color: green ? "var(--green)" : "#9F1239", border: green ? "1px solid #A7D6B5" : "1px solid #FBB6CE" }}>{sig}</span>
      );
    };
    return (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H }}>
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <style>{HOME_STYLES}</style>
        {renderUsageNotice()}
        {renderTopBar(true)}
        {renderRail()}
        {/* Center in the viewport with a max readable width; never underlap the fixed rail. */}
        <div className="hb-main" style={{ maxWidth: 1160, marginLeft: `max(${railW}px, calc((100vw - 1160px) / 2))`, marginRight: "auto" }}>
          <button style={backLink} onClick={() => goFlow("comp_dashboard")}>‹ Back to Comp Plan</button>
          <h1 className="hb-h1" style={{ marginTop: 12 }}>Coach's Take</h1>
          <p className="hb-sub">Good, your plan is locked in. Here's what I'm seeing and where I think we can go to work.</p>

          {!compPlan ? (
            <div className="ob-card">Load a plan first and Coach will give you a read.</div>
          ) : coachReadLoading ? (
            <div className="ob-card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 20 }}>
              {fillCircle(coachProgress)}
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Coach is working through what your plan means for you... {Math.round(coachProgress)}%</div>
            </div>
          ) : hasReadContent ? (
            <>
              {cr.thesis ? (
                <div className="ob-card" style={tintThesis}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--carrot)", marginBottom: 8 }}>Coach's read</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 25, fontWeight: 700, lineHeight: 1.35, color: "var(--ink)" }}>{cr.thesis}</div>
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, alignItems: "start" }}>
              {crMoney.length > 0 ? (
                <div className="ob-card" style={tintMoney}>
                  <div style={secHGreen}>Where your money is</div>
                  {crMoney.map((row, i) => (
                    <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", paddingTop: i === 0 ? 0 : 12, marginTop: i === 0 ? 0 : 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)" }}>{row.name}</div>
                        {signalPill(row.signal)}
                      </div>
                      {row.detail ? <div style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>{row.detail}</div> : null}
                      {row.rate ? <div style={{ fontSize: 18, fontWeight: 700, color: "var(--carrot-dark)", marginTop: 2 }}>{row.rate}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {cr.pushing_toward ? (
                <div className="ob-card" style={tintPush}>
                  <div style={secHGold}>What this plan is pushing you toward</div>
                  <div style={{ fontSize: 18, color: "var(--ink)", lineHeight: 1.65 }}>{cr.pushing_toward}</div>
                </div>
              ) : null}

              {crBlind.length > 0 ? (
                <div className="ob-card" style={tintBlind}>
                  <div style={secHRose}>Watch your blind spots</div>
                  {crBlind.map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: i === 0 ? 0 : 12 }}>
                      <span style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: "#E11D48", marginTop: 6 }} />
                      <div>
                        {b.title ? <div style={{ fontWeight: 700, color: "var(--ink)" }}>{b.title}</div> : null}
                        {b.body ? <div style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>{b.body}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              </div>

              {cr.bridge ? (
                <div style={{ background: "var(--green-light)", border: "1.5px solid var(--green)", borderRadius: 16, padding: 18, marginTop: 16 }}>
                  <div style={{ fontSize: 18, color: "#1B4332", lineHeight: 1.6 }}>{cr.bridge}</div>
                </div>
              ) : null}

              {/* Year-over-year comparison: present only when a prior plan exists (the
                  server attaches cr.comparison only then). Cached with the take. */}
              {cr.comparison && (cr.comparison.headline || (Array.isArray(cr.comparison.points) && cr.comparison.points.length) || cr.comparison.bottom_line) ? (
                <div className="ob-card" style={{ marginTop: 16, background: "#F7F4FF", border: "1.5px solid #C9BCF0" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#5B3FB0", marginBottom: 8 }}>
                    What changed{cr.comparison.prior_year && cr.comparison.current_year ? ` · FY${cr.comparison.prior_year} → FY${cr.comparison.current_year}` : " from last year"}
                  </div>
                  {cr.comparison.headline ? (
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.35, color: "var(--ink)", marginBottom: 14 }}>{cr.comparison.headline}</div>
                  ) : null}
                  {Array.isArray(cr.comparison.points) ? cr.comparison.points.map((p, i) => (
                    <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", paddingTop: i === 0 ? 0 : 12, marginTop: i === 0 ? 0 : 12 }}>
                      {p.change ? <div style={{ fontWeight: 700, color: "var(--ink)" }}>{p.change}</div> : null}
                      {p.meaning ? <div style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>{p.meaning}</div> : null}
                      {p.move ? <div style={{ fontSize: 16, color: "#5B3FB0", fontWeight: 600, lineHeight: 1.5, marginTop: 4 }}>→ {p.move}</div> : null}
                    </div>
                  )) : null}
                  {cr.comparison.bottom_line ? (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1.5px solid #C9BCF0", fontSize: 17, color: "var(--ink)", lineHeight: 1.6 }}>{cr.comparison.bottom_line}</div>
                  ) : null}
                </div>
              ) : null}

              {/* Escape hatch only: the take auto-regenerates when the plan changes
                  (new plan_id), so this is a quiet text link, not a flow step. */}
              <div style={{ marginTop: 22, textAlign: "center" }}>
                <button
                  onClick={() => runCoachRead(compPlan, true)}
                  style={{ background: "none", border: "none", padding: 4, color: "var(--muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textDecoration: "underline", opacity: 0.7 }}
                >Re-run Coach's Take</button>
              </div>
            </>
          ) : (
            <div className="ob-card">Coach could not read your plan right now. Head back and open this again to retry.</div>
          )}
        </div>
      </div>
    );
  }

  // ══ PAYOUT CURVE ═════════════════════════════════════════════════════
  if (screen === "payout_curve") {
    return (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        <PayoutCurveScreen plan={compPlan} onBack={() => goFlow("comp_dashboard")} />
      </div>
    );
  }

  // ══ EARNINGS GOALS (target / stretch, Net + Gross from the real plan) ═══
  if (screen === "earnings_goals") {
    const backLink = { background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 8 };
    const chrome = (inner) => (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        <div className="hb-main" style={{ maxWidth: 1160, marginLeft: `max(${railW}px, calc((100vw - 1160px) / 2))`, marginRight: "auto" }}>
          <button style={backLink} onClick={() => goFlow("comp_dashboard")}>‹ Back to Comp Plan</button>
          {inner}
        </div>
      </div>
    );
    // Guard: a goal screen needs a plan to compute earnings from.
    if (!compPlan) {
      return chrome(<div className="ob-card" style={{ padding: 20, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Load your comp plan first and Coach will show what your target and stretch goals are worth.</div>);
    }
    // Bridge: real engine -> gross, then the existing net (take-home) calc.
    const ep = toEarningsPlan(compPlan);
    const grossAt = (pct) => computeEarnings(ep, pct / 100).totalEarnings;
    const netAt = (pct) => calcNet(grossAt(pct));
    // Plan-driven bounds: floor and cap come from the real plan, not 75/200.
    const floorPct = ep.floor && ep.floor.attainment != null ? Math.round(ep.floor.attainment * 100) : 75;
    const capPct = ep.cap && ep.cap.attainment != null ? Math.round(ep.cap.attainment * 100) : 200;
    const planMin = Math.max(0, Math.min(floorPct, capPct - 20)); // floor stays below the ceiling
    const planMax = Math.max(planMin + 20, capPct);
    const SEP = 10;
    const dTarget = Math.min(Math.max(targetPct, planMin), planMax - SEP);
    const dStretch = Math.min(Math.max(stretchPct, dTarget + SEP), planMax);
    const milestones = [...new Set([planMin, 100, 125, 150, 175, capPct].filter((v) => v >= planMin && v <= planMax))].sort((a, b) => a - b);
    const persist = ({ target, stretch }) => { setTargetPct(target); setStretchPct(stretch); saveRepProfile({ target_pct: target, stretch_pct: stretch }); };
    const onCarrotChange = (which, field, value) => setCarrots((c) => ({ ...c, [which]: { ...c[which], [field]: value } }));
    // Toggle a card's lock and persist immediately; override the just-changed flag so
    // it is saved regardless of the async state update.
    const onToggleLock = (which, value) => {
      setCarrots((c) => ({ ...c, [which]: { ...c[which], locked: value } }));
      saveRepProfile(which === "target" ? { target_locked: value } : { stretch_locked: value });
    };
    return chrome(
      <SeeWhatMoreIsWorth
        grossAt={grossAt}
        takeHomeAt={netAt}
        planMin={planMin}
        planMax={planMax}
        minSeparation={SEP}
        milestones={milestones}
        defaultTarget={dTarget}
        defaultStretch={dStretch}
        crumb="Strategy · Step 1"
        title="Set Your Target and Stretch Goals"
        subhead="Pick the numbers you're playing for, then name the carrot behind each one. This is where your strategy starts."
        carrots={carrots}
        onCarrotChange={onCarrotChange}
        onCarrotBlur={() => saveRepProfile()}
        onToggleLock={onToggleLock}
        onCommit={persist}
        onContinue={(g) => { persist(g); goFlow("deal_breakdown"); }}
      />
    );
  }

  // ══ DEAL BREAKDOWN (Strategy Step 2: stretch goal -> concrete deals) ════
  if (screen === "deal_breakdown") {
    const backLink = { background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 8 };
    const chrome = (inner) => (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        <div className="hb-main" style={{ maxWidth: 1160, marginLeft: `max(${railW}px, calc((100vw - 1160px) / 2))`, marginRight: "auto" }}>
          <button style={backLink} onClick={() => goFlow("earnings_goals")}>‹ Back to your goals</button>
          {inner}
        </div>
      </div>
    );
    if (!compPlan) {
      return chrome(<div className="ob-card" style={{ padding: 20, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Load your comp plan and set your goals first, and Coach will break your stretch number into the deals it takes to get there.</div>);
    }
    return chrome(
      <DealBreakdown
        plan={compPlan}
        targetPct={targetPct}
        stretchPct={stretchPct}
        stored={dealPlan}
        onPersist={(obj) => { setDealPlan(obj); saveRepProfile({ deal_plan: obj }); }}
        onBack={() => goFlow("earnings_goals")}
        onContinue={() => {}}
      />
    );
  }

  // ══ ACCOUNT PRIORITIZATION (increment 1: import + list) ════════════════
  if (screen === "accounts_import") {
    return (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        <div className="hb-main" style={{ maxWidth: 1160, marginLeft: `max(${railW}px, calc((100vw - 1160px) / 2))`, marginRight: "auto" }}>
          <AccountsImport authHeaders={authHeaders} onBack={() => goFlow("home_base")} />
        </div>
      </div>
    );
  }

  // ══ HOME BASE ════════════════════════════════════════════════════════
  if (screen === "home_base") {
    const sameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const keyOf = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today); monday.setDate(today.getDate() - ((dow + 6) % 7));
    const weekdayInfo = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((name, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      return { name, date: d, isToday: sameDate(d, today) };
    });
    const taskCountByDate = {};
    weekdayInfo.forEach(({ name, date }) => { const list = weekTasks[name] || []; if (list.length) taskCountByDate[keyOf(date)] = list.length; });
    const toggleTask = (day, id) => setWeekTasks((prev) => ({ ...prev, [day]: prev[day].map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));

    const { y, m } = monthCursor;
    const startDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const shiftMonth = (delta) => setMonthCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
    const navArrow = { width: 34, height: 34, borderRadius: 9, border: "1.5px solid var(--border)", background: "white", cursor: "pointer", fontSize: 18, color: "var(--ink)", lineHeight: 1 };

    return (
      <div className="hb-wrap" style={{ paddingTop: TOPBAR_H, paddingLeft: railW }}>
        <style>{S}</style>
        <style>{HOME_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        <div className="hb-main">
          <h1 className="hb-h1">Welcome{currentName ? `, ${currentName}` : ""}</h1>
          <p className="hb-sub">Here is your plan of attack. Start with this week's setup, then dive into an area below.</p>

          <div className="hb-cal-head">
            <div className="hb-cal-title">{homeView === "week" ? "This Week" : `${MONTHS[m]} ${y}`}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {homeView === "month" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => shiftMonth(-1)} style={navArrow} aria-label="Previous month">‹</button>
                  <button onClick={() => shiftMonth(1)} style={navArrow} aria-label="Next month">›</button>
                </div>
              )}
              <div className="hb-toggle">
                <button className={homeView === "week" ? "on" : ""} onClick={() => setHomeView("week")}>Week</button>
                <button className={homeView === "month" ? "on" : ""} onClick={() => setHomeView("month")}>Month</button>
              </div>
            </div>
          </div>

          {homeView === "week" ? (
            <div className="hb-week">
              {weekdayInfo.map(({ name, date, isToday }) => (
                <div key={name} className={`hb-day${isToday ? " today" : ""}`}>
                  <div className="hb-day-name">{name}{isToday ? " · Today" : ""}</div>
                  <div className="hb-day-date">{date.getDate()}</div>
                  {(weekTasks[name] || []).length === 0
                    ? <div className="hb-empty">No tasks</div>
                    : (weekTasks[name] || []).map((t) => (
                      <label key={t.id} className={`hb-task${t.done ? " done" : ""}`}>
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(name, t.id)} />
                        <span>{t.text}</span>
                      </label>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="hb-month">
              <div className="hb-month-grid">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="hb-dow">{d}</div>)}
                {cells.map((d, i) => {
                  if (d === null) return <div key={"b" + i} className="hb-cell blank" />;
                  const cellDate = new Date(y, m, d);
                  const count = taskCountByDate[keyOf(cellDate)];
                  return (
                    <div key={d} className={`hb-cell${sameDate(cellDate, today) ? " today" : ""}`}>
                      <div className="hb-cell-n">{d}</div>
                      {count ? <span className="hb-dot">● {count}</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="hb-areas-h">Your Areas</div>
          <div className="hb-areas">
            {AREAS.map((a) => (
              <div key={a.key} className={`hb-area ${a.active ? "active" : "soon"}`} onClick={a.active ? () => goFlow("comp_dashboard") : undefined}>
                <div className="hb-area-icon">{a.icon}</div>
                <div className="hb-area-name">{a.name}</div>
                <div className="hb-area-desc">{a.desc}</div>
                <span className={`hb-area-status ${a.active ? "ready" : "soon"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "landing") {
    return (
      <>
        <style>{S}</style>

        {/* STICKY NAV */}
        <nav className={`lnav${scrolled ? " scrolled" : ""}`}>
          <button className="nav-logo">🥕 Earn The Carrot</button>
          <div className="nav-links">
            <a className="nav-link" href="#how-it-works">How It Works</a>
            <a className="nav-link" href="#coach">Meet Coach</a>
            <a className="nav-link" href="#pricing">Pricing</a>
            <button className="nav-link" onClick={() => goAuth("login")}>Log in</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="nav-cta" onClick={() => goAuth("signup")} style={{ lineHeight: 1.2, background: "transparent", border: "1.5px solid var(--carrot)", color: "var(--carrot)" }}>
              Sign up
            </button>
            <button className="nav-cta" onClick={() => goUpload()} style={{ lineHeight: 1.2 }}>
              Start by Uploading<br />your Comp Plan
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">For Quota Carrying Salespeople</div>
          <div>
            <span className="hero-carrot">🥕</span>
          </div>
          <h1 className="hero-title">
            Know Exactly How to{" "}
            <span className="hl">Make More Money</span>{" "}
            This Year.
          </h1>
          <p className="hero-sub">
            Coach helps salespeople understand how they get paid, build a personalized success plan, and stay focused on the actions that drive results.
          </p>
          <button className="hero-cta" onClick={() => goUpload()} style={{ lineHeight: 1.2 }}>
            Start by Uploading<br />your Comp Plan
          </button>
          <div className="hero-hint">
            <div>Upload your compensation plan. Build your plan.</div>
            <div>Earn your carrot.</div>
          </div>
        </section>

        {/* EVERY SALESPERSON HAS A CARROT */}
        <section className="carrots-section">
          <div className="sec-inner">
            <div className="sec-label">The Why</div>
            <h2 className="sec-title">Every Salesperson Has a Carrot</h2>
            <div className="carrot-grid">
              {CARROT_CARDS.map((c, i) => (
                <div key={i} className="carrot-card">
                  <span className="carrot-card-emoji">{c.emoji}</span>
                  <span className="carrot-card-text">{c.text}</span>
                </div>
              ))}
            </div>
            <p className="carrots-p1">
              The problem is that most salespeople spend their days staring at pipelines, forecasts, quotas, and activity reports. Somewhere along the way, they forget why they are working so hard in the first place.
            </p>
            <p className="carrots-p2">
              Earn The Carrot reconnects your daily sales activities to the rewards you actually care about.
            </p>
            <div className="activities-chain">
              {ACTIVITY_STEPS.map((step, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center" }}>
                  <span className="ac-step">{step}</span>
                  <span className="ac-arrow">→</span>
                </span>
              ))}
              <span className="ac-step last">Carrots</span>
            </div>
          </div>
        </section>

        {/* MEET COACH */}
        <section className="coach-section" id="coach">
          <div className="coach-inner">
            <div className="sec-label">Your AI Sales Coach</div>
            <h2 className="sec-title" style={{ color: "white", marginBottom: 20 }}>Meet Coach 🥕</h2>
            <p className="coach-quote">"What do I need to do today to earn the income I want this year?"</p>
            <p className="coach-coachsub">Coach helps you answer that question every single day.</p>
            <div className="coach-role-grid">
              {[
                { Icon: CompIcon, title: "Compensation Analyst", tag: "Understand", desc: "Coach breaks down your compensation plan, identifies earnings opportunities, and helps you understand exactly how you get paid." },
                { Icon: StrategyIcon, title: "Sales Strategist", tag: "Plan", desc: "Coach helps you build a realistic plan based on your territory, deal sizes, conversion rates, and goals." },
                { Icon: PerformanceIcon, title: "Performance Coach", tag: "Execute", desc: "Coach helps you stay focused on the activities that drive results and keeps you on track toward your targets." },
                { Icon: MotivationIcon, title: "Motivation Coach", tag: "Achieve", desc: "Coach keeps your carrots front and center, reminding you why the work matters and helping you stay motivated throughout the year." },
              ].map((r, i) => (
                <div key={i} className="coach-role-card">
                  <div className="coach-role-icon"><r.Icon /></div>
                  <div className="coach-role-body">
                    <div className="coach-role-head">
                      <span className="coach-role-title">{r.title}</span>
                      <span className="coach-role-tag">{r.tag}</span>
                    </div>
                    <div className="coach-role-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="coach-ask-label">Ask Coach Anything</div>
            <div className="coach-q-grid">
              {[
                "How much commission will I make if this deal closes?",
                "What happens if I finish at 120% of quota?",
                "How many opportunities do I need to hit my stretch goal?",
                "What activities should I focus on this month?",
              ].map((q, i) => (
                <div key={i} className="coach-q-card">"{q}"</div>
              ))}
            </div>
            <div className="coach-bottom-row">
              <span className="coach-br-muted">No spreadsheets.</span>
              <span className="coach-br-muted">No guesswork.</span>
              <span className="coach-br-muted">No generic activity mandates.</span>
              <span className="coach-br-bold">Just a plan built specifically for you.</span>
            </div>
          </div>
        </section>

        {/* HOW COACH WORKS */}
        <section className="hcw-section" id="how-it-works">
          <div className="hcw-inner">
            <div className="sec-label">How It Works</div>
            <h2 className="sec-title">How Coach Works</h2>
            <p className="hcw-sub">Coach turns your compensation plan into a personalized success plan.</p>
            <div className="hcw-grid">
              {[
                { num: "1", title: "Understand", desc: "Upload your compensation plan. Coach explains exactly how you get paid, including accelerators, tiers, clawbacks, and earnings scenarios." },
                { num: "2", title: "Plan", desc: "Coach asks questions about your territory, pipeline, goals, deal sizes, and conversion rates. Together you build a realistic success plan." },
                { num: "3", title: "Execute", desc: "Coach helps you focus on the activities that actually drive results. Not generic activity mandates. Your plan. Your numbers. Your goals." },
                { num: "4", title: "Achieve", desc: "Track progress toward quota, earnings, and the rewards you are working toward." },
              ].map((step, i) => (
                <div key={i} className="hcw-card">
                  <div className="hcw-num">{step.num}</div>
                  <div className="hcw-title">{step.title}</div>
                  <div className="hcw-desc">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE SALES REP PROBLEM */}
        <section className="problem-section">
          <div className="problem-inner">
            <div className="prob-label">The Problem</div>
            <h2 className="prob-title" style={{ marginBottom: 12 }}>The Sales Rep Problem</h2>
            <p className="prob-sub">Every year your company hands you a new compensation plan.</p>
            <div className="prob-grid">
              <div className="prob-card">
                <div className="prob-card-label orange">What You Are Thinking</div>
                {[
                  "How much money can I really make?",
                  "What changed from last year?",
                  "Where is the fine print?",
                ].map((line, i) => (
                  <div key={i} className="prob-card-line"><span>❓</span><span>{line}</span></div>
                ))}
                <p className="prob-card-note">You start reading the plan, but these are the questions you actually want answered.</p>
              </div>

              <div className="prob-card">
                <div className="prob-card-label red">What Most Reps Do</div>
                {[
                  { e: "📄", t: "Skim the compensation plan" },
                  { e: "📊", t: "Open Excel" },
                  { e: "🧮", t: "Build a commission calculator" },
                  { e: "📞", t: "Ask a few peers how they interpret it" },
                  { e: "🤷", t: "Make your best guess" },
                ].map((row, i) => (
                  <div key={i} className="prob-card-line"><span>{row.e}</span><span>{row.t}</span></div>
                ))}
                <p className="prob-card-note">Most reps spend more time trying to understand how they get paid than building a plan to maximize their earnings.</p>
              </div>

              <div className="prob-card highlight">
                <div className="prob-card-label orange">What Coach Does</div>
                {[
                  { e: "📄", t: "Reads the compensation plan" },
                  { e: "💰", t: "Calculates earnings scenarios" },
                  { e: "💰", t: "Builds your earnings model" },
                  { e: "🎯", t: "Creates a personalized success plan" },
                  { e: "🥕", t: "Connects earnings goals to personal rewards" },
                ].map((row, i) => (
                  <div key={i} className="prob-card-line"><span>{row.e}</span><span>{row.t}</span></div>
                ))}
                <p className="prob-card-note">Coach helps you understand how you get paid and what you need to do to exceed quota.</p>
              </div>
            </div>

            <div className="prob-final">
              <p className="prob-final-title">The Spreadsheet Was Never The Goal.</p>
              <p className="prob-final-sub">Most salespeople build spreadsheets because they are trying to answer a much bigger question: What do I need to do to succeed this year? Coach helps answer that question.</p>
              <p className="prob-final-line">Understand how you get paid.</p>
              <p className="prob-final-line">Build a personalized success plan.</p>
              <p className="prob-final-line">Stay focused on the actions that drive results.</p>
            </div>
          </div>
        </section>

        {/* ── PART 2 STYLES ── */}
        <style>{`
          /* ── MEET COACH ── */
          .coach-section{background:var(--dark);padding:96px 24px;}
          .coach-inner{max-width:900px;margin:0 auto;}
          .coach-quote{font-size:24px;font-style:italic;color:rgba(255,255,255,0.7);margin-bottom:12px;line-height:1.6;}
          .coach-coachsub{font-size:18px;color:rgba(255,255,255,0.5);margin-bottom:48px;}
          .coach-role-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px;}
          .coach-role-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;display:flex;gap:18px;align-items:flex-start;}
          .coach-role-icon{width:56px;height:56px;border-radius:50%;border:1.5px solid rgba(244,113,26,0.5);background:rgba(244,113,26,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
          .coach-role-body{flex:1;min-width:0;}
          .coach-role-head{display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;}
          .coach-role-title{font-size:18px;font-weight:700;color:white;display:inline-block;border-bottom:2px solid var(--carrot);padding-bottom:3px;}
          .coach-role-tag{font-size:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);background:rgba(244,113,26,0.15);border-radius:100px;padding:3px 10px;}
          .coach-role-desc{font-size:18px;color:rgba(255,255,255,0.55);line-height:1.6;margin-top:10px;}
          .coach-ask-label{font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;}
          .coach-q-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:44px;}
          .coach-q-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;font-size:18px;font-style:italic;color:rgba(255,255,255,0.75);line-height:1.5;}
          .coach-bottom-row{display:flex;flex-wrap:wrap;gap:32px;align-items:baseline;}
          .coach-br-muted{font-size:22px;color:rgba(255,255,255,0.45);}
          .coach-br-bold{font-size:22px;font-weight:700;color:white;}

          /* ── MOST COMPANIES ── */
          .diff-section{background:var(--cream);padding:96px 24px;}
          .diff-inner{max-width:900px;margin:0 auto;}
          .diff-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px;}
          .diff-col{border-radius:20px;padding:28px;}
          .diff-col.red{background:rgba(220,38,38,0.06);border:1.5px solid rgba(220,38,38,0.18);}
          .diff-col.green{background:rgba(45,106,79,0.07);border:1.5px solid rgba(45,106,79,0.22);}
          .diff-col-title{font-size:18px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;}
          .diff-col.red .diff-col-title{color:#B91C1C;}
          .diff-col.green .diff-col-title{color:var(--green);}
          .diff-mandate{font-size:22px;font-weight:600;color:var(--ink);margin-bottom:12px;line-height:1.5;}
          .diff-note{font-size:18px;font-style:italic;color:var(--muted);line-height:1.6;}
          .diff-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;margin-bottom:16px;}
          .diff-chain-step{font-size:18px;font-weight:600;color:var(--ink);}
          .diff-chain-step.last{color:var(--carrot);font-weight:800;}
          .diff-chain-arrow{color:var(--carrot);padding:0 5px;font-size:18px;}
          .diff-insight{font-size:18px;color:var(--muted);line-height:1.65;}

          /* ── CHATGPT VS COACH ── */
          .compare-section{background:var(--dark2);padding:96px 24px;}
          .compare-inner{max-width:860px;margin:0 auto;}
          .compare-p{font-size:18px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:14px;}
          .compare-wrap{border-radius:16px;overflow:hidden;margin:36px 0 28px;}
          .compare-table{width:100%;border-collapse:collapse;}
          .compare-table th{padding:14px 18px;font-size:18px;font-weight:700;letter-spacing:0.5px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);}
          .compare-table td{padding:13px 18px;font-size:18px;border-bottom:1px solid rgba(255,255,255,0.06);}
          .compare-table tr:last-child td{border-bottom:none;}
          .th-feature{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);}
          .th-generic{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);text-align:center!important;}
          .th-coach{color:var(--carrot);background:rgba(244,113,26,0.1);text-align:center!important;}
          .td-feature{color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.02);}
          .td-generic{color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.02);text-align:center!important;}
          .td-coach{color:#86EFAC;background:rgba(244,113,26,0.05);text-align:center!important;font-weight:600;}
          .compare-callout{background:rgba(244,113,26,0.08);border:1.5px solid rgba(244,113,26,0.25);border-radius:14px;padding:22px 28px;font-size:22px;font-style:italic;color:rgba(255,255,255,0.8);text-align:center;}

          /* ── CARROT LADDER ── */
          .ladder-section{background:var(--cream);padding:96px 24px;}
          .ladder-inner{max-width:960px;margin:0 auto;}
          .ladder-sub{font-size:23px;color:var(--muted);margin-bottom:40px;line-height:1.5;}
          .ladder-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:44px;}
          .ladder-card{border-radius:20px;padding:28px;}
          .ladder-card.mini{background:var(--gold-light);border:1.5px solid var(--gold);}
          .ladder-card.medium{background:var(--green-light);border:1.5px solid rgba(45,106,79,0.3);}
          .ladder-card.big{background:var(--carrot-light);border:1.5px solid rgba(244,113,26,0.3);}
          .ladder-card-icon{font-size:25px;margin-bottom:10px;}
          .ladder-card-title{font-size:18px;font-weight:800;color:var(--ink);margin-bottom:4px;}
          .ladder-card-tag{font-size:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;}
          .ladder-item{font-size:18px;color:var(--ink);line-height:1.9;}
          .ladder-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;}
          .lc-step{font-size:18px;font-weight:600;color:var(--ink);}
          .lc-step.last{color:var(--carrot);font-weight:800;}
          .lc-arrow{color:var(--carrot);padding:0 6px;font-size:18px;font-weight:700;}

          /* ── HOW COACH WORKS ── */
          .hcw-section{background:var(--cream);padding:96px 24px;}
          .hcw-inner{max-width:900px;margin:0 auto;}
          .hcw-sub{font-size:23px;color:var(--muted);line-height:1.5;margin-bottom:40px;}
          .hcw-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
          .hcw-card{background:white;border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .hcw-num{font-family:'Playfair Display',serif;font-size:49px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:12px;}
          .hcw-title{font-size:23px;font-weight:700;color:var(--ink);margin-bottom:10px;}
          .hcw-desc{font-size:18px;color:var(--muted);line-height:1.65;}

          /* ── STOP SPREADSHEETS ── */
          .ss-section{background:var(--cream);padding:96px 24px;}
          .ss-inner{max-width:900px;margin:0 auto;}
          .ss-body{margin:0 0 40px;}
          .ss-line{font-size:22px;color:var(--muted);line-height:1.7;margin-bottom:12px;}
          .ss-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px;}
          .ss-col{border-radius:20px;padding:24px;}
          .ss-col.today{border:1.5px solid rgba(26,18,8,0.25);background:rgba(26,18,8,0.03);}
          .ss-col.coach{border:1.5px solid rgba(244,113,26,0.4);background:rgba(244,113,26,0.05);}
          .ss-col-label{font-size:18px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;}
          .ss-col.today .ss-col-label{color:var(--muted);}
          .ss-col.coach .ss-col-label{color:var(--carrot);}
          .ss-step{border-radius:12px;padding:12px 16px;font-size:18px;font-weight:600;text-align:center;line-height:1.4;}
          .ss-col.today .ss-step{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.18);color:#7A2020;}
          .ss-col.coach .ss-step{background:white;border:1px solid rgba(244,113,26,0.3);color:var(--ink);}
          .ss-arrow{text-align:center;font-size:18px;line-height:1;margin:6px 0;}
          .ss-col.today .ss-arrow{color:rgba(220,38,38,0.4);}
          .ss-col.coach .ss-arrow{color:var(--carrot);}
          .ss-closing{text-align:center;}
          .ss-closing-muted{font-size:23px;color:var(--muted);margin-bottom:8px;}
          .ss-closing-bold{font-size:25px;font-weight:700;color:var(--ink);}

          /* ── RESPONSIVE PART 2 ── */
          @media(max-width:768px){
            .coach-role-grid,.coach-q-grid,.diff-cols,.ladder-grid,.hcw-grid,.ss-cols{grid-template-columns:1fr;}
            .coach-bottom-row{gap:20px;}
          }
          @media(max-width:480px){
            .coach-section,.diff-section,.compare-section,.ladder-section,.hcw-section,.ss-section{padding:64px 20px;}
          }
        `}</style>

        {/* MOST COMPANIES TELL YOU WHAT TO DO */}
        <section className="diff-section">
          <div className="diff-inner">
            <div className="sec-label">The Difference</div>
            <h2 className="sec-title">Most Companies Tell You What To Do</h2>
            <div className="diff-cols">
              <div className="diff-col red">
                <div className="diff-col-title">What Your Manager Says</div>
                <p className="diff-mandate">Make 50 calls. Book 10 meetings. Create 5 opportunities.</p>
                <p className="diff-note">But very few companies explain why those numbers matter.</p>
              </div>
              <div className="diff-col green">
                <div className="diff-col-title">What Coach Helps You Understand</div>
                <div className="diff-chain">
                  {["Activities", "Opportunities", "Deals", "Commission"].map((step, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center" }}>
                      <span className="diff-chain-step">{step}</span>
                      <span className="diff-chain-arrow">→</span>
                    </span>
                  ))}
                  <span className="diff-chain-step last">Carrots</span>
                </div>
                <p className="diff-insight">When you understand why you are doing the work, staying motivated becomes much easier.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CHATGPT VS COACH */}
        <section className="compare-section">
          <div className="compare-inner">
            <div className="prob-label">Why Not Just Use ChatGPT</div>
            <h2 className="prob-title">ChatGPT Can Explain Your Plan. Coach Helps You Execute It.</h2>
            <p className="compare-p">Yes, you could upload your compensation plan into a generic AI tool. But generic AI tools were not built specifically for salespeople.</p>
            <p className="compare-p">They do not understand quota attainment or accelerators or territory planning.</p>
            <p className="compare-p">And they do not help you build a personalized action plan.</p>
            <div className="compare-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="th-feature">Feature</th>
                    <th className="th-generic">Generic AI</th>
                    <th className="th-coach">Earn The Carrot</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Explains your compensation plan", "Yes", "Yes"],
                    ["Remembers your compensation plan", "No", "Yes"],
                    ["Calculates real earnings scenarios", "Limited", "Yes"],
                    ["Builds a personalized action plan", "No", "Yes"],
                    ["Connects goals to financial rewards", "No", "Yes"],
                    ["Creates realistic activity targets", "No", "Yes"],
                    ["Provides ongoing coaching", "No", "Yes"],
                    ["Tracks progress toward carrots", "No", "Yes"],
                    ["Motivates and reinforces goals", "No", "Yes"],
                    ["Reminds you why you are making calls at 4:45 PM Friday", "No", "Yes 🥕"],
                    ["Builds a personalized success plan", "No", "Yes"],
                  ].map(([feature, generic, coach], i) => (
                    <tr key={i}>
                      <td className="td-feature">{feature}</td>
                      <td className="td-generic">{generic}</td>
                      <td className="td-coach">{coach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="compare-callout">
              Generic AI answers questions. Coach helps you perform.
            </div>
          </div>
        </section>

        {/* YOUR CARROT LADDER */}
        <section className="ladder-section">
          <div className="ladder-inner">
            <div className="sec-label">Your Goals</div>
            <h2 className="sec-title">Your Carrot Ladder</h2>
            <p className="ladder-sub">Every goal starts with a reward.</p>
            <div className="ladder-grid">
              <div className="ladder-card mini">
                <div className="ladder-card-icon">🥕</div>
                <div className="ladder-card-title">Mini Carrots</div>
                <div className="ladder-card-tag">Daily Wins</div>
                {["New golf clubs", "Nice dinner out", "Concert tickets", "New gadgets"].map((item, i) => (
                  <div key={i} className="ladder-item">• {item}</div>
                ))}
              </div>
              <div className="ladder-card medium">
                <div className="ladder-card-icon">🥕🥕</div>
                <div className="ladder-card-title">Medium Carrots</div>
                <div className="ladder-card-tag">Periodic Rewards</div>
                {["Weekend getaway", "Family vacation", "Home improvement project", "New television"].map((item, i) => (
                  <div key={i} className="ladder-item">• {item}</div>
                ))}
              </div>
              <div className="ladder-card big">
                <div className="ladder-card-icon">🥕🥕🥕</div>
                <div className="ladder-card-title">Big Carrots</div>
                <div className="ladder-card-tag">Year Long Dreams</div>
                {["Hawaii vacation", "New boat", "Tesla", "Fund your child's college", "Pay off your mortgage"].map((item, i) => (
                  <div key={i} className="ladder-item">• {item}</div>
                ))}
              </div>
            </div>
            <div className="ladder-chain">
              {ACTIVITY_STEPS.map((step, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center" }}>
                  <span className="lc-step">{step}</span>
                  <span className="lc-arrow">→</span>
                </span>
              ))}
              <span className="lc-step last">Carrots</span>
            </div>
          </div>
        </section>

        {/* ── PART 3 STYLES ── */}
        <style>{`
          details > summary{list-style:none;cursor:pointer;}
          details > summary::-webkit-details-marker{display:none;}

          /* ── PLAYBOOK STEPS ── */
          .steps-section{background:white;padding:96px 24px;}
          .steps-inner{max-width:900px;margin:0 auto;}
          .steps-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px;}
          .step-card{background:var(--cream);border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .step-num{font-size:16px;font-weight:800;letter-spacing:2px;color:var(--carrot);text-transform:uppercase;margin-bottom:10px;}
          .step-title{font-size:23px;font-weight:700;color:var(--ink);margin-bottom:10px;line-height:1.3;}
          .step-desc{font-size:18px;color:var(--muted);line-height:1.65;}
          .step-checklist{margin-top:16px;display:flex;flex-direction:column;gap:8px;}
          .step-check-item{display:flex;align-items:flex-start;gap:8px;font-size:18px;color:var(--ink);line-height:1.4;}
          .step-check-icon{color:var(--carrot);flex-shrink:0;font-weight:700;}
          .steps-note{font-size:18px;color:var(--muted);margin-bottom:24px;text-align:center;}
          .steps-cta-btn{background:var(--carrot);color:white;border:none;border-radius:100px;padding:18px 42px;font-size:22px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
          .steps-cta-btn:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}

          /* ── 4:45 PM FRIDAY ── */
          .friday-section{background:linear-gradient(160deg,#071410,#0c2018,#091a12);padding:108px 24px;text-align:center;}
          .friday-inner{max-width:700px;margin:0 auto;}
          .friday-time{font-family:'Playfair Display',serif;font-size:77px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:52px;}
          .friday-line{font-size:25px;color:rgba(255,255,255,0.75);line-height:1.7;margin-bottom:4px;}
          .friday-line.bold{font-weight:700;color:white;}
          .friday-spacer{height:24px;}
          .friday-closing{font-size:29px;font-style:italic;color:rgba(255,255,255,0.9);margin-top:44px;margin-bottom:12px;line-height:1.4;}
          .friday-orange{font-size:29px;font-weight:800;color:var(--carrot);}

          /* ── PRICING ── */
          .pricing-section{background:white;padding:96px 24px;}
          .pricing-inner{max-width:1060px;margin:0 auto;}
          .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:40px;}
          .pcard{border-radius:24px;padding:32px;border:1.5px solid var(--border);display:flex;flex-direction:column;position:relative;}
          .pcard.featured{border-color:var(--carrot);border-top-width:4px;}
          .pcard.team{border-color:var(--green);}
          .most-popular-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--carrot);color:white;font-size:16px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:5px 16px;border-radius:100px;white-space:nowrap;}
          .ptier{font-size:16px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
          .ptier.orange{color:var(--carrot);}
          .ptier.standard{color:var(--muted);}
          .ptier.tgreen{color:var(--green);}
          .pname{font-family:'Playfair Display',serif;font-size:29px;font-weight:900;color:var(--ink);margin-bottom:8px;}
          .pprice{font-family:'Playfair Display',serif;font-size:57px;font-weight:900;color:var(--ink);line-height:1;margin-bottom:4px;}
          .pprice-vol{font-size:23px;font-weight:700;color:var(--green);margin-bottom:4px;}
          .psub{font-size:18px;color:var(--muted);margin-bottom:20px;}
          .pdivider{height:1px;background:var(--border);margin-bottom:20px;}
          .pfeatures{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;flex:1;}
          .pfeature{display:flex;align-items:flex-start;gap:10px;font-size:18px;color:var(--ink);line-height:1.5;}
          .pcheck{font-size:18px;flex-shrink:0;margin-top:2px;font-weight:700;}
          .pcheck.orange{color:var(--carrot);}
          .pcheck.tgreen{color:var(--green);}
          .pbtn{display:block;width:100%;padding:14px 24px;border-radius:100px;font-size:18px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;text-align:center;margin-bottom:12px;}
          .pbtn.filled{background:var(--carrot);color:white;border:2px solid var(--carrot);}
          .pbtn.filled:hover{background:var(--carrot-dark);border-color:var(--carrot-dark);}
          .pbtn.outlined-orange{background:white;color:var(--carrot);border:2px solid var(--carrot);}
          .pbtn.outlined-orange:hover{background:var(--carrot-light);}
          .pbtn.outlined-green{background:white;color:var(--green);border:2px solid var(--green);}
          .pbtn.outlined-green:hover{background:var(--green-light);}
          .pnote{font-size:18px;color:var(--muted);line-height:1.6;margin-bottom:6px;text-align:center;}
          .papproval-summary{display:block;margin-top:10px;padding:10px 16px;border-radius:100px;font-size:18px;font-weight:600;font-family:'DM Sans',sans-serif;text-align:center;transition:all 0.2s;}
          .papproval-summary.orange{border:1.5px solid var(--carrot);color:var(--carrot);background:white;}
          .papproval-summary.orange:hover{background:var(--carrot-light);}
          .papproval-summary.tgreen{border:1.5px solid var(--green);color:var(--green);background:white;}
          .papproval-summary.tgreen:hover{background:var(--green-light);}
          .email-box{margin-top:14px;background:var(--cream);border:1.5px solid var(--border);border-radius:16px;padding:18px;}
          .email-subject{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:12px;}
          .email-body{font-size:18px;color:var(--muted);line-height:1.7;white-space:pre-wrap;margin-bottom:14px;}
          .copy-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--ink);transition:all 0.2s;}
          .copy-btn:hover{border-color:var(--carrot);color:var(--carrot);}

          /* ── RESPONSIVE PART 3 ── */
          @media(max-width:900px){.pricing-grid{grid-template-columns:1fr;}}
          @media(max-width:600px){
            .steps-grid{grid-template-columns:1fr;}
            .friday-time{font-size:57px;}
            .friday-line{font-size:22px;}
            .friday-closing,.friday-orange{font-size:25px;}
            .steps-section,.friday-section,.pricing-section{padding:64px 20px;}
          }
        `}</style>

        {/* IT IS 4:45 PM ON FRIDAY */}
        <section className="friday-section">
          <div className="friday-inner">
            <div className="friday-time">4:45 PM Friday</div>
            <p className="friday-line">Most sales tools stop working the moment you close your laptop.</p>
            <p className="friday-line bold">Coach does not.</p>
            <div className="friday-spacer" />
            <p className="friday-line">At 4:45 PM on Friday, Coach remembers that Hawaii vacation.</p>
            <p className="friday-line">Coach remembers the boat.</p>
            <p className="friday-line">Coach remembers the debt you are paying off.</p>
            <p className="friday-line bold">Coach remembers the financial goals you set at the beginning of the year.</p>
            <div className="friday-spacer" />
            <p className="friday-line">Coach reminds you why one more call, one more email, or one more meeting matters.</p>
            <p className="friday-closing">Because sales is not really about quota.</p>
            <p className="friday-orange">It is about what quota makes possible.</p>
          </div>
        </section>

        {/* WHY EARN THE CARROT PAYS FOR ITSELF */}
        <section className="roi-section">
          <div className="roi-inner">
            <div className="sec-label">The ROI</div>
            <h2 className="sec-title">Why Earn The Carrot Pays for Itself</h2>
            <p className="roi-opening">
              Most salespeople never fully understand how their compensation plan works. Most never build a personalized plan. Most eventually lose focus somewhere between kickoff and year end. Coach changes that.
            </p>
            <div className="roi-grid">
              {[
                {
                  title: "Understand Your Compensation Plan",
                  desc: "Coach explains exactly how you get paid and identifies the earnings opportunities hidden in your plan.",
                },
                {
                  title: "Build Your Success Plan",
                  desc: "Coach works with you to build a realistic strategy based on your pipeline, deal sizes, conversion rates, and goals.",
                },
                {
                  title: "Stay Focused All Year",
                  desc: "Coach keeps your goals front and center and helps you stay focused on the activities that matter most.",
                },
              ].map((card, i) => (
                <div key={i} className="roi-card">
                  <div className="roi-card-title">{card.title}</div>
                  <div className="roi-card-desc">{card.desc}</div>
                </div>
              ))}
            </div>
            <div className="roi-callout">
              Most reps spend one to three hours reading compensation plans, building spreadsheets, estimating commissions, and guessing whether they have enough pipeline to hit quota. Coach does it in minutes. Then Coach goes further by helping you build a personalized success plan.
            </div>
            <div className="roi-box">
              If Coach helps you close just one additional deal this year, the investment pays for itself many times over. For the price of one good client lunch per month, you get a complete personal operating system for sales success.
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing-section" id="pricing">
          <div className="pricing-inner">
            <div className="sec-label">Pricing</div>
            <h2 className="sec-title">Simple. Transparent. Expensable.</h2>
            <div className="pricing-grid">

              {/* FREE */}
              <div className="pcard">
                <div className="ptier standard">Free</div>
                <div className="pname">Carrot Snapshot</div>
                <div className="pprice">$0</div>
                <div className="psub">No credit card required</div>
                <div className="pdivider" />
                <div className="pfeatures">
                  {[
                    "Upload up to 3 compensation plans",
                    "See target and stretch earnings",
                    "Earnings comparisons and insights",
                    "Create your first carrot and see how Coach connects your goals to your earning potential",
                    "No account required",
                  ].map((f, i) => (
                    <div key={i} className="pfeature">
                      <span className="pcheck orange">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="pbtn outlined-orange">Try It Free</button>
              </div>

              {/* PRO */}
              <div className="pcard featured">
                <div className="most-popular-badge">Most Popular</div>
                <div className="ptier orange">Pro</div>
                <div className="pname">Meet Coach</div>
                <div className="pprice">
                  $99<span style={{ fontSize: 25, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>/year</span>
                </div>
                <div className="psub">or $9.99 per month</div>
                <div className="pdivider" />
                <div className="pfeatures">
                  {[
                    "Unlimited Coach conversations",
                    "Full personalized playbook",
                    "Carrot tracking and goal progress",
                    "Earnings planning and scenarios",
                    "Territory strategy assistance",
                    "Activity planning and targets",
                    "Compensation plan memory",
                    "Ongoing coaching and motivation",
                  ].map((f, i) => (
                    <div key={i} className="pfeature">
                      <span className="pcheck orange">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="pbtn filled">Start Pro</button>
                <p className="pnote">100% expensable as a sales productivity tool</p>
                <p className="pnote">Less than the cost of one client lunch per month</p>
                <details>
                  <summary>
                    <div className="papproval-summary orange">Get Manager Approval Email</div>
                  </summary>
                  <div className="email-box">
                    <div className="email-subject">Subject: Approval Request, Earn The Carrot</div>
                    <div className="email-body">{MANAGER_EMAIL_BODY}</div>
                    <CopyButton
                      text={"Subject: Approval Request, Earn The Carrot\n\n" + MANAGER_EMAIL_BODY}
                      className="copy-btn"
                    />
                  </div>
                </details>
              </div>

              {/* TEAM */}
              <div className="pcard team">
                <div className="ptier tgreen">Team</div>
                <div className="pname">Team Starter</div>
                <div className="pprice-vol">Volume Pricing Available</div>
                <div className="psub">Bring Coach to your entire sales team</div>
                <div className="pdivider" />
                <div className="pfeatures">
                  {[
                    "Everything in Pro for every rep",
                    "Volume discount on Pro licenses",
                    "Centralized billing",
                    "Early access to future team features",
                    "Help your reps understand their comp plans and stay focused on activities that drive results",
                  ].map((f, i) => (
                    <div key={i} className="pfeature">
                      <span className="pcheck tgreen">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="pbtn outlined-green">Contact Us for Team Pricing</button>
                <p className="pnote">100% expensable as a sales productivity tool</p>
                <details>
                  <summary>
                    <div className="papproval-summary tgreen">Get Manager Approval Email</div>
                  </summary>
                  <div className="email-box">
                    <div className="email-subject">Subject: Approval Request, Earn The Carrot</div>
                    <div className="email-body">{MANAGER_EMAIL_BODY}</div>
                    <CopyButton
                      text={"Subject: Approval Request, Earn The Carrot\n\n" + MANAGER_EMAIL_BODY}
                      className="copy-btn"
                    />
                  </div>
                </details>
              </div>

            </div>
          </div>
        </section>

        {/* ── PART 4 STYLES ── */}
        <style>{`
          /* ── ROI ── */
          .roi-section{background:var(--cream);padding:96px 24px;}
          .roi-inner{max-width:960px;margin:0 auto;}
          .roi-opening{font-size:22px;color:var(--muted);line-height:1.65;margin-bottom:40px;max-width:720px;}
          .roi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:32px;}
          .roi-card{background:white;border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .roi-card-emoji{font-size:33px;margin-bottom:14px;}
          .roi-card-title{font-size:22px;font-weight:700;color:var(--ink);margin-bottom:10px;}
          .roi-card-desc{font-size:18px;color:var(--muted);line-height:1.65;}
          .roi-box{background:rgba(244,113,26,0.07);border:1.5px solid rgba(244,113,26,0.25);border-radius:20px;padding:28px 32px;font-size:18px;color:var(--ink);line-height:1.75;}
          .roi-callout{background:white;border:1.5px solid var(--border);border-left:4px solid var(--carrot);border-radius:16px;padding:24px 28px;font-size:18px;color:var(--ink);line-height:1.7;margin-bottom:20px;}

          /* ── CLOSING ── */
          .closing-section{background:var(--dark);padding:100px 24px;text-align:center;}
          .closing-inner{max-width:700px;margin:0 auto;}
          .closing-carrot{font-size:69px;display:inline-block;animation:bounce 2.2s ease-in-out infinite;margin-bottom:28px;}
          .closing-title{font-family:'Playfair Display',serif;font-size:57px;font-weight:900;color:white;line-height:1.1;margin-bottom:24px;}
          .closing-sub{font-size:22px;color:rgba(255,255,255,0.5);line-height:1.65;margin-bottom:16px;}
          .closing-note{font-size:18px;color:rgba(255,255,255,0.4);line-height:1.6;margin-bottom:36px;}
          .closing-lines{margin-bottom:36px;display:flex;flex-direction:column;gap:8px;}
          .closing-line{font-size:18px;font-weight:700;color:var(--carrot);}
          .closing-cta{background:var(--carrot);color:white;border:none;border-radius:100px;padding:18px 42px;font-size:22px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
          .closing-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}

          /* ── FOOTER ── */
          .site-footer{background:var(--dark2);border-top:1px solid rgba(255,255,255,0.07);padding:28px 48px;}
          .footer-inner{max-width:1060px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}
          .footer-logo{font-family:'Playfair Display',serif;font-size:23px;font-weight:900;color:var(--carrot);}
          .footer-links{display:flex;gap:6px;align-items:center;}
          .footer-link{font-size:18px;color:rgba(255,255,255,0.4);cursor:pointer;transition:color 0.2s;background:none;border:none;font-family:'DM Sans',sans-serif;}
          .footer-link:hover{color:rgba(255,255,255,0.7);}
          .footer-dot{color:rgba(255,255,255,0.18);font-size:18px;padding:0 2px;}
          .footer-tagline{font-size:18px;font-style:italic;color:rgba(255,255,255,0.22);}

          /* ── RESPONSIVE PART 4 ── */
          @media(max-width:768px){
            .roi-grid{grid-template-columns:1fr;}
            .closing-title{font-size:43px;}
            .site-footer{padding:24px 20px;}
            .footer-inner{flex-direction:column;text-align:center;gap:16px;}
          }
          @media(max-width:480px){
            .roi-section,.closing-section{padding:64px 20px;}
            .closing-title{font-size:37px;}
          }
        `}</style>

        {/* EVERY SALESPERSON WANTS TO WIN */}
        <section className="closing-section">
          <div className="closing-inner">
            <div><span className="closing-carrot">🥕</span></div>
            <h2 className="closing-title">Every Salesperson Wants to Win</h2>
            <p className="closing-sub">
              Earn The Carrot helps salespeople understand their compensation plans, build personalized plans to exceed quota, and stay motivated by the rewards they want to earn.
            </p>
            <p className="closing-note">
              Most companies tell reps what activities to do. Coach helps reps understand why those activities matter.
            </p>
            <div className="closing-lines">
              <div className="closing-line">Understand your compensation plan.</div>
              <div className="closing-line">Build a plan to exceed quota.</div>
              <div className="closing-line">Earn your carrot.</div>
            </div>
            <button className="closing-cta" onClick={() => goUpload()} style={{ lineHeight: 1.2 }}>
              Start by Uploading<br />your Comp Plan
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-logo">🥕 Earn The Carrot</div>
            <div className="footer-links">
              <button className="footer-link">Privacy Policy</button>
              <span className="footer-dot">·</span>
              <button className="footer-link">Terms of Service</button>
              <span className="footer-dot">·</span>
              <button className="footer-link">Contact</button>
            </div>
            <div className="footer-tagline">Too much stick out there. We need more carrots. 🥕</div>
          </div>
        </footer>
      </>
    );
  }

  // ══ DASHBOARD (terminal screen) ══════════════════════════════════════
  if (screen === "dashboard") {
    let remaining = carrotMoney;
    const funded = bigCarrots.map((c) => {
      const applied = Math.min(remaining, +c.cost || 0);
      remaining = Math.max(0, remaining - (+c.cost || 0));
      return { ...c, applied };
    });
    const activeMeta = DASH_TABS.find((t) => t.key === activeTab);
    return (
      <div className="ob">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="ob-dash">
          {activeTab === "home" && (
            <>
              <div className="ob-dash-hero">
                <div className="ob-dash-name">Welcome back{suName ? `, ${suName.split(" ")[0]}` : ""}</div>
                <div className="ob-dash-pct">{targetPct}% of plan</div>
                <div style={{ fontSize: 18, opacity: 0.9, marginTop: 6 }}>
                  On pace for {fmt(calcNet(calcGross(targetPct)))} take home
                </div>
                {carrotAnswer && (
                  <div style={{ fontSize: 18, opacity: 0.95, marginTop: 8, fontWeight: 700 }}>🥕 Your carrot: {carrotAnswer}</div>
                )}
              </div>
              <div className="ob-sec-h" style={{ marginTop: 0 }}>Today's activities</div>
              {metrics.map((m) => {
                const v = todayLog[m.id] || 0;
                const s = metricStatus(v, m);
                return (
                  <div key={m.id} className="ob-metric">
                    <div className="ob-metric-hdr">
                      <span style={{ fontSize: 23 }}>{m.emoji}</span>
                      <strong style={{ flex: 1 }}>{m.label}</strong>
                      <span className={`ob-status ${s.cls}`}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="ob-del" style={{ fontSize: 27 }} onClick={() => setTodayLog({ ...todayLog, [m.id]: Math.max(0, v - 1) })}>−</button>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 29, fontWeight: 900, minWidth: 36, textAlign: "center" }}>{v}</span>
                      <button className="ob-del" style={{ fontSize: 27 }} onClick={() => setTodayLog({ ...todayLog, [m.id]: v + 1 })}>+</button>
                      <span style={{ fontSize: 18, color: "var(--muted)", marginLeft: 8 }}>Floor {m.floor} · Stretch {m.stretch}</span>
                    </div>
                  </div>
                );
              })}
              <div className="ob-sec-h">Big carrot progress</div>
              {funded.map((c) => {
                const pctFill = +c.cost > 0 ? Math.min(100, (c.applied / c.cost) * 100) : 0;
                return (
                  <div key={c.id} className="ob-card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong>{c.name || "Big Carrot"}</strong>
                      <span style={{ fontSize: 18, color: "var(--muted)" }}>{fmt(c.applied)} / {fmt(c.cost)}</span>
                    </div>
                    <div className="ob-prog-bar"><div className="ob-prog-fill" style={{ width: `${pctFill}%` }} /></div>
                    <div style={{ fontSize: 18, color: "var(--muted)" }}>{Math.round(pctFill)}% funded</div>
                  </div>
                );
              })}
            </>
          )}
          {activeTab !== "home" && (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
              <div style={{ fontSize: 47, marginBottom: 12 }}>{activeMeta?.ico}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{activeMeta?.lbl}</div>
              <p>Coming soon.</p>
            </div>
          )}
        </div>

        {/* persistent carrot motivation bar */}
        <div className="ob-carrotbar">
          <div className="ob-carrotbar-inner">
            <div className="ob-cb-top"><span>🥕 Carrot money earned</span><span className="ob-cb-amt">{fmt(carrotMoney)}</span></div>
            <div className="ob-cb-track"><div className="ob-cb-fill" style={{ width: `${bigCarrotGoal > 0 ? Math.min(100, (carrotMoney / bigCarrotGoal) * 100) : 0}%` }} /></div>
          </div>
        </div>

        {/* bottom tab bar */}
        <div className="ob-tabbar">
          {DASH_TABS.map((t) => (
            <button key={t.key} className={`ob-tabbar-tab ${activeTab === t.key ? "on" : ""}`} onClick={() => { setActiveTab(t.key); window.scrollTo(0, 0); }}>
              <span className="ob-tabbar-ico">{t.ico}</span>
              <span className="ob-tabbar-lbl">{t.lbl}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ══ COMP PLAN SUMMARY (full-screen mockup) ═══════════════════════════
  // ══ PLAN CLARIFICATION ═══════════════════════════════════════════════
  if (screen === "plan_clarification") {
    // Treat plans as a list so this extends to multiple plans later.
    const plans = compPlan ? [compPlan] : [];

    // Null / missing plan: friendly message back to upload, never crash.
    if (plans.length === 0) {
      return (
        <div className="cf-wrap">
          <style>{S}</style>
          <style>{OB_STYLES}</style>
          <div className="cf-top">
            <button className="ob-back" onClick={() => goFlow("comp_documents")}>← Back</button>
            <div className="cf-step">Step 2 of 7</div>
          </div>
          <div className="cf-screen">
            <h1 className="cf-h1" style={{ marginBottom: 8 }}>Let's Make Sure Coach Got This Right</h1>
            <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: 24 }}>Coach read your files. Confirm a few details so your numbers are exactly right.</p>
            <div className="cf-info">Coach does not have a plan to review yet. Head back and upload your comp plan so Coach can read it.</div>
            <button className="cf-cta" onClick={() => goFlow("comp_documents")}>Back to your documents →</button>
          </div>
        </div>
      );
    }

    // Web Speech API dictation. Only expose the mic when the browser supports it.
    const SpeechRecognition =
      typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const speechSupported = !!SpeechRecognition;

    const toggleDictation = (key) => {
      if (!speechSupported) return;
      // Tapping the active mic stops it.
      if (listeningKey === key) {
        try { recognitionRef.current && recognitionRef.current.stop(); } catch {}
        return;
      }
      // Starting a new mic stops any other that is active, so only one listens at once.
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      let rec;
      try {
        rec = new SpeechRecognition();
      } catch {
        setListeningKey(null);
        return;
      }
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      const baseText = clarificationAnswers[key] || "";
      rec.onresult = (e) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
        const combined = baseText ? baseText.replace(/\s*$/, "") + " " + transcript : transcript;
        setClarificationAnswers((prev) => ({ ...prev, [key]: combined }));
      };
      // Fail quietly on permission denial or any error: drop back to the text input.
      rec.onerror = () => {
        if (recognitionRef.current === rec) recognitionRef.current = null;
        setListeningKey((cur) => (cur === key ? null : cur));
      };
      rec.onend = () => {
        if (recognitionRef.current === rec) recognitionRef.current = null;
        setListeningKey((cur) => (cur === key ? null : cur));
      };
      recognitionRef.current = rec;
      setListeningKey(key);
      try {
        rec.start();
      } catch {
        recognitionRef.current = null;
        setListeningKey(null);
      }
    };

    // Finalize: if any question is flagged, draft a manager email; otherwise continue.
    const flaggedCount = collectFlaggedQuestions(plans, askManagerFlags).length;
    const finalizeLabel = flaggedCount > 0 ? "Save & Draft Manager Email" : "Save & Continue";
    const finalize = () => goFlow(flaggedCount > 0 ? "manager_email" : "plan_summary");

    return (
      <div className="cf-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="cf-top">
          <button className="ob-back" onClick={() => goFlow("comp_documents")}>← Back</button>
          <div className="cf-step">Step 2 of 7</div>
        </div>
        <div className="cf-screen">
          <h1 className="cf-h1" style={{ marginBottom: 8 }}>Let's Make Sure Coach Got This Right</h1>
          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: 24 }}>Coach read your files. Confirm a few details so your numbers are exactly right.</p>
          <style>{`@keyframes micpulse{0%,100%{box-shadow:0 0 0 0 rgba(244,113,26,0.5);}50%{box-shadow:0 0 0 6px rgba(244,113,26,0);}}`}</style>

          <button className="cf-cta" style={{ marginBottom: 20 }} onClick={finalize}>{finalizeLabel}</button>

          {plans.map((p, idx) => {
            const heading = planTitle(p);
            const questions = Array.isArray(p && p.provenance && p.provenance.needs_clarification)
              ? p.provenance.needs_clarification
              : [];
            return (
              <div className="cf-card" key={idx}>
                <div className="cf-card-hdr">
                  <div className="cf-card-title"><span>📄 {heading}</span></div>
                </div>

                {questions.length === 0 ? (
                  <div className="cf-q">
                    <div className="cf-q-label" style={{ color: "var(--green)" }}>✓ Makes sense, nothing to clarify here.</div>
                  </div>
                ) : (
                  <>
                    <div className="cf-q">
                      <div className="cf-q-hint">Coach read this and has a few things to confirm.</div>
                    </div>
                    {questions.map((q, qi) => {
                      const key = heading + "::" + (q && q.field ? q.field : qi);
                      return (
                        <div className="cf-q" key={qi}>
                          <div className="cf-q-label">{q && q.question ? q.question : "Can you confirm this detail?"}</div>
                          {q && q.source_quote ? (
                            <div style={{ borderLeft: "3px solid var(--carrot)", padding: "6px 12px", margin: "8px 0 12px", background: "var(--carrot-light)", borderRadius: "0 8px 8px 0" }}>
                              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--carrot-dark)", marginBottom: 3 }}>Your plan says:</div>
                              <div style={{ fontSize: 16, fontStyle: "italic", color: "var(--muted)", lineHeight: 1.5 }}>{q.source_quote}</div>
                            </div>
                          ) : null}
                          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                            <input
                              className="ob-inp"
                              style={{ flex: 1, minWidth: 0 }}
                              type="text"
                              value={clarificationAnswers[key] || ""}
                              onChange={(e) => setClarificationAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                              placeholder="Your answer"
                            />
                            {speechSupported && (
                              <button
                                type="button"
                                onClick={() => toggleDictation(key)}
                                aria-label={listeningKey === key ? "Stop dictation" : "Dictate your answer"}
                                title={listeningKey === key ? "Stop dictation" : "Dictate your answer"}
                                style={{
                                  flex: "none",
                                  width: 50,
                                  borderRadius: 12,
                                  cursor: "pointer",
                                  fontSize: 18,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: listeningKey === key ? "1.5px solid var(--carrot)" : "1.5px solid var(--border)",
                                  background: listeningKey === key ? "var(--carrot)" : "white",
                                  color: listeningKey === key ? "white" : "var(--muted)",
                                  animation: listeningKey === key ? "micpulse 1.2s ease-in-out infinite" : "none",
                                }}
                              >
                                🎤
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`bs-opt ${askManagerFlags[key] ? "on" : ""}`}
                            style={{ marginTop: 10, fontSize: 16 }}
                            onClick={() => setAskManagerFlags((prev) => ({ ...prev, [key]: !prev[key] }))}
                          >
                            {askManagerFlags[key] ? "✓ Flagged to ask your manager" : "🚩 Ask your manager about this"}
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}

          <button className="cf-cta" onClick={finalize}>{finalizeLabel}</button>
        </div>
      </div>
    );
  }

  // ══ MANAGER EMAIL ════════════════════════════════════════════════════
  if (screen === "manager_email") {
    const plans = compPlan ? [compPlan] : [];
    const flagged = collectFlaggedQuestions(plans, askManagerFlags);
    const copyText = draftedEmail || flagged.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
    const doCopy = () => {
      try {
        navigator.clipboard.writeText(copyText).then(
          () => { setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); },
          () => {}
        );
      } catch {}
    };

    return (
      <div className="cf-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <style>{`@keyframes azspin{to{transform:rotate(360deg);}}`}</style>
        <div className="cf-top">
          <button className="ob-back" onClick={() => goFlow("plan_clarification")}>← Back to questions</button>
          <div className="cf-step">Manager Email</div>
        </div>
        <div className="cf-screen">
          <h1 className="cf-h1" style={{ marginBottom: 8 }}>Here's your email to send your manager</h1>
          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: 24 }}>A quick, professional note to confirm the details you flagged. Copy it, tweak anything, and send.</p>

          {emailDrafting ? (
            <div className="cf-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 36 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--carrot)", animation: "azspin 0.9s linear infinite" }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Drafting your email...</div>
            </div>
          ) : emailError ? (
            <>
              <div className="cf-info">Coach could not draft the email just now. Here are the questions you flagged. You can copy these and send them to your manager.</div>
              <div className="cf-card" style={{ padding: 20 }}>
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, fontSize: 18, color: "var(--ink)" }}>
                  {flagged.map((q, i) => <li key={i} style={{ marginBottom: 8 }}>{q.question}</li>)}
                </ul>
              </div>
            </>
          ) : (
            <div className="cf-card" style={{ padding: 20, whiteSpace: "pre-wrap", fontSize: 18, lineHeight: 1.6, color: "var(--ink)" }}>
              {draftedEmail}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={doCopy}
              style={{
                flex: "none", padding: "14px 22px", borderRadius: 100, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700,
                border: "1.5px solid var(--carrot)",
                background: emailCopied ? "var(--green-light)" : "white",
                color: emailCopied ? "var(--green)" : "var(--carrot)",
              }}
            >
              {emailCopied ? "✓ Copied" : "Copy email"}
            </button>
            <button className="cf-cta" style={{ flex: 1, marginTop: 0 }} onClick={() => goFlow("plan_summary")}>Continue →</button>
          </div>
        </div>
      </div>
    );
  }

  // ══ PLAN SUMMARY ═════════════════════════════════════════════════════
  if (screen === "plan_summary") {
    // Null / missing plan: friendly message back to upload, never crash.
    if (!compPlan) {
      return (
        <div className="cf-wrap">
          <style>{S}</style>
          <style>{OB_STYLES}</style>
          <div className="cf-top">
            <button className="ob-back" onClick={() => goFlow("comp_documents")}>← Back</button>
            <div className="cf-step">Plan Summary</div>
          </div>
          <div className="cf-screen">
            <h1 className="cf-h1" style={{ marginBottom: 8 }}>Here's what we found in your plan</h1>
            <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: 24 }}>Give it a look and make sure we got everything right. When you confirm, Coach will take it from there.</p>
            <div className="cf-info">Coach does not have a plan to review yet. Head back and upload your comp plan so Coach can read it.</div>
            <button className="cf-cta" onClick={() => goFlow("comp_documents")}>Back to your documents →</button>
          </div>
        </div>
      );
    }

    // ── Comparison tabs (Phase 1) ──────────────────────────────────────────
    // comparePlans is sorted newest plan year first, so [0] is the current plan: its
    // tab is leftmost and selected by default; priors sit to the right by year. The
    // current plan is compPlan; a prior plan is whatever we cached for its tab. Prior
    // tabs are READ-ONLY here, editing and confirm stay on the current plan.
    const currentTabPlan = comparePlans.length ? comparePlans[0] : null;
    const activeTabId = selectedPlanId || (currentTabPlan && currentTabPlan.id) || null;
    const onCurrentTab = !currentTabPlan || activeTabId === currentTabPlan.id;
    const displayedPlan = onCurrentTab ? compPlan : comparePlanCache[activeTabId];
    const yearTabs = comparePlans.length >= 2 ? (
      <div role="tablist" aria-label="Plan year" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {comparePlans.map((p) => {
          const active = p.id === activeTabId;
          const isCur = currentTabPlan && p.id === currentTabPlan.id;
          return (
            <button key={p.id} role="tab" aria-selected={active} onClick={() => selectComparePlan(p.id)}
              style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer", padding: "8px 16px", borderRadius: 100,
                border: active ? "1.5px solid var(--carrot)" : "1.5px solid var(--border)", background: active ? "var(--carrot)" : "white", color: active ? "white" : "var(--ink)" }}>
              FY{p.plan_year != null ? p.plan_year : "?"}{isCur ? " · current" : ""}
            </button>
          );
        })}
      </div>
    ) : null;

    const meta = (displayedPlan && displayedPlan.meta) || {};
    const pay = (displayedPlan && displayedPlan.pay) || {};
    const quota = (displayedPlan && displayedPlan.quota) || {};
    const commission = (displayedPlan && displayedPlan.commission) || {};
    const spiffs = Array.isArray(displayedPlan && displayedPlan.spiffs) ? displayedPlan.spiffs : [];
    const other = (displayedPlan && displayedPlan.other_terms) || {};
    const fc = (displayedPlan && displayedPlan.provenance && displayedPlan.provenance.field_confidence) || {};

    const isMissing = (v) => v === null || v === undefined || v === "";
    const tagEl = (kind) => {
      if (!kind) return null;
      const needs = kind === "needs";
      return (
        <span style={{
          marginLeft: 8, fontSize: 15, fontWeight: 700, padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap",
          background: needs ? "#FEE2E2" : "var(--gold-light)",
          color: needs ? "#B91C1C" : "#7A5C00",
          border: needs ? "1px solid #FCA5A5" : "1px solid var(--gold)",
        }}>{needs ? "Needs confirming" : "Coach assumed"}</span>
      );
    };
    // ── inline editing helpers ──
    const hasEdit = (path) => Object.prototype.hasOwnProperty.call(planEdits, path);
    const editedMarker = <span style={{ marginLeft: 8, fontSize: 15, fontWeight: 600, color: "var(--green)", whiteSpace: "nowrap" }}>✓ edited by you</span>;
    // Money input helpers: live thousands separators while typing.
    const formatThousands = (str) => {
      let s = String(str == null ? "" : str).replace(/[^\d.]/g, "");
      const dot = s.indexOf(".");
      if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, ""); // keep only first decimal point
      if (s === "") return "";
      const [intPart, decPart] = s.split(".");
      const intFmt = intPart === "" ? "" : Number(intPart).toLocaleString("en-US");
      return s.indexOf(".") !== -1 ? `${intFmt || "0"}.${decPart === undefined ? "" : decPart}` : intFmt;
    };
    const parseMoney = (str) => {
      const cleaned = String(str).replace(/[^\d.]/g, "");
      if (cleaned === "" || cleaned === ".") return null;
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    };
    const beginPlanEdit = (path, startVal, mode) => {
      setEditPath(path);
      setEditDraft(mode === "money" ? formatThousands(startVal) : (startVal === null || startVal === undefined ? "" : String(startVal)));
    };
    const stopDictation = () => { try { recognitionRef.current && recognitionRef.current.stop(); } catch {} recognitionRef.current = null; setListeningKey(null); };
    const cancelPlanEdit = () => { stopDictation(); setEditPath(null); setEditDraft(""); };
    const commitPlanEdit = (path, mode) => {
      stopDictation();
      const v = mode === "money" ? parseMoney(editDraft) : editDraft;
      setPlanEdits((prev) => ({ ...prev, [path]: v }));
      setEditPath(null); setEditDraft("");
    };
    // Voice dictation for the inline edit field (same Web Speech API as elsewhere).
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const speechSupported = !!SpeechRecognition;
    const toggleEditDictation = (mode) => {
      if (!speechSupported || !editPath) return;
      if (listeningKey === editPath) { try { recognitionRef.current && recognitionRef.current.stop(); } catch {} return; }
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
      let rec;
      try { rec = new SpeechRecognition(); } catch { setListeningKey(null); return; }
      rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
      const base = editDraft || "";
      rec.onresult = (e) => {
        let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        const combined = base ? base.replace(/\s*$/, "") + " " + t : t;
        setEditDraft(mode === "money" ? formatThousands(combined) : combined);
      };
      rec.onerror = () => { if (recognitionRef.current === rec) recognitionRef.current = null; setListeningKey((c) => (c === editPath ? null : c)); };
      rec.onend = () => { if (recognitionRef.current === rec) recognitionRef.current = null; setListeningKey((c) => (c === editPath ? null : c)); };
      recognitionRef.current = rec;
      setListeningKey(editPath);
      try { rec.start(); } catch { recognitionRef.current = null; setListeningKey(null); }
    };
    const pencilBtn = (path, startVal, mode) => (
      <button type="button" onClick={() => beginPlanEdit(path, startVal, mode)} aria-label="Edit value" title="Edit"
        style={{ marginLeft: 6, border: "1px solid var(--border)", background: "white", borderRadius: 8, cursor: "pointer", padding: "2px 5px", lineHeight: 0, verticalAlign: "middle", flex: "none" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--carrot)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
      </button>
    );
    const editBox = (path, mode) => {
      const listening = listeningKey === path;
      return (
        <span className="cf-edit" style={{ display: "inline-flex", width: "100%", marginTop: 0, alignItems: "stretch" }}>
          <input className="cf-einp" type="text" inputMode={mode === "money" ? "decimal" : "text"} autoFocus value={editDraft}
            onChange={(e) => setEditDraft(mode === "money" ? formatThousands(e.target.value) : e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitPlanEdit(path, mode); else if (e.key === "Escape") cancelPlanEdit(); }} />
          {speechSupported && (
            <button type="button" onClick={() => toggleEditDictation(mode)} aria-label={listening ? "Stop dictation" : "Dictate your answer"} title="Dictate"
              style={{ flex: "none", width: 44, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: listening ? "1.5px solid var(--carrot)" : "1.5px solid var(--border)", background: listening ? "var(--carrot)" : "white", animation: listening ? "micpulse 1.2s ease-in-out infinite" : "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={listening ? "white" : "var(--carrot)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
            </button>
          )}
          <button type="button" className="cf-save" onClick={() => commitPlanEdit(path, mode)}>✓</button>
          <button type="button" className="cf-cancel" onClick={cancelPlanEdit}>✕</button>
        </span>
      );
    };
    // Editable ob-stat row. type: "money" | "percent" | "text".
    const eRow = (label, original, path, type) => {
      const mode = type === "money" ? "money" : "text";
      const effective = effectivePlanValue(path, original);
      const edited = hasEdit(path);
      const missing = isMissing(effective);
      if (editPath === path) {
        return (
          <div className="ob-stat" key={label} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div className="ob-stat-lbl">{label}</div>
            {editBox(path, mode)}
          </div>
        );
      }
      const kind = missing ? "needs" : (path && fc[path] === "low" ? "assumed" : null);
      const display = missing
        ? <span style={{ fontStyle: "italic", color: "var(--muted)" }}>not specified</span>
        : (type === "money" && typeof effective === "number" ? fmt(effective) : effective);
      return (
        <div className="ob-stat" key={label}>
          <div className="ob-stat-lbl">{label}</div>
          <div className="ob-stat-val" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", gap: 4 }}>
            {display}{pencilBtn(path, missing ? "" : effective, mode)}{edited ? editedMarker : tagEl(kind)}
          </div>
        </div>
      );
    };
    // Editable noteStyle line (Floor / Cap / Calculation). Carries its own tag kind.
    const eNote = (label, original, path, tagKind) => {
      const effective = effectivePlanValue(path, original);
      const edited = hasEdit(path);
      const missing = isMissing(effective);
      return (
        <div style={noteStyle} key={label}>
          <b>{label}:</b>{" "}
          {editPath === path ? editBox(path, "text") : (
            <>
              {missing ? <span style={{ fontStyle: "italic" }}>not specified</span> : effective}
              {pencilBtn(path, missing ? "" : effective, "text")}
              {edited ? editedMarker : tagEl(tagKind)}
            </>
          )}
        </div>
      );
    };
    const pct = (r) => isMissing(r) ? "?" : (Math.round(r * 1000) / 10) + "%";

    // Plan period as a readable string.
    let periodStr = null;
    const pp = meta.plan_period;
    if (pp) {
      if (typeof pp === "string") periodStr = pp;
      else {
        const parts = [];
        if (pp.type) parts.push(pp.type);
        if (pp.start_date && pp.end_date) parts.push(`${pp.start_date} to ${pp.end_date}`);
        else if (pp.start_date) parts.push(`from ${pp.start_date}`);
        periodStr = parts.length ? parts.join(" · ") : null;
      }
    }
    const payMix = (pay.pay_mix && (!isMissing(pay.pay_mix.base_pct) || !isMissing(pay.pay_mix.variable_pct)))
      ? `${isMissing(pay.pay_mix.base_pct) ? "?" : pay.pay_mix.base_pct}% base / ${isMissing(pay.pay_mix.variable_pct) ? "?" : pay.pay_mix.variable_pct}% variable`
      : null;

    // Money-consistency: surface conflicts after edits, never silently resolve or block.
    const toNum = (v) => (typeof v === "number" ? v : (isMissing(v) ? null : (isNaN(parseFloat(String(v).replace(/[^\d.]/g, ""))) ? null : parseFloat(String(v).replace(/[^\d.]/g, "")))));
    const baseAmt = toNum(effectivePlanValue("pay.base_salary", pay.base_salary && pay.base_salary.amount));
    const oteAmt = toNum(effectivePlanValue("pay.ote", pay.ote && pay.ote.amount));
    const tvAmt = toNum(effectivePlanValue("pay.target_variable", pay.target_variable && pay.target_variable.amount));
    const moneyWarnings = [];
    if (baseAmt != null && tvAmt != null && oteAmt != null && Math.abs(baseAmt + tvAmt - oteAmt) > 1) {
      moneyWarnings.push(`Heads up, your base (${fmt(baseAmt)}) plus target variable (${fmt(tvAmt)}) comes to ${fmt(baseAmt + tvAmt)}, but your OTE says ${fmt(oteAmt)}. Want to line these up?`);
    }
    const mixEff = effectivePlanValue("pay.pay_mix", payMix);
    if (mixEff && baseAmt != null && oteAmt && oteAmt > 0) {
      const mixNums = String(mixEff).match(/[\d.]+/g);
      if (mixNums && mixNums.length >= 1) {
        const statedBasePct = parseFloat(mixNums[0]);
        const expectedBasePct = (baseAmt / oteAmt) * 100;
        if (!isNaN(statedBasePct) && Math.abs(statedBasePct - expectedBasePct) > 1) {
          moneyWarnings.push(`Heads up, your pay mix says ${statedBasePct}% base, but your base (${fmt(baseAmt)}) against OTE (${fmt(oteAmt)}) works out to about ${Math.round(expectedBasePct)}%. Want to line these up?`);
        }
      }
    }

    const basisText = {
      pct_of_revenue: "Pays a percentage of the revenue you book.",
      pct_of_variable: "Pays a percentage of your target variable, based on the percent of quota you attain.",
      dollar_per_unit: "Pays a fixed dollar amount per deal or unit.",
    }[commission.rate_basis] || null;

    const tiers = Array.isArray(commission.tiers) ? commission.tiers : [];
    const floor = commission.floor || {};
    const cap = commission.cap || {};
    // Floor: never render "null"; fall back to "not specified" and flag it.
    const floorComplete = floor.type === "none" || (!isMissing(floor.type) && !isMissing(floor.attainment_pct));
    let floorText;
    if (floor.type === "none") floorText = "No floor.";
    else if (floor.type === "threshold" && !isMissing(floor.attainment_pct)) floorText = `No commission below ${floor.attainment_pct}% attainment.`;
    else if (!isMissing(floor.type) && !isMissing(floor.attainment_pct)) floorText = `${floor.type} at ${floor.attainment_pct}%`;
    else floorText = null;
    const floorKind = floorComplete ? (fc["commission.floor"] === "low" ? "assumed" : null) : "needs";

    const capComplete = cap.type === "none" || (!isMissing(cap.type) && !isMissing(cap.attainment_pct));
    let capText;
    if (cap.type === "none") capText = "No cap.";
    else if (cap.type === "hard" && !isMissing(cap.attainment_pct)) capText = `Earnings cap at ${cap.attainment_pct}% attainment.`;
    else if (!isMissing(cap.type) && !isMissing(cap.attainment_pct)) capText = `${cap.type} at ${cap.attainment_pct}%`;
    else capText = null;
    const capKind = capComplete ? (fc["commission.cap"] === "low" ? "assumed" : null) : "needs";
    const calcText = commission.calculation === "marginal"
      ? "Marginal: each rate applies only to the dollars within its band."
      : commission.calculation === "retroactive"
        ? "Retroactive: reaching a tier lifts the rate on the whole amount."
        : null;
    const calcKind = isMissing(commission.calculation) ? "needs" : (fc["commission.calculation"] === "low" ? "assumed" : null);

    // Draw display string for the Extras section.
    let drawText = null;
    if (other.draw) {
      if (other.draw.type === "none") drawText = "No draw.";
      else if (!isMissing(other.draw.type) && !isMissing(other.draw.amount)) drawText = `${other.draw.type} · ${fmt(other.draw.amount)}`;
      else if (!isMissing(other.draw.type)) drawText = other.draw.type;
      else if (!isMissing(other.draw.amount)) drawText = fmt(other.draw.amount);
    }

    const components = Array.isArray(quota.components) ? quota.components : [];
    // Tiers/accelerators may live at the component level instead of plan level.
    const hasComponentCommission = components.some(
      (c) => c && c.commission && ((Array.isArray(c.commission.tiers) && c.commission.tiers.length > 0) || c.commission.rate_basis)
    );
    const secH = { fontFamily: "'Playfair Display',serif", fontSize: 23, fontWeight: 700, margin: "0 0 8px" };
    const noteStyle = { fontSize: 16, color: "var(--muted)", lineHeight: 1.5, marginTop: 8 };
    // Clarifying questions belong to confirming, not analysis, so they live on this
    // step, grouped by the file they came from.
    const clarQuestions = Array.isArray(compPlan.provenance && compPlan.provenance.needs_clarification) ? compPlan.provenance.needs_clarification : [];
    const clarFile = (compPlan.provenance && Array.isArray(compPlan.provenance.source_files) && compPlan.provenance.source_files[0]) || meta.plan_name || "your plan";

    // Prior-year tab: read-only summary of the selected prior plan. No editing/confirm
    // (those stay on the current plan). Reuses the same derived display strings, all of
    // which are computed from raw plan fields, not the edit overlay.
    if (!onCurrentTab) {
      return (
        <div className="cf-wrap" style={{ paddingTop: TOPBAR_H }}>
          <style>{S}</style>
          <style>{OB_STYLES}</style>
          {renderTopBar(true)}
          {renderRail()}
          <div className="cf-screen" style={{ maxWidth: 1160, marginLeft: `max(${railW}px, calc((100vw - 1160px) / 2))`, marginRight: "auto" }}>
            <button onClick={() => goFlow("comp_dashboard")} style={{ background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 14 }}>‹ Back to Comp Plan</button>
            <h1 className="cf-h1" style={{ marginBottom: 8 }}>{meta.plan_name || "Prior plan"}</h1>
            <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: 18 }}>Prior-year plan{periodStr ? ` · ${periodStr}` : ""} · read only. Switch to the current tab to edit.</p>
            {yearTabs}
            {!displayedPlan ? (
              <div className="ob-card" style={{ padding: 20, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Loading this plan…</div>
            ) : (
              <>
                <div className="ob-card">
                  <div style={secH}>Pay</div>
                  <div className="ob-stat"><div className="ob-stat-lbl">Base salary</div><div className="ob-stat-val">{isMissing(pay.base_salary && pay.base_salary.amount) ? "—" : fmt(pay.base_salary.amount)}</div></div>
                  <div className="ob-stat"><div className="ob-stat-lbl">OTE</div><div className="ob-stat-val">{isMissing(pay.ote && pay.ote.amount) ? "—" : fmt(pay.ote.amount)}</div></div>
                  <div className="ob-stat"><div className="ob-stat-lbl">Target variable</div><div className="ob-stat-val">{isMissing(pay.target_variable && pay.target_variable.amount) ? "—" : fmt(pay.target_variable.amount)}</div></div>
                  {payMix ? <div className="ob-stat"><div className="ob-stat-lbl">Pay mix</div><div className="ob-stat-val">{payMix}</div></div> : null}
                </div>
                <div className="ob-card">
                  <div style={secH}>Quota & components</div>
                  <div className="ob-stat"><div className="ob-stat-lbl">Total quota</div><div className="ob-stat-val">{isMissing(quota.total_quota && quota.total_quota.amount) ? "—" : fmt(quota.total_quota.amount)}</div></div>
                  {components.map((c, i) => (
                    <div key={i} style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 10 }}>
                      <div style={{ fontWeight: 700 }}>{c.name || "Component"}{c.weight_pct != null ? ` · ${c.weight_pct}%` : ""}{c.quota_amount != null ? ` · ${fmt(c.quota_amount)}` : ""}</div>
                      {Array.isArray(c.tiers) && c.tiers.length
                        ? <div style={noteStyle}>{c.tiers.map((t) => `${t.from_attainment_pct ?? "?"}–${t.to_attainment_pct ?? "up"}%: ${pct(t.rate)}`).join("  ·  ")}</div>
                        : c.rate != null ? <div style={noteStyle}>Rate: {pct(c.rate)}</div> : null}
                    </div>
                  ))}
                </div>
                <div className="ob-card">
                  <div style={secH}>Commission</div>
                  {basisText ? <div style={noteStyle}><b>Basis:</b> {basisText}</div> : null}
                  {calcText ? <div style={noteStyle}><b>Calculation:</b> {calcText}</div> : null}
                  {tiers.length ? <div style={noteStyle}><b>Tiers:</b> {tiers.map((t) => `${t.from_attainment_pct ?? "?"}–${t.to_attainment_pct ?? "up"}%: ${pct(t.rate)}`).join("  ·  ")}</div> : null}
                  {floorText ? <div style={noteStyle}><b>Floor:</b> {floorText}</div> : null}
                  {capText ? <div style={noteStyle}><b>Cap:</b> {capText}</div> : null}
                </div>
                {(spiffs.length || other.payout_frequency || other.clawback_terms || drawText) ? (
                  <div className="ob-card">
                    <div style={secH}>Extras</div>
                    {drawText ? <div style={noteStyle}><b>Draw:</b> {drawText}</div> : null}
                    {other.payout_frequency ? <div style={noteStyle}><b>Payout:</b> {other.payout_frequency}</div> : null}
                    {other.clawback_terms ? <div style={noteStyle}><b>Clawback:</b> {other.clawback_terms}</div> : null}
                    {spiffs.map((s, i) => <div key={i} style={noteStyle}><b>SPIFF:</b> {s.name}{s.payout != null ? ` · ${fmt(s.payout)}` : ""}{s.detail ? ` · ${s.detail}` : ""}</div>)}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="cf-wrap" style={{ paddingTop: TOPBAR_H }}>
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        {renderTopBar(true)}
        {renderRail()}
        {/* Center in the viewport with a max readable width; never underlap the fixed rail. */}
        <div className="cf-screen" style={{ maxWidth: 1160, marginLeft: `max(${railW}px, calc((100vw - 1160px) / 2))`, marginRight: "auto" }}>
          <button onClick={() => goFlow("comp_dashboard")} style={{ background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 14 }}>‹ Back to Comp Plan</button>
          <h1 className="cf-h1" style={{ marginBottom: 8 }}>Here's what we found in your plan</h1>
          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22 }}>Give it a look and make sure we got everything right. When you confirm, Coach will take it from there.</p>
          {yearTabs}

          {/* Laptop first: plan summary on the left, confirm/edit panel on the right. */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 560px", minWidth: 320 }}>

          {/* 1. The basics */}
          <div className="ob-card">
            <div style={secH}>The basics</div>
            {eRow("Name", meta.rep_name, "meta.rep_name", "text")}
            {eRow("Role", meta.rep_role, "meta.rep_role", "text")}
            {eRow("Plan name", meta.plan_name, "meta.plan_name", "text")}
            {eRow("Plan period", periodStr, "meta.plan_period", "text")}
          </div>

          {/* 2. Your pay */}
          <div className="ob-card">
            <div style={secH}>Your pay</div>
            {eRow("Base salary", pay.base_salary && pay.base_salary.amount, "pay.base_salary", "money")}
            {eRow("Target variable", pay.target_variable && pay.target_variable.amount, "pay.target_variable", "money")}
            {eRow("On-target earnings", pay.ote && pay.ote.amount, "pay.ote", "money")}
            {eRow("Pay mix", payMix, "pay.pay_mix", "text")}
            {moneyWarnings.map((w, wi) => (
              <div key={wi} style={{ marginTop: 12, background: "var(--gold-light)", border: "1px solid var(--gold)", color: "#7A5C00", borderRadius: 12, padding: "12px 14px", fontSize: 16, lineHeight: 1.5 }}>{w}</div>
            ))}
          </div>

          {/* 3. Your quota */}
          <div className="ob-card">
            <div style={secH}>Your quota</div>
            {eRow("Total quota", quota.total_quota && quota.total_quota.amount, "quota.total_quota", "money")}
            {eRow("Quota period", quota.total_quota && quota.total_quota.period, "quota.total_quota.period", "text")}
            {components.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {components.map((c, i) => (
                  <div key={i} style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
                    <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{c.name || `Component ${i + 1}`}</div>
                    <div style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.6 }}>
                      {isMissing(c.weight_pct) ? "Weight not specified" : `Weight: ${c.weight_pct}%`}
                      {isMissing(c.quota_amount) ? "" : ` · Quota: ${fmt(c.quota_amount)}`}
                      <br />
                      {c.commission && Array.isArray(c.commission.tiers) && c.commission.tiers.length > 0
                        ? `Commission: ${c.commission.tiers.map((t) => pct(t.rate)).join(", ")}`
                        : "Commission: uses the plan commission below"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. How you get paid */}
          <div className="ob-card">
            <div style={secH}>How you get paid</div>
            <div style={{ fontSize: 18, color: "var(--ink)", lineHeight: 1.6, display: "flex", alignItems: "flex-start", flexWrap: "wrap" }}>
              <span>{basisText || <span style={{ fontStyle: "italic", color: "var(--muted)" }}>Rate basis not specified</span>}</span>
              {tagEl(isMissing(commission.rate_basis) ? "needs" : (fc["commission.rate_basis"] === "low" ? "assumed" : null))}
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 6 }}>
                Tiers {tagEl(tiers.length > 0 ? (fc["commission.tiers"] === "low" ? "assumed" : null) : (hasComponentCommission ? null : "needs"))}
              </div>
              {tiers.length > 0 ? (
                tiers.map((t, i) => {
                  const range = isMissing(t.to_attainment_pct) ? `${t.from_attainment_pct}% and above` : `${t.from_attainment_pct}% to ${t.to_attainment_pct}%`;
                  return (
                    <div className="ob-stat" key={i}>
                      <div className="ob-stat-lbl">{range}{t.label ? ` · ${t.label}` : ""}</div>
                      <div className="ob-stat-val">{pct(t.rate)}</div>
                    </div>
                  );
                })
              ) : hasComponentCommission ? (
                <div style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.5 }}>Tier and accelerator detail is shown per quota component above.</div>
              ) : (
                <div style={{ fontSize: 18, fontStyle: "italic", color: "var(--muted)" }}>No tiers found.</div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              {eNote("Floor", floorText, "commission.floor", floorKind)}
              {eNote("Cap", capText, "commission.cap", capKind)}
              {eNote("Calculation", calcText, "commission.calculation", calcKind)}
            </div>
          </div>

          {/* 5. Extras */}
          <div className="ob-card">
            <div style={secH}>Extras</div>
            <div style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", marginBottom: 6 }}>SPIFFs</div>
            {spiffs.length === 0 ? (
              <div style={{ fontSize: 18, fontStyle: "italic", color: "var(--muted)", marginBottom: 6 }}>None found.</div>
            ) : (
              spiffs.map((s, i) => {
                const wrap = { borderTop: i === 0 ? "none" : "1px solid var(--border)", paddingTop: i === 0 ? 0 : 10, marginTop: i === 0 ? 0 : 10, marginBottom: 6 };
                if (typeof s === "string") {
                  return <div key={i} style={wrap}><div style={{ fontWeight: 700, color: "var(--ink)" }}>{s}</div></div>;
                }
                const sp = s || {};
                const name = sp.name || sp.title || `SPIFF ${i + 1}`;
                // Show full detail: gather every other primitive field, friendly fields first.
                const order = ["amount", "payout", "value", "condition", "trigger", "criteria", "requirement", "description", "notes", "detail", "limit", "cap", "frequency", "payout_timing", "clawback"];
                const seen = new Set(["name", "title"]);
                const parts = [];
                const pushKey = (k) => {
                  if (seen.has(k)) return;
                  seen.add(k);
                  const v = sp[k];
                  if (!isMissing(v) && (typeof v === "string" || typeof v === "number")) parts.push(String(v));
                };
                order.forEach(pushKey);
                Object.keys(sp).forEach(pushKey);
                const detail = parts.join(" · ");
                return (
                  <div key={i} style={wrap}>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>{name}</div>
                    {detail ? <div style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>{detail}</div> : null}
                  </div>
                );
              })
            )}
            <div style={{ marginTop: 12 }}>
              {eRow("Draw", drawText, "other_terms.draw", "text")}
              {eRow("Payout frequency", other.payout_frequency, "other_terms.payout_frequency", "text")}
              {eRow("Clawback", other.clawback_terms, "other_terms.clawback_terms", "text")}
            </div>
          </div>

            </div>

            <div style={{ flex: "1 1 360px", minWidth: 300, position: "sticky", top: 92, alignSelf: "flex-start" }}>
              <div className="ob-card">
                <div style={secH}>Confirm your plan</div>
                <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 16px" }}>Something off? Edit it inline or tell us what to fix.</p>

                {clarQuestions.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>A few things to confirm from {clarFile}</div>
                    {clarQuestions.map((q, qi) => {
                      const key = clarFile + "::" + (q && q.field ? q.field : qi);
                      return (
                        <div key={qi} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.45, marginBottom: 6 }}>{q && q.question ? q.question : "Can you confirm this detail?"}</div>
                          {q && q.source_quote ? (
                            <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--muted)", borderLeft: "3px solid var(--carrot)", padding: "2px 10px", margin: "0 0 6px", lineHeight: 1.4 }}>{q.source_quote}</div>
                          ) : null}
                          <input className="ob-inp" type="text" value={clarificationAnswers[key] || ""} onChange={(e) => setClarificationAnswers((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="Your answer" style={{ width: "100%", boxSizing: "border-box" }} />
                          <button type="button" className={`bs-opt ${askManagerFlags[key] ? "on" : ""}`} style={{ marginTop: 6, fontSize: 14 }} onClick={() => setAskManagerFlags((prev) => ({ ...prev, [key]: !prev[key] }))}>{askManagerFlags[key] ? "Flagged to ask your manager" : "Ask your manager about this"}</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Tell us what to fix</div>
                <textarea value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} placeholder="Anything Coach got wrong? Type it here." rows={4} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 16, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, resize: "vertical", marginBottom: 16 }} />

                {saveError && !(compPlan.meta && compPlan.meta.plan_id) && <div style={{ background: "var(--gold-light)", border: "1px solid var(--gold)", color: "#7A5C00", borderRadius: 12, padding: "10px 14px", fontSize: 15, lineHeight: 1.45, marginBottom: 12 }}>Heads up, your plan has not saved yet. Confirm below and Coach will save it.</div>}
                {confirmError && <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", borderRadius: 12, padding: "10px 14px", fontSize: 15, lineHeight: 1.45, marginBottom: 12 }}>{confirmError}</div>}
                <button className="cf-cta" style={{ width: "100%", opacity: confirming ? 0.6 : 1 }} disabled={confirming} onClick={confirmPlan}>{confirming ? "Saving your plan..." : "Looks right, confirm plan"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ CONFIRM (deduction questions) ════════════════════════════════════
  if (screen === "confirm") {
    const intendedK = grossAt100 * k401Pct / 100;
    const annualK = Math.min(intendedK, k401Limit);
    const monthly = intendedK / 12;
    const monthsToMax = monthly > 0 ? k401Limit / monthly : Infinity;
    const maxMonth = monthsToMax > 0 && monthsToMax < 12 ? MONTHS[Math.floor(monthsToMax)] : null;
    const willMax = intendedK >= k401Limit;
    const BRACKETS = [
      { key: "Under 50", label: "Under 50, max $23,500" },
      { key: "50-59", label: "Age 50 to 59, max $31,000" },
      { key: "60-63", label: "Age 60 to 63, max $34,750" },
      { key: "64+", label: "Age 64 and older, max $31,000" },
    ];
    return (
      <div className="cf-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="cf-top">
          <button className="ob-back" onClick={() => goFlow("plan_clarification")}>← Back</button>
          <div className="cf-step">Step 3 of 7</div>
        </div>
        <div className="cf-screen">
          <h1 className="cf-h1">Help Coach Understand Your True Take-Home Pay</h1>

          <div className="cf-card">
            <div className="cf-card-hdr">
              <div className="cf-card-title"><span>A few quick questions so Coach can calculate your real take-home</span></div>
              <div className="cf-card-sub">This takes less than 60 seconds</div>
            </div>

            {/* Q1 — State */}
            <div className="cf-q">
              <div className="cf-q-label">What state do you live in?</div>
              <div className="cf-q-hint">Used to calculate your state income tax</div>
              <select className="ob-inp" value={suState} onChange={(e) => setSuState(e.target.value)}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Q2 — 401k bracket + contribution */}
            <div className="cf-q">
              <div className="cf-q-label">Which 401k contribution bracket are you in?</div>
              <div className="cf-q-hint">We use this to calculate your maximum annual contribution. We are not asking your age.</div>
              <div className="bs-pills" style={{ marginBottom: 16 }}>
                {BRACKETS.map((b) => (
                  <button key={b.key} className={`bs-opt ${suAge === b.key ? "on" : ""}`} onClick={() => setSuAge(b.key)}>{b.label}</button>
                ))}
              </div>
              <div className="cf-q-label">What percentage of your salary do you contribute?</div>
              <input className="ob-slider" type="range" min="0" max="100" step="0.5" value={k401Pct} onChange={(e) => setK401Pct(+e.target.value)} />
              <div className="cf-q-calc">{k401Pct}% · Annual contribution: ~{fmt(annualK)}{maxMonth ? ` · You will max out around ${maxMonth}` : ""}</div>
              {willMax && <span className="cf-badge green" style={{ display: "inline-block", marginTop: 8 }}>✓ You will max out your 401k this year</span>}
            </div>

            {/* Q3 — Health */}
            <div className="cf-q">
              <div className="cf-q-label">What is your monthly health insurance premium?</div>
              <div className="cf-q-hint">Your portion after employer contribution · Based on single person coverage</div>
              <input className="ob-inp" type="number" value={healthMo} onChange={(e) => setHealthMo(+e.target.value)} placeholder="200" />
            </div>

            {/* Q4 — Other deductions */}
            <div className="cf-q">
              <div className="cf-q-label">Any other monthly deductions?</div>
              <div className="cf-q-hint">Dental, vision, FSA, parking, etc.</div>
              <input className="ob-inp" type="number" value={otherMonthly} onChange={(e) => setOtherMonthly(+e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="cf-info">🧮 Based on your state and deductions Coach will calculate your real take-home at every milestone. You can update these any time.</div>

          <button className="cf-cta" onClick={() => { saveRepProfile(); goFlow("comp_dashboard"); }}>Looks right →</button>
        </div>
      </div>
    );
  }

  // ══ REAL PAY + MOTIVATION ════════════════════════════════════════════
  if (screen === "real_pay_motivation") {
    // grossAt / takeHomeAt are wired to the real comp engine (calcGross / calcNet).
    // TODO: if the comp engine is refactored, keep these pointed at the source-of-truth functions.
    return (
      <SeeWhatMoreIsWorth
        grossAt={calcGross}
        takeHomeAt={(pct) => calcNet(calcGross(pct))}
        onContinue={() => goFlow("build_strategy")}
      />
    );
  }

  // ══ CREATE ACCOUNT ═══════════════════════════════════════════════════
  if (screen === "create_account") {
    const FREE_FEATURES = [
      "See your real take-home numbers",
      "Understand your compensation plan",
      "Set your first carrot",
    ];
    const PRO_FEATURES = [
      "Everything in Free",
      "Build your territory strategy with Coach",
      "Personalized success plan",
      "Ongoing coaching and motivation",
      "Track progress toward your carrot all year",
    ];
    return (
      <div className="ca-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="cf-top" style={{ background: "rgba(15,10,5,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button className="ob-back" onClick={() => goFlow("real_pay_motivation")}>← Back</button>
          <div className="cf-step" style={{ color: "rgba(255,255,255,0.6)" }}>Step 7 of 7</div>
        </div>
        <div className="ca-screen">
          <div className="ca-callout">
            <div className="ca-callout-c">🥕 Your carrot: {carrotAnswer || "Your goal"}</div>
            <div className="ca-callout-sub">Create your account to save your plan and start building your strategy with Coach.</div>
          </div>
          <h1 className="ca-h1">Save Your Plan and Start Building</h1>

          <div className="ca-plans">
            <div className={`pcard ca-plan ${selectedPlan === "free" ? "sel" : ""}`} onClick={() => setSelectedPlan("free")}>
              <div className="ptier standard">Free</div>
              <div className="pname">Carrot Snapshot</div>
              <div className="pprice">$0</div>
              <div className="pdivider" />
              <div className="pfeatures">
                {FREE_FEATURES.map((f, i) => (
                  <div key={i} className="pfeature"><span className="pcheck orange">✓</span><span>{f}</span></div>
                ))}
              </div>
              <button className="pbtn outlined-orange" onClick={(e) => { e.stopPropagation(); setSelectedPlan("free"); }}>Start Free</button>
            </div>
            <div className={`pcard featured ca-plan ${selectedPlan === "pro" ? "sel" : ""}`} onClick={() => setSelectedPlan("pro")}>
              <div className="most-popular-badge">Recommended</div>
              <div className="ptier orange">Pro</div>
              <div className="pname">Meet Coach</div>
              <div className="pprice">$99<span style={{ fontSize: 23, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>/year</span></div>
              <div className="psub">or $9.99 per month</div>
              <div className="pdivider" />
              <div className="pfeatures">
                {PRO_FEATURES.map((f, i) => (
                  <div key={i} className="pfeature"><span className="pcheck orange">✓</span><span>{f}</span></div>
                ))}
              </div>
              <button className="pbtn filled" onClick={(e) => { e.stopPropagation(); setSelectedPlan("pro"); }}>Start Pro · $9.99/month</button>
            </div>
          </div>

          <div className="ca-form">
            <label className="ca-flabel">Email Address</label>
            <input className="ca-finp" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@company.com" />
            <label className="ca-flabel">Create Password</label>
            <input className="ca-finp" type="password" value={suPass} onChange={(e) => setSuPass(e.target.value)} placeholder="Create a password" />
            <div className="ca-hint">You can upgrade or change your plan any time</div>
          </div>

          <button className="cf-cta" onClick={() => goFlow(selectedPlan === "pro" ? "build_strategy" : "dashboard")}>Create My Account →</button>
        </div>
      </div>
    );
  }

  // ══ BUILD STRATEGY ═══════════════════════════════════════════════════
  if (screen === "build_strategy") {
    const a1 = dealSize !== "" && +dealSize > 0;
    const a2 = !!salesCycle;
    const a3 = closeRateSet;
    const a4 = pipeline !== "";
    const a5 = territoryFocus.length > 0;
    const answeredCount = [a1, a2, a3, a4, a5].filter(Boolean).length;
    const currentQ = Math.min(5, answeredCount + 1);
    const D = +dealSize || 0;
    const CR = closeRate / 100;
    const Q = comp.quota;
    const oppsQuota = D > 0 && CR > 0 ? Math.ceil((Q / D) / CR) : null;
    const oppsStretch = D > 0 && CR > 0 ? Math.ceil((Q * 1.25 / D) / CR) : null;
    const neededPipeline = oppsQuota != null ? oppsQuota * D : null;
    const pipelineGap = neededPipeline != null && a4 ? Math.max(0, neededPipeline - (+pipeline || 0)) : null;
    const cycleWeeks = { "Under 30 days": 44, "1 to 3 months": 40, "3 to 6 months": 34, "6+ months": 28 }[salesCycle];
    const weeklyOpps = oppsQuota != null && cycleWeeks ? Math.max(1, Math.ceil(oppsQuota / cycleWeeks)) : null;
    const TERRITORIES = ["Enterprise", "Mid-Market", "SMB", "Named Accounts", "Geographic Territory", "Vertical Focus"];
    const toggleTerr = (t) => setTerritoryFocus((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    return (
      <div className="bs-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="cf-top">
          <button className="ob-back" onClick={() => goFlow("create_account")}>← Back</button>
          <div className="cf-step">Question {currentQ} of 5</div>
        </div>
        <div className="bs-screen">
          <div className="bs-pill">🥕 Working toward: {carrotAnswer || "Your goal"}</div>
          <h1 className="bs-h1">Build Your Strategy With Coach</h1>
          <div className="bs-prog">Question {currentQ} of 5</div>
          <div className="bs-cols">
            <div>
              <div className="bs-q">
                <div className="bs-q-num">Question 1</div>
                <div className="bs-q-label">What is your average deal size?</div>
                <div className="bs-q-hint">Your typical contract value when you close a deal</div>
                <div className="bs-inp-money"><span>$</span><input type="number" value={dealSize} onChange={(e) => setDealSize(e.target.value)} placeholder="0" /></div>
              </div>
              {a1 && (
                <div className="bs-q">
                  <div className="bs-q-num">Question 2</div>
                  <div className="bs-q-label">How long is your typical sales cycle?</div>
                  <div className="bs-pills">
                    {["Under 30 days", "1 to 3 months", "3 to 6 months", "6+ months"].map((o) => (
                      <button key={o} className={`bs-opt ${salesCycle === o ? "on" : ""}`} onClick={() => setSalesCycle(o)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}
              {a2 && (
                <div className="bs-q">
                  <div className="bs-q-num">Question 3</div>
                  <div className="bs-q-label">What is your typical close rate?</div>
                  <div className="bs-q-hint">Out of every 10 opportunities how many do you typically close?</div>
                  <div className="bs-slider-val">{closeRate}%</div>
                  <input className="bs-slider" type="range" min="1" max="100" value={closeRate} onChange={(e) => { setCloseRate(+e.target.value); setCloseRateSet(true); }} />
                </div>
              )}
              {a3 && (
                <div className="bs-q">
                  <div className="bs-q-num">Question 4</div>
                  <div className="bs-q-label">How much open pipeline do you currently have?</div>
                  <div className="bs-q-hint">Total value of all your active opportunities right now</div>
                  <div className="bs-inp-money"><span>$</span><input type="number" value={pipeline} onChange={(e) => setPipeline(e.target.value)} placeholder="0" /></div>
                </div>
              )}
              {a4 && (
                <div className="bs-q">
                  <div className="bs-q-num">Question 5</div>
                  <div className="bs-q-label">What is your territory focus?</div>
                  <div className="bs-q-hint">Select all that apply</div>
                  <div className="bs-pills">
                    {TERRITORIES.map((t) => (
                      <button key={t} className={`bs-opt ${territoryFocus.includes(t) ? "on" : ""}`} onClick={() => toggleTerr(t)}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bs-strat">
              <div className="bs-strat-h">Your Strategy Taking Shape</div>
              <div className="bs-strat-row">
                <div className="bs-strat-k">Opportunities to hit quota</div>
                {oppsQuota != null ? <div className="bs-strat-v">{oppsQuota}</div> : <div className="bs-strat-v pending">Answer Q1 and Q3</div>}
              </div>
              <div className="bs-strat-row">
                <div className="bs-strat-k">Opportunities to hit stretch (125%)</div>
                {oppsStretch != null ? <div className="bs-strat-v">{oppsStretch}</div> : <div className="bs-strat-v pending">Answer Q1 and Q3</div>}
              </div>
              <div className="bs-strat-row">
                <div className="bs-strat-k">Pipeline gap</div>
                {pipelineGap != null ? <div className="bs-strat-v">{pipelineGap > 0 ? fmt(pipelineGap) : "You are covered"}</div> : <div className="bs-strat-v pending">Answer Q4</div>}
              </div>
              <div className="bs-strat-row">
                <div className="bs-strat-k">Recommended weekly activities</div>
                {weeklyOpps != null ? <div className="bs-strat-v">~{weeklyOpps} new opps / week</div> : <div className="bs-strat-v pending">Answer Q2</div>}
              </div>
            </div>
          </div>

          {a5 && (
            <div className="bs-done">
              <div className="bs-done-t">✓ Coach has everything needed to build your success plan.</div>
              <button className="cf-cta" onClick={() => goFlow("dashboard")}>Go to My Dashboard →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── fallback: any unknown screen returns home ──
  return (
    <div className="ob">
      <style>{S}</style>
      <style>{OB_STYLES}</style>
      <div className="ob-screen">
        <button className="ob-btn" onClick={() => goFlow("landing")}>Back to home</button>
      </div>
    </div>
  );
}

const MANAGER_EMAIL_BODY = `Hi [Manager Name],

I found a sales productivity tool called Earn The Carrot that I believe will help me perform at a higher level this year.

The platform analyzes my compensation plan, helps me understand my earning potential, builds a personalized action plan, and keeps me focused on the activities that drive results.

The annual cost is $99 and qualifies as a sales productivity and performance tool. If approved, I will submit the expense through our normal reimbursement process. The invoice clearly describes the tool as an AI powered sales planning and productivity solution.

Thank you,
[Your Name]`;

const CompIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21"/>
    <rect x="4" y="13" width="3.5" height="8" rx="0.5"/>
    <rect x="10.25" y="8" width="3.5" height="13" rx="0.5"/>
    <rect x="16.5" y="4" width="3.5" height="17" rx="0.5"/>
    <polyline points="4 15 8 10 12 12.5 17 5.5" strokeWidth="1.75"/>
    <circle cx="17" cy="5.5" r="1.25" fill="#F4711A" stroke="none"/>
  </svg>
);

const StrategyIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1.5"/>
    <line x1="7.5" y1="3" x2="7.5" y2="21" strokeWidth="1"/>
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1"/>
    <line x1="16.5" y1="3" x2="16.5" y2="21" strokeWidth="1"/>
    <line x1="3" y1="7.5" x2="21" y2="7.5" strokeWidth="1"/>
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1"/>
    <line x1="3" y1="16.5" x2="21" y2="16.5" strokeWidth="1"/>
    <rect x="3" y="3" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="12" y="3" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="7.5" y="7.5" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="16.5" y="7.5" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="3" y="12" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="12" y="12" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="7.5" y="16.5" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
    <rect x="16.5" y="16.5" width="4.5" height="4.5" fill="rgba(244,113,26,0.35)" stroke="none"/>
  </svg>
);

const PerformanceIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6.5"/>
    <circle cx="12" cy="12" r="3.5"/>
    <circle cx="12" cy="12" r="1.5" fill="#F4711A" stroke="none"/>
  </svg>
);

const MotivationIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 20 8 12 12 16 16 8 21 4"/>
    <line x1="21" y1="4" x2="21" y2="9"/>
    <line x1="21" y1="4" x2="16" y2="4"/>
    <circle cx="3" cy="20" r="1.5" fill="rgba(244,113,26,0.3)" stroke="#F4711A"/>
    <circle cx="21" cy="4" r="1.5" fill="#F4711A" stroke="none"/>
  </svg>
);

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <button className={className} onClick={handleCopy}>
      {copied ? "✓ Copied!" : "Copy to clipboard"}
    </button>
  );
}

// ── ANALYZING SCREEN ──────────────────────────────────────────────────
const AZ_STYLES = `
.az-wrap{min-height:100vh;background:#0F0A05;color:white;display:flex;align-items:center;justify-content:center;padding:40px 24px;}
.az-inner{max-width:560px;width:100%;text-align:center;animation:fadeUp 0.4s ease;}
.az-carrot{font-size:83px;line-height:1;display:inline-block;margin-bottom:24px;animation:bounce 2s ease-in-out infinite;}
.az-title{font-family:'Playfair Display',serif;font-size:35px;font-weight:900;color:white;margin-bottom:36px;}
.az-stages{display:flex;flex-direction:column;gap:14px;text-align:left;margin-bottom:34px;}
.az-stage{display:flex;align-items:center;gap:14px;opacity:0.4;transition:opacity 0.4s ease;}
.az-stage.active,.az-stage.done{opacity:1;}
.az-marker{width:24px;height:24px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.az-dot{width:18px;height:18px;border-radius:50%;border:3px solid rgba(244,113,26,0.25);border-top-color:#F4711A;animation:azspin 0.8s linear infinite;}
.az-stage.pending .az-dot{border:3px solid rgba(255,255,255,0.15);animation:none;}
.az-check{color:#86EFAC;font-size:23px;font-weight:800;}
.az-stage-text{font-size:18px;color:rgba(255,255,255,0.9);}
.az-bar{height:8px;background:rgba(255,255,255,0.12);border-radius:5px;overflow:hidden;}
.az-bar-fill{height:100%;background:linear-gradient(90deg,#E9C46A,#F4711A);border-radius:5px;transition:width 0.15s linear;}
@keyframes azspin{to{transform:rotate(360deg);}}
`;

function AnalyzingScreen({ onDone }) {
  const STAGES = [
    "Reading your compensation structure...",
    "Identifying accelerators and bonuses...",
    "Calculating your earnings scenarios...",
    "Building your insights...",
  ];
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 3000);
    const t2 = setTimeout(() => setStage(2), 6000);
    const t3 = setTimeout(() => setStage(3), 9000);
    const finish = setTimeout(() => onDone(), 12000);
    let pct = 0;
    const iv = setInterval(() => { pct = Math.min(100, pct + 100 / 120); setProgress(pct); }, 100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(finish); clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="az-wrap">
      <style>{S}</style>
      <style>{AZ_STYLES}</style>
      <div className="az-inner">
        <div className="az-carrot">🥕</div>
        <h1 className="az-title">Coach is reading your plan...</h1>
        <div className="az-stages">
          {STAGES.map((label, i) => {
            const state = i < stage ? "done" : i === stage ? "active" : "pending";
            return (
              <div key={i} className={`az-stage ${state}`}>
                <span className="az-marker">
                  {state === "done" ? <span className="az-check">✓</span> : <span className="az-dot" />}
                </span>
                <span className="az-stage-text">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="az-bar"><div className="az-bar-fill" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}

function CarrotImageBox({ image, onImageChange }) {
  const [mode, setMode] = useState(null);
  const [urlVal, setUrlVal] = useState("");
  const [aiVal, setAiVal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  async function handleAI() {
    if (!aiVal.trim()) return;
    setAiLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    onImageChange(`https://placehold.co/600x300/F4711A/white?text=${encodeURIComponent(aiVal)}`);
    setAiLoading(false); setMode(null); setAiVal("");
  }
  function handleFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { onImageChange(ev.target.result); setMode(null); };
    r.readAsDataURL(f);
  }
  return (
    <div>
      <div className={`cib-box ${image ? "has" : ""}`}>
        {image
          ? <img src={image} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
          : <div style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}><div style={{ fontSize: 33, marginBottom: 6 }}>🥕</div><div style={{ fontSize: 16 }}>Add a photo of what you are working toward</div></div>}
      </div>
      {!mode && !aiLoading && (
        <div className="cib-grid">
          <button className="cib-btn" onClick={() => setMode("url")}><span style={{ fontSize: 18 }}>🔗</span>Paste a URL</button>
          <label className="cib-btn"><span style={{ fontSize: 18 }}>📸</span>Upload Photo<input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} /></label>
          <button className="cib-btn" onClick={() => setMode("ai")}><span style={{ fontSize: 18 }}>✨</span>Describe It</button>
        </div>
      )}
      {mode === "url" && (
        <div className="cib-row">
          <input className="cib-inp" placeholder="Paste image URL..." value={urlVal} onChange={(e) => setUrlVal(e.target.value)} autoFocus />
          <button className="cib-add" onClick={() => { if (urlVal.trim()) { onImageChange(urlVal.trim()); setMode(null); setUrlVal(""); } }}>Add</button>
          <button className="cib-cancel" onClick={() => setMode(null)}>Cancel</button>
        </div>
      )}
      {mode === "ai" && !aiLoading && (
        <div className="cib-row">
          <input className="cib-inp" placeholder='e.g. "Family vacation in Hawaii"' value={aiVal} onChange={(e) => setAiVal(e.target.value)} autoFocus />
          <button className="cib-add" onClick={handleAI}>Generate ✨</button>
          <button className="cib-cancel" onClick={() => setMode(null)}>Cancel</button>
        </div>
      )}
      {aiLoading && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--carrot-light)", borderRadius: 12, fontSize: 16, color: "var(--carrot-dark)", marginTop: 10 }}><span style={{ display: "inline-block", animation: "azspin 1s linear infinite" }}>🥕</span> Generating your carrot image...</div>}
    </div>
  );
}

function CarrotImageFinder({ answer }) {
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const find = () => {
    setErr(false);
    setImg(null);
    setLoading(true);
    setTimeout(() => {
      const q = encodeURIComponent(answer.split(" ").slice(0, 3).join(","));
      setImg(`https://source.unsplash.com/600x400/?${q}`);
      setLoading(false);
    }, 2000);
  };
  if (!answer.trim()) return null;
  if (!img) {
    return (
      <>
        <button className="rpm-findbtn" disabled={loading} onClick={find}>
          {loading
            ? <><span style={{ animation: "azspin 1s linear infinite", display: "inline-block" }}>🥕</span> Finding your image...</>
            : "Find My Image 🥕"}
        </button>
        <div className="rpm-findhint">Coach will find a photo that matches your goal</div>
      </>
    );
  }
  return (
    <>
      <div className="rpm-imgbox">
        {!err && <img src={img} alt={answer} onError={() => setErr(true)} />}
        {err && <div className="rpm-imgbox-fallback">{answer}</div>}
      </div>
      <div className="rpm-imgcap">{answer}</div>
      <button className="rpm-retry" onClick={find}>Not quite? Try again</button>
    </>
  );
}
