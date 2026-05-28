import { useState, useMemo } from "react";

// ── STATE TAX RATES ──────────────────────────────────────────────
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
  "West Virginia":5.12,"Wisconsin":5.3,"Wyoming":0,"Washington D.C.":8.5
};

const STATES = Object.keys(STATE_TAXES).sort();

// ── FEDERAL TAX BRACKETS (2025, single filer, marginal) ──────────
function getFedBracket(income) {
  if (income <= 11925)  return { rate: 10, label: "10% bracket" };
  if (income <= 48475)  return { rate: 12, label: "12% bracket" };
  if (income <= 103350) return { rate: 22, label: "22% bracket" };
  if (income <= 197300) return { rate: 24, label: "24% bracket" };
  if (income <= 250525) return { rate: 32, label: "32% bracket" };
  if (income <= 626350) return { rate: 35, label: "35% bracket" };
  return { rate: 37, label: "37% bracket" };
}

// ── 401K ─────────────────────────────────────────────────────────
const K401_LIMIT = 23500; // 2025 IRS limit

function get401kMaxMonth(annualSalary, pct) {
  if (!pct || !annualSalary) return null;
  const monthlyContrib = (annualSalary * pct / 100) / 12;
  const monthsToMax = K401_LIMIT / monthlyContrib;
  if (monthsToMax >= 12) return null;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[Math.floor(monthsToMax)];
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --carrot: #F4711A; --carrot-dark: #C85A0D; --carrot-light: #FDE8D8;
    --green: #2D6A4F; --green-light: #D8F3DC;
    --gold: #E9C46A; --gold-light: #FFF9E6;
    --blue-light: #EFF6FF; --blue: #1D4ED8;
    --cream: #FFFAF4; --ink: #1A1208; --muted: #7A6A55; --border: #EDE0CC;
    --red-light: #FEE2E2; --red: #DC2626;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); }
  .app { min-height: 100vh; background: var(--cream);
    background-image: radial-gradient(circle at 20% 80%, #FDE8D810 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, #D8F3DC10 0%, transparent 50%); }

  /* NAV */
  .nav { display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px; border-bottom: 1px solid var(--border);
    background: rgba(255,250,244,0.95); backdrop-filter: blur(8px);
    position: sticky; top: 0; z-index: 100; }
  .nav-logo { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900;
    color: var(--carrot); display: flex; align-items: center; gap: 6px; }
  .nav-steps { display: flex; gap: 4px; }
  .nav-step { width: 8px; height: 8px; border-radius: 50%; background: var(--border); transition: all 0.3s; }
  .nav-step.active { background: var(--carrot); width: 24px; border-radius: 4px; }
  .nav-step.done { background: var(--green); }

  /* SCREENS */
  .screen { max-width: 720px; margin: 0 auto; padding: 48px 24px; animation: fadeUp 0.4s ease; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  /* WELCOME */
  .welcome-hero { text-align: center; padding: 32px 0 48px; }
  .welcome-carrot { font-size: 72px; margin-bottom: 16px; animation: bounce 2s ease infinite; display: inline-block; }
  @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
  .welcome-title { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 900; line-height: 1.1; color: var(--ink); margin-bottom: 16px; }
  .welcome-title span { color: var(--carrot); }
  .welcome-sub { font-size: 18px; color: var(--muted); max-width: 480px; margin: 0 auto 40px; line-height: 1.6; }
  .feature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 40px; }
  .feature-card { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 20px 16px; text-align: center; }
  .feature-icon { font-size: 28px; margin-bottom: 8px; }
  .feature-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .feature-desc { font-size: 12px; color: var(--muted); line-height: 1.4; }

  /* PROFILE CARD */
  .profile-section { background: white; border: 1.5px solid var(--border); border-radius: 20px; padding: 24px; margin-bottom: 20px; }
  .profile-section-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px;
    border-radius: 100px; font-size: 15px; font-weight: 600; cursor: pointer; border: none;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .btn-primary { background: var(--carrot); color: white; }
  .btn-primary:hover { background: var(--carrot-dark); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(244,113,26,0.3); }
  .btn-secondary { background: white; color: var(--ink); border: 1.5px solid var(--border); }
  .btn-secondary:hover { border-color: var(--carrot); color: var(--carrot); }
  .btn-ghost { background: transparent; color: var(--muted); padding: 14px 20px; }
  .btn-ghost:hover { color: var(--ink); }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

  /* TYPOGRAPHY */
  .section-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: var(--ink); margin-bottom: 8px; line-height: 1.2; }
  .section-sub { font-size: 16px; color: var(--muted); margin-bottom: 32px; line-height: 1.5; }

  /* INPUTS */
  .input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: 12px;
    font-size: 15px; font-family: 'DM Sans', sans-serif; background: white; color: var(--ink); transition: border-color 0.2s; }
  .input:focus { outline: none; border-color: var(--carrot); }
  .input-label { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 6px; display: block; }
  .input-hint { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .input-group { margin-bottom: 20px; }
  .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  select.input { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A6A55' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

  /* UPLOAD */
  .upload-zone { border: 2px dashed var(--border); border-radius: 20px; padding: 36px 32px;
    text-align: center; cursor: pointer; transition: all 0.2s; background: white; margin-bottom: 12px; }
  .upload-zone:hover { border-color: var(--carrot); background: var(--carrot-light); }
  .upload-zone.has-file { border-color: var(--green); border-style: solid; background: var(--green-light); }
  .upload-icon { font-size: 36px; margin-bottom: 10px; }
  .upload-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
  .upload-hint { font-size: 13px; color: var(--muted); }
  .spiff-zone { border: 2px dashed var(--gold); border-radius: 16px; padding: 24px;
    text-align: center; cursor: pointer; background: white; transition: all 0.2s; margin-bottom: 8px; }
  .spiff-zone:hover { background: var(--gold-light); }
  .spiff-item { display: flex; align-items: center; gap: 10px; background: var(--gold-light);
    border: 1px solid var(--gold); border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 6px; }
  .spiff-remove { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--muted); font-size: 18px; }

  /* COMP SUMMARY */
  .summary-card { background: white; border: 1.5px solid var(--border); border-radius: 20px; overflow: hidden; margin-bottom: 16px; }
  .summary-card-header { padding: 16px 20px; background: var(--cream); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .summary-card-title { font-size: 15px; font-weight: 700; }
  .confidence-badge { margin-left: auto; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }
  .confidence-high { background: var(--green-light); color: var(--green); }
  .summary-field { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
  .summary-field:last-child { border-bottom: none; }
  .summary-field:hover { background: #FFFAF4; }
  .summary-field-name { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .summary-field-value { font-size: 20px; font-weight: 700; color: var(--ink); }
  .summary-edit-btn { background: none; border: 1.5px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--muted); transition: all 0.15s; }
  .summary-edit-btn:hover { border-color: var(--carrot); color: var(--carrot); }
  .inline-edit { display: flex; gap: 8px; margin-top: 8px; }

  /* TAX ASSUMPTION BOX */
  .tax-assumption-box { background: var(--blue-light); border: 1.5px solid #BFDBFE; border-radius: 20px; padding: 24px; margin-bottom: 20px; }
  .tax-assumption-title { font-size: 15px; font-weight: 700; color: var(--blue); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .tax-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #BFDBFE; }
  .tax-row:last-child { border-bottom: none; }
  .tax-row-label { font-size: 14px; color: var(--ink); }
  .tax-row-source { font-size: 11px; color: #6B7280; margin-top: 2px; }
  .tax-row-rate { font-size: 16px; font-weight: 700; color: var(--blue); }
  .tax-override-link { font-size: 12px; color: var(--carrot); cursor: pointer; text-decoration: underline; margin-left: 8px; font-weight: 600; }
  .tax-total-row { margin-top: 16px; padding: 14px 16px; background: white; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
  .tax-total-label { font-size: 13px; font-weight: 600; color: var(--muted); }
  .tax-total-value { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--ink); }

  /* 401K MAX BOX */
  .k401-box { background: var(--green-light); border: 1.5px solid var(--green); border-radius: 16px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
  .k401-icon { font-size: 32px; flex-shrink: 0; }
  .k401-title { font-size: 15px; font-weight: 700; color: var(--green); margin-bottom: 4px; }
  .k401-sub { font-size: 13px; color: var(--green); opacity: 0.85; }

  /* MILESTONES */
  .milestone-card { background: white; border: 1.5px solid var(--border); border-radius: 20px; padding: 24px; margin-bottom: 16px; transition: all 0.2s; }
  .milestone-card:hover { border-color: var(--carrot); box-shadow: 0 4px 20px rgba(244,113,26,0.08); }
  .milestone-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .milestone-pct { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; color: var(--carrot); }
  .milestone-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 100px; background: var(--carrot-light); color: var(--carrot-dark); }
  .milestone-pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .milestone-pay-box { border-radius: 14px; padding: 14px 16px; }
  .milestone-pay-box.gross { background: var(--cream); border: 1.5px solid var(--border); }
  .milestone-pay-box.net { background: var(--green-light); border: 1.5px solid var(--green); }
  .milestone-pay-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .milestone-pay-box.net .milestone-pay-label { color: var(--green); }
  .milestone-pay-amount { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--ink); }
  .milestone-pay-box.net .milestone-pay-amount { color: var(--green); }
  .milestone-pay-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .milestone-bar-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .milestone-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

  /* MY CARROTS */
  .carrot-card { background: white; border: 1.5px solid var(--border); border-radius: 24px; padding: 28px; margin-bottom: 24px; }
  .carrot-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
  .carrot-pct-badge { background: var(--carrot); color: white; font-size: 14px; font-weight: 700; padding: 6px 16px; border-radius: 100px; }
  .carrot-amounts { display: flex; gap: 20px; }
  .carrot-amount-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
  .carrot-amount-value { font-size: 18px; font-weight: 700; color: var(--ink); }
  .carrot-amount-value.net { color: var(--green); }
  .carrot-visual-box { border: 2px dashed var(--border); border-radius: 16px; overflow: hidden; min-height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; background: var(--cream); transition: all 0.2s; }
  .carrot-visual-box.has-image { border-style: solid; border-color: var(--carrot-light); }
  .carrot-visual-box img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .carrot-visual-placeholder { text-align: center; padding: 24px; color: var(--muted); }
  .carrot-visual-placeholder .big { font-size: 36px; margin-bottom: 8px; }
  .carrot-add-options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .carrot-add-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 10px; border-radius: 14px; border: 1.5px solid var(--border); background: white; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; color: var(--muted); }
  .carrot-add-btn:hover { border-color: var(--carrot); color: var(--carrot); background: var(--carrot-light); }
  .carrot-add-btn span { font-size: 22px; }
  .carrot-url-row, .carrot-ai-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .ai-generating { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--carrot-light); border-radius: 12px; font-size: 13px; color: var(--carrot-dark); font-weight: 500; margin-bottom: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { display: inline-block; animation: spin 1s linear infinite; }

  /* GOALS */
  .suggested-goals { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .suggested-pill { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1.5px solid var(--border); border-radius: 100px; cursor: pointer; font-size: 13px; font-weight: 500; background: white; transition: all 0.15s; }
  .suggested-pill:hover { border-color: var(--carrot); background: var(--carrot-light); color: var(--carrot-dark); }
  .goal-item { display: flex; align-items: center; gap: 12px; background: white; border: 1.5px solid var(--border); border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; transition: all 0.2s; }
  .goal-item:hover { border-color: var(--green); }
  .goal-emoji { font-size: 22px; width: 36px; text-align: center; }
  .goal-text { flex: 1; font-size: 15px; font-weight: 500; }
  .goal-freq { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; background: var(--green-light); color: var(--green); }
  .goal-delete { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 18px; padding: 4px; }
  .goal-delete:hover { color: var(--red); }

  /* DASHBOARD */
  .dashboard-header { background: linear-gradient(135deg, var(--carrot) 0%, var(--carrot-dark) 100%); border-radius: 24px; padding: 32px; color: white; margin-bottom: 24px; position: relative; overflow: hidden; }
  .dashboard-header::after { content: '🥕'; position: absolute; right: 24px; top: 50%; transform: translateY(-50%); font-size: 80px; opacity: 0.15; }
  .dashboard-greeting { font-size: 13px; font-weight: 600; opacity: 0.8; margin-bottom: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .dashboard-name { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; margin-bottom: 8px; }
  .dashboard-tagline { font-size: 15px; opacity: 0.85; }
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .dash-card { background: white; border: 1.5px solid var(--border); border-radius: 20px; padding: 20px; }
  .dash-card-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .dash-card-value { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--ink); }
  .dash-card-value.green { color: var(--green); }
  .dash-card-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .my-carrots-dash { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px; }
  .my-carrot-dash-card { background: white; border: 1.5px solid var(--border); border-radius: 18px; overflow: hidden; }
  .my-carrot-dash-card img { width: 100%; height: 100px; object-fit: cover; }
  .my-carrot-dash-no-img { height: 100px; background: var(--carrot-light); display: flex; align-items: center; justify-content: center; font-size: 36px; }
  .my-carrot-dash-body { padding: 12px; }
  .my-carrot-dash-pct { font-size: 11px; font-weight: 700; color: var(--carrot); letter-spacing: 1px; text-transform: uppercase; }
  .my-carrot-dash-label { font-size: 13px; font-weight: 600; color: var(--ink); margin-top: 2px; }
  .my-carrot-dash-amount { font-size: 12px; color: var(--green); font-weight: 600; margin-top: 2px; }
  .goal-track-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .goal-check { width: 28px; height: 28px; border-radius: 8px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
  .goal-check.checked { background: var(--green); border-color: var(--green); color: white; }
  .goal-check:hover { border-color: var(--green); }
  .goal-track-text { flex: 1; font-size: 15px; }
  .goal-track-text.done { text-decoration: line-through; color: var(--muted); }

  /* CELEBRATION */
  .celebration { text-align: center; padding: 40px 24px; }
  @keyframes popIn { 0%{transform:scale(0.5);opacity:0;} 70%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
  .celebration-icon { font-size: 80px; animation: popIn 0.6s ease forwards; display: inline-block; margin-bottom: 16px; }
  .celebration-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; color: var(--ink); margin-bottom: 8px; }
  .celebration-sub { font-size: 16px; color: var(--muted); margin-bottom: 32px; max-width: 420px; margin-left: auto; margin-right: auto; }

  /* UTILS */
  .bottom-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); }
  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }
  .pill-orange { background: var(--carrot-light); color: var(--carrot-dark); }
  .pill-green { background: var(--green-light); color: var(--green); }
  .info-box { background: var(--gold-light); border: 1px solid var(--gold); border-radius: 14px; padding: 14px 18px; font-size: 13px; color: #7A5C00; margin-bottom: 20px; line-height: 1.5; }
  .slider { width: 100%; accent-color: var(--carrot); height: 6px; cursor: pointer; }
  .slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 4px; }
`;

const SUGGESTED_GOALS = [
  {emoji:"📞",label:"Cold calls",freq:"Daily"},
  {emoji:"📧",label:"Prospecting emails",freq:"Daily"},
  {emoji:"🤝",label:"Customer meetings",freq:"Weekly"},
  {emoji:"💪",label:"Workout",freq:"Daily"},
  {emoji:"🧘",label:"Meditate",freq:"Daily"},
  {emoji:"📚",label:"Read / learn",freq:"Daily"},
  {emoji:"🎯",label:"Pipeline review",freq:"Weekly"},
  {emoji:"✍️",label:"Journal",freq:"Daily"},
  {emoji:"🏃",label:"Run / walk",freq:"Daily"},
  {emoji:"💤",label:"8hrs sleep",freq:"Daily"},
];

const MILESTONES = [
  {pct:75,  label:"On Track",         color:"#E9C46A"},
  {pct:100, label:"Quota",            color:"#F4711A"},
  {pct:125, label:"Accelerator",      color:"#E76F51"},
  {pct:150, label:"President's Club", color:"#2D6A4F"},
];

const COMP_FIELDS = [
  {key:"base",           label:"Base Salary",              fmt:v=>"$"+Math.round(v).toLocaleString()},
  {key:"quota",          label:"Annual Quota",             fmt:v=>"$"+Math.round(v).toLocaleString()},
  {key:"commissionRate", label:"Commission Rate",          fmt:v=>`${v}%`},
  {key:"accelerator",    label:"Accelerator (above quota)",fmt:v=>`${v}x`},
];

function fmt(n){ return "$"+Math.round(n).toLocaleString(); }

function CarrotImageBox({reward, onImageChange}) {
  const [mode,setMode]=useState(null);
  const [urlInput,setUrlInput]=useState("");
  const [aiInput,setAiInput]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  async function handleAI(){
    if(!aiInput.trim())return;
    setAiLoading(true);
    await new Promise(r=>setTimeout(r,1800));
    onImageChange(`https://placehold.co/600x300/F4711A/white?text=${encodeURIComponent(aiInput)}`);
    setAiLoading(false);setMode(null);setAiInput("");
  }
  function handleUpload(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{onImageChange(ev.target.result);setMode(null);};
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <div className={`carrot-visual-box ${reward.image?"has-image":""}`}>
        {reward.image
          ?<img src={reward.image} alt="carrot" onError={e=>e.target.style.display='none'}/>
          :<div className="carrot-visual-placeholder"><div className="big">🥕</div><p>Add a photo of what you're working toward</p></div>}
      </div>
      {!mode&&!aiLoading&&(
        <div className="carrot-add-options">
          <button className="carrot-add-btn" onClick={()=>setMode("url")}><span>🔗</span>Paste a URL</button>
          <label className="carrot-add-btn" style={{cursor:"pointer"}}>
            <span>📸</span>Upload Photo
            <input type="file" accept="image/*" style={{display:"none"}} onChange={handleUpload}/>
          </label>
          <button className="carrot-add-btn" onClick={()=>setMode("ai")}><span>✨</span>Describe It</button>
        </div>
      )}
      {mode==="url"&&(
        <div className="carrot-url-row">
          <input className="input" placeholder="Paste image URL..." value={urlInput} onChange={e=>setUrlInput(e.target.value)} style={{flex:1}}/>
          <button className="btn btn-primary btn-sm" onClick={()=>{if(urlInput.trim()){onImageChange(urlInput.trim());setMode(null);setUrlInput("")}}}>Add</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setMode(null)}>Cancel</button>
        </div>
      )}
      {mode==="ai"&&!aiLoading&&(
        <div className="carrot-ai-row">
          <input className="input" placeholder='e.g. "Family vacation in Hawaii"' value={aiInput} onChange={e=>setAiInput(e.target.value)} style={{flex:1}}/>
          <button className="btn btn-primary btn-sm" onClick={handleAI}>Generate ✨</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setMode(null)}>Cancel</button>
        </div>
      )}
      {aiLoading&&<div className="ai-generating"><span className="spinner">🥕</span>Generating your carrot image...</div>}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [userName, setUserName] = useState("");
  const [userState, setUserState] = useState("");
  const [k401Pct, setK401Pct] = useState(6);
  const [healthMonthly, setHealthMonthly] = useState(200);
  const [otherMonthly, setOtherMonthly] = useState(0);

  const [fileName, setFileName] = useState(null);
  const [spiffs, setSpiffs] = useState([]);

  const [comp, setComp] = useState({base:80000,quota:500000,commissionRate:8,accelerator:1.5});
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [taxOverrides, setTaxOverrides] = useState({});

  const [rewards, setRewards] = useState({});
  const [goals, setGoals] = useState([]);
  const [checked, setChecked] = useState({});

  const go = s => setScreen(s);

  // ── TAX CALCULATIONS ────────────────────────────────────────────
  const grossAt100 = useMemo(() => {
    const {base,quota,commissionRate,accelerator} = comp;
    return base + quota * (commissionRate/100);
  }, [comp]);

  const fedBracket = useMemo(() => getFedBracket(grossAt100), [grossAt100]);
  const stateTaxRate = STATE_TAXES[userState] || 0;
  const ficaRate = 7.65;

  const effectiveFedRate = taxOverrides.fed ?? fedBracket.rate;
  const effectiveStateRate = taxOverrides.state ?? stateTaxRate;
  const totalPctDeductions = effectiveFedRate + effectiveStateRate + ficaRate + k401Pct;
  const totalFlatDeductions = (healthMonthly + otherMonthly) * 12;

  function calcGross(pct) {
    const {base,quota,commissionRate,accelerator} = comp;
    const rate = commissionRate/100;
    const att = pct/100;
    const commission = att<=1 ? quota*att*rate : quota*rate + quota*(att-1)*rate*accelerator;
    return base + commission;
  }
  function calcNet(gross) {
    return gross * (1 - totalPctDeductions/100) - totalFlatDeductions;
  }

  const k401MaxMonth = useMemo(() => get401kMaxMonth(grossAt100, k401Pct), [grossAt100, k401Pct]);
  const annualK401 = (grossAt100 * k401Pct/100);
  const willMaxK401 = annualK401 >= K401_LIMIT;

  function startEdit(field,value){setEditingField(field);setEditValue(String(value));}
  function saveEdit(){setComp(c=>({...c,[editingField]:parseFloat(editValue)||0}));setEditingField(null);}

  function addGoal(emoji,label,freq){
    if(goals.find(g=>g.label===label))return;
    setGoals([...goals,{emoji,label,freq,id:Date.now()}]);
  }
  function removeGoal(id){setGoals(goals.filter(g=>g.id!==id));}
  function toggleCheck(id){setChecked(c=>({...c,[id]:!c[id]}));}

  const doneToday = Object.values(checked).filter(Boolean).length;
  const profileReady = userName && userState;

  const STEPS = ["upload","summary","milestones","mycorrots","goals","dashboard"];
  const si = STEPS.indexOf(screen);

  return (
    <div className="app">
      <style>{styles}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">🥕 Earn The Carrot</div>
        <div className="nav-steps">
          {STEPS.map((s,i)=>(
            <div key={s} className={`nav-step ${screen===s?"active":si>i?"done":""}`}/>
          ))}
        </div>
        {screen==="dashboard"
          ?<button className="btn btn-secondary btn-sm" onClick={()=>go("goals")}>✏️ Edit Goals</button>
          :screen!=="welcome"&&screen!=="celebrate"
            ?<span style={{fontSize:13,color:"var(--muted)"}}>Step {si+1} of {STEPS.length}</span>
            :<div/>}
      </nav>

      {/* ── WELCOME / PROFILE ── */}
      {screen==="welcome"&&(
        <div className="screen">
          <div className="welcome-hero">
            <div><span className="welcome-carrot">🥕</span></div>
            <h1 className="welcome-title">Earn Your<br/><span>Carrot</span></h1>
            <p className="welcome-sub">Know exactly what you'll take home at every milestone — and what you're working toward.</p>
            <div className="feature-grid">
              <div className="feature-card"><div className="feature-icon">📄</div><div className="feature-title">Upload Your Plan</div><div className="feature-desc">AI reads your comp plan and calculates real take-home at every milestone</div></div>
              <div className="feature-card"><div className="feature-icon">🥕</div><div className="feature-title">My Carrots</div><div className="feature-desc">Attach a photo of your dream to each milestone — your personal why</div></div>
              <div className="feature-card"><div className="feature-icon">📈</div><div className="feature-title">Daily Goals</div><div className="feature-desc">Build habits and track the activities that get you to your carrot</div></div>
            </div>
          </div>

          {/* PROFILE SETUP */}
          <div className="profile-section">
            <div className="profile-section-title">👤 Let's set up your profile</div>
            <div className="input-row" style={{marginBottom:20}}>
              <div className="input-group" style={{marginBottom:0}}>
                <label className="input-label">Your First Name</label>
                <input className="input" placeholder="e.g. Alex" value={userName} onChange={e=>setUserName(e.target.value)}/>
              </div>
              <div className="input-group" style={{marginBottom:0}}>
                <label className="input-label">State You Live In</label>
                <select className="input" value={userState} onChange={e=>setUserState(e.target.value)}>
                  <option value="">Select your state...</option>
                  {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">401(k) Contribution: <strong>{k401Pct}% of salary</strong></label>
              <input type="range" className="slider" min="0" max="25" step="0.5" value={k401Pct} onChange={e=>setK401Pct(+e.target.value)}/>
              <div className="slider-labels"><span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span></div>
              <div className="input-hint">Annual contribution: ~{fmt(grossAt100 * k401Pct/100)} · {willMaxK401?"✅ You'll max out your 401k this year!":k401MaxMonth?`🎯 You'll max out around ${k401MaxMonth}`:"Set your rate above"}</div>
            </div>

            <div className="input-row">
              <div className="input-group" style={{marginBottom:0}}>
                <label className="input-label">Health Insurance (per month)</label>
                <input className="input" type="number" value={healthMonthly} onChange={e=>setHealthMonthly(+e.target.value)} placeholder="e.g. 200"/>
                <div className="input-hint">Your portion of the premium</div>
              </div>
              <div className="input-group" style={{marginBottom:0}}>
                <label className="input-label">Other Deductions (per month)</label>
                <input className="input" type="number" value={otherMonthly} onChange={e=>setOtherMonthly(+e.target.value)} placeholder="e.g. dental, FSA"/>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",fontSize:17,padding:"16px"}}
            onClick={()=>go("upload")} disabled={!profileReady}>
            Let's Go 🥕
          </button>
        </div>
      )}

      {/* ── UPLOAD ── */}
      {screen==="upload"&&(
        <div className="screen">
          <div className="section-label">Step 1 of 6</div>
          <h2 className="section-title">Upload Your Documents</h2>
          <p className="section-sub">Drop in your comp plan, plus any SPIFFs, bonus emails, or quota changes. We'll read everything so nothing gets missed.</p>

          <div className="section-label" style={{marginBottom:10}}>📄 Your Comp Plan</div>
          <label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={e=>e.target.files[0]&&setFileName(e.target.files[0].name)} style={{display:"none"}}/>
            <div className={`upload-zone ${fileName?"has-file":""}`}>
              <div className="upload-icon">{fileName?"✅":"📄"}</div>
              <div className="upload-title">{fileName||"Drop your comp plan here"}</div>
              <div className="upload-hint">{fileName?"File ready · Click to replace":"PDF or Word doc · Click to browse"}</div>
            </div>
          </label>

          <div className="section-label" style={{marginBottom:10,marginTop:20}}>⚡ SPIFFs, Bonuses & Plan Changes</div>
          <div className="info-box">💡 Got an email about a new SPIFF or quota change? Save it and upload it here — we'll factor everything in.</div>
          <label>
            <input type="file" accept=".pdf,.doc,.docx,.txt,.eml" onChange={e=>{const f=e.target.files[0];if(f)setSpiffs(s=>[...s,{name:f.name,id:Date.now()}]);}} style={{display:"none"}}/>
            <div className="spiff-zone">
              <div className="upload-icon">⚡</div>
              <div className="upload-title">Add SPIFFs, bonuses, or incentive emails</div>
              <div className="upload-hint">Click to add — you can upload multiple files</div>
            </div>
          </label>
          {spiffs.map(s=>(
            <div className="spiff-item" key={s.id}>⚡ {s.name}
              <button className="spiff-remove" onClick={()=>setSpiffs(sp=>sp.filter(x=>x.id!==s.id))}>×</button>
            </div>
          ))}

          <div className="bottom-nav">
            <button className="btn btn-ghost" onClick={()=>go("welcome")}>← Back</button>
            <button className="btn btn-primary" onClick={()=>go("summary")}>Review My Plan →</button>
          </div>
        </div>
      )}

      {/* ── COMP PLAN SUMMARY ── */}
      {screen==="summary"&&(
        <div className="screen">
          <div className="section-label">Step 2 of 6</div>
          <h2 className="section-title">Here's What We Found</h2>
          <p className="section-sub">We read your comp plan and pulled out the key numbers. Glance through and tap ✏️ to fix anything that looks off.</p>

          <div className="summary-card">
            <div className="summary-card-header">
              <span style={{fontSize:20}}>💰</span>
              <span className="summary-card-title">Your Compensation</span>
              <span className="confidence-badge confidence-high">Looks good</span>
            </div>
            {COMP_FIELDS.map(f=>(
              <div className="summary-field" key={f.key}>
                <div style={{flex:1}}>
                  <div className="summary-field-name">{f.label}</div>
                  {editingField===f.key
                    ?<div className="inline-edit">
                        <input className="input" value={editValue} onChange={e=>setEditValue(e.target.value)}
                          style={{width:160,padding:"6px 10px",fontSize:14}} autoFocus onKeyDown={e=>e.key==="Enter"&&saveEdit()}/>
                        <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditingField(null)}>Cancel</button>
                      </div>
                    :<div className="summary-field-value">{f.fmt(comp[f.key])}</div>
                  }
                </div>
                {editingField!==f.key&&<button className="summary-edit-btn" onClick={()=>startEdit(f.key,comp[f.key])}>✏️ Edit</button>}
              </div>
            ))}
          </div>

          {spiffs.length>0&&(
            <div className="summary-card">
              <div className="summary-card-header">
                <span style={{fontSize:20}}>⚡</span>
                <span className="summary-card-title">SPIFFs & Incentives ({spiffs.length})</span>
                <span className="confidence-badge confidence-high">Loaded</span>
              </div>
              {spiffs.map(s=>(
                <div className="summary-field" key={s.id}>
                  <div><div className="summary-field-name">Incentive Plan</div>
                    <div className="summary-field-value" style={{fontSize:15}}>{s.name}</div></div>
                </div>
              ))}
            </div>
          )}

          {/* TAX ASSUMPTION BOX */}
          <div className="tax-assumption-box">
            <div className="tax-assumption-title">🧮 Here's What We're Assuming for Taxes</div>
            <div className="info-box" style={{marginBottom:16}}>
              Based on your income and the state you told us, we've pre-filled your tax rates. Tap to override any number.
            </div>
            {[
              {key:"fed", label:"Federal Income Tax", source:`Based on your income (${fedBracket.label})`, rate:effectiveFedRate, auto:fedBracket.rate},
              {key:"state", label:`${userState||"State"} Income Tax`, source:`${stateTaxRate===0?"No state income tax":"Standard "+userState+" rate"}`, rate:effectiveStateRate, auto:stateTaxRate},
              {key:"fica", label:"Social Security & Medicare", source:"Fixed rate — everyone pays this", rate:ficaRate, auto:ficaRate},
              {key:"k401l", label:"401(k) Contribution", source:`You told us ${k401Pct}% on your profile`, rate:k401Pct, auto:k401Pct, noOverride:true},
            ].map(t=>(
              <div className="tax-row" key={t.key}>
                <div>
                  <div className="tax-row-label">{t.label}</div>
                  <div className="tax-row-source">{t.source}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div className="tax-row-rate">{t.rate}%</div>
                  {!t.noOverride&&(
                    <span className="tax-override-link" onClick={()=>{
                      const val = prompt(`Override ${t.label} rate (currently ${t.rate}%):`, t.rate);
                      if(val!==null&&!isNaN(+val)) setTaxOverrides(x=>({...x,[t.key]:+val}));
                    }}>override</span>
                  )}
                </div>
              </div>
            ))}
            <div className="tax-total-row">
              <div>
                <div className="tax-total-label">Total Deduction Rate</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>+ {fmt(totalFlatDeductions)}/yr in flat deductions</div>
              </div>
              <div className="tax-total-value">~{Math.round(totalPctDeductions)}%</div>
            </div>
          </div>

          {/* 401K MAX */}
          {k401Pct>0&&(
            <div className="k401-box">
              <div className="k401-icon">🏦</div>
              <div>
                <div className="k401-title">
                  {willMaxK401?"🎉 You'll max out your 401k this year!"
                    :k401MaxMonth?`You'll max your 401k around ${k401MaxMonth}`
                    :"Increase your 401k % to max it out"}
                </div>
                <div className="k401-sub">
                  At {k401Pct}% you contribute ~{fmt(annualK401)}/yr · 2025 limit is {fmt(K401_LIMIT)}
                  {!willMaxK401&&` · Increase to ${Math.ceil(K401_LIMIT/grossAt100*100)}% to max it out`}
                </div>
              </div>
            </div>
          )}

          <div className="bottom-nav">
            <button className="btn btn-ghost" onClick={()=>go("upload")}>← Back</button>
            <button className="btn btn-primary" onClick={()=>go("milestones")}>See My Real Numbers →</button>
          </div>
        </div>
      )}

      {/* ── MILESTONES ── */}
      {screen==="milestones"&&(
        <div className="screen">
          <div className="section-label">Step 3 of 6</div>
          <h2 className="section-title">Your Real Numbers</h2>
          <p className="section-sub">Here's what you'd earn — and what actually hits your bank account — at each performance level.</p>
          {MILESTONES.map(m=>{
            const gross=calcGross(m.pct); const net=calcNet(gross);
            return(
              <div className="milestone-card" key={m.pct}>
                <div className="milestone-header">
                  <div className="milestone-pct">{m.pct}% of Plan</div>
                  <div className="milestone-badge">{m.label}</div>
                </div>
                <div className="milestone-pay-grid">
                  <div className="milestone-pay-box gross">
                    <div className="milestone-pay-label">Gross Earnings</div>
                    <div className="milestone-pay-amount">{fmt(gross)}</div>
                    <div className="milestone-pay-sub">before taxes & deductions</div>
                  </div>
                  <div className="milestone-pay-box net">
                    <div className="milestone-pay-label">Est. Take-Home</div>
                    <div className="milestone-pay-amount">{fmt(net)}</div>
                    <div className="milestone-pay-sub">what hits your bank</div>
                  </div>
                </div>
                <div className="milestone-bar-track">
                  <div className="milestone-bar-fill" style={{width:`${Math.min(m.pct,100)}%`,background:m.color}}/>
                </div>
              </div>
            );
          })}
          <div className="info-box">💡 Estimates based on ~{Math.round(totalPctDeductions)}% total deductions for {userState}. Your actual take-home may vary slightly based on filing status and timing.</div>
          <div className="bottom-nav">
            <button className="btn btn-ghost" onClick={()=>go("summary")}>← Back</button>
            <button className="btn btn-primary" onClick={()=>go("mycorrots")}>Set My Carrots 🥕</button>
          </div>
        </div>
      )}

      {/* ── MY CARROTS ── */}
      {screen==="mycorrots"&&(
        <div className="screen">
          <div className="section-label">Step 4 of 6</div>
          <h2 className="section-title">My Carrots 🥕</h2>
          <p className="section-sub">What are you working toward? Add a photo for each milestone — your car, your vacation, your dream. Make it real.</p>
          {MILESTONES.map(m=>{
            const gross=calcGross(m.pct); const net=calcNet(gross);
            const r=rewards[m.pct]||{};
            return(
              <div className="carrot-card" key={m.pct}>
                <div className="carrot-card-header">
                  <div className="carrot-pct-badge">{m.pct}% · {m.label}</div>
                  <div className="carrot-amounts">
                    <div><div className="carrot-amount-label">Take-Home</div><div className="carrot-amount-value net">{fmt(net)}/yr</div></div>
                    <div><div className="carrot-amount-label">Gross</div><div className="carrot-amount-value">{fmt(gross)}/yr</div></div>
                  </div>
                </div>
                <CarrotImageBox reward={r} onImageChange={img=>setRewards({...rewards,[m.pct]:{...r,image:img}})}/>
                <input className="input" placeholder="What is this? e.g. Family trip to Italy, New Tesla, College fund..."
                  value={r.label||""} onChange={e=>setRewards({...rewards,[m.pct]:{...r,label:e.target.value}})}/>
              </div>
            );
          })}
          <div className="bottom-nav">
            <button className="btn btn-ghost" onClick={()=>go("milestones")}>← Back</button>
            <button className="btn btn-primary" onClick={()=>go("goals")}>Set My Daily Goals →</button>
          </div>
        </div>
      )}

      {/* ── GOALS ── */}
      {screen==="goals"&&(
        <div className="screen">
          <div className="section-label">Step 5 of 6</div>
          <h2 className="section-title">Set Your Daily Goals</h2>
          <p className="section-sub">What will you do every day to earn your carrot? Add anything — sales calls, workouts, habits. This is your personal playbook.</p>
          <div className="section-label" style={{marginBottom:12}}>Quick Add</div>
          <div className="suggested-goals">
            {SUGGESTED_GOALS.map(g=>(
              <button key={g.label} className="suggested-pill" onClick={()=>addGoal(g.emoji,g.label,g.freq)}>{g.emoji} {g.label}</button>
            ))}
          </div>
          <div className="section-label" style={{marginBottom:12}}>Add Your Own</div>
          <div style={{display:"flex",gap:10,marginBottom:24}}>
            <input className="input" placeholder="e.g. 🏊 Swim 30 mins, 📞 15 cold calls..." id="custom-goal" style={{flex:1}}/>
            <button className="btn btn-primary btn-sm" onClick={()=>{
              const inp=document.getElementById("custom-goal");
              if(inp.value.trim()){addGoal("✨",inp.value.trim(),"Daily");inp.value="";}
            }}>Add</button>
          </div>
          {goals.length>0&&(
            <div>
              <div className="section-label" style={{marginBottom:12}}>Your Goals ({goals.length})</div>
              {goals.map(g=>(
                <div className="goal-item" key={g.id}>
                  <div className="goal-emoji">{g.emoji}</div>
                  <div className="goal-text">{g.label}</div>
                  <div className="goal-freq">{g.freq}</div>
                  <button className="goal-delete" onClick={()=>removeGoal(g.id)}>×</button>
                </div>
              ))}
            </div>
          )}
          {goals.length===0&&<div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:15}}>👆 Add at least one goal to continue</div>}
          <div className="bottom-nav">
            <button className="btn btn-ghost" onClick={()=>go("mycorrots")}>← Back</button>
            <button className="btn btn-primary" onClick={()=>go("celebrate")} disabled={goals.length===0}>All Done! 🥕</button>
          </div>
        </div>
      )}

      {/* ── CELEBRATE ── */}
      {screen==="celebrate"&&(
        <div className="screen">
          <div className="celebration">
            <div className="celebration-icon">🥕</div>
            <div className="celebration-title">Your Carrots Are Set!</div>
            <div className="celebration-sub">You know what you're earning, what you'll take home, what you're working toward, and what you'll do every day to get there. Now go earn it.</div>
            <button className="btn btn-primary" style={{fontSize:18,padding:"16px 40px"}} onClick={()=>go("dashboard")}>
              See My Dashboard →
            </button>
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {screen==="dashboard"&&(
        <div className="screen">
          <div className="dashboard-header">
            <div className="dashboard-greeting">Welcome back</div>
            <div className="dashboard-name">{userName}'s Carrots 🥕</div>
            <div className="dashboard-tagline">Working toward {fmt(calcNet(calcGross(125)))} take-home · {userState}</div>
          </div>

          <div className="dash-grid">
            <div className="dash-card">
              <div className="dash-card-label">At Quota (100%)</div>
              <div className="dash-card-value green">{fmt(calcNet(calcGross(100)))}</div>
              <div className="dash-card-sub">est. take-home · {fmt(calcGross(100))} gross</div>
            </div>
            <div className="dash-card">
              <div className="dash-card-label">401(k) Status</div>
              <div className="dash-card-value" style={{fontSize:20}}>
                {willMaxK401?"🎉 Maxing out!":k401MaxMonth?`Max ~${k401MaxMonth}`:"Not maxing"}
              </div>
              <div className="dash-card-sub">{fmt(Math.min(annualK401,K401_LIMIT))} of {fmt(K401_LIMIT)} limit</div>
            </div>
          </div>

          <div className="section-label" style={{marginBottom:12}}>My Carrots</div>
          <div className="my-carrots-dash">
            {MILESTONES.map(m=>{
              const r=rewards[m.pct]||{};
              return(
                <div className="my-carrot-dash-card" key={m.pct}>
                  {r.image?<img src={r.image} alt={r.label} onError={e=>e.target.style.display='none'}/>
                    :<div className="my-carrot-dash-no-img">🥕</div>}
                  <div className="my-carrot-dash-body">
                    <div className="my-carrot-dash-pct">{m.pct}% · {m.label}</div>
                    <div className="my-carrot-dash-label">{r.label||"Set your carrot"}</div>
                    <div className="my-carrot-dash-amount">{fmt(calcNet(calcGross(m.pct)))} take-home</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:20,padding:24,marginBottom:20}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:12}}>Today's Goals</div>
            {goals.map(g=>(
              <div className="goal-track-item" key={g.id}>
                <div className={`goal-check ${checked[g.id]?"checked":""}`} onClick={()=>toggleCheck(g.id)}>
                  {checked[g.id]&&"✓"}
                </div>
                <div className={`goal-track-text ${checked[g.id]?"done":""}`}>{g.emoji} {g.label}</div>
                <span className="pill pill-orange">{g.freq}</span>
              </div>
            ))}
            <div style={{marginTop:20,padding:"12px 16px",background:doneToday===goals.length&&goals.length>0?"var(--green-light)":"var(--carrot-light)",borderRadius:12,fontSize:14,fontWeight:500,textAlign:"center",color:doneToday===goals.length&&goals.length>0?"var(--green)":"var(--carrot-dark)"}}>
              {doneToday} of {goals.length} done today {doneToday===goals.length&&goals.length>0?"🎉 All done!":""}
            </div>
          </div>

          <div style={{textAlign:"center",padding:"24px",background:"white",border:"1.5px solid var(--border)",borderRadius:20}}>
            <div style={{fontSize:28,marginBottom:8}}>📊</div>
            <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>CRM Import Coming Soon</div>
            <div style={{fontSize:14,color:"var(--muted)"}}>Upload your Salesforce report to automatically track quota attainment</div>
          </div>
        </div>
      )}
    </div>
  );
}
