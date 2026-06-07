import { useState, useEffect, useMemo } from "react";

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
  font-family:'Playfair Display',serif;font-size:20px;font-weight:900;
  color:var(--carrot);cursor:pointer;background:none;border:none;
}
.nav-links{display:flex;align-items:center;gap:32px;}
.nav-link{
  color:rgba(255,255,255,0.65);font-size:15px;font-weight:500;
  cursor:pointer;transition:color 0.2s;background:none;border:none;
  font-family:'DM Sans',sans-serif;text-decoration:none;
}
.nav-link:hover{color:white;}
.nav-cta{
  background:var(--carrot);color:white;border:none;border-radius:100px;
  padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all 0.2s;
}
.nav-cta:hover{background:var(--carrot-dark);transform:translateY(-1px);box-shadow:0 6px 20px rgba(244,113,26,0.35);}

/* ── HERO ── */
.hero{background:var(--dark);padding:88px 24px 100px;text-align:center;}
.hero-badge{
  display:inline-flex;align-items:center;
  background:rgba(244,113,26,0.15);border:1px solid rgba(244,113,26,0.3);
  border-radius:100px;padding:6px 18px;font-size:15px;font-weight:700;
  color:#FDBA74;letter-spacing:0.5px;margin-bottom:28px;
}
.hero-carrot{
  font-size:80px;line-height:1;display:inline-block;
  margin-bottom:28px;animation:bounce 2.2s ease-in-out infinite;
}
.hero-title{
  font-family:'Playfair Display',serif;font-size:64px;font-weight:900;
  color:white;line-height:1.06;
  max-width:820px;margin:0 auto 24px;
}
.hero-title .hl{color:var(--carrot);}
.hero-sub{
  font-size:24px;color:rgba(255,255,255,0.6);line-height:1.5;
  max-width:560px;margin:0 auto 36px;
}
.hero-cta{
  display:inline-block;background:var(--carrot);color:white;border:none;
  border-radius:100px;padding:18px 42px;font-size:17px;font-weight:700;
  cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;
  margin-bottom:24px;
}
.hero-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}
.hero-hint{font-size:17px;color:rgba(255,255,255,0.65);line-height:1.8;}

/* ── CARROTS SECTION ── */
.carrots-section{background:var(--cream);padding:96px 24px;}
.sec-inner{max-width:900px;margin:0 auto;}
.sec-label{
  font-family:'Playfair Display',serif;font-size:28px;font-weight:700;
  color:var(--carrot);margin-bottom:8px;
}
.sec-title{
  font-family:'Playfair Display',serif;font-size:40px;font-weight:900;
  color:var(--ink);margin-bottom:40px;line-height:1.15;
}
.carrot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;}
.carrot-card{
  background:white;border:1.5px solid var(--border);border-radius:16px;
  padding:20px;display:flex;align-items:center;gap:14px;transition:all 0.2s;
}
.carrot-card:hover{border-color:var(--carrot);transform:translateY(-2px);box-shadow:0 6px 20px rgba(244,113,26,0.1);}
.carrot-card-emoji{font-size:24px;flex-shrink:0;}
.carrot-card-text{font-size:15px;font-weight:600;color:var(--ink);}
.carrots-p1{font-size:17px;color:var(--muted);line-height:1.65;margin-bottom:18px;}
.carrots-p2{font-size:19px;font-weight:700;color:var(--ink);line-height:1.55;margin-bottom:40px;}
.activities-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;}
.ac-step{font-size:15px;font-weight:600;color:var(--ink);}
.ac-step.last{color:var(--carrot);font-weight:800;}
.ac-arrow{color:var(--carrot);font-size:15px;font-weight:700;padding:0 6px;}

/* ── PROBLEM SECTION ── */
.problem-section{background:var(--dark2);padding:96px 24px;}
.problem-inner{max-width:960px;margin:0 auto;}
.prob-label{
  font-family:'Playfair Display',serif;font-size:28px;font-weight:700;
  color:var(--carrot);margin-bottom:8px;
}
.prob-title{
  font-family:'Playfair Display',serif;font-size:44px;font-weight:900;
  color:white;margin-bottom:40px;line-height:1.12;
}
.prob-lines{margin-bottom:36px;}
.prob-line{font-size:19px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:12px;}
.prob-line.bold{font-weight:700;color:white;font-size:20px;}
.prob-callout{
  border-left:3px solid var(--carrot);padding:22px 26px;margin-bottom:28px;
  background:rgba(255,255,255,0.03);border-radius:0 12px 12px 0;
}
.prob-callout-line{font-size:16px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:10px;}
.prob-callout-line:last-child{margin-bottom:0;}
.prob-bottom{
  background:rgba(244,113,26,0.1);border:1px solid rgba(244,113,26,0.22);
  border-radius:16px;padding:28px 32px;
}
.prob-bottom-bold{font-size:19px;font-weight:700;color:white;margin-bottom:10px;}
.prob-bottom-muted{font-size:16px;color:rgba(255,255,255,0.5);line-height:1.65;}
.prob-sub{font-size:17px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:36px;}
.prob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:28px;}
.prob-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;}
.prob-card.highlight{border-left:3px solid var(--carrot);}
.prob-card-label{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;}
.prob-card-label.orange{color:var(--carrot);}
.prob-card-label.red{color:#FCA5A5;}
.prob-card-line{font-size:15px;color:rgba(255,255,255,0.8);line-height:1.5;margin-bottom:10px;display:flex;gap:8px;align-items:flex-start;}
.prob-card-note{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;margin-top:14px;}
.prob-final{background:rgba(15,10,5,0.6);border:1.5px solid rgba(244,113,26,0.4);border-radius:20px;padding:32px;text-align:center;}
.prob-final-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:white;margin-bottom:12px;}
.prob-final-sub{font-size:17px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:20px;}
.prob-final-line{font-size:14px;color:rgba(255,255,255,0.45);line-height:1.8;}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .lnav{padding:14px 20px;}
  .nav-links{display:none;}
  .hero-title{font-size:38px;}
  .hero-sub{font-size:19px;}
  .sec-title{font-size:30px;}
  .prob-title{font-size:32px;}
  .carrot-grid{grid-template-columns:repeat(2,1fr);}
  .prob-grid{grid-template-columns:1fr;}
}
@media(max-width:480px){
  .hero{padding:60px 20px 72px;}
  .hero-title{font-size:38px;}
  .hero-sub{font-size:17px;}
  .carrots-section,.problem-section{padding:64px 20px;}
  .carrot-grid{grid-template-columns:1fr;}
  .prob-title{font-size:28px;}
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

const FLOW = ["signup", "upload", "summary", "paycheck", "carrots", "playbook"];
const FLOW_LABELS = ["Account", "Upload", "Summary", "Paycheck", "Carrots", "Playbook"];
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
.ob-back{background:white;border:1.5px solid var(--border);border-radius:100px;padding:7px 16px;font-size:14px;font-weight:600;color:var(--muted);cursor:pointer;font-family:'DM Sans',sans-serif;}
.ob-back:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-progress{flex:1;display:flex;gap:6px;align-items:center;justify-content:center;}
.ob-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all 0.3s;}
.ob-dot.active{background:var(--carrot);width:26px;border-radius:4px;}
.ob-dot.done{background:var(--green);}
.ob-steplbl{font-size:13px;font-weight:700;color:var(--muted);min-width:48px;text-align:right;}
.ob-screen{max-width:560px;margin:0 auto;padding:34px 20px 70px;animation:fadeUp 0.35s ease;}
.ob-eyebrow{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--carrot);margin-bottom:8px;}
.ob-h1{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:var(--ink);margin-bottom:8px;line-height:1.15;}
.ob-subt{font-size:15px;color:var(--muted);line-height:1.55;margin-bottom:26px;}
.ob-field{margin-bottom:18px;}
.ob-label{display:block;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.ob-inp{width:100%;padding:13px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:16px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);}
.ob-inp:focus{outline:none;border-color:var(--carrot);}
select.ob-inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A6A55' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}
.ob-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.ob-btn{width:100%;padding:16px;border-radius:100px;border:none;background:var(--carrot);color:white;font-size:17px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;margin-top:10px;}
.ob-btn:hover{background:var(--carrot-dark);}
.ob-btn:disabled{opacity:0.4;cursor:not-allowed;}
.ob-card{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:16px;}
.ob-note{background:var(--green-light);border:1px solid var(--green);border-radius:12px;padding:12px 16px;font-size:13px;color:var(--green);line-height:1.5;margin-bottom:20px;display:flex;gap:10px;}
.ob-drop{border:2px dashed var(--border);border-radius:18px;padding:44px 24px;text-align:center;cursor:pointer;background:white;transition:all 0.2s;margin-bottom:16px;}
.ob-drop:hover{border-color:var(--carrot);background:var(--carrot-light);}
.ob-drop.has{border-style:solid;border-color:var(--green);background:var(--green-light);}
.ob-coach{background:linear-gradient(145deg,#0F0A05,#2D1A0A);border-radius:20px;padding:22px;color:white;margin-bottom:18px;}
.ob-coach-badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;background:rgba(244,113,26,0.25);color:#FDBA74;margin-bottom:12px;}
.ob-coach-line{font-size:14px;line-height:1.65;color:rgba(255,255,255,0.85);margin-bottom:8px;}
.ob-coach-line:last-child{margin-bottom:0;}
.ob-ote{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:20px;padding:26px;color:white;margin-bottom:18px;text-align:center;}
.ob-ote-lbl{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.85;margin-bottom:6px;}
.ob-ote-val{font-family:'Playfair Display',serif;font-size:46px;font-weight:900;line-height:1;}
.ob-split{display:flex;gap:12px;margin-top:18px;}
.ob-split-item{flex:1;background:rgba(255,255,255,0.16);border-radius:12px;padding:12px;}
.ob-split-k{font-size:11px;opacity:0.85;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.ob-split-v{font-size:18px;font-weight:800;}
.ob-stat{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid var(--border);}
.ob-stat:last-child{border-bottom:none;}
.ob-stat-lbl{font-size:14px;color:var(--muted);}
.ob-stat-sub{font-size:11px;color:var(--muted);opacity:0.8;}
.ob-stat-val{font-size:17px;font-weight:700;color:var(--ink);text-align:right;}
.ob-stat-val.green{color:var(--green);}
.ob-stat-val.red{color:#DC2626;}
.ob-tabs{display:flex;gap:6px;background:var(--cream);border:1.5px solid var(--border);border-radius:14px;padding:5px;margin-bottom:22px;}
.ob-tab{flex:1;padding:11px 6px;border:none;background:none;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;color:var(--muted);}
.ob-tab.on{background:white;color:var(--carrot);box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.ob-slider{width:100%;accent-color:var(--carrot);cursor:pointer;margin:8px 0 4px;}
.ob-target{font-family:'Playfair Display',serif;font-size:54px;font-weight:900;color:var(--carrot);text-align:center;line-height:1;}
.ob-target-sub{text-align:center;font-size:13px;color:var(--muted);margin-bottom:10px;}
.ob-add{width:100%;padding:13px;border:2px dashed var(--border);border-radius:14px;background:white;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--muted);font-size:14px;}
.ob-add:hover{border-color:var(--carrot);color:var(--carrot);}
.ob-add:disabled{opacity:0.45;cursor:not-allowed;}
.ob-del{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;}
.ob-del:hover{color:#DC2626;}
.ob-pill-row{display:flex;gap:8px;flex-wrap:wrap;}
.ob-pill{padding:8px 14px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.ob-pill.on{border-color:var(--carrot);background:var(--carrot);color:white;}
.ob-toggle{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:var(--ink);font-weight:600;}
.ob-track{width:44px;height:25px;border-radius:100px;background:var(--border);position:relative;transition:all 0.2s;flex-shrink:0;}
.ob-track.on{background:var(--green);}
.ob-knob{position:absolute;top:2.5px;left:2.5px;width:20px;height:20px;border-radius:50%;background:white;transition:all 0.2s;}
.ob-track.on .ob-knob{left:21.5px;}
.ob-opt{border:2px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;background:white;margin-bottom:10px;transition:all 0.2s;}
.ob-opt:hover{border-color:var(--carrot);}
.ob-opt.on{border-color:var(--carrot);background:var(--carrot-light);}
.ob-money-line{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:12px;background:rgba(244,113,26,0.1);border:1px solid rgba(244,113,26,0.3);margin-bottom:14px;}
.ob-money-line .v{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:var(--carrot-dark);}
.ob-sec-h{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin:26px 0 4px;}
.ob-sec-sub{font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.5;}
/* dashboard */
.ob-dash{max-width:560px;margin:0 auto;padding:20px 16px 170px;animation:fadeUp 0.35s ease;}
.ob-dash-hero{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:22px;padding:26px;color:white;margin-bottom:20px;position:relative;overflow:hidden;}
.ob-dash-hero::after{content:'🥕';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:72px;opacity:0.13;}
.ob-dash-name{font-size:14px;opacity:0.9;margin-bottom:6px;}
.ob-dash-pct{font-family:'Playfair Display',serif;font-size:46px;font-weight:900;line-height:1;}
.ob-prog-bar{height:12px;background:var(--border);border-radius:6px;overflow:hidden;margin:8px 0 6px;}
.ob-prog-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot));border-radius:6px;transition:width 0.6s ease;}
.ob-metric{background:white;border:1.5px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;}
.ob-metric-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.ob-status{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;}
.st-stretch{background:var(--green-light);color:var(--green);}
.st-floor{background:#EFF6FF;color:#1D4ED8;}
.st-below{background:#FEE2E2;color:#DC2626;}
.ob-carrotbar{position:fixed;bottom:62px;left:0;right:0;z-index:60;background:linear-gradient(135deg,#1A1208,#2D1A0A);color:white;padding:10px 16px;border-top:1px solid rgba(244,113,26,0.25);}
.ob-carrotbar-inner{max-width:560px;margin:0 auto;}
.ob-cb-top{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:rgba(255,255,255,0.7);}
.ob-cb-amt{font-family:'Playfair Display',serif;font-size:16px;font-weight:900;color:var(--carrot);}
.ob-cb-track{height:8px;background:rgba(255,255,255,0.15);border-radius:5px;overflow:hidden;margin-top:6px;}
.ob-cb-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot),var(--green));border-radius:5px;transition:width 0.6s ease;}
.ob-tabbar{position:fixed;bottom:0;left:0;right:0;z-index:70;display:flex;background:rgba(255,250,244,0.98);backdrop-filter:blur(10px);border-top:1px solid var(--border);}
.ob-tabbar-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 11px;border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);}
.ob-tabbar-tab.on{color:var(--carrot);}
.ob-tabbar-ico{font-size:19px;line-height:1;}
.ob-tabbar-lbl{font-size:10px;font-weight:700;}
@media(max-width:480px){.ob-row{grid-template-columns:1fr;}}
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
  const [comp] = useState({ base: 150000, quota: 1500000, commissionRate: 8, accelerator: 1.5 });
  const [k401Pct, setK401Pct]   = useState(6);
  const [healthMo, setHealthMo] = useState(200);
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
    const taxable = Math.max(0, gross - k - health);
    const fed = taxable * getFedBracket(gross).rate / 100;
    const st = taxable * stateTaxPct / 100;
    const fica = gross * 0.0765;
    return gross - fed - st - fica - k - health;
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

  const goFlow = (s) => { setScreen(s); window.scrollTo(0, 0); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          <button className="nav-cta" onClick={() => goFlow("signup")}>
            Build My Playbook
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
          <button className="hero-cta" onClick={() => goFlow("signup")}>
            Build My Personal Playbook →
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
          .coach-quote{font-size:19px;font-style:italic;color:rgba(255,255,255,0.7);margin-bottom:12px;line-height:1.6;}
          .coach-coachsub{font-size:16px;color:rgba(255,255,255,0.5);margin-bottom:48px;}
          .coach-role-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px;}
          .coach-role-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;display:flex;gap:18px;align-items:flex-start;}
          .coach-role-icon{width:56px;height:56px;border-radius:50%;border:1.5px solid rgba(244,113,26,0.5);background:rgba(244,113,26,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
          .coach-role-body{flex:1;min-width:0;}
          .coach-role-head{display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;}
          .coach-role-title{font-size:16px;font-weight:700;color:white;display:inline-block;border-bottom:2px solid var(--carrot);padding-bottom:3px;}
          .coach-role-tag{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--carrot);background:rgba(244,113,26,0.15);border-radius:100px;padding:3px 10px;}
          .coach-role-desc{font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;margin-top:10px;}
          .coach-ask-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;}
          .coach-q-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:44px;}
          .coach-q-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;font-size:15px;font-style:italic;color:rgba(255,255,255,0.75);line-height:1.5;}
          .coach-bottom-row{display:flex;flex-wrap:wrap;gap:32px;align-items:baseline;}
          .coach-br-muted{font-size:17px;color:rgba(255,255,255,0.45);}
          .coach-br-bold{font-size:17px;font-weight:700;color:white;}

          /* ── MOST COMPANIES ── */
          .diff-section{background:var(--cream);padding:96px 24px;}
          .diff-inner{max-width:900px;margin:0 auto;}
          .diff-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px;}
          .diff-col{border-radius:20px;padding:28px;}
          .diff-col.red{background:rgba(220,38,38,0.06);border:1.5px solid rgba(220,38,38,0.18);}
          .diff-col.green{background:rgba(45,106,79,0.07);border:1.5px solid rgba(45,106,79,0.22);}
          .diff-col-title{font-size:14px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;}
          .diff-col.red .diff-col-title{color:#B91C1C;}
          .diff-col.green .diff-col-title{color:var(--green);}
          .diff-mandate{font-size:17px;font-weight:600;color:var(--ink);margin-bottom:12px;line-height:1.5;}
          .diff-note{font-size:15px;font-style:italic;color:var(--muted);line-height:1.6;}
          .diff-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;margin-bottom:16px;}
          .diff-chain-step{font-size:14px;font-weight:600;color:var(--ink);}
          .diff-chain-step.last{color:var(--carrot);font-weight:800;}
          .diff-chain-arrow{color:var(--carrot);padding:0 5px;font-size:14px;}
          .diff-insight{font-size:15px;color:var(--muted);line-height:1.65;}

          /* ── CHATGPT VS COACH ── */
          .compare-section{background:var(--dark2);padding:96px 24px;}
          .compare-inner{max-width:860px;margin:0 auto;}
          .compare-p{font-size:16px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:14px;}
          .compare-wrap{border-radius:16px;overflow:hidden;margin:36px 0 28px;}
          .compare-table{width:100%;border-collapse:collapse;}
          .compare-table th{padding:14px 18px;font-size:13px;font-weight:700;letter-spacing:0.5px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);}
          .compare-table td{padding:13px 18px;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06);}
          .compare-table tr:last-child td{border-bottom:none;}
          .th-feature{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);}
          .th-generic{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.03);text-align:center!important;}
          .th-coach{color:var(--carrot);background:rgba(244,113,26,0.1);text-align:center!important;}
          .td-feature{color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.02);}
          .td-generic{color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.02);text-align:center!important;}
          .td-coach{color:#86EFAC;background:rgba(244,113,26,0.05);text-align:center!important;font-weight:600;}
          .compare-callout{background:rgba(244,113,26,0.08);border:1.5px solid rgba(244,113,26,0.25);border-radius:14px;padding:22px 28px;font-size:17px;font-style:italic;color:rgba(255,255,255,0.8);text-align:center;}

          /* ── CARROT LADDER ── */
          .ladder-section{background:var(--cream);padding:96px 24px;}
          .ladder-inner{max-width:960px;margin:0 auto;}
          .ladder-sub{font-size:18px;color:var(--muted);margin-bottom:40px;line-height:1.5;}
          .ladder-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:44px;}
          .ladder-card{border-radius:20px;padding:28px;}
          .ladder-card.mini{background:var(--gold-light);border:1.5px solid var(--gold);}
          .ladder-card.medium{background:var(--green-light);border:1.5px solid rgba(45,106,79,0.3);}
          .ladder-card.big{background:var(--carrot-light);border:1.5px solid rgba(244,113,26,0.3);}
          .ladder-card-icon{font-size:20px;margin-bottom:10px;}
          .ladder-card-title{font-size:16px;font-weight:800;color:var(--ink);margin-bottom:4px;}
          .ladder-card-tag{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;}
          .ladder-item{font-size:14px;color:var(--ink);line-height:1.9;}
          .ladder-chain{display:flex;align-items:center;flex-wrap:wrap;gap:2px;}
          .lc-step{font-size:15px;font-weight:600;color:var(--ink);}
          .lc-step.last{color:var(--carrot);font-weight:800;}
          .lc-arrow{color:var(--carrot);padding:0 6px;font-size:15px;font-weight:700;}

          /* ── HOW COACH WORKS ── */
          .hcw-section{background:var(--cream);padding:96px 24px;}
          .hcw-inner{max-width:900px;margin:0 auto;}
          .hcw-sub{font-size:18px;color:var(--muted);line-height:1.5;margin-bottom:40px;}
          .hcw-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
          .hcw-card{background:white;border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .hcw-num{font-family:'Playfair Display',serif;font-size:44px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:12px;}
          .hcw-title{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:10px;}
          .hcw-desc{font-size:15px;color:var(--muted);line-height:1.65;}

          /* ── STOP SPREADSHEETS ── */
          .ss-section{background:var(--cream);padding:96px 24px;}
          .ss-inner{max-width:900px;margin:0 auto;}
          .ss-body{margin:0 0 40px;}
          .ss-line{font-size:17px;color:var(--muted);line-height:1.7;margin-bottom:12px;}
          .ss-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px;}
          .ss-col{border-radius:20px;padding:24px;}
          .ss-col.today{border:1.5px solid rgba(26,18,8,0.25);background:rgba(26,18,8,0.03);}
          .ss-col.coach{border:1.5px solid rgba(244,113,26,0.4);background:rgba(244,113,26,0.05);}
          .ss-col-label{font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;}
          .ss-col.today .ss-col-label{color:var(--muted);}
          .ss-col.coach .ss-col-label{color:var(--carrot);}
          .ss-step{border-radius:12px;padding:12px 16px;font-size:14px;font-weight:600;text-align:center;line-height:1.4;}
          .ss-col.today .ss-step{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.18);color:#7A2020;}
          .ss-col.coach .ss-step{background:white;border:1px solid rgba(244,113,26,0.3);color:var(--ink);}
          .ss-arrow{text-align:center;font-size:16px;line-height:1;margin:6px 0;}
          .ss-col.today .ss-arrow{color:rgba(220,38,38,0.4);}
          .ss-col.coach .ss-arrow{color:var(--carrot);}
          .ss-closing{text-align:center;}
          .ss-closing-muted{font-size:18px;color:var(--muted);margin-bottom:8px;}
          .ss-closing-bold{font-size:20px;font-weight:700;color:var(--ink);}

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
          .step-num{font-size:11px;font-weight:800;letter-spacing:2px;color:var(--carrot);text-transform:uppercase;margin-bottom:10px;}
          .step-title{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:10px;line-height:1.3;}
          .step-desc{font-size:15px;color:var(--muted);line-height:1.65;}
          .step-checklist{margin-top:16px;display:flex;flex-direction:column;gap:8px;}
          .step-check-item{display:flex;align-items:flex-start;gap:8px;font-size:14px;color:var(--ink);line-height:1.4;}
          .step-check-icon{color:var(--carrot);flex-shrink:0;font-weight:700;}
          .steps-note{font-size:16px;color:var(--muted);margin-bottom:24px;text-align:center;}
          .steps-cta-btn{background:var(--carrot);color:white;border:none;border-radius:100px;padding:18px 42px;font-size:17px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
          .steps-cta-btn:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}

          /* ── 4:45 PM FRIDAY ── */
          .friday-section{background:linear-gradient(160deg,#071410,#0c2018,#091a12);padding:108px 24px;text-align:center;}
          .friday-inner{max-width:700px;margin:0 auto;}
          .friday-time{font-family:'Playfair Display',serif;font-size:72px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:52px;}
          .friday-line{font-size:20px;color:rgba(255,255,255,0.75);line-height:1.7;margin-bottom:4px;}
          .friday-line.bold{font-weight:700;color:white;}
          .friday-spacer{height:24px;}
          .friday-closing{font-size:24px;font-style:italic;color:rgba(255,255,255,0.9);margin-top:44px;margin-bottom:12px;line-height:1.4;}
          .friday-orange{font-size:24px;font-weight:800;color:var(--carrot);}

          /* ── PRICING ── */
          .pricing-section{background:white;padding:96px 24px;}
          .pricing-inner{max-width:1060px;margin:0 auto;}
          .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:40px;}
          .pcard{border-radius:24px;padding:32px;border:1.5px solid var(--border);display:flex;flex-direction:column;position:relative;}
          .pcard.featured{border-color:var(--carrot);border-top-width:4px;}
          .pcard.team{border-color:var(--green);}
          .most-popular-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--carrot);color:white;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:5px 16px;border-radius:100px;white-space:nowrap;}
          .ptier{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
          .ptier.orange{color:var(--carrot);}
          .ptier.standard{color:var(--muted);}
          .ptier.tgreen{color:var(--green);}
          .pname{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:var(--ink);margin-bottom:8px;}
          .pprice{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--ink);line-height:1;margin-bottom:4px;}
          .pprice-vol{font-size:18px;font-weight:700;color:var(--green);margin-bottom:4px;}
          .psub{font-size:14px;color:var(--muted);margin-bottom:20px;}
          .pdivider{height:1px;background:var(--border);margin-bottom:20px;}
          .pfeatures{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;flex:1;}
          .pfeature{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink);line-height:1.5;}
          .pcheck{font-size:13px;flex-shrink:0;margin-top:2px;font-weight:700;}
          .pcheck.orange{color:var(--carrot);}
          .pcheck.tgreen{color:var(--green);}
          .pbtn{display:block;width:100%;padding:14px 24px;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;text-align:center;margin-bottom:12px;}
          .pbtn.filled{background:var(--carrot);color:white;border:2px solid var(--carrot);}
          .pbtn.filled:hover{background:var(--carrot-dark);border-color:var(--carrot-dark);}
          .pbtn.outlined-orange{background:white;color:var(--carrot);border:2px solid var(--carrot);}
          .pbtn.outlined-orange:hover{background:var(--carrot-light);}
          .pbtn.outlined-green{background:white;color:var(--green);border:2px solid var(--green);}
          .pbtn.outlined-green:hover{background:var(--green-light);}
          .pnote{font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:6px;text-align:center;}
          .papproval-summary{display:block;margin-top:10px;padding:10px 16px;border-radius:100px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;text-align:center;transition:all 0.2s;}
          .papproval-summary.orange{border:1.5px solid var(--carrot);color:var(--carrot);background:white;}
          .papproval-summary.orange:hover{background:var(--carrot-light);}
          .papproval-summary.tgreen{border:1.5px solid var(--green);color:var(--green);background:white;}
          .papproval-summary.tgreen:hover{background:var(--green-light);}
          .email-box{margin-top:14px;background:var(--cream);border:1.5px solid var(--border);border-radius:16px;padding:18px;}
          .email-subject{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:12px;}
          .email-body{font-size:13px;color:var(--muted);line-height:1.7;white-space:pre-wrap;margin-bottom:14px;}
          .copy-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--ink);transition:all 0.2s;}
          .copy-btn:hover{border-color:var(--carrot);color:var(--carrot);}

          /* ── RESPONSIVE PART 3 ── */
          @media(max-width:900px){.pricing-grid{grid-template-columns:1fr;}}
          @media(max-width:600px){
            .steps-grid{grid-template-columns:1fr;}
            .friday-time{font-size:52px;}
            .friday-line{font-size:17px;}
            .friday-closing,.friday-orange{font-size:20px;}
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
                  $99<span style={{ fontSize: 20, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>/year</span>
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
                    <div className="email-subject">Subject: Approval Request — Earn The Carrot</div>
                    <div className="email-body">{MANAGER_EMAIL_BODY}</div>
                    <CopyButton
                      text={"Subject: Approval Request — Earn The Carrot\n\n" + MANAGER_EMAIL_BODY}
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
                    <div className="email-subject">Subject: Approval Request — Earn The Carrot</div>
                    <div className="email-body">{MANAGER_EMAIL_BODY}</div>
                    <CopyButton
                      text={"Subject: Approval Request — Earn The Carrot\n\n" + MANAGER_EMAIL_BODY}
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
          .roi-opening{font-size:17px;color:var(--muted);line-height:1.65;margin-bottom:40px;max-width:720px;}
          .roi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:32px;}
          .roi-card{background:white;border:1.5px solid var(--border);border-radius:20px;padding:28px;}
          .roi-card-emoji{font-size:28px;margin-bottom:14px;}
          .roi-card-title{font-size:17px;font-weight:700;color:var(--ink);margin-bottom:10px;}
          .roi-card-desc{font-size:15px;color:var(--muted);line-height:1.65;}
          .roi-box{background:rgba(244,113,26,0.07);border:1.5px solid rgba(244,113,26,0.25);border-radius:20px;padding:28px 32px;font-size:16px;color:var(--ink);line-height:1.75;}
          .roi-callout{background:white;border:1.5px solid var(--border);border-left:4px solid var(--carrot);border-radius:16px;padding:24px 28px;font-size:16px;color:var(--ink);line-height:1.7;margin-bottom:20px;}

          /* ── CLOSING ── */
          .closing-section{background:var(--dark);padding:100px 24px;text-align:center;}
          .closing-inner{max-width:700px;margin:0 auto;}
          .closing-carrot{font-size:64px;display:inline-block;animation:bounce 2.2s ease-in-out infinite;margin-bottom:28px;}
          .closing-title{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:white;line-height:1.1;margin-bottom:24px;}
          .closing-sub{font-size:17px;color:rgba(255,255,255,0.5);line-height:1.65;margin-bottom:16px;}
          .closing-note{font-size:16px;color:rgba(255,255,255,0.4);line-height:1.6;margin-bottom:36px;}
          .closing-lines{margin-bottom:36px;display:flex;flex-direction:column;gap:8px;}
          .closing-line{font-size:16px;font-weight:700;color:var(--carrot);}
          .closing-cta{background:var(--carrot);color:white;border:none;border-radius:100px;padding:18px 42px;font-size:17px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
          .closing-cta:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 12px 36px rgba(244,113,26,0.4);}

          /* ── FOOTER ── */
          .site-footer{background:var(--dark2);border-top:1px solid rgba(255,255,255,0.07);padding:28px 48px;}
          .footer-inner{max-width:1060px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}
          .footer-logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:var(--carrot);}
          .footer-links{display:flex;gap:6px;align-items:center;}
          .footer-link{font-size:13px;color:rgba(255,255,255,0.4);cursor:pointer;transition:color 0.2s;background:none;border:none;font-family:'DM Sans',sans-serif;}
          .footer-link:hover{color:rgba(255,255,255,0.7);}
          .footer-dot{color:rgba(255,255,255,0.18);font-size:13px;padding:0 2px;}
          .footer-tagline{font-size:13px;font-style:italic;color:rgba(255,255,255,0.22);}

          /* ── RESPONSIVE PART 4 ── */
          @media(max-width:768px){
            .roi-grid{grid-template-columns:1fr;}
            .closing-title{font-size:38px;}
            .site-footer{padding:24px 20px;}
            .footer-inner{flex-direction:column;text-align:center;gap:16px;}
          }
          @media(max-width:480px){
            .roi-section,.closing-section{padding:64px 20px;}
            .closing-title{font-size:32px;}
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
            <button className="closing-cta" onClick={() => goFlow("signup")}>
              Build My Personal Playbook →
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
                <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
                  On pace for {fmt(calcNet(calcGross(targetPct)))} take home
                </div>
              </div>
              <div className="ob-sec-h" style={{ marginTop: 0 }}>Today's activities</div>
              {metrics.map((m) => {
                const v = todayLog[m.id] || 0;
                const s = metricStatus(v, m);
                return (
                  <div key={m.id} className="ob-metric">
                    <div className="ob-metric-hdr">
                      <span style={{ fontSize: 18 }}>{m.emoji}</span>
                      <strong style={{ flex: 1 }}>{m.label}</strong>
                      <span className={`ob-status ${s.cls}`}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="ob-del" style={{ fontSize: 22 }} onClick={() => setTodayLog({ ...todayLog, [m.id]: Math.max(0, v - 1) })}>−</button>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, minWidth: 36, textAlign: "center" }}>{v}</span>
                      <button className="ob-del" style={{ fontSize: 22 }} onClick={() => setTodayLog({ ...todayLog, [m.id]: v + 1 })}>+</button>
                      <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>Floor {m.floor} · Stretch {m.stretch}</span>
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
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{fmt(c.applied)} / {fmt(c.cost)}</span>
                    </div>
                    <div className="ob-prog-bar"><div className="ob-prog-fill" style={{ width: `${pctFill}%` }} /></div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{Math.round(pctFill)}% funded</div>
                  </div>
                );
              })}
            </>
          )}
          {activeTab !== "home" && (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{activeMeta?.ico}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{activeMeta?.lbl}</div>
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

  // ══ ONBOARDING STEP SCREENS ══════════════════════════════════════════
  if (FLOW.includes(screen)) {
    const idx = FLOW.indexOf(screen);
    let body = null;

    if (screen === "signup") {
      body = (
        <>
          <div className="ob-eyebrow">Step 1 of 6 · Create account</div>
          <h1 className="ob-h1">Create your account</h1>
          <p className="ob-subt">A few details so Coach can personalize your earnings math.</p>
          <div className="ob-field">
            <label className="ob-label">Full name</label>
            <input className="ob-inp" value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Jordan Rivera" />
          </div>
          <div className="ob-field">
            <label className="ob-label">Work email</label>
            <input className="ob-inp" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="ob-row">
            <div className="ob-field">
              <label className="ob-label">State</label>
              <select className="ob-inp" value={suState} onChange={(e) => setSuState(e.target.value)}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="ob-field">
              <label className="ob-label">Age bracket</label>
              <select className="ob-inp" value={suAge} onChange={(e) => setSuAge(e.target.value)}>
                {AGE_BRACKETS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <p className="ob-sec-sub" style={{ marginTop: -8 }}>Age bracket sets your 401k contribution limit ({fmt(K401_LIMITS[suAge])} per year).</p>
          <div className="ob-field">
            <label className="ob-label">Password</label>
            <input className="ob-inp" type="password" value={suPass} onChange={(e) => setSuPass(e.target.value)} placeholder="Create a password" />
          </div>
          <button className="ob-btn" disabled={!suName || !suEmail || !suState || !suPass} onClick={() => goFlow("upload")}>Create My Account</button>
        </>
      );
    } else if (screen === "upload") {
      body = (
        <>
          <div className="ob-eyebrow">Step 2 of 6 · Compensation plan</div>
          <h1 className="ob-h1">Upload your comp plan</h1>
          <p className="ob-subt">Drop in your compensation plan PDF. Coach reads every line.</p>
          <label className={`ob-drop ${planFile ? "has" : ""}`}>
            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setPlanFile(e.target.files[0] || null)} />
            <div style={{ fontSize: 38, marginBottom: 10 }}>{planFile ? "✅" : "📄"}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{planFile ? planFile.name : "Click to upload your PDF"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{planFile ? "Tap to choose a different file" : "PDF up to 20 MB"}</div>
          </label>
          <div className="ob-note"><span>🔒</span><span>Your plan is private. We use it only to build your personal earnings model and never share it.</span></div>
          <button className="ob-btn" disabled={!planFile} onClick={() => goFlow("summary")}>Analyze My Plan</button>
        </>
      );
    } else if (screen === "summary") {
      body = (
        <>
          <div className="ob-eyebrow">Step 3 of 6 · Plan analysis</div>
          <h1 className="ob-h1">Here is your plan</h1>
          <p className="ob-subt">Coach analyzed your compensation plan. Here is what stood out.</p>
          <div className="ob-coach">
            <span className="ob-coach-badge">🥕 Coach analysis</span>
            <p className="ob-coach-line">Your base salary is {fmt(comp.base)} with an annual quota of {fmt(comp.quota)}.</p>
            <p className="ob-coach-line">You earn {comp.commissionRate}% commission, with a {comp.accelerator}x accelerator on everything above 100% of quota.</p>
            <p className="ob-coach-line">Hit quota and you are looking at {fmt(grossAt100)} on-target earnings. The accelerator means overperformance pays off fast.</p>
          </div>
          <div className="ob-ote">
            <div className="ob-ote-lbl">On-target earnings</div>
            <div className="ob-ote-val">{fmt(grossAt100)}</div>
            <div className="ob-split">
              <div className="ob-split-item"><div className="ob-split-k">Base</div><div className="ob-split-v">{fmt(comp.base)}</div></div>
              <div className="ob-split-item"><div className="ob-split-k">Commission</div><div className="ob-split-v">{fmt(commAt100)}</div></div>
            </div>
          </div>
          <button className="ob-btn" onClick={() => goFlow("paycheck")}>See My Paycheck</button>
        </>
      );
    } else if (screen === "paycheck") {
      const gross = grossAt100;
      const k = Math.min(gross * k401Pct / 100, k401Limit);
      const health = healthMo * 12;
      const taxable = Math.max(0, gross - k - health);
      const fed = taxable * getFedBracket(gross).rate / 100;
      const st = taxable * stateTaxPct / 100;
      const fica = gross * 0.0765;
      const net = calcNet(gross);
      const netBaseAlone = calcNet(comp.base);
      const commTakeHome = net - netBaseAlone;
      body = (
        <>
          <div className="ob-eyebrow">Step 4 of 6 · Take-home</div>
          <h1 className="ob-h1">Your real paycheck</h1>
          <p className="ob-subt">At 100% of quota, here is what actually lands in your bank account.</p>
          <div className="ob-card">
            <label className="ob-label">401k contribution: {k401Pct}%</label>
            <input className="ob-slider" type="range" min="0" max="50" value={k401Pct} onChange={(e) => setK401Pct(+e.target.value)} />
            <p className="ob-sec-sub" style={{ marginBottom: 6 }}>Limit for {suAge}: {fmt(k401Limit)} per year · contributing {fmt(k)}</p>
            <label className="ob-label" style={{ marginTop: 10 }}>Health insurance: {fmt(healthMo)} per month</label>
            <input className="ob-slider" type="range" min="0" max="1500" step="25" value={healthMo} onChange={(e) => setHealthMo(+e.target.value)} />
          </div>
          <div className="ob-card">
            <div className="ob-stat"><div className="ob-stat-lbl">Base take home</div><div className="ob-stat-val">{fmt(netBaseAlone)}</div></div>
            <div className="ob-stat"><div className="ob-stat-lbl">Commission take home</div><div className="ob-stat-val green">{fmt(commTakeHome)}</div></div>
            <div className="ob-stat"><div><div className="ob-stat-lbl">401k (pre-tax)</div><div className="ob-stat-sub">reduces taxable income</div></div><div className="ob-stat-val">−{fmt(k)}</div></div>
            <div className="ob-stat"><div><div className="ob-stat-lbl">Health (pre-tax)</div><div className="ob-stat-sub">reduces taxable income</div></div><div className="ob-stat-val">−{fmt(health)}</div></div>
            <div className="ob-stat"><div><div className="ob-stat-lbl">Federal tax ({getFedBracket(gross).rate}%)</div><div className="ob-stat-sub">on income after pre-tax</div></div><div className="ob-stat-val red">−{fmt(fed)}</div></div>
            <div className="ob-stat"><div><div className="ob-stat-lbl">State tax ({stateTaxPct}%)</div><div className="ob-stat-sub">{suState || "—"}</div></div><div className="ob-stat-val red">−{fmt(st)}</div></div>
            <div className="ob-stat"><div><div className="ob-stat-lbl">FICA (7.65%)</div><div className="ob-stat-sub">on full gross</div></div><div className="ob-stat-val red">−{fmt(fica)}</div></div>
            <div className="ob-stat"><div className="ob-stat-lbl" style={{ fontWeight: 800, color: "var(--ink)" }}>Total take home</div><div className="ob-stat-val green">{fmt(net)}</div></div>
          </div>
          <button className="ob-btn" onClick={() => goFlow("carrots")}>Set My Carrots</button>
        </>
      );
    } else if (screen === "carrots") {
      body = (
        <>
          <div className="ob-eyebrow">Step 5 of 6 · Your carrots</div>
          <h1 className="ob-h1">Define your carrots</h1>
          <p className="ob-subt">The rewards you are working toward. This is your why.</p>
          <div className="ob-tabs">
            {[["big", "Big"], ["medium", "Medium"], ["mini", "Mini"]].map(([k, l]) => (
              <button key={k} className={`ob-tab ${carrotTab === k ? "on" : ""}`} onClick={() => setCarrotTab(k)}>{l}</button>
            ))}
          </div>
          {carrotTab === "big" && (
            <>
              {bigCarrots.map((c) => {
                const p = pctToFund(+c.cost);
                return (
                  <div key={c.id} className="ob-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <strong>Big Carrot</strong>
                      <button className="ob-del" onClick={() => setBigCarrots(bigCarrots.filter((x) => x.id !== c.id))}>×</button>
                    </div>
                    <input className="ob-inp" style={{ marginBottom: 10 }} placeholder="What is it?" value={c.name} onChange={(e) => setBigCarrots(bigCarrots.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))} />
                    <input className="ob-inp" type="number" placeholder="Cost" value={c.cost} onChange={(e) => setBigCarrots(bigCarrots.map((x) => x.id === c.id ? { ...x, cost: +e.target.value } : x))} />
                    {+c.cost > 0 && <p className="ob-sec-sub" style={{ marginTop: 8 }}>{p ? `Fully funded at ${p}% of plan` : "Beyond 300% of plan"}</p>}
                  </div>
                );
              })}
              <button className="ob-add" disabled={bigCarrots.length >= 2} onClick={() => setBigCarrots([...bigCarrots, { id: bigCarrots.reduce((m, c) => Math.max(m, c.id), 0) + 1, name: "", cost: 0 }])}>
                + Add Big Carrot{bigCarrots.length >= 2 ? " (max 2)" : ""}
              </button>
            </>
          )}
          {carrotTab === "medium" && (
            <>
              {medCarrots.map((c) => (
                <div key={c.id} className="ob-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Medium Carrot</strong>
                    <button className="ob-del" onClick={() => setMedCarrots(medCarrots.filter((x) => x.id !== c.id))}>×</button>
                  </div>
                  <input className="ob-inp" style={{ marginBottom: 10 }} placeholder="What is it?" value={c.name} onChange={(e) => setMedCarrots(medCarrots.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))} />
                  <div className="ob-row">
                    <input className="ob-inp" type="number" placeholder="Cost" value={c.cost} onChange={(e) => setMedCarrots(medCarrots.map((x) => x.id === c.id ? { ...x, cost: +e.target.value } : x))} />
                    <select className="ob-inp" value={c.period} onChange={(e) => setMedCarrots(medCarrots.map((x) => x.id === c.id ? { ...x, period: e.target.value } : x))}>
                      {["Monthly", "Quarterly", "Twice a year"].map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button className="ob-add" onClick={() => setMedCarrots([...medCarrots, { id: medCarrots.reduce((m, c) => Math.max(m, c.id), 0) + 1, name: "", cost: 0, period: "Quarterly" }])}>+ Add Medium Carrot</button>
            </>
          )}
          {carrotTab === "mini" && (
            <>
              <p className="ob-sec-sub">One small treat tied to each activity. You earn it when you hit that activity's stretch goal.</p>
              {metrics.map((m) => (
                <div key={m.id} className="ob-card">
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{m.emoji} {m.label}</div>
                  <input className="ob-inp" placeholder="Mini treat (e.g. fancy coffee)" value={m.treat} onChange={(e) => updateMetric(m.id, { treat: e.target.value })} />
                </div>
              ))}
            </>
          )}
          <button className="ob-btn" onClick={() => goFlow("playbook")}>Build My Playbook</button>
        </>
      );
    } else if (screen === "playbook") {
      const gross = calcGross(targetPct);
      const net = calcNet(gross);
      const netBaseAlone = calcNet(comp.base);
      const commTakeHome = net - netBaseAlone;
      body = (
        <>
          <div className="ob-eyebrow">Step 6 of 6 · Your playbook</div>
          <h1 className="ob-h1">Your personal playbook</h1>
          <p className="ob-subt">Set your target, then tune the activities that get you there.</p>
          <div className="ob-card">
            <div className="ob-target">{targetPct}%</div>
            <div className="ob-target-sub">of plan target</div>
            <input className="ob-slider" type="range" min="50" max="300" value={targetPct} onChange={(e) => setTargetPct(+e.target.value)} />
            <div className="ob-stat"><div className="ob-stat-lbl">Base take home</div><div className="ob-stat-val">{fmt(netBaseAlone)}</div></div>
            <div className="ob-stat"><div className="ob-stat-lbl">Commission take home</div><div className="ob-stat-val green">{fmt(commTakeHome)}</div></div>
          </div>
          {targetPct > 100 && (
            <div className="ob-money-line"><span style={{ fontWeight: 700 }}>🥕 Carrot money (above 100%)</span><span className="v">{fmt(carrotMoney)}</span></div>
          )}
          <div className="ob-sec-h">Your activities</div>
          <p className="ob-sec-sub">Floor keeps you on track. Stretch unlocks your mini carrot.</p>
          {metrics.map((m) => (
            <div key={m.id} className="ob-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
                <strong>{m.emoji} {m.label}</strong>
                <div className="ob-pill-row">
                  {["Daily", "Weekly", "Monthly"].map((f) => (
                    <button key={f} className={`ob-pill ${m.freq === f ? "on" : ""}`} onClick={() => updateMetric(m.id, { freq: f })}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="ob-row">
                <div><label className="ob-label">Floor</label><input className="ob-inp" type="number" value={m.floor} onChange={(e) => updateMetric(m.id, { floor: +e.target.value })} /></div>
                <div><label className="ob-label">Stretch</label><input className="ob-inp" type="number" value={m.stretch} onChange={(e) => updateMetric(m.id, { stretch: +e.target.value })} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="ob-toggle" onClick={() => updateMetric(m.id, { reminder: !m.reminder })}>
                  <span className={`ob-track ${m.reminder ? "on" : ""}`}><span className="ob-knob" /></span> Reminder
                </button>
              </div>
              <div className="ob-field" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="ob-label">Mini carrot treat</label>
                <input className="ob-inp" placeholder="e.g. fancy coffee" value={m.treat} onChange={(e) => updateMetric(m.id, { treat: e.target.value })} />
              </div>
            </div>
          ))}
          <div className="ob-sec-h">How will you track?</div>
          {[
            ["manual", "✍️ Manual entry", "Log your numbers each day or week"],
            ["crm", "🔗 Connect CRM", "Pull activities automatically from your CRM"],
            ["csv", "📊 CSV upload", "Upload a weekly export"],
          ].map(([k, t, d]) => (
            <div key={k} className={`ob-opt ${trackingMethod === k ? "on" : ""}`} onClick={() => setTrackingMethod(k)}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{d}</div>
            </div>
          ))}
          <button className="ob-btn" onClick={() => goFlow("dashboard")}>Go to My Dashboard</button>
        </>
      );
    }

    return (
      <div className="ob">
        <style>{S}</style>
        <style>{OB_STYLES}</style>
        <div className="ob-top">
          <button className="ob-back" onClick={() => goFlow(idx === 0 ? "landing" : FLOW[idx - 1])}>← Back</button>
          <div className="ob-progress">
            {FLOW.map((s, i) => (
              <div key={s} className={`ob-dot ${i === idx ? "active" : i < idx ? "done" : ""}`} title={FLOW_LABELS[i]} />
            ))}
          </div>
          <div className="ob-steplbl">{idx + 1} / {FLOW.length}</div>
        </div>
        <div className="ob-screen">{body}</div>
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
