// STYLE RULE: No hyphens or em dashes used as pauses in visible text.
// Use periods or commas instead. Numeric ranges like 10-15 are fine.
import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart, Label } from "recharts";

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
body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--ink);}

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
  font-family:'Playfair Display',serif;font-size:22px;font-weight:900;
  color:var(--carrot);cursor:pointer;background:none;border:none;
}
.nav-links{display:flex;align-items:center;gap:32px;}
.nav-link{
  color:rgba(255,255,255,0.65);font-size:17px;font-weight:500;
  cursor:pointer;transition:color 0.2s;background:none;border:none;
  font-family:'DM Sans',sans-serif;text-decoration:none;
}
.nav-link:hover{color:white;}
.nav-cta{
  background:var(--carrot);color:white;border:none;border-radius:100px;
  padding:10px 22px;font-size:16px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all 0.2s;
}
.nav-cta:hover{background:var(--carrot-dark);transform:translateY(-1px);box-shadow:0 6px 20px rgba(244,113,26,0.35);}

/* ── HERO ── */
.hero{background:var(--dark);padding:88px 24px 100px;text-align:center;}
.hero-badge{
  display:inline-flex;align-items:center;
  background:rgba(244,113,26,0.15);border:1px solid rgba(244,113,26,0.3);
  border-radius:100px;padding:6px 18px;font-size:17px;font-weight:700;
  color:#FDBA74;letter-spacing:0.5px;margin-bottom:28px;
}
.hero-carrot{
  font-size:82px;line-height:1;display:inline-block;
  margin-bottom:28px;animation:bounce 2.2s ease-in-out infinite;
}
.hero-title{
  font-family:'Playfair Display',serif;font-size:66px;font-weight:900;
  color:white;line-height:1.06;
  max-width:820px;margin:0 auto 24px;
}
.hero-title .hl{color:var(--carrot);}
.hero-sub{
  font-size:26px;color:rgba(255,255,255,0.6);line-height:1.5;
  max-width:560px;margin:0 auto 36px;
}
.hero-cta{
  display:inline-block;background:var(--carrot);color:white;border:none;
  border-radius:100px;padding:18px 42px;font-size:19px;font-weight:700;
  cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;
  margin-bottom:24px;
}
.hero-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.hero-hint{font-size:19px;color:rgba(255,255,255,0.65);line-height:1.8;}

/* ── CARROTS SECTION ── */
.carrots-section{background:var(--cream);padding:96px 24px;}
.sec-inner{max-width:900px;margin:0 auto;}
.sec-label{
  font-family:'Playfair Display',serif;font-size:30px;font-weight:700;
  color:var(--carrot);margin-bottom:8px;
}
.sec-title{
  font-family:'Playfair Display',serif;font-size:42px;font-weight:900;
  color:var(--ink);margin-bottom:40px;line-height:1.15;
}
.carrot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;}
.carrot-card{
  background:white;border:1.5px solid var(--border);border-radius:16px;
  padding:20px;display:flex;align-items:center;gap:14px;transition:all 0.2s;
}
.carrot-card:hover{border-color:var(--carrot);transform:translateY(-2px);box-shadow:0 6px 20px rgba(244,113,26,0.1);}
.carrot-card-emoji{font-size:26px;flex-shrink:0;}
.carrot-card-text{font-size:17px;font-weight:600;color:var(--ink);}
.carrots-p1{font-size:19px;color:var(--muted);line-height:1.65;margin-bottom:18px;}
.carrots-p2{font-size:21px;font-weight:700;color:var(--ink);line-height:1.55;margin-bottom:40px;}
.activities-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;}
.ac-step{font-size:17px;font-weight:600;color:var(--ink);}
.ac-step.last{color:var(--carrot);font-weight:800;}
.ac-arrow{color:var(--carrot);font-size:17px;font-weight:700;padding:0 6px;}

/* ── PROBLEM SECTION ── */
.problem-section{background:var(--dark2);padding:96px 24px;}
.problem-inner{max-width:960px;margin:0 auto;}
.prob-label{
  font-family:'Playfair Display',serif;font-size:30px;font-weight:700;
  color:var(--carrot);margin-bottom:8px;
}
.prob-title{
  font-family:'Playfair Display',serif;font-size:46px;font-weight:900;
  color:white;margin-bottom:40px;line-height:1.12;
}
.prob-lines{margin-bottom:36px;}
.prob-line{font-size:21px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:12px;}
.prob-line.bold{font-weight:700;color:white;font-size:22px;}
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
.prob-bottom-bold{font-size:21px;font-weight:700;color:white;margin-bottom:10px;}
.prob-bottom-muted{font-size:18px;color:rgba(255,255,255,0.5);line-height:1.65;}
.prob-sub{font-size:19px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:36px;}
.prob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:28px;}
.prob-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;}
.prob-card.highlight{border-left:3px solid var(--carrot);}
.prob-card-label{font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;}
.prob-card-label.orange{color:var(--carrot);}
.prob-card-label.red{color:#FCA5A5;}
.prob-card-line{font-size:17px;color:rgba(255,255,255,0.8);line-height:1.5;margin-bottom:10px;display:flex;gap:8px;align-items:flex-start;}
.prob-card-note{font-size:15px;color:rgba(255,255,255,0.45);line-height:1.6;margin-top:14px;}
.prob-final{background:rgba(15,10,5,0.6);border:1.5px solid rgba(244,113,26,0.4);border-radius:20px;padding:32px;text-align:center;}
.prob-final-title{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:white;margin-bottom:12px;}
.prob-final-sub{font-size:19px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:20px;}
.prob-final-line{font-size:16px;color:rgba(255,255,255,0.45);line-height:1.8;}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .lnav{padding:14px 20px;}
  .nav-links{display:none;}
  .hero-title{font-size:40px;}
  .hero-sub{font-size:21px;}
  .sec-title{font-size:32px;}
  .prob-title{font-size:34px;}
  .carrot-grid{grid-template-columns:repeat(2,1fr);}
  .prob-grid{grid-template-columns:1fr;}
}
@media(max-width:480px){
  .hero{padding:60px 20px 72px;}
  .hero-title{font-size:40px;}
  .hero-sub{font-size:19px;}
  .carrots-section,.problem-section{padding:64px 20px;}
  .carrot-grid{grid-template-columns:1fr;}
  .prob-title{font-size:30px;}
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
.ob-back{background:white;border:1.5px solid var(--border);border-radius:100px;padding:7px 16px;font-size:16px;font-weight:600;color:var(--muted);cursor:pointer;font-family:'DM Sans',sans-serif;}
.ob-back:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-progress{flex:1;display:flex;gap:6px;align-items:center;justify-content:center;}
.ob-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all 0.3s;}
.ob-dot.active{background:var(--carrot);width:26px;border-radius:4px;}
.ob-dot.done{background:var(--green);}
.ob-steplbl{font-size:15px;font-weight:700;color:var(--muted);min-width:48px;text-align:right;}
.ob-screen{max-width:560px;margin:0 auto;padding:34px 20px 70px;animation:fadeUp 0.35s ease;}
.ob-eyebrow{font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--carrot);margin-bottom:8px;}
.ob-h1{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:var(--ink);margin-bottom:8px;line-height:1.15;}
.ob-subt{font-size:17px;color:var(--muted);line-height:1.55;margin-bottom:26px;}
.ob-field{margin-bottom:18px;}
.ob-label{display:block;font-size:15px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.ob-inp{width:100%;padding:13px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:18px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);}
.ob-inp:focus{outline:none;border-color:var(--carrot);}
select.ob-inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A6A55' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}
.ob-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.ob-btn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:19px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;margin-top:10px;}
.ob-btn:hover{background:var(--carrot-dark);}
.ob-btn:disabled{opacity:0.4;cursor:not-allowed;}
.ob-card{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:16px;}
.ob-note{background:var(--green-light);border:1px solid var(--green);border-radius:12px;padding:12px 16px;font-size:15px;color:var(--green);line-height:1.5;margin-bottom:20px;display:flex;gap:10px;}
.ob-drop{border:2px dashed var(--border);border-radius:18px;padding:44px 24px;text-align:center;cursor:pointer;background:white;transition:all 0.2s;margin-bottom:16px;}
.ob-drop:hover{border-color:var(--carrot);background:var(--carrot-light);}
.ob-drop.has{border-style:solid;border-color:var(--green);background:var(--green-light);}
.ob-coach{background:linear-gradient(145deg,#0F0A05,#2D1A0A);border-radius:20px;padding:22px;color:white;margin-bottom:18px;}
.ob-coach-badge{display:inline-block;font-size:13px;font-weight:700;padding:3px 10px;border-radius:100px;background:rgba(244,113,26,0.25);color:#FDBA74;margin-bottom:12px;}
.ob-coach-line{font-size:16px;line-height:1.65;color:rgba(255,255,255,0.85);margin-bottom:8px;}
.ob-coach-line:last-child{margin-bottom:0;}
.ob-ote{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:20px;padding:26px;color:white;margin-bottom:18px;text-align:center;}
.ob-ote-lbl{font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.85;margin-bottom:6px;}
.ob-ote-val{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;line-height:1;}
.ob-split{display:flex;gap:12px;margin-top:18px;}
.ob-split-item{flex:1;background:rgba(255,255,255,0.16);border-radius:12px;padding:12px;}
.ob-split-k{font-size:13px;opacity:0.85;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.ob-split-v{font-size:20px;font-weight:800;}
.ob-stat{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid var(--border);}
.ob-stat:last-child{border-bottom:none;}
.ob-stat-lbl{font-size:16px;color:var(--muted);}
.ob-stat-sub{font-size:13px;color:var(--muted);opacity:0.8;}
.ob-stat-val{font-size:19px;font-weight:700;color:var(--ink);text-align:right;}
.ob-stat-val.green{color:var(--green);}
.ob-stat-val.red{color:#DC2626;}
.ob-tabs{display:flex;gap:6px;background:var(--cream);border:1.5px solid var(--border);border-radius:14px;padding:5px;margin-bottom:22px;}
.ob-tab{flex:1;padding:11px 6px;border:none;background:none;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;color:var(--muted);}
.ob-tab.on{background:white;color:var(--carrot);box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.ob-slider{width:100%;accent-color:var(--carrot);cursor:pointer;margin:8px 0 4px;}
.ob-target{font-family:'Playfair Display',serif;font-size:56px;font-weight:900;color:var(--carrot);text-align:center;line-height:1;}
.ob-target-sub{text-align:center;font-size:15px;color:var(--muted);margin-bottom:10px;}
.ob-add{width:100%;padding:13px;border:2px dashed var(--border);border-radius:14px;background:white;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--muted);font-size:16px;}
.ob-add:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-add:disabled{opacity:0.45;cursor:not-allowed;}
.ob-del{background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;line-height:1;}
.ob-del:hover{color:#DC2626;}
.ob-pill-row{display:flex;gap:8px;flex-wrap:wrap;}
.ob-pill{padding:8px 14px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.ob-pill.on{border-color:var(--carrot);background:var(--carrot);color:white;}
.ob-toggle{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:16px;color:var(--ink);font-weight:600;}
.ob-track{width:44px;height:25px;border-radius:100px;background:var(--border);position:relative;transition:all 0.2s;flex-shrink:0;}
.ob-track.on{background:var(--green);}
.ob-knob{position:absolute;top:2.5px;left:2.5px;width:20px;height:20px;border-radius:50%;background:white;transition:all 0.2s;}
.ob-track.on .ob-knob{left:21.5px;}
.ob-opt{border:2px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;background:white;margin-bottom:10px;transition:all 0.2s;}
.ob-opt:hover{border-color:var(--carrot);}
.ob-opt.on{border-color:var(--carrot);background:var(--carrot-light);}
.ob-money-line{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:12px;background:rgba(244,113,26,0.1);border:1px solid rgba(244,113,26,0.3);margin-bottom:14px;}
.ob-money-line .v{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:var(--carrot-dark);}
.ob-sec-h{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin:26px 0 4px;}
.ob-sec-sub{font-size:15px;color:var(--muted);margin-bottom:14px;line-height:1.5;}
/* dashboard */
.ob-dash{max-width:560px;margin:0 auto;padding:20px 16px 170px;animation:fadeUp 0.35s ease;}
.ob-dash-hero{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:22px;padding:26px;color:white;margin-bottom:20px;position:relative;overflow:hidden;}
.ob-dash-hero::after{content:'🥕';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:74px;opacity:0.13;}
.ob-dash-name{font-size:16px;opacity:0.9;margin-bottom:6px;}
.ob-dash-pct{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;line-height:1;}
.ob-prog-bar{height:12px;background:var(--border);border-radius:6px;overflow:hidden;margin:8px 0 6px;}
.ob-prog-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot));border-radius:6px;transition:width 0.6s ease;}
.ob-metric{background:white;border:1.5px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;}
.ob-metric-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.ob-status{font-size:13px;font-weight:700;padding:3px 10px;border-radius:100px;}
.st-stretch{background:var(--green-light);color:var(--green);}
.st-floor{background:#EFF6FF;color:#1D4ED8;}
.st-below{background:#FEE2E2;color:#DC2626;}
.ob-carrotbar{position:fixed;bottom:62px;left:0;right:0;z-index:60;background:linear-gradient(135deg,#1A1208,#2D1A0A);color:white;padding:10px 16px;border-top:1px solid rgba(244,113,26,0.25);}
.ob-carrotbar-inner{max-width:560px;margin:0 auto;}
.ob-cb-top{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:rgba(255,255,255,0.7);}
.ob-cb-amt{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:var(--carrot);}
.ob-cb-track{height:8px;background:rgba(255,255,255,0.15);border-radius:5px;overflow:hidden;margin-top:6px;}
.ob-cb-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot),var(--green));border-radius:5px;transition:width 0.6s ease;}
.ob-tabbar{position:fixed;bottom:0;left:0;right:0;z-index:70;display:flex;background:rgba(255,250,244,0.98);backdrop-filter:blur(10px);border-top:1px solid var(--border);}
.ob-tabbar-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 11px;border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.ob-tabbar-tab.on{color:var(--carrot);}
.ob-tabbar-ico{font-size:21px;line-height:1;}
.ob-tabbar-lbl{font-size:13px;font-weight:700;}
/* summary — comp fields */
.ob-card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.ob-card-title{font-size:17px;font-weight:700;color:var(--ink);}
.ob-badge-green{background:var(--green-light);color:var(--green);font-size:13px;font-weight:700;padding:4px 12px;border-radius:100px;}
.ob-frow{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);}
.ob-frow:last-child{border-bottom:none;}
.ob-fname{flex:1;font-size:16px;color:var(--ink);font-weight:600;}
.ob-fval{font-size:18px;font-weight:700;color:var(--ink);}
.ob-ebtn{background:none;border:1.5px solid var(--border);border-radius:8px;padding:5px 12px;font-size:15px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;}
.ob-ebtn:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-erow{display:flex;gap:8px;align-items:center;}
.ob-einp{width:120px;padding:8px 12px;border:1.5px solid var(--carrot);border-radius:8px;font-size:17px;font-family:'DM Sans',sans-serif;color:var(--ink);}
.ob-einp:focus{outline:none;}
.ob-save{background:var(--carrot);color:white;border:none;border-radius:8px;padding:8px 14px;font-weight:700;font-size:15px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.ob-cancel{background:none;border:none;color:var(--muted);font-size:15px;cursor:pointer;font-family:'DM Sans',sans-serif;}
/* summary — tax box */
.ob-tax{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:20px;padding:24px;margin-bottom:20px;}
.ob-tax-title{font-size:18px;font-weight:800;color:#1D4ED8;margin-bottom:8px;}
.ob-tax-note{font-size:15px;color:#3B5BA5;line-height:1.5;margin-bottom:16px;}
.ob-tax-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #BFDBFE;gap:10px;}
.ob-tax-row:last-child{border-bottom:none;}
.ob-tax-lbl{font-size:16px;color:#1E3A8A;font-weight:600;}
.ob-tax-sub{font-size:13px;color:#3B5BA5;margin-top:2px;}
.ob-tax-val{font-size:17px;font-weight:700;color:#1E3A8A;text-align:right;}
.ob-tax-override{background:none;border:none;color:#1D4ED8;font-size:14px;font-weight:700;cursor:pointer;text-decoration:underline;font-family:'DM Sans',sans-serif;padding:0;margin-top:2px;}
.ob-tax-total{display:flex;align-items:center;justify-content:space-between;background:white;border-radius:12px;padding:14px 16px;margin-top:14px;}
.ob-tax-total-v{font-size:18px;font-weight:800;color:#1E3A8A;text-align:right;}
/* summary — 401k box */
.ob-401k{background:var(--green-light);border:1.5px solid var(--green);border-radius:16px;padding:18px 20px;margin-bottom:20px;}
.ob-401k-msg{font-size:17px;font-weight:700;color:var(--green);margin-bottom:6px;}
.ob-401k-sub{font-size:15px;color:#2D6A4F;opacity:0.9;line-height:1.5;}
/* confirm screen */
.cf-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.cf-top{position:sticky;top:0;z-index:50;background:rgba(255,250,244,0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;padding:14px 20px;}
.cf-step{font-size:13px;font-weight:700;color:var(--muted);}
.cf-screen{max-width:600px;margin:0 auto;padding:30px 20px 90px;animation:fadeUp 0.35s ease;}
.cf-h1{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:var(--ink);margin-bottom:24px;line-height:1.15;}
.cf-card{background:white;border:1.5px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:20px;}
.cf-card-hdr{padding:18px 20px;border-bottom:1px solid var(--border);background:var(--cream);}
.cf-card-title{font-size:16px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;}
.cf-card-sub{font-size:13px;color:var(--muted);margin-top:4px;}
.cf-badge{font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;}
.cf-badge.green{background:var(--green-light);color:var(--green);}
.cf-row{display:flex;align-items:flex-start;gap:14px;padding:14px 20px;border-bottom:1px solid var(--border);}
.cf-row:last-child{border-bottom:none;}
.cf-row-body{flex:1;min-width:0;}
.cf-row-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.cf-row-val{font-size:18px;font-weight:700;color:var(--ink);}
.cf-row-val.missing{font-size:14px;font-weight:500;font-style:italic;color:var(--carrot);}
.cf-tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:100px;margin-top:5px;}
.cf-tag.found{background:var(--green-light);color:var(--green);}
.cf-tag.verify{background:#FFF9E6;color:#7A5C00;}
.cf-ebtn{flex-shrink:0;background:none;border:1.5px solid var(--border);border-radius:10px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;}
.cf-ebtn:hover{border-color:var(--carrot);color:var(--carrot);}
.cf-edit{display:flex;gap:8px;align-items:center;margin-top:8px;}
.cf-einp{flex:1;min-width:0;padding:9px 12px;border:1.5px solid var(--carrot);border-radius:10px;font-size:16px;font-family:'DM Sans',sans-serif;color:var(--ink);}
.cf-einp:focus{outline:none;}
.cf-save{background:var(--carrot);color:white;border:none;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;}
.cf-cancel{background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.cf-q{padding:18px 20px;border-bottom:1px solid var(--border);}
.cf-q:last-child{border-bottom:none;}
.cf-q-label{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:4px;}
.cf-q-hint{font-size:13px;color:var(--muted);margin-bottom:10px;}
.cf-q-calc{font-size:13px;font-weight:700;color:var(--green);margin-top:8px;}
.cf-info{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:16px;padding:16px 20px;font-size:14px;color:#1E3A8A;line-height:1.6;margin-bottom:20px;}
.cf-cta{width:100%;padding:18px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:17px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.cf-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.cf-cta:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
/* real pay motivation screen */
.rpm-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.rpm-screen{max-width:600px;margin:0 auto;padding:30px 20px 90px;animation:fadeUp 0.35s ease;}
.rpm-h1{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:var(--ink);margin-bottom:24px;line-height:1.15;}
.rpm-dark{background:#0F0A05;border-radius:24px;padding:28px;margin-bottom:24px;}
.rpm-eyebrow{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--carrot);margin-bottom:10px;}
.rpm-dark-h{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:white;line-height:1.2;margin-bottom:8px;}
.rpm-dark-sub{font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:22px;line-height:1.5;}
.rpm-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.rpm-mcard{background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;}
.rpm-mcard.quota{border-color:var(--carrot);}
.rpm-mcard.stretch{border-color:#86EFAC;}
.rpm-mpct{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:white;line-height:1;}
.rpm-mlabel{font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:14px;font-weight:600;}
.rpm-mline{margin-bottom:8px;}
.rpm-mk{font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
.rpm-mk.gross{color:rgba(255,255,255,0.55);}
.rpm-mk.net{color:#86EFAC;}
.rpm-mv{font-size:16px;font-weight:700;color:white;}
.rpm-mv.net{font-size:20px;font-weight:800;color:#86EFAC;}
.rpm-mbar{height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:12px;}
.rpm-mbar-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot));border-radius:3px;}
.rpm-stretchbox{background:rgba(244,113,26,0.12);border:1.5px solid rgba(244,113,26,0.35);border-radius:16px;padding:18px 20px;margin-top:18px;}
.rpm-stretchbox-big{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:#FDBA74;margin-bottom:4px;}
.rpm-stretchbox-sub{font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;}
.rpm-slider-pct{font-family:'Playfair Display',serif;font-size:44px;font-weight:900;color:var(--carrot);text-align:center;line-height:1;margin-bottom:22px;}
.rpm-nums{display:flex;justify-content:space-around;gap:16px;margin-bottom:24px;text-align:center;flex-wrap:wrap;}
.rpm-num{flex:1;min-width:130px;}
.rpm-num-k{font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px;}
.rpm-num-k.net{color:#86EFAC;}
.rpm-num-v{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:white;line-height:1;}
.rpm-num-v.net{font-size:38px;color:#86EFAC;}
.rpm-num-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:8px;line-height:1.4;}
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
.rpm-marker-pct{font-size:13px;font-weight:800;color:rgba(255,255,255,0.5);}
.rpm-marker-lbl{font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;margin-top:2px;white-space:nowrap;}
.rpm-marker.on .rpm-marker-pct,.rpm-marker.on .rpm-marker-lbl{color:var(--carrot);}
.rpm-carrot-sub{font-size:15px;color:#7A6A55;line-height:1.6;padding:0 20px 14px;}
.rpm-amt{color:var(--carrot);font-weight:800;}
.rpm-pad{padding:0 20px 20px;}
.rpm-input{width:100%;padding:16px 18px;border:1.5px solid #EDE0CC;border-radius:14px;font-size:18px;font-family:'DM Sans',sans-serif;color:#1A1208;background:white;}
.rpm-input:focus{outline:none;border-color:var(--carrot);}
.rpm-input::placeholder{color:#B0A090;}
.rpm-q-label{font-size:14px;font-weight:700;color:#1A1208;margin-bottom:8px;}
.rpm-q-hint{font-size:13px;color:#7A6A55;margin-top:6px;}
.rpm-money{display:flex;align-items:center;border:1.5px solid #EDE0CC;border-radius:14px;overflow:hidden;background:white;}
.rpm-money span{padding:0 4px 0 16px;color:#7A6A55;font-weight:700;font-size:18px;}
.rpm-money input{flex:1;min-width:0;border:none;background:transparent;padding:16px 16px 16px 4px;font-size:18px;font-family:'DM Sans',sans-serif;color:#1A1208;}
.rpm-money input:focus{outline:none;}
.rpm-money input::placeholder{color:#B0A090;}
.rpm-pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;}
.rpm-pill{padding:9px 16px;border-radius:100px;border:1.5px solid #EDE0CC;background:white;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:#7A6A55;}
.rpm-pill:hover{border-color:var(--carrot);color:var(--carrot);}
.rpm-pill.on{background:var(--carrot);border-color:var(--carrot);color:white;}
.rpm-img-label{font-size:13px;font-weight:700;color:#1A1208;margin:18px 0 10px;}
.rpm-findbtn{width:100%;background:white;border:1.5px solid var(--carrot);color:var(--carrot);border-radius:12px;padding:14px;font-weight:600;font-size:15px;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:18px;display:flex;align-items:center;justify-content:center;gap:8px;}
.rpm-findbtn:hover{background:var(--carrot-light);}
.rpm-findbtn:disabled{opacity:0.75;cursor:default;}
.rpm-findhint{font-size:13px;color:#7A6A55;text-align:center;margin-top:8px;}
.rpm-imgbox{position:relative;width:100%;height:200px;border-radius:16px;overflow:hidden;margin-top:18px;background:linear-gradient(135deg,#F4711A,#E9C46A,#2D6A4F);display:flex;align-items:center;justify-content:center;}
.rpm-imgbox img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.rpm-imgbox-fallback{position:relative;z-index:1;color:white;font-weight:800;font-size:18px;text-align:center;padding:16px;text-shadow:0 1px 4px rgba(0,0,0,0.4);}
.rpm-imgcap{text-align:center;color:var(--carrot);font-weight:700;font-size:14px;margin-top:10px;}
.rpm-retry{display:block;margin:6px auto 0;background:none;border:none;color:#7A6A55;font-size:13px;cursor:pointer;text-decoration:underline;font-family:'DM Sans',sans-serif;}
.rpm-goals{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;}
.rpm-goal{background:white;border:1px solid #EDE0CC;border-radius:20px;padding:24px;text-align:center;}
.rpm-goal.target{border-top:3px solid var(--carrot);}
.rpm-goal.stretch{border-top:3px solid var(--green);}
.rpm-goal-lbl{font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;}
.rpm-goal.target .rpm-goal-lbl{color:var(--carrot);}
.rpm-goal.stretch .rpm-goal-lbl{color:var(--green);}
.rpm-goal-inrow{display:flex;align-items:baseline;justify-content:center;gap:6px;}
.rpm-goal-input{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;color:#1A1208;text-align:center;border:none;width:110px;background:transparent;padding:0;}
.rpm-goal-input:focus{outline:none;}
.rpm-goal-input::placeholder{color:#D8C8B0;}
.rpm-goal-suffix{font-size:14px;color:#7A6A55;font-weight:600;}
.rpm-lockbtn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:17px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:20px;}
.rpm-lockbtn:hover:not(:disabled){background:var(--carrot-dark);}
.rpm-lockbtn:disabled{opacity:0.4;cursor:not-allowed;}
.rpm-locked{background:var(--green-light);border:1.5px solid var(--green);border-radius:14px;padding:14px 18px;font-size:15px;font-weight:700;color:var(--green);text-align:center;margin-bottom:16px;}
.rpm-result{border-radius:14px;padding:16px 18px;margin-bottom:12px;font-size:15px;line-height:1.5;}
.rpm-result.target{background:rgba(244,113,26,0.08);border:1px solid rgba(244,113,26,0.25);color:#1A1208;}
.rpm-result.stretch{background:var(--green-light);border:1px solid rgba(45,106,79,0.3);color:#1A1208;}
.rpm-result-amt{font-family:'Playfair Display',serif;font-weight:900;font-size:24px;}
.rpm-result.target .rpm-result-amt{color:var(--carrot);}
.rpm-result.stretch .rpm-result-amt{color:var(--green);}
@media(max-width:600px){.rpm-goals{grid-template-columns:1fr;}}
.rpm-goldbox{background:var(--gold-light);border:1.5px solid var(--gold);border-radius:16px;padding:16px 20px;font-size:14px;color:#7A5C00;line-height:1.6;margin-bottom:20px;}
.rpm-card{background:white;border:1px solid #EDE0CC;border-radius:20px;overflow:hidden;margin-bottom:20px;}
.rpm-card-hdr{padding:18px 20px 0;}
.rpm-card-title{font-size:16px;font-weight:700;color:#1A1208;}
.rpm-explain{background:white;border:1px solid #EDE0CC;border-left:3px solid var(--carrot);border-radius:0 14px 14px 0;padding:24px;margin:20px 0;}
.rpm-explain-1{font-size:17px;color:#1A1208;line-height:1.7;margin-bottom:12px;}
.rpm-explain-2{font-size:17px;font-weight:700;color:#1A1208;line-height:1.7;margin-bottom:12px;}
.rpm-explain-3{font-size:15px;color:#7A6A55;line-height:1.7;}
.rpm-nudge{background:#FFF7ED;border:1.5px solid var(--carrot);border-radius:16px;padding:20px;margin-top:18px;}
.rpm-nudge-lbl{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);margin-bottom:10px;}
.rpm-nudge-txt{font-size:16px;font-style:italic;color:#1A1208;line-height:1.7;}
/* carrot image box */
.cib-box{border:2px dashed var(--border);border-radius:16px;min-height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--cream);overflow:hidden;}
.cib-box.has{border-style:solid;border-color:var(--carrot-light);}
.cib-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.cib-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 8px;border-radius:12px;border:1.5px solid var(--border);background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--muted);font-family:'DM Sans',sans-serif;}
.cib-btn:hover{border-color:var(--carrot);color:var(--carrot);}
.cib-row{display:flex;gap:8px;margin-top:10px;align-items:center;}
.cib-inp{flex:1;min-width:0;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;font-family:'DM Sans',sans-serif;}
.cib-inp:focus{outline:none;border-color:var(--carrot);}
.cib-add{background:var(--carrot);color:white;border:none;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;}
.cib-cancel{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;}
@keyframes azspin{to{transform:rotate(360deg);}}
/* create account screen */
.ca-wrap{min-height:100vh;background:var(--dark);color:white;font-family:'DM Sans',sans-serif;}
.ca-screen{max-width:760px;margin:0 auto;padding:30px 20px 90px;animation:fadeUp 0.35s ease;}
.ca-callout{background:rgba(244,113,26,0.12);border:1px solid rgba(244,113,26,0.35);border-radius:14px;padding:16px 20px;}
.ca-callout-c{font-size:16px;font-weight:700;color:#FDBA74;}
.ca-callout-sub{font-size:14px;color:rgba(255,255,255,0.65);margin-top:4px;line-height:1.5;}
.ca-h1{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:white;margin:18px 0 22px;line-height:1.15;}
.ca-plans{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
.ca-plan{cursor:pointer;}
.ca-plan.sel{box-shadow:0 0 0 3px rgba(244,113,26,0.5);}
.ca-form{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px;margin-bottom:20px;}
.ca-flabel{font-size:13px;font-weight:700;color:white;margin-bottom:6px;display:block;}
.ca-finp{width:100%;padding:13px 16px;border:1.5px solid rgba(255,255,255,0.2);border-radius:12px;font-size:16px;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.06);color:white;margin-bottom:16px;}
.ca-finp:focus{outline:none;border-color:var(--carrot);}
.ca-finp::placeholder{color:rgba(255,255,255,0.35);}
.ca-hint{font-size:13px;color:rgba(255,255,255,0.55);}
/* build strategy screen */
.bs-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.bs-screen{max-width:760px;margin:0 auto;padding:24px 20px 90px;animation:fadeUp 0.35s ease;}
.bs-pill{display:inline-flex;align-items:center;gap:6px;background:var(--carrot-light);color:var(--carrot-dark);border-radius:100px;padding:8px 16px;font-size:14px;font-weight:700;margin-bottom:16px;}
.bs-h1{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:var(--ink);margin-bottom:6px;line-height:1.15;}
.bs-prog{font-size:13px;font-weight:700;color:var(--muted);margin-bottom:20px;}
.bs-cols{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;align-items:start;}
.bs-q{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px;animation:fadeUp 0.4s ease;}
.bs-q-num{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);margin-bottom:6px;}
.bs-q-label{font-size:17px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.bs-q-hint{font-size:13px;color:var(--muted);margin-bottom:12px;}
.bs-inp-money{display:flex;align-items:center;border:1.5px solid var(--border);border-radius:12px;overflow:hidden;background:white;}
.bs-inp-money span{padding:0 4px 0 14px;color:var(--muted);font-weight:700;}
.bs-inp-money input{flex:1;min-width:0;border:none;padding:13px 14px 13px 4px;font-size:16px;font-family:'DM Sans',sans-serif;color:var(--ink);background:transparent;}
.bs-inp-money input:focus{outline:none;}
.bs-pills{display:flex;flex-wrap:wrap;gap:10px;}
.bs-opt{padding:9px 16px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.bs-opt:hover{border-color:var(--carrot);color:var(--carrot);}
.bs-opt.on{background:var(--carrot);border-color:var(--carrot);color:white;}
.bs-slider{width:100%;accent-color:var(--carrot);cursor:pointer;}
.bs-slider-val{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:var(--carrot);text-align:center;margin-bottom:6px;}
.bs-strat{background:#0F0A05;border-radius:18px;padding:22px;position:sticky;top:20px;}
.bs-strat-h{font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);margin-bottom:16px;}
.bs-strat-row{padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);}
.bs-strat-row:last-child{border-bottom:none;}
.bs-strat-k{font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:4px;}
.bs-strat-v{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:white;}
.bs-strat-v.pending{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:rgba(255,255,255,0.45);font-style:italic;}
.bs-done{background:var(--green-light);border:1.5px solid var(--green);border-radius:16px;padding:18px 20px;margin-top:20px;}
.bs-done-t{font-size:16px;font-weight:700;color:var(--green);margin-bottom:12px;}
@media(max-width:680px){.bs-cols{grid-template-columns:1fr;}.ca-plans{grid-template-columns:1fr;}.bs-strat{position:static;}}
/* upload screen */
.up-wrap{min-height:100vh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;}
.up-screen{max-width:600px;margin:0 auto;padding:30px 20px 90px;animation:fadeUp 0.35s ease;}
.up-h1{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;color:var(--ink);line-height:1.15;margin-bottom:12px;}
.up-sub{font-size:17px;color:var(--muted);line-height:1.6;max-width:500px;margin-bottom:26px;}
.up-zone{border:2px dashed var(--border);border-radius:20px;min-height:200px;background:white;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;cursor:pointer;transition:all 0.2s;}
.up-zone:hover{border-color:var(--carrot);background:var(--carrot-light);}
.up-zone-ico{font-size:48px;margin-bottom:12px;}
.up-zone-t{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.up-zone-s{font-size:15px;color:var(--muted);line-height:1.5;margin-bottom:10px;max-width:440px;margin-left:auto;margin-right:auto;}
.up-zone-hint{font-size:13px;color:var(--muted);margin-bottom:8px;}
.up-zone-link{font-size:14px;color:var(--carrot);font-weight:700;}
.up-list{margin-top:16px;display:flex;flex-direction:column;gap:8px;}
.up-file{display:flex;align-items:center;gap:12px;padding:12px 16px;background:white;border:1.5px solid var(--border);border-radius:12px;}
.up-file-ico{font-size:18px;flex-shrink:0;}
.up-file-name{flex:1;min-width:0;font-size:14px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.up-file-size{font-size:13px;color:var(--muted);flex-shrink:0;}
.up-file-x{flex-shrink:0;background:none;border:none;color:#DC2626;font-size:20px;line-height:1;cursor:pointer;padding:0 4px;}
.up-priv{display:flex;gap:10px;background:var(--green-light);border:1px solid var(--green);border-radius:14px;padding:16px;font-size:14px;color:var(--green);line-height:1.55;margin-top:20px;}
.up-next{background:var(--carrot-light);border:1.5px solid rgba(244,113,26,0.3);border-radius:14px;padding:16px;margin-top:12px;}
.up-next-t{font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--carrot-dark);margin-bottom:10px;}
.up-next-line{display:flex;gap:8px;font-size:14px;color:var(--ink);line-height:1.5;margin-bottom:6px;}
.up-next-line:last-child{margin-bottom:0;}
.up-next-num{color:var(--carrot);font-weight:800;flex-shrink:0;}
.up-cta{width:100%;padding:18px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:18px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;margin-top:24px;}
.up-cta:hover:not(:disabled){background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.up-cta:disabled{background:rgba(244,113,26,0.4);cursor:not-allowed;}
/* carrot bridge */
.cb-wrap{min-height:100vh;background:var(--dark);color:white;display:flex;align-items:center;justify-content:center;padding:40px 24px;}
.cb-inner{max-width:560px;width:100%;animation:fadeUp 0.4s ease;}
.cb-label{font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--carrot);margin-bottom:16px;}
.cb-headline{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;color:white;line-height:1.2;margin-bottom:14px;}
.cb-amt{color:var(--carrot);}
.cb-sub{font-size:19px;color:rgba(255,255,255,0.6);margin-bottom:28px;}
.cb-input{width:100%;padding:16px 18px;border:1.5px solid rgba(255,255,255,0.2);border-radius:14px;font-size:20px;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.06);color:white;margin-bottom:16px;}
.cb-input:focus{outline:none;border-color:var(--carrot);}
.cb-input::placeholder{color:rgba(255,255,255,0.35);}
.cb-pills{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:30px;}
.cb-pill{padding:9px 16px;border-radius:100px;border:1.5px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.8);font-size:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.cb-pill:hover{border-color:var(--carrot);color:white;}
.cb-pill.on{background:var(--carrot);border-color:var(--carrot);color:white;}
.cb-btn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:19px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.cb-btn:hover{background:var(--carrot-dark);}
.cb-btn:disabled{opacity:0.4;cursor:not-allowed;}
/* pitch */
.pitch-wrap{min-height:100vh;background:var(--dark);color:white;padding:48px 24px;}
.pitch-inner{max-width:560px;margin:0 auto;animation:fadeUp 0.4s ease;}
.pitch-carrot-callout{background:rgba(244,113,26,0.12);border:1px solid rgba(244,113,26,0.35);border-radius:14px;padding:14px 18px;font-size:17px;color:#FDBA74;font-weight:700;margin-bottom:24px;}
.pitch-headline{font-family:'Playfair Display',serif;font-size:34px;font-weight:900;color:white;line-height:1.2;margin-bottom:22px;}
.pitch-contrast{margin-bottom:24px;}
.pitch-mgr{font-size:18px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:10px;}
.pitch-coach{font-size:19px;font-weight:700;color:white;line-height:1.6;}
.pitch-checks{margin-bottom:28px;}
.pitch-check{display:flex;align-items:flex-start;gap:12px;padding:11px 0;font-size:17px;color:rgba(255,255,255,0.85);border-bottom:1px solid rgba(255,255,255,0.06);}
.pitch-check:last-child{border-bottom:none;}
.pitch-check-ico{color:#86EFAC;font-weight:800;flex-shrink:0;}
.pitch-cta{width:100%;padding:18px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:19px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.pitch-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.pitch-note{text-align:center;font-size:15px;color:rgba(255,255,255,0.45);margin-top:14px;}
@media(max-width:480px){.ob-row{grid-template-columns:1fr;}.cb-headline{font-size:29px;}.pitch-headline{font-size:28px;}}
`;

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [scrolled, setScrolled] = useState(false);

  // ── ONBOARDING STATE ──
  const [suName, setSuName]   = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suState, setSuState] = useState("");
  const [suAge, setSuAge]     = useState("Under 50");
  const [suPass, setSuPass]   = useState("");
  const [planFile, setPlanFile] = useState(null);
  const [planFiles, setPlanFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
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
  const startEdit = (f, v) => { setEditField(f); setEditVal(String(v)); };
  const saveComp = () => { setComp((c) => ({ ...c, [editField]: parseFloat(editVal) || 0 })); setEditField(null); };
  const saveTax = (key) => { setTaxOverrides((t) => ({ ...t, [key]: parseFloat(editVal) || 0 })); setEditField(null); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.history.replaceState({ screen: "landing" }, "");
    const onPop = (e) => setScreen(e.state && e.state.screen ? e.state.screen : "landing");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
          </div>
          <button className="nav-cta" onClick={() => goFlow("upload")} style={{ lineHeight: 1.2 }}>
            Start by Uploading<br />your Comp Plan
          </button>
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
          <button className="hero-cta" onClick={() => goFlow("upload")} style={{ lineHeight: 1.2 }}>
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
          .coach-quote{font-size:21px;font-style:italic;color:rgba(255,255,255,0.7);margin-bottom:12px;line-height:1.6;}
          .coach-coachsub{font-size:18px;color:rgba(255,255,255,0.5);margin-bottom:48px;}
          .coach-role-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px;}
          .coach-role-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;display:flex;gap:18px;align-items:flex-start;}
          .coach-role-icon{width:56px;height:56px;border-radius:50%;border:1.5px solid rgba(244,113,26,0.5);background:rgba(244,113,26,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
          .coach-role-body{flex:1;min-width:0;}
          .coach-role-head{display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;}
          .coach-role-title{font-size:18px;font-weight:700;color:white;display:inline-block;border-bottom:2px solid var(--carrot);padding-bottom:3px;}
          .coach-role-tag{font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);background:rgba(244,113,26,0.15);border-radius:100px;padding:3px 10px;}
          .coach-role-desc{font-size:16px;color:rgba(255,255,255,0.55);line-height:1.6;margin-top:10px;}
          .coach-ask-label{font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;}
          .coach-q-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:44px;}
          .coach-q-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;font-size:17px;font-style:italic;color:rgba(255,255,255,0.75);line-height:1.5;}
          .coach-bottom-row{display:flex;flex-wrap:wrap;gap:32px;align-items:baseline;}
          .coach-br-muted{font-size:19px;color:rgba(255,255,255,0.45);}
          .coach-br-bold{font-size:19px;font-weight:700;color:white;}

          /* ── MOST COMPANIES ── */
          .diff-section{background:var(--cream);padding:96px 24px;}
          .diff-inner{max-width:900px;margin:0 auto;}
          .diff-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px;}
          .diff-col{border-radius:20px;padding:28px;}
          .diff-col.red{background:rgba(220,38,38,0.06);border:1.5px solid rgba(220,38,38,0.18);}
          .diff-col.green{background:rgba(45,106,79,0.07);border:1.5px solid rgba(45,106,79,0.22);}
          .diff-col-title{font-size:16px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;}
          .diff-col.red .diff-col-title{color:#B91C1C;}
          .diff-col.green .diff-col-title{color:var(--green);}
          .diff-mandate{font-size:19px;font-weight:600;color:var(--ink);margin-bottom:12px;line-height:1.5;}
          .diff-note{font-size:17px;font-style:italic;color:var(--muted);line-height:1.6;}
          .diff-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;margin-bottom:16px;}
          .diff-chain-step{font-size:16px;font-weight:600;color:var(--ink);}
          .diff-chain-step.last{color:var(--carrot);font-weight:800;}
          .diff-chain-arrow{color:var(--carrot);padding:0 5px;font-size:16px;}
          .diff-insight{font-size:17px;color:var(--muted);line-height:1.65;}

          /* ── CHATGPT VS COACH ── */
          .compare-section{background:var(--dark2);padding:96px 24px;}
          .compare-inner{max-width:860px;margin:0 auto;}
          .compare-p{font-size:18px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:14px;}
          .compare-wrap{border-radius:16px;overflow:hidden;margin:36px 0 28px;}
          .compare-table{width:100%;border-collapse:collapse;}
          .compare-table th{padding:14px 18px;font-size:15px;font-weight:700;letter-spacing:0.5px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);}
          .compare-table td{padding:13px 18px;font-size:16px;border-bottom:1px solid rgba(255,255,255,0.06);}
          .compare-table tr:last-child td{border-bottom:none;}
          .th-feature{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);}
          .th-generic{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);text-align:center!important;}
          .th-coach{color:var(--carrot);background:rgba(244,113,26,0.1);text-align:center!important;}
          .td-feature{color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.02);}
          .td-generic{color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.02);text-align:center!important;}
          .td-coach{color:#86EFAC;background:rgba(244,113,26,0.05);text-align:center!important;font-weight:600;}
          .compare-callout{background:rgba(244,113,26,0.08);border:1.5px solid rgba(244,113,26,0.25);border-radius:14px;padding:22px 28px;font-size:19px;font-style:italic;color:rgba(255,255,255,0.8);text-align:center;}

          /* ── CARROT LADDER ── */
          .ladder-section{background:var(--cream);padding:96px 24px;}
          .ladder-inner{max-width:960px;margin:0 auto;}
          .ladder-sub{font-size:20px;color:var(--muted);margin-bottom:40px;line-height:1.5;}
          .ladder-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:44px;}
          .ladder-card{border-radius:20px;padding:28px;}
          .ladder-card.mini{background:var(--gold-light);border:1.5px solid var(--gold);}
          .ladder-card.medium{background:var(--green-light);border:1.5px solid rgba(45,106,79,0.3);}
          .ladder-card.big{background:var(--carrot-light);border:1.5px solid rgba(244,113,26,0.3);}
          .ladder-card-icon{font-size:22px;margin-bottom:10px;}
          .ladder-card-title{font-size:18px;font-weight:800;color:var(--ink);margin-bottom:4px;}
          .ladder-card-tag{font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;}
          .ladder-item{font-size:16px;color:var(--ink);line-height:1.9;}
          .ladder-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;}
          .lc-step{font-size:17px;font-weight:600;color:var(--ink);}
          .lc-step.last{color:var(--carrot);font-weight:800;}
          .lc-arrow{color:var(--carrot);padding:0 6px;font-size:17px;font-weight:700;}

          /* ── HOW COACH WORKS ── */
          .hcw-section{background:var(--cream);padding:96px 24px;}
          .hcw-inner{max-width:900px;margin:0 auto;}
          .hcw-sub{font-size:20px;color:var(--muted);line-height:1.5;margin-bottom:40px;}
          .hcw-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
          .hcw-card{background:white;border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .hcw-num{font-family:'Playfair Display',serif;font-size:46px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:12px;}
          .hcw-title{font-size:20px;font-weight:700;color:var(--ink);margin-bottom:10px;}
          .hcw-desc{font-size:17px;color:var(--muted);line-height:1.65;}

          /* ── STOP SPREADSHEETS ── */
          .ss-section{background:var(--cream);padding:96px 24px;}
          .ss-inner{max-width:900px;margin:0 auto;}
          .ss-body{margin:0 0 40px;}
          .ss-line{font-size:19px;color:var(--muted);line-height:1.7;margin-bottom:12px;}
          .ss-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px;}
          .ss-col{border-radius:20px;padding:24px;}
          .ss-col.today{border:1.5px solid rgba(26,18,8,0.25);background:rgba(26,18,8,0.03);}
          .ss-col.coach{border:1.5px solid rgba(244,113,26,0.4);background:rgba(244,113,26,0.05);}
          .ss-col-label{font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;}
          .ss-col.today .ss-col-label{color:var(--muted);}
          .ss-col.coach .ss-col-label{color:var(--carrot);}
          .ss-step{border-radius:12px;padding:12px 16px;font-size:16px;font-weight:600;text-align:center;line-height:1.4;}
          .ss-col.today .ss-step{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.18);color:#7A2020;}
          .ss-col.coach .ss-step{background:white;border:1px solid rgba(244,113,26,0.3);color:var(--ink);}
          .ss-arrow{text-align:center;font-size:18px;line-height:1;margin:6px 0;}
          .ss-col.today .ss-arrow{color:rgba(220,38,38,0.4);}
          .ss-col.coach .ss-arrow{color:var(--carrot);}
          .ss-closing{text-align:center;}
          .ss-closing-muted{font-size:20px;color:var(--muted);margin-bottom:8px;}
          .ss-closing-bold{font-size:22px;font-weight:700;color:var(--ink);}

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
          .step-num{font-size:13px;font-weight:800;letter-spacing:2px;color:var(--carrot);text-transform:uppercase;margin-bottom:10px;}
          .step-title{font-size:20px;font-weight:700;color:var(--ink);margin-bottom:10px;line-height:1.3;}
          .step-desc{font-size:17px;color:var(--muted);line-height:1.65;}
          .step-checklist{margin-top:16px;display:flex;flex-direction:column;gap:8px;}
          .step-check-item{display:flex;align-items:flex-start;gap:8px;font-size:16px;color:var(--ink);line-height:1.4;}
          .step-check-icon{color:var(--carrot);flex-shrink:0;font-weight:700;}
          .steps-note{font-size:18px;color:var(--muted);margin-bottom:24px;text-align:center;}
          .steps-cta-btn{background:var(--carrot);color:white;border:none;border-radius:100px;padding:18px 42px;font-size:19px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
          .steps-cta-btn:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}

          /* ── 4:45 PM FRIDAY ── */
          .friday-section{background:linear-gradient(160deg,#071410,#0c2018,#091a12);padding:108px 24px;text-align:center;}
          .friday-inner{max-width:700px;margin:0 auto;}
          .friday-time{font-family:'Playfair Display',serif;font-size:74px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:52px;}
          .friday-line{font-size:22px;color:rgba(255,255,255,0.75);line-height:1.7;margin-bottom:4px;}
          .friday-line.bold{font-weight:700;color:white;}
          .friday-spacer{height:24px;}
          .friday-closing{font-size:26px;font-style:italic;color:rgba(255,255,255,0.9);margin-top:44px;margin-bottom:12px;line-height:1.4;}
          .friday-orange{font-size:26px;font-weight:800;color:var(--carrot);}

          /* ── PRICING ── */
          .pricing-section{background:white;padding:96px 24px;}
          .pricing-inner{max-width:1060px;margin:0 auto;}
          .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:40px;}
          .pcard{border-radius:24px;padding:32px;border:1.5px solid var(--border);display:flex;flex-direction:column;position:relative;}
          .pcard.featured{border-color:var(--carrot);border-top-width:4px;}
          .pcard.team{border-color:var(--green);}
          .most-popular-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--carrot);color:white;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:5px 16px;border-radius:100px;white-space:nowrap;}
          .ptier{font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
          .ptier.orange{color:var(--carrot);}
          .ptier.standard{color:var(--muted);}
          .ptier.tgreen{color:var(--green);}
          .pname{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:8px;}
          .pprice{font-family:'Playfair Display',serif;font-size:54px;font-weight:900;color:var(--ink);line-height:1;margin-bottom:4px;}
          .pprice-vol{font-size:20px;font-weight:700;color:var(--green);margin-bottom:4px;}
          .psub{font-size:16px;color:var(--muted);margin-bottom:20px;}
          .pdivider{height:1px;background:var(--border);margin-bottom:20px;}
          .pfeatures{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;flex:1;}
          .pfeature{display:flex;align-items:flex-start;gap:10px;font-size:16px;color:var(--ink);line-height:1.5;}
          .pcheck{font-size:15px;flex-shrink:0;margin-top:2px;font-weight:700;}
          .pcheck.orange{color:var(--carrot);}
          .pcheck.tgreen{color:var(--green);}
          .pbtn{display:block;width:100%;padding:14px 24px;border-radius:100px;font-size:17px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;text-align:center;margin-bottom:12px;}
          .pbtn.filled{background:var(--carrot);color:white;border:2px solid var(--carrot);}
          .pbtn.filled:hover{background:var(--carrot-dark);border-color:var(--carrot-dark);}
          .pbtn.outlined-orange{background:white;color:var(--carrot);border:2px solid var(--carrot);}
          .pbtn.outlined-orange:hover{background:var(--carrot-light);}
          .pbtn.outlined-green{background:white;color:var(--green);border:2px solid var(--green);}
          .pbtn.outlined-green:hover{background:var(--green-light);}
          .pnote{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:6px;text-align:center;}
          .papproval-summary{display:block;margin-top:10px;padding:10px 16px;border-radius:100px;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;text-align:center;transition:all 0.2s;}
          .papproval-summary.orange{border:1.5px solid var(--carrot);color:var(--carrot);background:white;}
          .papproval-summary.orange:hover{background:var(--carrot-light);}
          .papproval-summary.tgreen{border:1.5px solid var(--green);color:var(--green);background:white;}
          .papproval-summary.tgreen:hover{background:var(--green-light);}
          .email-box{margin-top:14px;background:var(--cream);border:1.5px solid var(--border);border-radius:16px;padding:18px;}
          .email-subject{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:12px;}
          .email-body{font-size:15px;color:var(--muted);line-height:1.7;white-space:pre-wrap;margin-bottom:14px;}
          .copy-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--ink);transition:all 0.2s;}
          .copy-btn:hover{border-color:var(--carrot);color:var(--carrot);}

          /* ── RESPONSIVE PART 3 ── */
          @media(max-width:900px){.pricing-grid{grid-template-columns:1fr;}}
          @media(max-width:600px){
            .steps-grid{grid-template-columns:1fr;}
            .friday-time{font-size:54px;}
            .friday-line{font-size:19px;}
            .friday-closing,.friday-orange{font-size:22px;}
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
                  $99<span style={{ fontSize: 22, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>/year</span>
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
          .roi-opening{font-size:19px;color:var(--muted);line-height:1.65;margin-bottom:40px;max-width:720px;}
          .roi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:32px;}
          .roi-card{background:white;border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .roi-card-emoji{font-size:30px;margin-bottom:14px;}
          .roi-card-title{font-size:19px;font-weight:700;color:var(--ink);margin-bottom:10px;}
          .roi-card-desc{font-size:17px;color:var(--muted);line-height:1.65;}
          .roi-box{background:rgba(244,113,26,0.07);border:1.5px solid rgba(244,113,26,0.25);border-radius:20px;padding:28px 32px;font-size:18px;color:var(--ink);line-height:1.75;}
          .roi-callout{background:white;border:1.5px solid var(--border);border-left:4px solid var(--carrot);border-radius:16px;padding:24px 28px;font-size:18px;color:var(--ink);line-height:1.7;margin-bottom:20px;}

          /* ── CLOSING ── */
          .closing-section{background:var(--dark);padding:100px 24px;text-align:center;}
          .closing-inner{max-width:700px;margin:0 auto;}
          .closing-carrot{font-size:66px;display:inline-block;animation:bounce 2.2s ease-in-out infinite;margin-bottom:28px;}
          .closing-title{font-family:'Playfair Display',serif;font-size:54px;font-weight:900;color:white;line-height:1.1;margin-bottom:24px;}
          .closing-sub{font-size:19px;color:rgba(255,255,255,0.5);line-height:1.65;margin-bottom:16px;}
          .closing-note{font-size:18px;color:rgba(255,255,255,0.4);line-height:1.6;margin-bottom:36px;}
          .closing-lines{margin-bottom:36px;display:flex;flex-direction:column;gap:8px;}
          .closing-line{font-size:18px;font-weight:700;color:var(--carrot);}
          .closing-cta{background:var(--carrot);color:white;border:none;border-radius:100px;padding:18px 42px;font-size:19px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
          .closing-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}

          /* ── FOOTER ── */
          .site-footer{background:var(--dark2);border-top:1px solid rgba(255,255,255,0.07);padding:28px 48px;}
          .footer-inner{max-width:1060px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}
          .footer-logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:var(--carrot);}
          .footer-links{display:flex;gap:6px;align-items:center;}
          .footer-link{font-size:15px;color:rgba(255,255,255,0.4);cursor:pointer;transition:color 0.2s;background:none;border:none;font-family:'DM Sans',sans-serif;}
          .footer-link:hover{color:rgba(255,255,255,0.7);}
          .footer-dot{color:rgba(255,255,255,0.18);font-size:15px;padding:0 2px;}
          .footer-tagline{font-size:15px;font-style:italic;color:rgba(255,255,255,0.22);}

          /* ── RESPONSIVE PART 4 ── */
          @media(max-width:768px){
            .roi-grid{grid-template-columns:1fr;}
            .closing-title{font-size:40px;}
            .site-footer{padding:24px 20px;}
            .footer-inner{flex-direction:column;text-align:center;gap:16px;}
          }
          @media(max-width:480px){
            .roi-section,.closing-section{padding:64px 20px;}
            .closing-title{font-size:34px;}
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
            <button className="closing-cta" onClick={() => goFlow("upload")} style={{ lineHeight: 1.2 }}>
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
                <div style={{ fontSize: 15, opacity: 0.9, marginTop: 6 }}>
                  On pace for {fmt(calcNet(calcGross(targetPct)))} take home
                </div>
                {carrotAnswer && (
                  <div style={{ fontSize: 15, opacity: 0.95, marginTop: 8, fontWeight: 700 }}>🥕 Your carrot: {carrotAnswer}</div>
                )}
              </div>
              <div className="ob-sec-h" style={{ marginTop: 0 }}>Today's activities</div>
              {metrics.map((m) => {
                const v = todayLog[m.id] || 0;
                const s = metricStatus(v, m);
                return (
                  <div key={m.id} className="ob-metric">
                    <div className="ob-metric-hdr">
                      <span style={{ fontSize: 20 }}>{m.emoji}</span>
                      <strong style={{ flex: 1 }}>{m.label}</strong>
                      <span className={`ob-status ${s.cls}`}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="ob-del" style={{ fontSize: 24 }} onClick={() => setTodayLog({ ...todayLog, [m.id]: Math.max(0, v - 1) })}>−</button>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, minWidth: 36, textAlign: "center" }}>{v}</span>
                      <button className="ob-del" style={{ fontSize: 24 }} onClick={() => setTodayLog({ ...todayLog, [m.id]: v + 1 })}>+</button>
                      <span style={{ fontSize: 15, color: "var(--muted)", marginLeft: 8 }}>Floor {m.floor} · Stretch {m.stretch}</span>
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
                      <span style={{ fontSize: 15, color: "var(--muted)" }}>{fmt(c.applied)} / {fmt(c.cost)}</span>
                    </div>
                    <div className="ob-prog-bar"><div className="ob-prog-fill" style={{ width: `${pctFill}%` }} /></div>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>{Math.round(pctFill)}% funded</div>
                  </div>
                );
              })}
            </>
          )}
          {activeTab !== "home" && (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>{activeMeta?.ico}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{activeMeta?.lbl}</div>
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
  if (screen === "summary") {
    return <CompSummaryScreen onContinue={() => goFlow("real_pay_motivation")} />;
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
          <button className="ob-back" onClick={() => goFlow("upload")}>← Back</button>
          <div className="cf-step">Step 2 of 6</div>
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

          <button className="cf-cta" onClick={() => goFlow("summary")}>Looks right, show me the analysis →</button>
        </div>
      </div>
    );
  }

  // ══ REAL PAY + MOTIVATION ════════════════════════════════════════════
  if (screen === "real_pay_motivation") {
    const MARKERS = [
      { pct: 75, label: "On Track" },
      { pct: 100, label: "Quota" },
      { pct: 125, label: "Stretch" },
      { pct: 150, label: "Presidents Club" },
    ];
    const sliderGross = calcGross(sliderValue);
    const sliderNet = calcNet(sliderGross);
    const net100 = calcNet(calcGross(100));
    const stretchNet = calcNet(calcGross(125));
    const diff = stretchNet - net100;
    const extraPerMonth = Math.max(0, sliderNet - net100) / 12;
    const monthsNeeded = +carrotCost > 0 && extraPerMonth > 0 ? Math.ceil(+carrotCost / extraPerMonth) : null;
    const costMonth = monthsNeeded ? MONTHS[Math.min(11, monthsNeeded - 1)] : null;
    const PICKS = ["Family vacation", "Pay off debt", "New car", "Home improvement", "Save it"];
    const findImage = () => {
      setImageError(false);
      setCarrotImage(null);
      setImageLoading(true);
      setTimeout(() => {
        const q = encodeURIComponent(carrotAnswer.split(" ").slice(0, 3).join(","));
        setCarrotImage(`https://source.unsplash.com/600x400/?${q}`);
        setImageLoading(false);
      }, 2000);
    };
    return (
      <div className="rpm-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="cf-top">
          <button className="ob-back" onClick={() => goFlow("summary")}>← Back</button>
          <div className="cf-step">Step 5 of 6</div>
        </div>
        <div className="rpm-screen">
          <h1 className="rpm-h1">See Your Real Pay. Set Your Motivation.</h1>

          {/* SECTION 1 — Interactive attainment slider */}
          <div className="rpm-dark">
            <div className="rpm-eyebrow">Your Real Numbers</div>
            <div className="rpm-slider-pct">{sliderValue}% of Plan</div>
            <div className="rpm-nums">
              <div className="rpm-num">
                <div className="rpm-num-k">Gross Earnings</div>
                <div className="rpm-num-v">{fmt(sliderGross)}</div>
              </div>
              <div className="rpm-num">
                <div className="rpm-num-k net">Est. Take-Home</div>
                <div className="rpm-num-v net">{fmt(sliderNet)}</div>
                <div className="rpm-num-sub">after federal tax, state tax, FICA, 401k, and your deductions</div>
              </div>
            </div>
            <input className="rpm-range" type="range" min="50" max="200" step="5" value={sliderValue} onChange={(e) => setSliderValue(+e.target.value)} />
            <div className="rpm-markers">
              {MARKERS.map((m) => (
                <div key={m.pct} className={`rpm-marker ${sliderValue >= m.pct ? "on" : ""}`} style={{ left: `${((m.pct - 50) / 150) * 100}%` }}>
                  <div className="rpm-marker-pct">{m.pct}%</div>
                  <div className="rpm-marker-lbl">{m.label}</div>
                </div>
              ))}
            </div>
            {sliderValue >= 125 && (
              <div className="rpm-stretchbox">
                <div className="rpm-stretchbox-big">Your stretch goal take-home: {fmt(stretchNet)}</div>
                <div className="rpm-stretchbox-sub">That is {fmt(diff)} more than hitting quota.</div>
              </div>
            )}
          </div>

          {/* SECTION 1.5 — Why it works */}
          <div className="rpm-explain">
            <p className="rpm-explain-1">The secret to hitting your number is not willpower. It is connecting every small action to something real you want.</p>
            <p className="rpm-explain-2">When you know that one more call gets you closer to Hawaii, you make the call.</p>
            <p className="rpm-explain-3">That is what Coach does. Every activity. Every day. All year.</p>
          </div>

          {/* SECTION 2 — Set Your Goals */}
          <div className="rpm-goals">
            <div className="rpm-goal target">
              <div className="rpm-goal-lbl">Target Goal</div>
              <div className="rpm-goal-inrow">
                <input className="rpm-goal-input" type="number" value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)} placeholder="—" />
                <span className="rpm-goal-suffix">% of Plan</span>
              </div>
            </div>
            <div className="rpm-goal stretch">
              <div className="rpm-goal-lbl">Stretch Goal</div>
              <div className="rpm-goal-inrow">
                <input className="rpm-goal-input" type="number" value={stretchGoal} onChange={(e) => setStretchGoal(e.target.value)} placeholder="—" />
                <span className="rpm-goal-suffix">% of Plan</span>
              </div>
            </div>
          </div>

          {!goalsLocked ? (
            <button
              className="rpm-lockbtn"
              disabled={targetGoal.trim() === "" || stretchGoal.trim() === "" || isNaN(+targetGoal) || isNaN(+stretchGoal)}
              onClick={() => { setGoalsLocked(true); setTargetPct(+targetGoal); }}
            >
              Lock In
            </button>
          ) : (
            <>
              <div className="rpm-locked">✓ Locked In, Target {targetGoal}% and Stretch {stretchGoal}%</div>
              <div className="rpm-result target">At your Target of {targetGoal}% your take-home is <span className="rpm-result-amt">{fmt(calcNet(calcGross(+targetGoal)))}</span></div>
              <div className="rpm-result stretch">At your Stretch of {stretchGoal}% your take-home is <span className="rpm-result-amt">{fmt(calcNet(calcGross(+stretchGoal)))}</span></div>
            </>
          )}

          {/* SECTION 3 — Carrot cards (appear once goals locked) */}
          {goalsLocked && (
            <>
              <div className="rpm-card" style={{ marginTop: 20 }}>
                <div className="rpm-card-hdr">
                  <div className="rpm-card-title" style={{ lineHeight: 1.4 }}>If you hit your Target of {targetGoal}% and took home {fmt(calcNet(calcGross(+targetGoal)))}, what would you do with it?</div>
                </div>
                <div className="rpm-pad" style={{ paddingTop: 14 }}>
                  <input className="rpm-input" value={carrotAnswer} onChange={(e) => setCarrotAnswer(e.target.value)} placeholder="e.g. Family vacation in Hawaii, Pay off my car, New boat..." />
                  <CarrotImageFinder answer={carrotAnswer} />
                </div>
              </div>
              <div className="rpm-card">
                <div className="rpm-card-hdr">
                  <div className="rpm-card-title" style={{ lineHeight: 1.4 }}>If you hit your Stretch of {stretchGoal}% and took home {fmt(calcNet(calcGross(+stretchGoal)))}, what would you do with it?</div>
                </div>
                <div className="rpm-pad" style={{ paddingTop: 14 }}>
                  <input className="rpm-input" value={stretchCarrot} onChange={(e) => setStretchCarrot(e.target.value)} placeholder="e.g. Pay off the mortgage, A boat, Dream kitchen..." />
                  <CarrotImageFinder answer={stretchCarrot} />
                </div>
              </div>
            </>
          )}

          {/* SECTION 3 — Save + Continue */}
          <div className="rpm-goldbox">Your carrot and real numbers will be saved when you create your account in the next step.</div>
          <button className="cf-cta" disabled={!carrotAnswer.trim()} onClick={() => goFlow("create_account")}>Save My Carrot and Create My Account →</button>
        </div>
      </div>
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
          <div className="cf-step" style={{ color: "rgba(255,255,255,0.6)" }}>Step 6 of 6</div>
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
              <div className="pprice">$99<span style={{ fontSize: 20, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>/year</span></div>
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

  // ══ UPLOAD (files for Coach to review) ═══════════════════════════════
  if (screen === "upload") {
    const fmtSize = (b) => (b < 1024 * 1024 ? Math.round(b / 1024) + " KB" : (b / 1024 / 1024).toFixed(1) + " MB");
    const addFiles = (fileList) => setUploadedFiles((prev) => [...prev, ...Array.from(fileList || [])].slice(0, 10));
    const removeFile = (i) => setUploadedFiles((prev) => prev.filter((_, j) => j !== i));
    return (
      <div className="up-wrap">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="cf-top">
          <button className="ob-back" onClick={() => goFlow("landing")}>← Back</button>
          <div className="cf-step">Step 1 of 6</div>
        </div>
        <div className="up-screen">
          <h1 className="up-h1">Upload Your Files for Coach to Review</h1>
          <p className="up-sub">Drop in anything related to your compensation. Coach will figure out what each file is and use everything to build your earnings picture.</p>

          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files);
              setUploadedFiles((prev) => [...prev, ...dropped]);
            }}
            style={{
              border: "2px dashed #EDE0CC",
              borderRadius: 20,
              padding: "48px 32px",
              textAlign: "center",
              cursor: "pointer",
              background: "white",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Drop your files here</div>
            <div style={{ fontSize: 15, color: "#7A6A55", marginBottom: 8 }}>Comp plans, prior year plans, SPIFF emails, quota changes</div>
            <div style={{ fontSize: 13, color: "#7A6A55" }}>PDF, Word, or text files · Up to 10 files · 20MB each</div>
            <div style={{ fontSize: 13, color: "#F4711A", marginTop: 8, fontWeight: 600 }}>or click to browse</div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.eml"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const selected = Array.from(e.target.files);
              setUploadedFiles((prev) => [...prev, ...selected]);
              e.target.value = "";
            }}
          />

          {uploadedFiles.length > 0 && (
            <div className="up-list">
              {uploadedFiles.map((f, i) => (
                <div className="up-file" key={i}>
                  <span className="up-file-ico">📄</span>
                  <span className="up-file-name">{f.name}</span>
                  <span className="up-file-size">{fmtSize(f.size)}</span>
                  <button className="up-file-x" onClick={() => removeFile(i)}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="up-priv"><span>🔒</span><span>Your files are private. Coach uses them only to build your personal earnings model and never shares them with anyone.</span></div>

          <div className="up-next">
            <div className="up-next-t">What Happens Next</div>
            <div className="up-next-line"><span className="up-next-num">1</span><span>Coach reads your files and identifies your compensation structure</span></div>
            <div className="up-next-line"><span className="up-next-num">2</span><span>You confirm what Coach found and add your state and 401k details</span></div>
            <div className="up-next-line"><span className="up-next-num">3</span><span>Coach shows you your full earnings analysis and real take-home numbers</span></div>
          </div>

          <button className="up-cta" disabled={uploadedFiles.length === 0} onClick={() => goFlow("confirm")}>Review My Plan →</button>
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

// ── COMP PLAN SUMMARY SCREEN (from comp-summary-mockup) ───────────────
const CS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  .cs-root * { box-sizing: border-box; }
  .cs-root { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); min-height: 100vh; }
  .cs-root .page { max-width: 760px; margin: 0 auto; padding: 40px 24px; }

  @keyframes csFadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
  @keyframes csPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

  .cs-root .page-header { margin-bottom: 28px; animation: csFadeUp 0.4s ease; }
  .cs-root .page-eyebrow { font-size:13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .cs-root .page-title { font-family: 'Playfair Display', serif; font-size:38px; font-weight: 900; color: var(--ink); line-height: 1.15; margin-bottom: 10px; }
  .cs-root .page-title span { color: var(--carrot); }
  .cs-root .page-sub { font-size:17px; color: var(--muted); line-height: 1.6; max-width: 540px; }

  .cs-root .ai-banner { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, #1A1208 0%, #3D2B1A 100%); border-radius: 16px; padding: 18px 22px; margin-bottom: 20px; animation: csFadeUp 0.4s ease 0.1s both; }
  .cs-root .ai-banner-icon { font-size:30px; flex-shrink: 0; }
  .cs-root .ai-banner-text { flex: 1; }
  .cs-root .ai-banner-title { font-size:16px; font-weight: 700; color: white; margin-bottom: 2px; }
  .cs-root .ai-banner-sub { font-size:14px; color: rgba(255,255,255,0.6); }
  .cs-root .ai-confidence { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .cs-root .ai-confidence-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ADE80; animation: csPulse 2s ease infinite; }
  .cs-root .ai-confidence-label { font-size:14px; font-weight: 700; color: #4ADE80; }

  .cs-root .coach-card { background: linear-gradient(145deg, #0F0A05 0%, #2D1A0A 50%, #1A2D1A 100%); border-radius: 24px; overflow: hidden; margin-bottom: 20px; animation: csFadeUp 0.4s ease 0.15s both; box-shadow: 0 8px 40px rgba(244,113,26,0.15); }
  .cs-root .coach-header { padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 12px; }
  .cs-root .coach-header-icon { font-size:26px; }
  .cs-root .coach-header-text { flex: 1; }
  .cs-root .coach-header-title { font-size:17px; font-weight: 700; color: white; margin-bottom: 2px; }
  .cs-root .coach-header-sub { font-size:14px; color: rgba(255,255,255,0.5); }
  .cs-root .coach-header-badge { font-size:13px; font-weight: 700; padding: 4px 10px; border-radius: 100px; background: rgba(244,113,26,0.25); color: #FDBA74; }

  .cs-root .big-picture { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .cs-root .big-picture-label { font-size:13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #FDBA74; margin-bottom: 12px; }
  .cs-root .big-picture-text { font-size:18px; line-height: 1.7; color: rgba(255,255,255,0.92); font-style: italic; border-left: 3px solid var(--carrot); padding-left: 16px; }

  .cs-root .insights-section { padding: 20px 24px; }
  .cs-root .insights-col-title { font-size:13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; }
  .cs-root .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .cs-root .insight-pill { border-radius: 14px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px; }
  .cs-root .insight-pill.do { background: rgba(45,106,79,0.25); border: 1px solid rgba(45,106,79,0.4); }
  .cs-root .insight-pill.watch { background: rgba(220,38,38,0.2); border: 1px solid rgba(220,38,38,0.35); }
  .cs-root .insight-icon { font-size:20px; flex-shrink: 0; margin-top: 1px; }
  .cs-root .insight-text { font-size:15px; line-height: 1.5; }
  .cs-root .insight-pill.do .insight-text { color: #86EFAC; }
  .cs-root .insight-pill.watch .insight-text { color: #FCA5A5; }
  .cs-root .insight-headline { font-weight: 700; margin-bottom: 3px; font-size:15px; }
  .cs-root .watch-title { color: #FCA5A5; }
  .cs-root .do-title { color: #86EFAC; }

  .cs-root .section-card { background: white; border: 1.5px solid var(--border); border-radius: 22px; overflow: hidden; margin-bottom: 20px; animation: csFadeUp 0.4s ease both; }
  .cs-root .card-header { display: flex; align-items: center; gap: 12px; padding: 16px 22px; border-bottom: 1px solid var(--border); background: var(--cream); }
  .cs-root .card-header-icon { font-size:22px; }
  .cs-root .card-header-title { font-size:17px; font-weight: 700; flex: 1; }
  .cs-root .badge { font-size:13px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
  .cs-root .badge-green { background: var(--green-light); color: var(--green); }
  .cs-root .badge-orange { background: var(--carrot-light); color: var(--carrot-dark); }

  .cs-root .field-row { display: flex; align-items: center; padding: 16px 22px; border-bottom: 1px solid var(--border); transition: background 0.15s; gap: 16px; }
  .cs-root .field-row:last-child { border-bottom: none; }
  .cs-root .field-row:hover { background: #FEFCF8; }
  .cs-root .field-row.missing { background: #FFFBEB; }
  .cs-root .field-icon { font-size:20px; width: 32px; text-align: center; flex-shrink: 0; }
  .cs-root .field-body { flex: 1; min-width: 0; }
  .cs-root .field-label { font-size:13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .cs-root .field-value { font-size:22px; font-weight: 700; color: var(--ink); }
  .cs-root .field-value.missing-val { font-size:16px; font-weight: 500; color: var(--carrot); font-style: italic; }
  .cs-root .field-sub { font-size:14px; color: var(--muted); margin-top: 2px; }
  .cs-root .field-source { display: inline-flex; align-items: center; gap: 4px; font-size:13px; color: var(--green); background: var(--green-light); padding: 2px 8px; border-radius: 100px; margin-top: 4px; font-weight: 600; }
  .cs-root .edit-btn { flex-shrink: 0; background: none; border: 1.5px solid var(--border); border-radius: 10px; padding: 7px 14px; font-size:14px; font-weight: 600; cursor: pointer; color: var(--muted); transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .cs-root .edit-btn:hover { border-color: var(--carrot); color: var(--carrot); background: var(--carrot-light); }
  .cs-root .add-btn { flex-shrink: 0; background: var(--carrot); border: none; border-radius: 10px; padding: 7px 14px; font-size:14px; font-weight: 700; cursor: pointer; color: white; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .cs-root .inline-edit { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
  .cs-root .inline-input { padding: 8px 12px; border: 1.5px solid var(--carrot); border-radius: 10px; font-size:17px; font-family: 'DM Sans', sans-serif; width: 180px; color: var(--ink); background: white; }
  .cs-root .inline-input:focus { outline: none; }
  .cs-root .save-btn { background: var(--carrot); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size:15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .cs-root .cancel-btn { background: none; color: var(--muted); border: none; font-size:15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 8px; }

  .cs-root .commission-visual { padding: 20px 22px; background: var(--cream); border-top: 1px solid var(--border); }
  .cs-root .commission-visual-title { font-size:14px; font-weight: 700; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
  .cs-root .tier-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .cs-root .tier-label { font-size:14px; font-weight: 600; color: var(--ink); width: 160px; flex-shrink: 0; }
  .cs-root .tier-bar-track { flex: 1; height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
  .cs-root .tier-bar-fill { height: 100%; border-radius: 5px; }
  .cs-root .tier-rate { font-size:15px; font-weight: 700; color: var(--ink); width: 48px; text-align: right; }

  .cs-root .spiff-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px 22px; border-bottom: 1px solid var(--border); }
  .cs-root .spiff-item:last-child { border-bottom: none; }
  .cs-root .spiff-emoji { font-size:26px; flex-shrink: 0; margin-top: 2px; }
  .cs-root .spiff-body { flex: 1; }
  .cs-root .spiff-name { font-size:17px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .cs-root .spiff-desc { font-size:15px; color: var(--muted); line-height: 1.5; }
  .cs-root .spiff-value { font-size:20px; font-weight: 700; color: var(--green); flex-shrink: 0; }

  .cs-root .concern-box { display: flex; gap: 14px; background: var(--red-light); border: 1px solid #FECACA; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; animation: csFadeUp 0.4s ease 0.3s both; }
  .cs-root .concern-title { font-size:16px; font-weight: 700; color: var(--red); margin-bottom: 3px; }
  .cs-root .concern-desc { font-size:15px; color: #7F1D1D; line-height: 1.5; }

  .cs-root .confirm-bar { display: flex; align-items: center; justify-content: space-between; background: white; border: 1.5px solid var(--border); border-radius: 20px; padding: 20px 24px; margin-top: 8px; gap: 16px; animation: csFadeUp 0.4s ease 0.5s both; }
  .cs-root .confirm-bar-title { font-size:18px; font-weight: 700; margin-bottom: 2px; }
  .cs-root .confirm-bar-sub { font-size:15px; color: var(--muted); }
  .cs-root .confirm-actions { display: flex; gap: 10px; flex-shrink: 0; }
  .cs-root .btn-confirm { background: var(--carrot); color: white; border: none; border-radius: 100px; padding: 12px 24px; font-size:16px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .cs-root .btn-confirm:hover { background: var(--carrot-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244,113,26,0.3); }
  .cs-root .btn-fix { background: white; color: var(--ink); border: 1.5px solid var(--border); border-radius: 100px; padding: 12px 20px; font-size:16px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .cs-root .btn-fix:hover { border-color: var(--carrot); color: var(--carrot); }
`;

const CS_MOTIVATIONS = [
  { label: "New Business", level: 9, desc: "Heavily weighted toward new logos" },
  { label: "Expansion", level: 4, desc: "Renewals & upsells pay less" },
  { label: "Speed", level: 8, desc: "Fast Start bonus rewards early wins" },
  { label: "Big Deals", level: 6, desc: "No deal-size accelerator found" },
];

const CS_DO_INSIGHTS = [
  { icon: "🏆", headline: "Hit quota fast", text: "Your accelerator jumps to 14% above 100%. The plan is designed to reward blowing past quota, not just hitting it." },
  { icon: "🆕", headline: "Chase new logos", text: "New Logo SPIFF pays $5K per new customer. Leadership is clearly prioritizing new business over expansion this year." },
  { icon: "⚡", headline: "Win in Month 1", text: "Fast Start bonus expires after 30 days. Front-load your pipeline now. This $2,500 is gone if you miss it." },
  { icon: "📅", headline: "Close before quarter end", text: "Commission pays on booking date. Deals that slip to next quarter reset your accelerator progress." },
];

const CS_WATCH_INSIGHTS = [
  { icon: "⚠️", headline: "The 75% cliff is real", text: "Below 75% quota you earn nothing in commission, just base. Don't let yourself sit at 60% thinking you're making progress." },
  { icon: "🔄", headline: "Renewals won't move the needle", text: "Renewal commissions are half the rate of new business. If you spend Q3 on renewals you'll likely miss the accelerator." },
  { icon: "📉", headline: "Sandbagging backfires here", text: "Holding deals for next quarter resets your accelerator tier. The math strongly favors closing now." },
];

function PayoutCurve() {
  const BASE = 85000;
  const QUOTA = 600000;

  const data = [];
  for (let pct = 0; pct <= 175; pct += 5) {
    const att = pct / 100;
    let commission = 0;
    if (att <= 0.75) {
      commission = QUOTA * att * 0.05;
    } else if (att <= 1.0) {
      commission = QUOTA * 0.75 * 0.05 + QUOTA * (att - 0.75) * 0.08;
    } else if (att <= 1.5) {
      commission = QUOTA * 0.75 * 0.05 + QUOTA * 0.25 * 0.08 + QUOTA * Math.min(att - 1, 0.5) * 0.14;
      if (att > 1.5) commission += QUOTA * (att - 1.5) * 0.08;
    } else {
      commission = QUOTA * 0.75 * 0.05 + QUOTA * 0.25 * 0.08 + QUOTA * 0.5 * 0.14 + QUOTA * (att - 1.5) * 0.06;
    }
    const gross = BASE + commission;
    data.push({
      pct,
      gross: Math.round(gross / 1000) * 1000,
      commission: Math.round(commission / 1000) * 1000,
      base: BASE,
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const gross = payload.find((p) => p.dataKey === "gross");
    const comm = payload.find((p) => p.dataKey === "commission");
    return (
      <div style={{ background: "#1A1208", border: "1px solid rgba(244,113,26,0.3)", borderRadius: 12, padding: "12px 16px", fontSize: 15 }}>
        <div style={{ fontWeight: 700, color: "white", marginBottom: 8 }}>{label}% of Quota</div>
        {gross && <div style={{ color: "#F4711A", fontWeight: 700 }}>Total: ${(gross.value / 1000).toFixed(0)}k</div>}
        {comm && <div style={{ color: "#E9C46A" }}>Commission: ${(comm.value / 1000).toFixed(0)}k</div>}
        <div style={{ color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Base: $85k</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F4711A" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F4711A" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E9C46A" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#E9C46A" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="pct" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 13 }} tickFormatter={(v) => v + "%"} />
        <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 13 }} tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={75} stroke="#E9C46A" strokeDasharray="4 4" strokeWidth={1.5}>
          <Label value="75% cliff" fill="#E9C46A" fontSize={10} position="insideTopRight" offset={4} />
        </ReferenceLine>
        <ReferenceLine x={100} stroke="#F4711A" strokeDasharray="4 4" strokeWidth={1.5}>
          <Label value="Quota" fill="#F4711A" fontSize={10} position="insideTopRight" offset={4} />
        </ReferenceLine>
        <ReferenceLine x={150} stroke="#2D6A4F" strokeDasharray="4 4" strokeWidth={1.5}>
          <Label value="Decelerator" fill="#86EFAC" fontSize={10} position="insideTopRight" offset={4} />
        </ReferenceLine>
        <Area type="monotone" dataKey="commission" stroke="#E9C46A" strokeWidth={1.5} fill="url(#commGrad)" dot={false} />
        <Area type="monotone" dataKey="gross" stroke="#F4711A" strokeWidth={2.5} fill="url(#grossGrad)" dot={false} />
        <Line type="monotone" dataKey="base" stroke="rgba(255,255,255,0.15)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── ANALYZING SCREEN ──────────────────────────────────────────────────
const AZ_STYLES = `
.az-wrap{min-height:100vh;background:#0F0A05;color:white;display:flex;align-items:center;justify-content:center;padding:40px 24px;}
.az-inner{max-width:560px;width:100%;text-align:center;animation:fadeUp 0.4s ease;}
.az-carrot{font-size:80px;line-height:1;display:inline-block;margin-bottom:24px;animation:bounce 2s ease-in-out infinite;}
.az-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:white;margin-bottom:36px;}
.az-stages{display:flex;flex-direction:column;gap:14px;text-align:left;margin-bottom:34px;}
.az-stage{display:flex;align-items:center;gap:14px;opacity:0.4;transition:opacity 0.4s ease;}
.az-stage.active,.az-stage.done{opacity:1;}
.az-marker{width:24px;height:24px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.az-dot{width:18px;height:18px;border-radius:50%;border:3px solid rgba(244,113,26,0.25);border-top-color:#F4711A;animation:azspin 0.8s linear infinite;}
.az-stage.pending .az-dot{border:3px solid rgba(255,255,255,0.15);animation:none;}
.az-check{color:#86EFAC;font-size:20px;font-weight:800;}
.az-stage-text{font-size:17px;color:rgba(255,255,255,0.9);}
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
          : <div style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}><div style={{ fontSize: 30, marginBottom: 6 }}>🥕</div><div style={{ fontSize: 13 }}>Add a photo of what you are working toward</div></div>}
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
      {aiLoading && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--carrot-light)", borderRadius: 12, fontSize: 13, color: "var(--carrot-dark)", marginTop: 10 }}><span style={{ display: "inline-block", animation: "azspin 1s linear infinite" }}>🥕</span> Generating your carrot image...</div>}
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

function CompSummaryScreen({ onContinue }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [comp, setComp] = useState({ base: 85000, quota: 600000, ote: 133000, payFreq: "Semi-monthly (24x/year)" });

  function startEdit(field, val) { setEditing(field); setEditVal(String(val)); }
  function saveEdit() { setComp((c) => ({ ...c, [editing]: parseFloat(editVal) || c[editing] })); setEditing(null); }

  const tiers = [
    { range: "0–75% of quota", rate: 5, color: "#E9C46A", width: 30 },
    { range: "75–100% of quota", rate: 8, color: "#F4711A", width: 55 },
    { range: "100%+ (Accelerator)", rate: 14, color: "#2D6A4F", width: 85 },
  ];

  const spiffs = [
    { emoji: "🆕", name: "New Logo SPIFF", desc: "Sign a net-new logo customer in Q3", value: "$5,000", confirmed: true },
    { emoji: "📅", name: "Fast Start Bonus", desc: "Hit 50% of quota by end of Month 1", value: "$2,500", confirmed: true },
    { emoji: "🎪", name: "Event Attendance Bonus", desc: "Get 3+ customers to attend the annual summit", value: "$500", confirmed: false },
  ];

  return (
    <div className="cs-root">
      <style>{S}</style>
      <style>{CS_STYLES}</style>
      <div className="page">

        {/* HEADER */}
        <div className="page-header">
          <div className="page-eyebrow">Step 2 of 6 · Comp Plan Review</div>
          <h1 className="page-title">Here's What Coach <span>Found</span></h1>
          <p className="page-sub">We read your plan and did two things. We pulled out every number, and decoded what leadership is actually trying to get you to do.</p>
        </div>

        {/* AI BANNER */}
        <div className="ai-banner">
          <div className="ai-banner-icon">🥕</div>
          <div className="ai-banner-text">
            <div className="ai-banner-title">Coach reviewed your compensation plan</div>
            <div className="ai-banner-sub">Here is what Coach found, your numbers, your opportunities, and what your plan is really designed to reward</div>
          </div>
          <div className="ai-confidence">
            <div className="ai-confidence-dot" />
            <div className="ai-confidence-label">92% confident</div>
          </div>
        </div>

        {/* TOP CTA BAR */}
        <div style={{ background: "var(--carrot-light)", border: "1px solid rgba(244,113,26,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--carrot-dark)" }}>Ready to see your real take-home numbers?</div>
          <button onClick={onContinue} style={{ background: "var(--carrot)", color: "white", border: "none", borderRadius: 100, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Continue to My Earnings →
          </button>
        </div>

        {/* ── AI COACH CARD ── */}
        <div className="coach-card">
          <div className="coach-header">
            <div className="coach-header-icon">🧠</div>
            <div className="coach-header-text">
              <div className="coach-header-title">AI Plan Interpretation</div>
              <div className="coach-header-sub">What leadership is really trying to get you to do</div>
            </div>
            <div className="coach-header-badge">New ✨</div>
          </div>

          {/* BIG PICTURE */}
          <div className="big-picture">
            <div className="big-picture-label">The Big Picture</div>
            <div className="big-picture-text">
              "This is a hunter's plan. Leadership is betting big on new logos this year. New business pays nearly 2x more than expansion, and the Fast Start bonus rewards whoever gets off the blocks quickest. The accelerator is aggressive above quota, which means the top reps will separate themselves fast. If you're spending your time on renewals, you're playing the wrong game in 2025."
            </div>
          </div>

          {/* WHAT TO DO */}
          <div className="insights-section">
            <div className="insights-col-title do-title">✅ What This Plan Rewards</div>
            <div className="insights-grid">
              {CS_DO_INSIGHTS.map((ins, i) => (
                <div className="insight-pill do" key={i}>
                  <div className="insight-icon">{ins.icon}</div>
                  <div className="insight-text">
                    <div className="insight-headline">{ins.headline}</div>
                    {ins.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="insights-col-title watch-title">⚠️ What To Watch Out For</div>
            <div className="insights-grid">
              {CS_WATCH_INSIGHTS.map((ins, i) => (
                <div className="insight-pill watch" key={i}>
                  <div className="insight-icon">{ins.icon}</div>
                  <div className="insight-text">
                    <div className="insight-headline">{ins.headline}</div>
                    {ins.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOTIVATION METERS */}
          <div style={{ padding: "4px 24px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
              What Leadership Is Prioritizing
            </div>
            {CS_MOTIVATIONS.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", width: 110, flexShrink: 0 }}>{m.label}</div>
                <div style={{ flex: 1, display: "flex", gap: 3 }}>
                  {[...Array(10)].map((_, j) => (
                    <div key={j} style={{
                      flex: 1, height: 8, borderRadius: 4,
                      background: j < m.level ? (m.level >= 8 ? "var(--carrot)" : m.level >= 6 ? "#E9C46A" : "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.1)",
                      transition: `all 0.3s ease ${j * 0.05}s`,
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", width: 140, flexShrink: 0, textAlign: "right" }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MISSING FIELD WARNING */}
        <div className="concern-box">
          <div style={{ fontSize: 22 }}>⚠️</div>
          <div>
            <div className="concern-title">One thing we couldn't find</div>
            <div className="concern-desc">We couldn't locate your <strong>draw amount</strong>. If you have a recoverable or non-recoverable draw, add it below. It affects your take-home calculations.</div>
          </div>
        </div>

        {/* COMP STRUCTURE CARD */}
        <div className="section-card">
          <div className="card-header">
            <div className="card-header-icon">💰</div>
            <div className="card-header-title">Your Full Earnings Picture</div>
            <div className="badge badge-green">✓ Found</div>
          </div>

          {[
            { key: "base", icon: "🏦", label: "Base Salary", display: fmt(comp.base) + "/year", sub: null, page: "page 2" },
          ].map((f) => (
            <div className="field-row" key={f.key}>
              <div className="field-icon">{f.icon}</div>
              <div className="field-body">
                <div className="field-label">{f.label}</div>
                {editing === f.key
                  ? <div className="inline-edit">
                      <input className="inline-input" value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
                      <button className="save-btn" onClick={saveEdit}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  : <>
                      <div className="field-value">{f.display}</div>
                      {f.sub && <div className="field-sub">{f.sub}</div>}
                      <div className="field-source">📄 Found on {f.page}</div>
                    </>
                }
              </div>
              {editing !== f.key && <button className="edit-btn" onClick={() => startEdit(f.key, comp[f.key])}>✏️ Edit</button>}
            </div>
          ))}

          {/* Commission at Target (display only) */}
          <div className="field-row">
            <div className="field-icon">📈</div>
            <div className="field-body">
              <div className="field-label">Commission at Target</div>
              <div className="field-value">{fmt(comp.ote - comp.base)}/year at 100% quota</div>
              <div className="field-sub">Your quota times your commission rate, paid at 100% attainment</div>
            </div>
          </div>

          {[
            { key: "ote", icon: "🎯", label: "On-Target Earnings (OTE)", display: fmt(comp.ote) + "/year at quota", sub: `That's ${fmt(comp.ote - comp.base)} in variable pay at 100%`, page: "page 1" },
            { key: "quota", icon: "📊", label: "Annual Quota", display: fmt(comp.quota), sub: null, page: "page 3" },
          ].map((f) => (
            <div className="field-row" key={f.key}>
              <div className="field-icon">{f.icon}</div>
              <div className="field-body">
                <div className="field-label">{f.label}</div>
                {editing === f.key
                  ? <div className="inline-edit">
                      <input className="inline-input" value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
                      <button className="save-btn" onClick={saveEdit}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  : <>
                      <div className="field-value">{f.display}</div>
                      {f.sub && <div className="field-sub">{f.sub}</div>}
                      <div className="field-source">📄 Found on {f.page}</div>
                    </>
                }
              </div>
              {editing !== f.key && <button className="edit-btn" onClick={() => startEdit(f.key, comp[f.key])}>✏️ Edit</button>}
            </div>
          ))}

          <div className="field-row">
            <div className="field-icon">📅</div>
            <div className="field-body">
              <div className="field-label">Pay Frequency</div>
              <div className="field-value" style={{ fontSize: 19 }}>{comp.payFreq}</div>
              <div className="field-sub">~{fmt(comp.base / 24)} base per paycheck</div>
            </div>
            <button className="edit-btn">✏️ Edit</button>
          </div>

          <div className="field-row missing">
            <div className="field-icon">💳</div>
            <div className="field-body">
              <div className="field-label">Draw Amount</div>
              <div className="field-value missing-val">Not found. Do you have a draw?</div>
            </div>
            <button className="add-btn">+ Add</button>
          </div>
        </div>

        {/* COMMISSION TIERS */}
        <div className="section-card">
          <div className="card-header">
            <div className="card-header-icon">📈</div>
            <div className="card-header-title">Commission Structure</div>
            <div className="badge badge-green">✓ 3 tiers found</div>
          </div>
          {tiers.map((t, i) => (
            <div className="field-row" key={i}>
              <div className="field-icon">{i === 0 ? "🟡" : i === 1 ? "🟠" : "🟢"}</div>
              <div className="field-body">
                <div className="field-label">{t.range}</div>
                <div className="field-value">{t.rate}% commission rate</div>
                {i === 2 && <div className="field-sub">🚀 Accelerator, every dollar above quota earns more</div>}
              </div>
              <button className="edit-btn">✏️ Edit</button>
            </div>
          ))}
          <div className="commission-visual">
            <div className="commission-visual-title">How Your Rate Climbs</div>
            {tiers.map((t, i) => (
              <div className="tier-row" key={i}>
                <div className="tier-label">{t.range}</div>
                <div className="tier-bar-track"><div className="tier-bar-fill" style={{ width: `${t.width}%`, background: t.color }} /></div>
                <div className="tier-rate">{t.rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* SPIFFS */}
        <div className="section-card">
          <div className="card-header">
            <div className="card-header-icon">⚡</div>
            <div className="card-header-title">Active SPIFFs &amp; Incentives</div>
            <div className="badge badge-orange">3 active</div>
          </div>
          {spiffs.map((s, i) => (
            <div className="spiff-item" key={i}>
              <div className="spiff-emoji">{s.emoji}</div>
              <div className="spiff-body">
                <div className="spiff-name">{s.name}</div>
                <div className="spiff-desc">{s.desc}</div>
                <div className="field-source" style={{ marginTop: 6 }}>
                  {s.confirmed ? "📄 Confirmed in document" : "⚠️ Verify with your manager"}
                </div>
              </div>
              <div className="spiff-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── PAYOUT CURVE ── */}
        <div style={{ background: "#0F0A05", borderRadius: 24, overflow: "hidden", marginBottom: 20, boxShadow: "0 8px 40px rgba(244,113,26,0.12)" }}>
          <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Your Payout Curve</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "white", marginBottom: 4 }}>How Your Earnings Climb</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>See exactly how commission accelerates, or decelerates, at every point in your plan.</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                {[
                  { color: "#F4711A", label: "Total Earnings" },
                  { color: "#E9C46A", label: "Commission Only" },
                  { color: "rgba(255,255,255,0.2)", label: "Base Salary" },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 3, background: l.color, borderRadius: 2 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 8px 8px" }}>
            <PayoutCurve />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { pct: "75%", label: "On Track", earn: "$107,500", rate: "5%", color: "#E9C46A" },
              { pct: "100%", label: "Quota", earn: "$133,000", rate: "8%", color: "#F4711A" },
              { pct: "125%", label: "Accelerator", earn: "$175,000", rate: "14%", color: "#E76F51" },
              { pct: "150%", label: "Pres. Club", earn: "$217,000", rate: "14%", color: "#2D6A4F" },
            ].map((m, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.color, fontFamily: "'Playfair Display', serif" }}>{m.pct}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{m.earn}</div>
                <div style={{ fontSize: 13, color: m.color, marginTop: 2 }}>{m.rate} rate</div>
              </div>
            ))}
          </div>
        </div>

        {/* CONFIRM BAR */}
        {!confirmed
          ? <div className="confirm-bar" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="confirm-bar-title">Does this look right?</div>
              <div className="confirm-bar-sub">Fix anything above, then continue to calculate your real take-home numbers.</div>
              <button className="btn-confirm" style={{ width: "100%", padding: 18, fontSize: 17, marginTop: 14 }} onClick={onContinue}>Continue to My Earnings →</button>
              <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginTop: 10 }}>Next: See exactly what you take home at every milestone</div>
              <button className="btn-fix" style={{ alignSelf: "center", marginTop: 10 }}>Something's wrong</button>
            </div>
          : <div style={{ background: "var(--green-light)", border: "1.5px solid var(--green)", borderRadius: 20, padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 34 }}>🥕</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>Comp plan confirmed!</div>
                <div style={{ fontSize: 15, color: "var(--green)", opacity: 0.85 }}>Now let's calculate what you actually take home at each milestone</div>
              </div>
              <button onClick={onContinue} style={{ marginLeft: "auto", background: "var(--green)", color: "white", border: "none", borderRadius: 100, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                See My Numbers →
              </button>
            </div>
        }

      </div>
    </div>
  );
}
