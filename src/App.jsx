import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Label } from "recharts";

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
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getFedBracket(income) {
  if (income <= 11925)  return { rate:10, label:"10% bracket" };
  if (income <= 48475)  return { rate:12, label:"12% bracket" };
  if (income <= 103350) return { rate:22, label:"22% bracket" };
  if (income <= 197300) return { rate:24, label:"24% bracket" };
  if (income <= 250525) return { rate:32, label:"32% bracket" };
  if (income <= 626350) return { rate:35, label:"35% bracket" };
  return { rate:37, label:"37% bracket" };
}

// ── AGE-BASED 401(k) LIMITS (2025) ───────────────────────────────────
// Base $23,500 · age 50+ catch-up +$7,500 · ages 60–63 super catch-up +$11,250
const K401_BASE = 23500;
function get401kLimit(age) {
  const a = +age || 0;
  if (a >= 60 && a <= 63) return K401_BASE + 11250; // 34,750
  if (a >= 50)            return K401_BASE + 7500;  // 31,000
  return K401_BASE;
}
function k401LimitNote(age) {
  const a = +age || 0;
  if (a >= 60 && a <= 63) return "incl. $11,250 super catch-up (ages 60–63)";
  if (a >= 50)            return "incl. $7,500 catch-up (age 50+)";
  return "standard limit (under 50)";
}
function get401kMaxMonth(gross, pct, limit) {
  if (!pct || !gross) return null;
  const monthly = gross * pct / 100 / 12;
  const toMax = limit / monthly;
  if (toMax >= 12) return null;
  return MONTHS[Math.floor(toMax)];
}

const SUGGESTED_METRICS = [
  {emoji:"📞", label:"Cold calls",          freq:"Daily",  defaultTarget:10},
  {emoji:"📧", label:"Prospecting emails",  freq:"Daily",  defaultTarget:20},
  {emoji:"🤝", label:"Discovery meetings",  freq:"Weekly", defaultTarget:5},
  {emoji:"🎯", label:"Demos / presentations",freq:"Weekly",defaultTarget:3},
  {emoji:"📋", label:"Pipeline reviews",    freq:"Weekly", defaultTarget:1},
  {emoji:"🆕", label:"New logo outreach",   freq:"Daily",  defaultTarget:5},
  {emoji:"📈", label:"Deals advanced",      freq:"Weekly", defaultTarget:4},
  {emoji:"✍️", label:"Proposals sent",      freq:"Weekly", defaultTarget:2},
];

// ── THREE-TIER CARROTS ───────────────────────────────────────────────
const CARROT_TIERS = [
  {key:"mini",   emoji:"🥕", label:"Mini Carrot",   tag:"Earn it soon",  hint:"A small treat to keep you going week to week.",  color:"#E9C46A"},
  {key:"medium", emoji:"🥕", label:"Medium Carrot", tag:"Mid-year reward",hint:"Something meaningful you reach by mid-year.",   color:"#F4711A"},
  {key:"big",    emoji:"🥕", label:"Big Carrot",    tag:"The dream",     hint:"The big one — what this whole year is really for.",color:"#2D6A4F"},
];

function fmt(n){ return "$"+Math.round(n).toLocaleString(); }
function fmtMo(n){ return "$"+Math.round(n/12).toLocaleString()+"/mo"; }

// ── PAYOUT CURVE ─────────────────────────────────────────────────────
function PayoutCurveChart({comp}) {
  const {base,quota,commissionRate,accelerator} = comp;
  const rate = commissionRate/100;
  const data = [];
  for (let pct=0; pct<=175; pct+=5) {
    const att=pct/100;
    let comm=0;
    if (att<=0.75)      comm=quota*att*0.05;
    else if (att<=1.0)  comm=quota*0.75*0.05+quota*(att-0.75)*rate;
    else if (att<=1.5)  comm=quota*0.75*0.05+quota*(att-0.75)*rate;
    else                comm=quota*0.75*0.05+quota*0.25*rate+quota*0.5*rate*accelerator+quota*(att-1.5)*rate;
    // recompute accelerator band cleanly
    if (att>1.0 && att<=1.5) comm=quota*0.75*0.05+quota*0.25*rate+quota*(att-1)*rate*accelerator;
    data.push({pct, gross:Math.round((base+comm)/1000)*1000});
  }
  const Tip = ({active,payload,label}) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{background:"#1A1208",border:"1px solid rgba(244,113,26,0.3)",borderRadius:10,padding:"10px 14px",fontSize:12}}>
        <div style={{fontWeight:700,color:"white",marginBottom:4}}>{label}% of Quota</div>
        <div style={{color:"#F4711A",fontWeight:700}}>${(payload[0].value/1000).toFixed(0)}k total earnings</div>
      </div>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{top:8,right:16,left:0,bottom:4}}>
        <defs>
          <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F4711A" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#F4711A" stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="pct" stroke="rgba(255,255,255,0.15)" tick={{fill:"rgba(255,255,255,0.4)",fontSize:10}} tickFormatter={v=>v+"%"}/>
        <YAxis stroke="rgba(255,255,255,0.15)" tick={{fill:"rgba(255,255,255,0.4)",fontSize:10}} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"k"} width={44}/>
        <Tooltip content={<Tip/>}/>
        <ReferenceLine x={75} stroke="#E9C46A" strokeDasharray="4 3" strokeWidth={1.5}><Label value="75% cliff" fill="#E9C46A" fontSize={9} position="insideTopRight"/></ReferenceLine>
        <ReferenceLine x={100} stroke="#F4711A" strokeDasharray="4 3" strokeWidth={1.5}><Label value="Quota" fill="#F4711A" fontSize={9} position="insideTopRight"/></ReferenceLine>
        <ReferenceLine x={150} stroke="#86EFAC" strokeDasharray="4 3" strokeWidth={1.5}><Label value="Decelerator" fill="#86EFAC" fontSize={9} position="insideTopRight"/></ReferenceLine>
        <Area type="monotone" dataKey="gross" stroke="#F4711A" strokeWidth={2.5} fill="url(#cg1)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── CARROT IMAGE BOX ─────────────────────────────────────────────────
function CarrotImageBox({reward, onImageChange, compact}) {
  const [mode,setMode]=useState(null);
  const [urlVal,setUrlVal]=useState("");
  const [aiVal,setAiVal]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  async function handleAI(){
    if (!aiVal.trim()) return;
    setAiLoading(true);
    await new Promise(r=>setTimeout(r,1800));
    onImageChange(`https://placehold.co/600x300/F4711A/white?text=${encodeURIComponent(aiVal)}`);
    setAiLoading(false); setMode(null); setAiVal("");
  }
  function handleFile(e){
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{onImageChange(ev.target.result);setMode(null);};
    r.readAsDataURL(f);
  }
  return (
    <div>
      <div style={{border:`2px ${reward.image?"solid":"dashed"} ${reward.image?"var(--carrot-light)":"var(--border)"}`,borderRadius:16,minHeight:compact?110:150,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,background:"var(--cream)",overflow:"hidden"}}>
        {reward.image
          ?<img src={reward.image} alt="" style={{width:"100%",height:compact?130:190,objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>
          :<div style={{textAlign:"center",padding:24,color:"var(--muted)"}}><div style={{fontSize:34,marginBottom:8}}>🥕</div><p style={{fontSize:13}}>Add a photo of what you're working toward</p></div>}
      </div>
      {!mode&&!aiLoading&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          <button onClick={()=>setMode("url")} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"12px 8px",borderRadius:12,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--muted)"}}>
            <span style={{fontSize:20}}>🔗</span>Paste URL
          </button>
          <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"12px 8px",borderRadius:12,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--muted)"}}>
            <span style={{fontSize:20}}>📸</span>Upload Photo
            <input type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
          </label>
          <button onClick={()=>setMode("ai")} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"12px 8px",borderRadius:12,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--muted)"}}>
            <span style={{fontSize:20}}>✨</span>Describe It
          </button>
        </div>
      )}
      {mode==="url"&&(
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <input style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,fontSize:16,fontFamily:"'DM Sans',sans-serif",color:"var(--ink)"}} placeholder="Paste image URL..." value={urlVal} onChange={e=>setUrlVal(e.target.value)}/>
          <button onClick={()=>{if(urlVal.trim()){onImageChange(urlVal.trim());setMode(null);setUrlVal("");}}} style={{background:"var(--carrot)",color:"white",border:"none",borderRadius:100,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Add</button>
          <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13}}>Cancel</button>
        </div>
      )}
      {mode==="ai"&&!aiLoading&&(
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <input style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,fontSize:16,fontFamily:"'DM Sans',sans-serif",color:"var(--ink)"}} placeholder={`e.g. "Family vacation in Hawaii"`} value={aiVal} onChange={e=>setAiVal(e.target.value)}/>
          <button onClick={handleAI} style={{background:"var(--carrot)",color:"white",border:"none",borderRadius:100,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Generate ✨</button>
          <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13}}>Cancel</button>
        </div>
      )}
      {aiLoading&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"var(--carrot-light)",borderRadius:12,fontSize:13,color:"var(--carrot-dark)",marginBottom:14}}>
        <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🥕</span> Generating your carrot image...
      </div>}
    </div>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --carrot:#F4711A;--carrot-dark:#C85A0D;--carrot-light:#FDE8D8;
  --green:#2D6A4F;--green-light:#D8F3DC;
  --gold:#E9C46A;--gold-light:#FFF9E6;
  --blue:#1D4ED8;--blue-light:#EFF6FF;
  --red:#DC2626;--red-light:#FEE2E2;
  --cream:#FFFAF4;--ink:#1A1208;--muted:#7A6A55;--border:#EDE0CC;
}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);font-size:16px;-webkit-text-size-adjust:100%;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
@keyframes popIn{0%{transform:scale(0);opacity:0;}70%{transform:scale(1.15);}100%{transform:scale(1);opacity:1;}}
@keyframes spin{to{transform:rotate(360deg);}}

/* NAV */
.nav{display:flex;align-items:center;justify-content:space-between;padding:14px 32px;border-bottom:1px solid var(--border);background:rgba(255,250,244,0.95);backdrop-filter:blur(8px);position:sticky;top:0;z-index:100;}
.nav-logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:var(--carrot);cursor:pointer;}
.nav-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all 0.3s;cursor:default;}
.nav-dot.active{background:var(--carrot);width:24px;border-radius:4px;}
.nav-dot.done{background:var(--green);cursor:pointer;}
.nbtn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:100px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.nbtn-back{background:white;color:var(--muted);border:1.5px solid var(--border);}
.nbtn-back:hover{border-color:var(--carrot);color:var(--carrot);}
.nbtn-next{background:var(--carrot);color:white;}
.nbtn-next:hover{background:var(--carrot-dark);}

/* SCREEN */
.screen{max-width:720px;margin:0 auto;padding:48px 24px 80px;animation:fadeUp 0.4s ease;}
.slabel{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.stitle{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--ink);margin-bottom:8px;line-height:1.2;}
.ssub{font-size:16px;color:var(--muted);margin-bottom:28px;line-height:1.55;}

/* INPUTS */
.inp{width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:16px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);transition:border-color 0.2s;}
.inp:focus{outline:none;border-color:var(--carrot);}
input::placeholder,textarea::placeholder{color:#B0A090;font-style:italic;}
.ilabel{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px;display:block;}
.ihint{font-size:13px;color:var(--muted);margin-top:4px;}
.igroup{margin-bottom:18px;}
.irow{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.irow3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
select.inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A6A55' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:100px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.btn-p{background:var(--carrot);color:white;}
.btn-p:hover{background:var(--carrot-dark);transform:translateY(-1px);box-shadow:0 8px 24px rgba(244,113,26,0.3);}
.btn-p:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-s{background:white;color:var(--ink);border:1.5px solid var(--border);}
.btn-s:hover{border-color:var(--carrot);color:var(--carrot);}
.btn-g{background:transparent;color:var(--muted);}
.btn-sm{padding:8px 16px;font-size:14px;}
.btn-full{width:100%;justify-content:center;font-size:17px;padding:16px;}

/* BOXES */
.info-box{background:var(--gold-light);border:1px solid var(--gold);border-radius:14px;padding:14px 18px;font-size:13px;color:#7A5C00;margin-bottom:20px;line-height:1.5;}
.priv-box{background:var(--green-light);border:1px solid var(--green);border-radius:14px;padding:14px 18px;font-size:13px;color:var(--green);margin-bottom:20px;line-height:1.5;display:flex;gap:10px;}

/* UPLOAD */
.uzone{border:2px dashed var(--border);border-radius:20px;padding:36px 32px;text-align:center;cursor:pointer;transition:all 0.2s;background:white;margin-bottom:12px;}
.uzone:hover{border-color:var(--carrot);background:var(--carrot-light);}
.uzone.has{border-color:var(--green);border-style:solid;background:var(--green-light);}

/* SUMMARY CARD */
.scard{background:white;border:1.5px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:16px;}
.scard-hdr{padding:14px 20px;background:var(--cream);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
.scard-ttl{font-size:16px;font-weight:700;flex:1;}
.badge{font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;}
.badge-g{background:var(--green-light);color:var(--green);}
.badge-o{background:var(--carrot-light);color:var(--carrot-dark);}
.frow{display:flex;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border);gap:14px;}
.frow:last-child{border-bottom:none;}
.frow:hover{background:#FEFCF8;}
.ficon{font-size:18px;width:32px;text-align:center;flex-shrink:0;}
.fbody{flex:1;min-width:0;}
.flabel{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:2px;}
.fval{font-size:18px;font-weight:700;}
.fsrc{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--green);background:var(--green-light);padding:2px 8px;border-radius:100px;margin-top:4px;font-weight:600;}
.ebtn{flex-shrink:0;background:none;border:1.5px solid var(--border);border-radius:8px;padding:6px 12px;font-size:14px;font-weight:600;cursor:pointer;color:var(--muted);}
.ebtn:hover{border-color:var(--carrot);color:var(--carrot);}
.iedit{display:flex;gap:8px;margin-top:8px;align-items:center;}
.ieinp{padding:8px 12px;border:1.5px solid var(--carrot);border-radius:10px;font-size:16px;font-family:'DM Sans',sans-serif;width:160px;color:var(--ink);background:white;}
.ieinp:focus{outline:none;}
.sbtn{background:var(--carrot);color:white;border:none;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:700;cursor:pointer;}
.cbtn{background:none;color:var(--muted);border:none;font-size:14px;cursor:pointer;padding:8px;}

/* AI COACH */
.coach{background:linear-gradient(145deg,#0F0A05,#2D1A0A 50%,#1A2D1A);border-radius:24px;overflow:hidden;margin-bottom:20px;box-shadow:0 8px 40px rgba(244,113,26,0.15);}
.coach-hdr{padding:18px 24px 14px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:12px;}
.coach-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;background:rgba(244,113,26,0.25);color:#FDBA74;margin-left:auto;}
.bpic{padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.08);}
.bpic-lbl{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FDBA74;margin-bottom:10px;}
.bpic-txt{font-size:15px;line-height:1.7;color:rgba(255,255,255,0.92);font-style:italic;border-left:3px solid var(--carrot);padding-left:16px;}
.ins-sec{padding:18px 24px;}
.ins-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}
.ins-pill{border-radius:12px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;}
.ins-do{background:rgba(45,106,79,0.25);border:1px solid rgba(45,106,79,0.4);}
.ins-watch{background:rgba(220,38,38,0.2);border:1px solid rgba(220,38,38,0.35);}
.ins-do .ins-txt{color:#86EFAC;}
.ins-watch .ins-txt{color:#FCA5A5;}
.ins-txt{font-size:12px;line-height:1.5;}
.ins-hl{font-weight:700;margin-bottom:2px;font-size:12px;}

/* TAX */
.tax-box{background:var(--blue-light);border:1.5px solid #BFDBFE;border-radius:20px;padding:22px;margin-bottom:20px;}
.tax-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #BFDBFE;}
.tax-row:last-child{border-bottom:none;}

/* MILESTONE */
.mcard{background:white;border:1.5px solid var(--border);border-radius:22px;overflow:hidden;margin-bottom:14px;cursor:pointer;transition:all 0.2s;}
.mcard:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.08);}
.mcard.top{border-color:var(--green);}
.tier-pill{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:7px;}
.tier-active{background:rgba(244,113,26,0.1);border:1.5px solid rgba(244,113,26,0.3);}
.tier-inactive{background:var(--cream);border:1px solid var(--border);}
.tier-badge{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;}
.tier-active .tier-badge{background:var(--carrot);color:white;}
.tier-inactive .tier-badge{background:var(--border);color:var(--muted);}

/* PLAYBOOK / TARGETS */
.target-display{background:linear-gradient(135deg,#1A1208,#2D1A0A);border-radius:20px;padding:28px;text-align:center;margin-bottom:20px;}
.target-pct{font-family:'Playfair Display',serif;font-size:60px;font-weight:900;color:var(--carrot);line-height:1;}
.target-th{font-size:24px;font-weight:700;color:white;margin-top:10px;}
.target-sub{font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;}
.slider{width:100%;accent-color:var(--carrot);cursor:pointer;}
.dual-card{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px;}
.dual-card.floor{border-color:var(--gold);}
.dual-card.stretch{border-color:var(--green);}

/* METRIC CARD */
.mc{background:white;border:1.5px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px;}
.mc:hover{border-color:var(--carrot);}
.mc-hdr{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.mc-emoji{font-size:22px;width:36px;text-align:center;}
.mc-name{flex:1;font-size:15px;font-weight:600;}
.mc-del{background:none;border:none;cursor:pointer;color:var(--muted);font-size:20px;line-height:1;}
.mc-del:hover{color:var(--red);}
.clabel{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;}
.num-row{display:flex;align-items:center;gap:8px;}
.num-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid var(--border);background:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;transition:all 0.15s;}
.num-btn:hover{border-color:var(--carrot);color:var(--carrot);}
.num-val{font-size:18px;font-weight:700;min-width:36px;text-align:center;}
.fsel{width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:10px;font-size:16px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);}
.fsel:focus{outline:none;border-color:var(--carrot);}
.vbtns{display:flex;gap:6px;}
.vbtn{flex:1;padding:7px 6px;border-radius:8px;border:1.5px solid var(--border);background:white;font-size:14px;font-weight:600;cursor:pointer;text-align:center;transition:all 0.15s;}
.vbtn.on{border-color:var(--carrot);background:var(--carrot-light);color:var(--carrot-dark);}
.sug-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border:1.5px solid var(--border);border-radius:100px;cursor:pointer;font-size:14px;font-weight:500;background:white;transition:all 0.15s;margin:0 6px 8px 0;}
.sug-pill:hover{border-color:var(--carrot);background:var(--carrot-light);color:var(--carrot-dark);}

/* TRACKING */
.topt{border:2px solid var(--border);border-radius:18px;padding:18px 20px;cursor:pointer;transition:all 0.2s;background:white;margin-bottom:10px;display:flex;gap:16px;align-items:flex-start;}
.topt:hover{border-color:var(--carrot);}
.topt.sel{border-color:var(--carrot);background:var(--carrot-light);}
.topt-badge{display:inline-block;margin-top:8px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;background:var(--carrot);color:white;}
.crm-field{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;}
.crm-field:last-child{border-bottom:none;}
.crm-req{font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;background:var(--carrot-light);color:var(--carrot-dark);}

/* DASHBOARD */
.dash-hero{background:linear-gradient(135deg,var(--carrot),var(--carrot-dark));border-radius:24px;padding:30px;color:white;margin-bottom:22px;position:relative;overflow:hidden;}
.dash-hero::after{content:'🥕';position:absolute;right:22px;top:50%;transform:translateY(-50%);font-size:76px;opacity:0.12;}
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;}
.dcard{background:white;border:1.5px solid var(--border);border-radius:20px;padding:18px;}
.dcard-lbl{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.dcard-val{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;}
.gl-item{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border);}
.gl-item:last-child{border-bottom:none;}
.gchk{width:26px;height:26px;border-radius:8px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;flex-shrink:0;}
.gchk.on{background:var(--green);border-color:var(--green);color:white;}

/* METRIC PROGRESS */
.mp-card{background:white;border:1.5px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px;}
.mp-status{font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px;}
.st-ex{background:var(--green-light);color:var(--green);}
.st-met{background:var(--blue-light);color:var(--blue);}
.st-beh{background:var(--red-light);color:var(--red);}
.coach-msg{border-radius:12px;padding:12px 14px;margin-top:12px;font-size:13px;line-height:1.5;}
.cm-ex{background:var(--green-light);border:1px solid var(--green);color:var(--green);}
.cm-met{background:var(--blue-light);border:1px solid #BFDBFE;color:var(--blue);}
.cm-beh{background:var(--red-light);border:1px solid #FECACA;color:var(--red);}

/* LANDING */
.landing{min-height:100vh;background:#0F0A05;}
.lnav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;}
.lhero{max-width:900px;margin:0 auto;padding:80px 48px 60px;text-align:center;}
.leyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(244,113,26,0.15);border:1px solid rgba(244,113,26,0.3);border-radius:100px;padding:6px 16px;font-size:12px;font-weight:700;color:#FDBA74;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px;}
.ltitle{font-family:'Playfair Display',serif;font-size:62px;font-weight:900;color:white;line-height:1.08;margin-bottom:20px;}
.ltitle .hl{color:var(--carrot);}
.lprimary{background:var(--carrot);color:white;border:none;border-radius:100px;padding:16px 36px;font-size:16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.lprimary:hover{background:var(--carrot-dark);transform:translateY(-2px);box-shadow:0 10px 32px rgba(244,113,26,0.4);}
.lsecondary{background:rgba(255,255,255,0.08);color:white;border:1px solid rgba(255,255,255,0.2);border-radius:100px;padding:16px 32px;font-size:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;}
.lfgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto 80px;padding:0 48px;}
.lfcard{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px;transition:all 0.2s;}
.lfcard:hover{background:rgba(255,255,255,0.07);border-color:rgba(244,113,26,0.3);}
.pain-section{max-width:900px;margin:0 auto 80px;padding:0 48px;}
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.pcard{background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);border-radius:16px;padding:20px;}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.scard2{background:rgba(45,106,79,0.12);border:1px solid rgba(45,106,79,0.25);border-radius:16px;padding:20px;}

/* SIGNUP */
.sw{min-height:100vh;background:#0F0A05;display:flex;align-items:center;justify-content:center;padding:24px;}
.sc{background:white;border-radius:28px;max-width:520px;width:100%;overflow:hidden;animation:fadeUp 0.4s ease;box-shadow:0 40px 80px rgba(0,0,0,0.5);}
.sc-top{background:linear-gradient(135deg,#1A1208,#2D1A0A);padding:32px 36px 28px;text-align:center;position:relative;overflow:hidden;}
.sc-top::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 120%,rgba(244,113,26,0.25),transparent 60%);}
.sdivider{height:1px;background:var(--border);margin:20px 0;}

/* PROMISE */
.promise{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);}
.promise:last-child{border-bottom:none;}
.picon{width:40px;height:40px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;}
.ptag{display:inline-block;margin-top:5px;font-size:11px;font-weight:700;padding:2px 8px;border-radius:100px;}
.agree{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:all 0.2s;}
.agree:hover{border-color:var(--carrot);background:var(--carrot-light);}
.agree.on{border-color:var(--green);background:var(--green-light);}
.chk{width:22px;height:22px;border-radius:7px;border:2px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
.chk.on{background:var(--green);border-color:var(--green);}

/* CELEBRATE */
.cel{text-align:center;padding:60px 24px;}
.cel-icon{font-size:76px;animation:popIn 0.6s ease forwards;display:inline-block;margin-bottom:16px;}
.cel-title{font-family:'Playfair Display',serif;font-size:34px;font-weight:900;margin-bottom:8px;}

/* MINI-CARROT / PROGRESS BARS */
.mc-gold-bar{height:10px;background:var(--border);border-radius:5px;overflow:hidden;margin-bottom:4px;}
.mc-gold-fill{height:100%;background:linear-gradient(90deg,var(--gold),#F4D03F);border-radius:5px;transition:width 0.6s ease;}
.treat-msg{background:var(--green-light);border:1px solid var(--green);border-radius:10px;padding:7px 12px;font-size:13px;font-weight:600;color:var(--green);margin-top:5px;animation:fadeUp 0.3s ease;}

/* ── CARROT MONEY BAR (persistent) ── */
.carrotbar{position:sticky;top:0;z-index:90;background:linear-gradient(135deg,#1A1208,#2D1A0A);color:white;padding:12px 18px;box-shadow:0 2px 14px rgba(0,0,0,0.25);}
.carrotbar-inner{max-width:720px;margin:0 auto;}
.cb-top{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.cb-amt{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:var(--carrot);}
.cb-track{height:9px;background:rgba(255,255,255,0.12);border-radius:5px;overflow:hidden;}
.cb-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--carrot),var(--green));border-radius:5px;transition:width 0.7s ease;}

/* ── THREE-TIER CARROT CARD ── */
.tcard{background:white;border:1.5px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:16px;}
.tcard.funded{border-color:var(--green);}
.tcard-body{padding:18px 20px;}
.tchip{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:100px;}

/* ── BOTTOM TAB BAR ── */
.tabbar{position:fixed;bottom:0;left:0;right:0;z-index:100;display:flex;background:rgba(255,250,244,0.97);backdrop-filter:blur(10px);border-top:1px solid var(--border);box-shadow:0 -2px 14px rgba(0,0,0,0.05);}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 10px;cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif;color:var(--muted);transition:color 0.15s;}
.tab.on{color:var(--carrot);}
.tab-ico{font-size:20px;line-height:1;}
.tab-lbl{font-size:11px;font-weight:700;letter-spacing:0.3px;}
.app-screen{max-width:720px;margin:0 auto;padding:24px 20px 96px;animation:fadeUp 0.35s ease;}

/* ── SUB-TABS (carrots screen) ── */
.subtabs{display:flex;gap:6px;background:var(--cream);border:1.5px solid var(--border);border-radius:14px;padding:5px;margin-bottom:22px;}
.subtab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px;border:none;background:none;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);font-weight:600;transition:all 0.15s;}
.subtab.on{background:white;color:var(--carrot);box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.subtab-ico{font-size:18px;}
.subtab-lbl{font-size:12px;font-weight:700;}
.subtab-sub{font-size:11px;opacity:0.7;}
.addrow{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border:2px dashed var(--border);border-radius:16px;background:white;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--muted);font-size:14px;transition:all 0.15s;}
.addrow:hover{border-color:var(--carrot);color:var(--carrot);background:var(--carrot-light);}
.addrow:disabled{opacity:0.45;cursor:not-allowed;}
.fund-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 12px;border-radius:100px;background:var(--carrot-light);color:var(--carrot-dark);}
.mini-treat{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--border);border-radius:14px;margin-bottom:10px;background:white;}
.sec-hdr{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin:30px 0 6px;}
.sec-sub{font-size:14px;color:var(--muted);margin-bottom:16px;line-height:1.5;}
.divider-line{height:1px;background:var(--border);margin:32px 0;}
.qbtn{padding:8px 14px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);transition:all 0.15s;}
.qbtn.on{border-color:var(--carrot);background:var(--carrot);color:white;}
.qbtn:hover{border-color:var(--carrot);}
.dual-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.fbox{border-radius:14px;padding:14px;border:1.5px solid;}
.fbox.floor{background:var(--blue-light);border-color:#BFDBFE;}
.fbox.stretch{background:var(--green-light);border-color:var(--green);}
.fbox-lbl{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}
.treat-input{width:100%;padding:9px 12px;border:1.5px solid var(--gold);border-radius:10px;font-size:16px;font-family:'DM Sans',sans-serif;background:var(--gold-light);color:var(--ink);}
.treat-input:focus{outline:none;border-color:var(--carrot);}
.crm-url-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:100px;background:var(--blue);color:white;border:none;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;text-decoration:none;}
.crm-url-btn:hover{background:#1E40AF;}

/* ── RESOURCES / WHY IT WORKS PAGE ── */
.res-hero{max-width:760px;margin:0 auto;padding:64px 48px 32px;text-align:center;}
.res-section{max-width:1040px;margin:0 auto;padding:0 48px 72px;}
.res-h2{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:white;margin-bottom:8px;}
.res-sub{font-size:16px;color:rgba(255,255,255,0.5);margin-bottom:30px;line-height:1.55;}
.vid-grid,.wp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.vid-card{display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;text-decoration:none;transition:all 0.2s;}
.vid-card:hover{background:rgba(255,255,255,0.07);border-color:rgba(244,113,26,0.4);transform:translateY(-3px);}
.vid-thumb{position:relative;aspect-ratio:16/9;background:#1A1208;overflow:hidden;}
.vid-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.vid-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,10,5,0.28);transition:background 0.2s;}
.vid-card:hover .vid-play{background:rgba(15,10,5,0.1);}
.vid-play>span{width:54px;height:54px;border-radius:50%;background:rgba(244,113,26,0.95);display:flex;align-items:center;justify-content:center;font-size:18px;color:white;padding-left:4px;box-shadow:0 6px 20px rgba(0,0,0,0.45);}
.vid-body{padding:18px 20px;display:flex;flex-direction:column;flex:1;}
.vid-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:white;margin-bottom:4px;line-height:1.25;}
.vid-speaker{font-size:13px;color:var(--carrot);font-weight:600;margin-bottom:10px;}
.vid-desc{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.55;flex:1;margin-bottom:16px;}
.vid-btn{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:white;background:var(--carrot);padding:9px 16px;border-radius:100px;align-self:flex-start;}
.wp-card{display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:26px;}
.wp-icon{font-size:30px;margin-bottom:14px;}
.wp-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:white;margin-bottom:10px;line-height:1.3;}
.wp-teaser{font-size:14px;color:rgba(255,255,255,0.5);line-height:1.55;flex:1;margin-bottom:18px;}
.wp-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:100px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);color:rgba(255,255,255,0.4);font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;align-self:flex-start;cursor:not-allowed;}
.wp-soon{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#FDBA74;background:rgba(244,113,26,0.18);border-radius:100px;padding:3px 9px;margin-left:4px;}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.stat-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:30px 24px;text-align:center;}
.stat-num{font-family:'Playfair Display',serif;font-size:46px;font-weight:900;color:var(--carrot);line-height:1;margin-bottom:12px;}
.stat-txt{font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;margin-bottom:10px;}
.stat-src{font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;}
@media(max-width:760px){.vid-grid,.wp-grid,.stat-grid{grid-template-columns:1fr;}}

/* ── MOBILE READABILITY (under 600px) ── */
@media(max-width:600px){
  .ltitle{font-size:38px;}
  .stitle{font-size:24px;}
  .screen{padding:24px 16px 80px;}
  .app-screen{padding:16px 14px 96px;}
  .lhero{padding:48px 24px 40px;}
  .res-hero{padding:40px 24px 24px;}
  /* card padding 24 → 16, more breathable on small screens */
  .dcard,.mc,.mp-card,.dual-card,.tcard-body,.mini-treat,.scard-hdr{padding:16px;}
  .lfcard{padding:24px 18px!important;}
  .pcard,.scard2{padding:16px!important;}
  /* keep 2-col grids 2-col, just tighten the gap */
  .dgrid,.dual-grid,.dual-card .dual-grid,.irow,.irow3,.pgrid,.sgrid,.ins-grid{gap:10px;}
  .stat-grid{gap:12px;}
  /* 3-col feature row collapses to single column so the big icons stay legible */
  .lfgrid{grid-template-columns:1fr;}
  .tab-lbl{font-size:11px;}
}
`;

// ── MAIN APP ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Profile
  const [userName, setUserName]     = useState("");
  const [userEmail, setUserEmail]   = useState("");
  const [userState, setUserState]   = useState("");
  const [userAge, setUserAge]       = useState(35);
  const [k401Pct, setK401Pct]       = useState(6);
  const [healthMo, setHealthMo]     = useState(200);
  const [otherMo, setOtherMo]       = useState(0);
  const [userPhone, setUserPhone]   = useState("");

  // Upload
  const [files, setFiles] = useState([]);

  // Comp
  const [comp, setComp] = useState({base:150000, quota:1875000, commissionRate:8, accelerator:1.75});
  const [editField, setEditField]   = useState(null);
  const [editVal, setEditVal]       = useState("");
  const [taxOverrides, setTaxOverrides] = useState({});
  const [expandedM, setExpandedM]   = useState(null);

  // Carrots — Big (max 2) + Medium (periodic). Mini carrots live on each metric.
  const [bigCarrots, setBigCarrots] = useState([
    {id:1, label:"Family trip to Italy", what:"Two weeks, the whole family, no email", cost:12000, image:null},
  ]);
  const [medCarrots, setMedCarrots] = useState([
    {id:1, label:"Weekend getaway", what:"Recharge with my partner", cost:2500, period:"Quarterly", image:null},
  ]);
  const [carrotTab, setCarrotTab]   = useState("big");
  const [carrotCut, setCarrotCut]   = useState(25); // % of take-home commission above quota earmarked as "carrot money"
  const [carrotMoney, setCarrotMoney] = useState(3200); // accumulated carrot money (demo)

  // Playbook — Floor / Stretch + metrics + tracking
  const [floorPct, setFloorPct]     = useState(100);
  const [stretchPct, setStretchPct] = useState(130);
  const [metrics, setMetrics]       = useState([]);
  const [trackingMethod, setTrackingMethod] = useState(null);
  const [crmUrl, setCrmUrl]         = useState("");
  const [updateFreq, setUpdateFreq] = useState("weekly");
  const [weeklySummaryDay, setWeeklySummaryDay] = useState("Friday");
  const [weeklySummaryTime, setWeeklySummaryTime] = useState("8:00 AM");

  // App / Dashboard
  const [activeTab, setActiveTab]   = useState("home");
  const [goals, setGoals]           = useState([]);
  const [checked, setChecked]       = useState({});
  const [weeklyEntries, setWeeklyEntries] = useState({});
  const [csvDone, setCsvDone]       = useState(false);
  const [treatMsg, setTreatMsg]     = useState(null);
  const [todayEarned, setTodayEarned] = useState(false);

  const go = s => { setScreen(s); window.scrollTo(0,0); };

  // ── CALC ─────────────────────────────────────────────────────────
  const k401Limit  = useMemo(()=>get401kLimit(userAge),[userAge]);
  const grossAt100 = useMemo(()=>comp.base+comp.quota*0.75*0.05+comp.quota*0.25*(comp.commissionRate/100),[comp]);
  const fedBracket = useMemo(()=>getFedBracket(grossAt100),[grossAt100]);
  const stateTax   = STATE_TAXES[userState]||0;
  const fica       = 7.65;
  const effFed     = taxOverrides.fed??fedBracket.rate;
  const effState   = taxOverrides.state??stateTax;
  const healthAnnual = healthMo*12;
  const otherAnnual  = otherMo*12;
  const annualK401 = Math.min(grossAt100*k401Pct/100, k401Limit);
  const willMax    = grossAt100*k401Pct/100 >= k401Limit;
  const k401Mo     = useMemo(()=>get401kMaxMonth(grossAt100,k401Pct,k401Limit),[grossAt100,k401Pct,k401Limit]);

  function calcGross(pct) {
    const {base,quota,commissionRate,accelerator}=comp;
    const r=commissionRate/100; const a=pct/100;
    const c = a<=0.75 ? quota*a*0.05
            : a<=1.0  ? quota*0.75*0.05+quota*(a-0.75)*r
            : a<=1.5  ? quota*0.75*0.05+quota*0.25*r+quota*(a-1)*r*accelerator
                      : quota*0.75*0.05+quota*0.25*r+quota*0.5*r*accelerator+quota*(a-1.5)*r;
    return base+c;
  }
  // ── PRE-TAX 401(k) NET MATH ──
  // 401(k) + health are pre-tax (reduce taxable income for fed/state).
  // FICA is charged on gross (401k does NOT reduce FICA).
  function k401For(gross){ return Math.min(gross*k401Pct/100, k401Limit); }
  function calcNet(gross){
    const k = k401For(gross);
    const taxable = Math.max(0, gross - k - healthAnnual);
    const fed   = taxable * effFed/100;
    const st    = taxable * effState/100;
    const ficaT = gross * fica/100;
    return gross - fed - st - ficaT - k - healthAnnual - otherAnnual;
  }
  function effRate(gross){ return gross>0 ? Math.round((1-calcNet(gross)/gross)*100) : 0; }

  function startEdit(f,v){setEditField(f);setEditVal(String(v));}
  function saveEdit(){setComp(c=>({...c,[editField]:parseFloat(editVal)||0}));setEditField(null);}

  function addMetric(emoji,label,freq,target){
    if (metrics.find(m=>m.label===label)) return;
    setMetrics(p=>[...p,{id:Date.now()+Math.random(),emoji,label,freq,
      floor:target, stretch:Math.max(target+1,Math.round(target*1.3)),
      remTime:"9:00 AM",remDay:freq==="Daily"?"Daily":"Mon",remVehicle:"email",
      treat:""}]);
  }
  function updMetric(id,patch){setMetrics(p=>p.map(m=>m.id===id?{...m,...patch}:m));}

  // ── CARROT MONEY ─────────────────────────────────────────────────
  // Carrot money = the slice of your take-home commission you reserve for rewards.
  const netBase       = useMemo(()=>calcNet(comp.base),[comp.base,effFed,effState,k401Pct,k401Limit,healthAnnual,otherAnnual]);
  const netAtStretch  = useMemo(()=>calcNet(calcGross(stretchPct)),[comp,stretchPct,effFed,effState,k401Pct,k401Limit,healthAnnual,otherAnnual]);
  const netCommission = Math.max(0, netAtStretch - netBase);
  const carrotBudget  = netCommission * carrotCut/100;       // total annual carrot money at stretch
  const carrotPerDay  = carrotBudget/250;                    // per goal day
  const carrotTotalCost = bigCarrots.reduce((s,c)=>s+(+c.cost||0),0)+medCarrots.reduce((s,c)=>s+(+c.cost||0),0);

  // Carrot money only accrues on take-home ABOVE the 100%-of-plan number.
  const netAt100 = useMemo(()=>calcNet(calcGross(100)),[comp,effFed,effState,k401Pct,k401Limit,healthAnnual,otherAnnual]);
  function carrotMoneyAtPct(pct){ return Math.max(0, calcNet(calcGross(pct))-netAt100)*carrotCut/100; }
  // Lowest attainment % whose above-quota carrot money fully funds `cost`.
  function pctToFund(cost){
    if (!cost) return null;
    for (let p=101;p<=300;p++){ if (carrotMoneyAtPct(p)>=cost) return p; }
    return null; // can't be funded by 300%
  }

  // Funds Big Carrots in order from accumulated carrot money.
  function carrotFunding(){
    let remaining = carrotMoney;
    const out = {};
    let current = null;
    bigCarrots.forEach(c=>{
      const cost = +c.cost||0;
      const applied = Math.min(remaining, cost);
      out[c.id] = {applied, cost, done: cost>0 && applied>=cost};
      remaining = Math.max(0, remaining-cost);
      if (current===null && cost>0 && applied<cost) current=c.id;
    });
    return {out, current, remaining};
  }

  // ── METRIC STATUS vs Floor / Stretch ─────────────────────────────
  // Returns {key, label, color, bg} given a logged count and the metric.
  function metricStatus(count, m){
    const c = +count||0;
    if (c >= (+m.stretch||0))      return {key:"stretch", label:"🎉 Stretch hit",  color:"var(--green)", bg:"st-ex",  cm:"cm-ex"};
    if (c >= (+m.floor||0))        return {key:"floor",   label:"✓ Floor cleared", color:"var(--blue)",  bg:"st-met", cm:"cm-met"};
    return {key:"below", label:"Below floor", color:"var(--red)", bg:"st-beh", cm:"cm-beh"};
  }
  // Log a value for a metric this week; celebrate a mini-carrot if Stretch is reached.
  function logEntry(m, val){
    const v = Math.max(0, +val||0);
    setWeeklyEntries(p=>({...p,[m.id]:v}));
    if (v >= (+m.stretch||0) && m.treat){
      setTreatMsg(`🥕 Stretch goal hit on ${m.label}! Mini-carrot unlocked: ${m.treat}`);
      setTimeout(()=>setTreatMsg(null), 4000);
    }
  }

  const doneToday = Object.values(checked).filter(Boolean).length;
  const STEPS     = ["upload","summary","paycheck","carrots","playbook"];
  const STEP_LBLS = ["Upload","Plan Summary","Paycheck","My Carrots","My Playbook"];
  const si        = STEPS.indexOf(screen);
  const showNav   = STEPS.includes(screen);
  const inApp     = screen==="app";

  // ── OTE calcs for summary ─────────────────────────────────────────
  const atQuotaComm = comp.quota*0.75*0.05+comp.quota*0.25*(comp.commissionRate/100);
  const ote         = comp.base+atQuotaComm;
  const basePct     = Math.round((comp.base/ote)*100);
  const commPct     = 100-basePct;

  return (
    <div style={{minHeight:"100vh"}}>
      <style>{S}</style>

      {/* SETUP TOP NAV */}
      {showNav&&(
        <nav className="nav">
          <div className="nav-logo" onClick={()=>go("landing")}>🥕 Earn The Carrot</div>
          <div style={{display:"flex",gap:4}}>
            {STEPS.map((s,i)=>(
              <div key={s} className={`nav-dot ${screen===s?"active":si>i?"done":""}`}
                onClick={()=>si>i&&go(s)} title={STEP_LBLS[i]}/>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            {si>0&&<button className="nbtn nbtn-back" onClick={()=>go(STEPS[si-1])}>← Back</button>}
            {si>=0&&si<STEPS.length-1&&(
              <button className="nbtn nbtn-next" onClick={()=>go(STEPS[si+1])}>{STEP_LBLS[si+1]} →</button>
            )}
          </div>
        </nav>
      )}

      {/* ══ LANDING ══════════════════════════════════════════════════ */}
      {screen==="landing"&&(
        <div className="landing">
          <nav className="lnav">
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"var(--carrot)"}}>🥕 Earn The Carrot</div>
            <div style={{display:"flex",gap:28,alignItems:"center"}}>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.55)",cursor:"pointer"}}>How It Works</span>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.55)",cursor:"pointer"}} onClick={()=>go("resources")}>Why It Works</span>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.55)",cursor:"pointer"}}>Company</span>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.55)",cursor:"pointer"}}>Privacy</span>
              <button className="lprimary" style={{padding:"10px 22px",fontSize:14}} onClick={()=>go("signup")}>Get Started Free</button>
            </div>
          </nav>
          <div className="lhero">
            <div style={{fontSize:80,textAlign:"center",animation:"bounce 2s ease infinite",marginBottom:16}}>🥕</div>
            <div className="leyebrow">🥕 For Sales People, By Sales People</div>
            <h1 className="ltitle">Stop chasing a <span className="hl">number.</span><br/>Start chasing your <span className="hl">dream.</span></h1>
            <p style={{fontSize:20,color:"rgba(255,255,255,0.65)",lineHeight:1.65,maxWidth:640,margin:"0 auto 14px"}}>
              Too many salespeople grind toward a quota they don't connect with. Earn The Carrot helps you decode your comp plan, see what you actually take home, and turn your commission into real rewards you can see and touch.
            </p>
            <p style={{fontSize:16,fontWeight:700,color:"var(--gold)",marginBottom:40}}>"Too much stick out there. We need more carrots." 🥕</p>
            <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:60}}>
              <button className="lprimary" onClick={()=>go("signup")}>Start Earning Your Carrot →</button>
              <button className="lsecondary" onClick={()=>go("upload")}>See a Demo</button>
            </div>
          </div>
          <div className="lfgrid">
            {[
              {icon:"📄",t:"Decode Your Comp Plan",d:"AI reads every line of your comp plan — surfacing hidden clauses, decelerators, clawbacks, and the fine print that quietly shapes your real take-home."},
              {icon:"🥕",t:"Visualize Your Carrots",d:"Turn your commission into real rewards you can see and touch. Mini, medium, and big carrots — all funded by the money you earn above quota."},
              {icon:"🎯",t:"Track What Matters",d:"Set a Floor you refuse to miss and a Stretch that changes your year. We build the daily playbook and track every metric that gets you there."},
            ].map((f,i)=>(
              <div className="lfcard" key={i} style={{padding:"40px 32px"}}>
                <div style={{fontSize:64,marginBottom:18}}>{f.icon}</div>
                <div style={{fontSize:21,fontWeight:700,color:"white",marginBottom:12}}>{f.t}</div>
                <div style={{fontSize:15,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>{f.d}</div>
              </div>
            ))}
          </div>
          <div className="pain-section">
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:"white",marginBottom:14,textAlign:"center"}}>The problem with sales motivation today</h2>
            <p style={{fontSize:16,color:"rgba(255,255,255,0.5)",textAlign:"center",marginBottom:32}}>Most tools focus on the company's goals, not yours. That's backwards.</p>

            {/* The 1992 playbook — a moment of humor before we get serious */}
            <div style={{background:"#1A1208",border:"1px solid rgba(244,113,26,0.2)",borderRadius:24,padding:"44px 32px",textAlign:"center",marginBottom:40}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"white",marginBottom:30}}>The 1992 Sales Motivation Playbook</div>
              <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:440,margin:"0 auto"}}>
                {[
                  {e:"🚗",t:"First prize:",d:"A Cadillac Eldorado"},
                  {e:"🔪",t:"Second prize:",d:"A set of steak knives"},
                  {e:"😤",t:"Third prize:",d:"You're fired"},
                ].map((x,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:18,textAlign:"left"}}>
                    <span style={{fontSize:48,flexShrink:0,width:58,textAlign:"center"}}>{x.e}</span>
                    <span style={{fontSize:18,color:"rgba(255,255,255,0.8)"}}><strong style={{color:"white"}}>{x.t}</strong> {x.d}</span>
                  </div>
                ))}
              </div>
              <div style={{height:1,background:"rgba(255,255,255,0.12)",maxWidth:440,margin:"32px auto 22px"}}/>
              <div style={{fontSize:15,fontStyle:"italic",color:"var(--carrot)",marginBottom:12,lineHeight:1.5}}>"Sound familiar? Most companies are still running the same playbook."</div>
              <div style={{fontSize:17,fontWeight:700,color:"white"}}>Earn The Carrot was built to change that.</div>
            </div>

            <div className="pgrid">
              {[
                {icon:"😤",t:"\"Exceed your number\" isn't motivating",d:"Hitting 110% quota doesn't make you want to work harder. It just feels like more pressure."},
                {icon:"📝",t:"Nobody reads their comp plan",d:"Hidden clawbacks and caps are buried in fine print. Most reps find out when their paycheck is smaller than expected."},
                {icon:"🏆",t:"Only one person can be #1",d:"Leaderboards make 99% of your team feel like losers. That kills morale across the board."},
                {icon:"💸",t:"You don't know what you take home",d:"The gap between gross OTE and actual take-home can be 35–40%. Most reps have no idea."},
              ].map((p,i)=>(
                <div className="pcard" key={i} style={{padding:24}}>
                  <div style={{fontSize:64,marginBottom:16}}>{p.icon}</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#FCA5A5",marginBottom:6}}>{p.t}</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>{p.d}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:"var(--gold)",letterSpacing:2,margin:"20px 0"}}>→ EARN THE CARROT FIXES THIS ←</div>
            <div className="sgrid">
              {[
                {icon:"🥕",t:"Chase your dream, not a number",d:"\"I want to take my family to Italy\" is 10x more motivating than hitting 120% of plan."},
                {icon:"🔍",t:"AI reads the fine print for you",d:"We surface every hidden clause, cap, and gotcha so you know exactly how your plan works."},
                {icon:"🎯",t:"Win against yourself, not others",d:"Everyone has their own floor and stretch. Everyone can win. Motivation goes up across the team."},
                {icon:"🏦",t:"See your real take-home instantly",d:"Know exactly what hits your bank at your floor and stretch — after every deduction."},
              ].map((s,i)=>(
                <div className="scard2" key={i} style={{padding:24}}>
                  <div style={{fontSize:64,marginBottom:16}}>{s.icon}</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#86EFAC",marginBottom:6}}>{s.t}</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{textAlign:"center",padding:"0 48px 80px"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:"white",marginBottom:14}}>Ready to earn your carrot?</h2>
            <p style={{fontSize:16,color:"rgba(255,255,255,0.5)",marginBottom:32}}>Free to start. No credit card. No company data stored.</p>
            <button className="lprimary" style={{fontSize:18,padding:"18px 48px"}} onClick={()=>go("signup")}>🥕 Get Started Free</button>
          </div>
          <footer style={{borderTop:"1px solid rgba(255,255,255,0.08)",padding:"32px 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"var(--carrot)"}}>🥕 Earn The Carrot</div>
            <div style={{display:"flex",gap:24}}>
              {["Privacy Policy","Terms of Service","Contact"].map(l=>(
                <span key={l} style={{fontSize:13,color:"rgba(255,255,255,0.35)",cursor:"pointer"}}>{l}</span>
              ))}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)"}}>© 2025 EarnTheCarrot.com</div>
          </footer>
        </div>
      )}

      {/* ══ RESOURCES / WHY IT WORKS ═════════════════════════════════ */}
      {screen==="resources"&&(
        <div className="landing">
          <nav className="lnav">
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"var(--carrot)",cursor:"pointer"}} onClick={()=>go("landing")}>🥕 Earn The Carrot</div>
            <div style={{display:"flex",gap:28,alignItems:"center"}}>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.55)",cursor:"pointer"}} onClick={()=>go("landing")}>Home</span>
              <span style={{fontSize:14,color:"var(--carrot)",fontWeight:600,cursor:"default"}}>Why It Works</span>
              <button className="lprimary" style={{padding:"10px 22px",fontSize:14}} onClick={()=>go("signup")}>Get Started Free</button>
            </div>
          </nav>

          {/* HERO */}
          <div className="res-hero">
            <div className="leyebrow">📚 Why It Works</div>
            <h1 className="ltitle" style={{fontSize:52}}>The science of <span className="hl">motivation.</span></h1>
            <p style={{fontSize:19,color:"rgba(255,255,255,0.6)",maxWidth:680,margin:"0 auto",lineHeight:1.6}}>
              Earn The Carrot isn't a hunch — it's built on decades of research into what actually drives people to perform. Watch the talks, read the papers, see the numbers.
            </p>
          </div>

          {/* SECTION 1 — VIDEOS */}
          <div className="res-section">
            <h2 className="res-h2">🎬 Watch: The Science Behind Earn The Carrot</h2>
            <p className="res-sub">Three talks that shaped how we think about sales motivation.</p>
            <div className="vid-grid">
              {[
                {id:"nf4oROvpp90", title:"Why We Do What We Do", speaker:"Tony Robbins · TED",
                  desc:"The most-watched TED Talk on human motivation. Robbins explains why people are driven by emotion and meaning — not logic or numbers alone. Essential viewing for any sales leader.",
                  url:"https://www.youtube.com/watch?v=nf4oROvpp90"},
                {id:"rrkrvAUbU9Y", title:"The Puzzle of Motivation", speaker:"Daniel Pink · TED",
                  desc:"Pink's landmark research shows that traditional carrot-and-stick incentives actually hurt performance on complex tasks. The case for intrinsic motivation — and the academic foundation of Earn The Carrot.",
                  url:"https://www.youtube.com/watch?v=rrkrvAUbU9Y"},
                {id:"rrkrvAUbU9Y", title:"Motivation and Sales", speaker:"Daniel Pink",
                  desc:"Pink applies his motivation research directly to sales teams. Why the best reps are driven by autonomy, mastery, and purpose — not just commission checks.",
                  url:"https://www.youtube.com/watch?v=rrkrvAUbU9Y"},
              ].map((v,i)=>(
                <a className="vid-card" key={i} href={v.url} target="_blank" rel="noreferrer">
                  <div className="vid-thumb">
                    <img src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy"/>
                    <div className="vid-play"><span>▶</span></div>
                  </div>
                  <div className="vid-body">
                    <div className="vid-title">{v.title}</div>
                    <div className="vid-speaker">{v.speaker}</div>
                    <p className="vid-desc">{v.desc}</p>
                    <span className="vid-btn">Watch on YouTube ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* SECTION 2 — WHITE PAPERS */}
          <div className="res-section">
            <h2 className="res-h2">📄 Read: Our Research</h2>
            <p className="res-sub">Deep dives on the broken state of sales motivation — and the fix.</p>
            <div className="wp-grid">
              {[
                {icon:"🥕", title:"Too Much Stick, Not Enough Carrot", teaser:"Why modern sales motivation is broken and how to fix it."},
                {icon:"💸", title:"The $115,000 Problem", teaser:"How comp plan confusion is silently killing your sales team."},
                {icon:"🎯", title:"The Personal Goal Effect", teaser:"How connecting quotas to life dreams unlocks sales performance."},
              ].map((w,i)=>(
                <div className="wp-card" key={i}>
                  <div className="wp-icon">{w.icon}</div>
                  <div className="wp-title">{w.title}</div>
                  <p className="wp-teaser">{w.teaser}</p>
                  <button className="wp-btn" disabled>⬇ Download PDF<span className="wp-soon">Coming soon</span></button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3 — THE NUMBERS */}
          <div className="res-section">
            <h2 className="res-h2">📊 The Numbers</h2>
            <p className="res-sub">The data behind why a new approach to motivation matters.</p>
            <div className="stat-grid">
              {[
                {num:"16%",  txt:"of sales reps hit quota in 2024",                src:"Kixie"},
                {num:"89%",  txt:"of sellers feel burned out",                     src:"Gartner"},
                {num:"$115K",txt:"average cost to replace a sales rep",            src:"Everstage"},
                {num:"35%",  txt:"annual sales rep turnover — 3x the national average", src:"Industry data"},
                {num:"57%",  txt:"more sales by optimists vs. pessimists",         src:"Forbes / Seligman"},
                {num:"28%",  txt:"of reps believe their team will hit quota",      src:"Salesforce"},
              ].map((s,i)=>(
                <div className="stat-card" key={i}>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-txt">{s.txt}</div>
                  <div className="stat-src">Source: {s.src}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{textAlign:"center",padding:"0 48px 80px"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:900,color:"white",marginBottom:14}}>Ready to put the science to work?</h2>
            <p style={{fontSize:16,color:"rgba(255,255,255,0.5)",marginBottom:30}}>Turn your quota into a carrot worth chasing.</p>
            <button className="lprimary" style={{fontSize:18,padding:"18px 48px"}} onClick={()=>go("signup")}>🥕 Get Started Free</button>
          </div>

          <footer style={{borderTop:"1px solid rgba(255,255,255,0.08)",padding:"32px 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"var(--carrot)",cursor:"pointer"}} onClick={()=>go("landing")}>🥕 Earn The Carrot</div>
            <div style={{display:"flex",gap:24}}>
              {["Privacy Policy","Terms of Service","Contact"].map(l=>(
                <span key={l} style={{fontSize:13,color:"rgba(255,255,255,0.35)",cursor:"pointer"}}>{l}</span>
              ))}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)"}}>© 2025 EarnTheCarrot.com</div>
          </footer>
        </div>
      )}

      {/* ══ SIGNUP ═══════════════════════════════════════════════════ */}
      {screen==="signup"&&(
        <div className="sw">
          <div className="sc">
            <div className="sc-top">
              <div style={{fontSize:48,marginBottom:12,animation:"bounce 2s ease infinite",display:"inline-block",position:"relative",zIndex:1}}>🥕</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:"white",marginBottom:6,position:"relative",zIndex:1}}>Create Your Profile</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",position:"relative",zIndex:1}}>Takes 2 minutes. We only ask what we actually need.</div>
            </div>
            <div style={{padding:"28px 32px"}}>
              <div style={{background:"var(--green-light)",border:"1px solid var(--green)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"var(--green)",marginBottom:20,lineHeight:1.5,display:"flex",gap:8}}>
                🔒 <span><strong>Your privacy matters.</strong> We only store your first name, email, state, age, and financial inputs — never your company name, SSN, or documents. Your comp plan is read by AI and immediately deleted.</span>
              </div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>About You</div>
              <div className="irow" style={{marginBottom:16}}>
                <div className="igroup" style={{marginBottom:0}}>
                  <label className="ilabel">First Name</label>
                  <input className="inp" placeholder="e.g. Alex" value={userName} onChange={e=>setUserName(e.target.value)}/>
                </div>
                <div className="igroup" style={{marginBottom:0}}>
                  <label className="ilabel">Email Address</label>
                  <input className="inp" type="email" placeholder="you@example.com" value={userEmail} onChange={e=>setUserEmail(e.target.value)}/>
                </div>
              </div>
              <div className="irow" style={{marginBottom:0}}>
                <div className="igroup">
                  <label className="ilabel">State You Live In</label>
                  <select className="inp" value={userState} onChange={e=>setUserState(e.target.value)}>
                    <option value="">Select your state...</option>
                    {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="ihint">Sets your state tax rate</div>
                </div>
                <div className="igroup">
                  <label className="ilabel">Your Age</label>
                  <input className="inp" type="number" min="18" max="80" value={userAge} onChange={e=>setUserAge(+e.target.value)}/>
                  <div className="ihint">Sets your 401(k) limit ({fmt(k401Limit)})</div>
                </div>
              </div>
              <div className="sdivider"/>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>Your Deductions</div>
              <div className="igroup">
                <label className="ilabel">401(k) Contribution: <strong>{k401Pct}% of salary</strong></label>
                <input type="range" className="slider" min="0" max="25" step="0.5" value={k401Pct} onChange={e=>setK401Pct(+e.target.value)}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginTop:4}}>
                  <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span>
                </div>
                <div className="ihint">2025 limit for your age: {fmt(k401Limit)} — {k401LimitNote(userAge)}</div>
              </div>
              <div className="irow">
                <div className="igroup" style={{marginBottom:0}}>
                  <label className="ilabel">Health Insurance/mo</label>
                  <input className="inp" type="number" value={healthMo} onChange={e=>setHealthMo(+e.target.value)}/>
                  <div className="ihint">Pre-tax premium</div>
                </div>
                <div className="igroup" style={{marginBottom:0}}>
                  <label className="ilabel">Other Deductions/mo</label>
                  <input className="inp" type="number" value={otherMo} onChange={e=>setOtherMo(+e.target.value)} placeholder="Dental, FSA, etc."/>
                </div>
              </div>
              <div className="sdivider"/>
              <button className="btn btn-p btn-full" onClick={()=>go("privacy")} disabled={!userName||!userEmail||!userState}>
                Continue — Let's Earn 🥕
              </button>
              <div style={{textAlign:"center",marginTop:12,fontSize:13,color:"var(--muted)"}}>
                Already have an account? <span style={{color:"var(--carrot)",cursor:"pointer",fontWeight:600}}>Sign in</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PRIVACY ══════════════════════════════════════════════════ */}
      {screen==="privacy"&&(
        <div className="sw">
          <div style={{background:"white",borderRadius:28,maxWidth:520,width:"100%",overflow:"hidden",animation:"fadeUp 0.4s ease",boxShadow:"0 40px 80px rgba(0,0,0,0.5)"}}>
            <div style={{background:"linear-gradient(135deg,#1A1208,#2D1A0A)",padding:"28px 32px 24px",textAlign:"center"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(244,113,26,0.15)",border:"2px solid rgba(244,113,26,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28}}>🔒</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"white",marginBottom:6}}>Before You Upload Anything</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)"}}>Here's exactly what we do — and don't do — with your documents.</div>
            </div>
            <div style={{padding:"20px 28px"}}>
              {[
                {icon:"🗑️",bg:"#FDE8D8",t:"Your documents are deleted immediately",d:"AI reads your file to extract numbers — then it's permanently deleted.",tag:"Files deleted after processing",tBg:"#FDE8D8",tC:"#C85A0D"},
                {icon:"👁️",bg:"#EFF6FF",t:"No human ever sees your uploads",d:"Only AI processes your documents. No Earn The Carrot employee has access.",tag:"AI only — no human access",tBg:"#EFF6FF",tC:"#1D4ED8"},
                {icon:"🚫",bg:"#D8F3DC",t:"We never sell your data",d:"Your information is never sold, rented, or shared with advertisers. Ever.",tag:"Zero data selling — guaranteed",tBg:"#D8F3DC",tC:"#2D6A4F"},
                {icon:"🔒",bg:"#FFF9E6",t:"Minimum data only",d:"We store your name, email, state, and extracted numbers — no company names or SSNs.",tag:"Only what the app needs",tBg:"#FFF9E6",tC:"#7A5C00"},
              ].map((p,i)=>(
                <div className="promise" key={i}>
                  <div className="picon" style={{background:p.bg}}>{p.icon}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--ink)",marginBottom:3}}>{p.t}</div>
                    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.5}}>{p.d}</div>
                    <div className="ptag" style={{background:p.tBg,color:p.tC}}>✓ {p.tag}</div>
                  </div>
                </div>
              ))}
              <div className={`agree ${privacyAgreed?"on":""}`} onClick={()=>setPrivacyAgreed(!privacyAgreed)} style={{margin:"16px 0"}}>
                <div className={`chk ${privacyAgreed?"on":""}`}>
                  {privacyAgreed&&<span style={{color:"white",fontSize:13,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1,fontSize:13,color:"var(--muted)",lineHeight:1.5}}>
                  <strong>I understand and agree.</strong> My documents are deleted after processing and my data is never sold.
                </div>
              </div>
              <button className="btn btn-p btn-full" style={{opacity:privacyAgreed?1:0.4,cursor:privacyAgreed?"pointer":"not-allowed"}}
                onClick={()=>privacyAgreed&&go("upload")}>
                {privacyAgreed?"🔒 I'm Protected — Upload My Plan":"Check the box above to continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ UPLOAD ═══════════════════════════════════════════════════ */}
      {screen==="upload"&&(
        <div className="screen">
          <div className="slabel">Step 1 of 5</div>
          <h2 className="stitle">Upload Your Documents</h2>
          <p className="ssub">Drop in your comp plan, pay stub, SPIFFs, quota changes — anything related to your compensation. We'll read it all.</p>
          <div className="priv-box">
            <span>🔒</span>
            <span><strong>Your documents are safe.</strong> Everything you upload is read by AI to extract key numbers, then permanently deleted. No human sees your files. We never store your company name, SSN, or document contents.</span>
          </div>
          <label style={{display:"block"}}>
            <input type="file" accept=".pdf,.doc,.docx,.txt,.eml,.png,.jpg" multiple
              onChange={e=>setFiles(p=>[...p,...Array.from(e.target.files).map(f=>({name:f.name,id:Date.now()+Math.random()}))])}
              style={{display:"none"}}/>
            <div className={`uzone ${files.length?"has":""}`}>
              <div style={{fontSize:36,marginBottom:10}}>{files.length?"✅":"📄"}</div>
              <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>
                {files.length?`${files.length} file${files.length>1?"s":""} ready — click to add more`:"Drop your comp plan, pay stub, or SPIFF emails here"}
              </div>
              <div style={{fontSize:13,color:"var(--muted)"}}>PDF, Word, images, or forwarded emails · Click to browse</div>
            </div>
          </label>
          {files.map(f=>(
            <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,background:"var(--gold-light)",border:"1px solid var(--gold)",borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:6}}>
              <span>📄</span><span style={{flex:1}}>{f.name}</span>
              <button onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:18}}>×</button>
            </div>
          ))}
          <div className="info-box">💡 <strong>Tip:</strong> Got a SPIFF email or quota change? Forward it to yourself, save it, and upload it here.</div>
        </div>
      )}

      {/* ══ SUMMARY ══════════════════════════════════════════════════ */}
      {screen==="summary"&&(
        <div className="screen">
          <div className="slabel">Step 2 of 5</div>
          <h2 className="stitle">Here's What We Found</h2>
          <p className="ssub">We decoded two things — your numbers and what leadership is really trying to get you to do.</p>

          {/* AI COACH */}
          <div className="coach">
            <div className="coach-hdr">
              <span style={{fontSize:22}}>🧠</span>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"white",marginBottom:2}}>AI Plan Interpretation</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>What your comp plan is designed to make you do</div>
              </div>
              <div className="coach-badge">New ✨</div>
            </div>
            <div className="bpic">
              <div className="bpic-lbl">The Big Picture</div>
              <div className="bpic-txt">"This is a hunter's plan. Leadership is betting big on new logos this year — new business pays nearly 2x more than expansion, and the Fast Start bonus rewards whoever gets off the blocks quickest. The 14% accelerator above quota means top reps will separate themselves fast. If you're spending time on renewals, you're playing the wrong game."</div>
            </div>
            <div className="ins-sec">
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"#86EFAC",marginBottom:10}}>✅ What This Plan Rewards</div>
              <div className="ins-grid">
                {[
                  {icon:"🏆",h:"Hit quota fast",t:"Your accelerator jumps to 14% above 100% — the plan rewards blowing past quota, not just hitting it."},
                  {icon:"🆕",h:"Chase new logos",t:"New Logo SPIFF pays $8K per customer. Leadership is prioritizing new business."},
                  {icon:"⚡",h:"Win in Month 1",t:"Fast Start bonus expires after 30 days. This $15K is gone if you miss it."},
                  {icon:"📅",h:"Close before quarter end",t:"Commission pays on booking date. Deals that slip reset your accelerator progress."},
                ].map((ins,i)=>(
                  <div className="ins-pill ins-do" key={i}>
                    <div style={{fontSize:16,flexShrink:0}}>{ins.icon}</div>
                    <div className="ins-txt"><div className="ins-hl">{ins.h}</div>{ins.t}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"#FCA5A5",marginBottom:10}}>⚠️ Watch Out For These</div>
              <div className="ins-grid">
                {[
                  {icon:"⚠️",h:"The 75% cliff is real",t:"Below 75% quota you earn nothing in commission — just base."},
                  {icon:"📉",h:"Decelerator at 150%",t:"Rate drops from 14% back to 8% above 150%."},
                  {icon:"🔄",h:"Clawback is 180 days",t:"The summary says 90 days but the legal section says 180."},
                  {icon:"💰",h:"Hard cap at $350K variable",t:"Total variable pay is capped despite the accelerator."},
                ].map((ins,i)=>(
                  <div className="ins-pill ins-watch" key={i}>
                    <div style={{fontSize:16,flexShrink:0}}>{ins.icon}</div>
                    <div className="ins-txt"><div className="ins-hl">{ins.h}</div>{ins.t}</div>
                  </div>
                ))}
              </div>
              <div style={{padding:"14px 0"}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:12}}>What Leadership Is Prioritizing</div>
                {[
                  {l:"New Business",lv:9,d:"Heavily weighted toward new logos"},
                  {l:"Speed",lv:8,d:"Fast Start rewards early wins"},
                  {l:"Expansion",lv:4,d:"Renewals & upsells pay less"},
                  {l:"Big Deals",lv:6,d:"No deal-size accelerator found"},
                ].map((m,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.65)",width:100,flexShrink:0}}>{m.l}</div>
                    <div style={{flex:1,display:"flex",gap:3}}>
                      {[...Array(10)].map((_,j)=>(
                        <div key={j} style={{flex:1,height:8,borderRadius:4,background:j<m.lv?(m.lv>=8?"var(--carrot)":m.lv>=6?"#E9C46A":"rgba(255,255,255,0.3)"):"rgba(255,255,255,0.1)"}}/>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",width:150,flexShrink:0,textAlign:"right"}}>{m.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FINE PRINT */}
          <div style={{background:"var(--red-light)",border:"1.5px solid #FECACA",borderRadius:16,padding:"18px 22px",marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:"var(--red)",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>⚠️ Fine Print — Things Most Reps Miss</div>
            <div style={{fontSize:13,color:"#7F1D1D",marginBottom:8,fontStyle:"italic"}}>Our AI found these buried in the legal section. Most reps never see them until it affects their paycheck.</div>
            {[
              {p:"Clawback window is actually 180 days",d:"The summary says 90 days — the legal section says 180. If a customer churns within 6 months, your commission is reversed."},
              {p:"Must be employed on payment date",d:"Resign or get terminated before commission is paid? You forfeit it — even if you closed the deal months ago."},
              {p:"Hard cap: $350,000 max variable pay",d:"Despite the 14% accelerator, total variable pay is capped. Know this before counting on a big payout."},
              {p:"Quota can be modified mid-year — retroactively",d:"Your quota can increase mid-quarter, potentially dropping your attainment percentage significantly."},
            ].map((w,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<3?"1px solid #FECACA":"none"}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>🔴</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#7F1D1D",marginBottom:2}}>{w.p}</div>
                  <div style={{fontSize:12,color:"#991B1B",lineHeight:1.5}}>{w.d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* OTE COMP CARD */}
          <div className="scard">
            <div className="scard-hdr"><span style={{fontSize:18}}>💰</span><span className="scard-ttl">Your Total Compensation</span><span className="badge badge-g">✓ Found</span></div>
            <div style={{background:"linear-gradient(135deg,#1A1208,#2D1A0A)",padding:"22px 22px 20px"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:6}}>On-Target Earnings at 100% of Plan</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:"white",lineHeight:1,marginBottom:4}}>{fmt(ote)}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:18}}>total gross · {fmt(calcNet(calcGross(100)))} est. take-home after taxes</div>
              <div style={{display:"flex",height:10,borderRadius:5,overflow:"hidden",marginBottom:12}}>
                <div style={{width:`${basePct}%`,background:"#E9C46A"}}/>
                <div style={{width:`${commPct}%`,background:"var(--carrot)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:"rgba(233,196,106,0.15)",border:"1px solid rgba(233,196,106,0.3)",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#E9C46A",marginBottom:4}}>🏦 Base Salary ({basePct}%)</div>
                  {editField==="base"
                    ?<div className="iedit">
                        <input className="ieinp" value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&saveEdit()} style={{background:"rgba(255,255,255,0.1)",borderColor:"#E9C46A",color:"white",width:130}}/>
                        <button className="sbtn" onClick={saveEdit}>Save</button>
                        <button className="cbtn" style={{color:"rgba(255,255,255,0.5)"}} onClick={()=>setEditField(null)}>×</button>
                      </div>
                    :<>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"white"}}>{fmt(comp.base)}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3}}>{fmt(comp.base/12)}/mo · {fmt(comp.base/24)}/paycheck</div>
                      <button className="ebtn" style={{marginTop:6,fontSize:11,padding:"3px 10px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",borderRadius:6}} onClick={()=>startEdit("base",comp.base)}>✏️ Edit</button>
                    </>}
                </div>
                <div style={{background:"rgba(244,113,26,0.15)",border:"1px solid rgba(244,113,26,0.3)",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#FDBA74",marginBottom:4}}>📈 Commission ({commPct}%)</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"white"}}>{fmt(atQuotaComm)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3}}>at 100% of {fmt(comp.quota)} quota</div>
                  <button className="ebtn" style={{marginTop:6,fontSize:11,padding:"3px 10px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",borderRadius:6}} onClick={()=>startEdit("quota",comp.quota)}>✏️ Edit Quota</button>
                </div>
              </div>
            </div>

            <div className="frow">
              <div className="ficon">📊</div>
              <div className="fbody">
                <div className="flabel">Annual Quota</div>
                {editField==="quota"
                  ?<div className="iedit"><input className="ieinp" value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&saveEdit()}/><button className="sbtn" onClick={saveEdit}>Save</button><button className="cbtn" onClick={()=>setEditField(null)}>Cancel</button></div>
                  :<><div className="fval">{fmt(comp.quota)}</div><div className="fsrc">📄 Found on page 3</div></>}
              </div>
              {editField!=="quota"&&<button className="ebtn" onClick={()=>startEdit("quota",comp.quota)}>✏️ Edit</button>}
            </div>

            <div style={{padding:"18px 20px",borderTop:"1px solid var(--border)"}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>Commission Tiers & Payouts</div>
              {[
                {range:"0% – 75% of quota",  rate:5, color:"#E9C46A", payout:comp.quota*0.75*0.05,              bg:"var(--gold-light)",  border:"var(--gold)",   label:"Base rate",warn:false},
                {range:"75% – 100% of quota", rate:8, color:"#F4711A", payout:comp.quota*0.25*(comp.commissionRate/100), bg:"var(--carrot-light)",border:"var(--carrot)",label:"Standard rate",warn:false},
                {range:"100% – 150% Accelerator",rate:14,color:"#2D6A4F",payout:comp.quota*0.5*0.14,            bg:"var(--green-light)", border:"var(--green)",  label:"Accelerator — highest rate",warn:false},
                {range:"150%+ Decelerator",   rate:8, color:"#888",    payout:null,                              bg:"var(--red-light)",   border:"#FECACA",       label:"⚠️ Rate drops — cap applies",warn:true},
              ].map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,marginBottom:8,background:t.bg,border:`1px solid ${t.border}`}}>
                  <div style={{width:38,height:38,borderRadius:10,background:t.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"white",flexShrink:0}}>{t.rate}%</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:t.warn?"var(--red)":i===2?"var(--green)":"var(--ink)"}}>{t.range}</div>
                    <div style={{fontSize:12,color:t.warn?"#7F1D1D":i===2?"var(--green)":"var(--muted)",marginTop:2}}>{t.rate}% on every dollar in this tier · {t.label}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,minWidth:80}}>
                    {t.payout!=null
                      ?<><div style={{fontSize:16,fontWeight:700,color:i===2?"var(--green)":"var(--ink)"}}>{fmt(t.payout)}</div><div style={{fontSize:11,color:"var(--muted)"}}>this tier earns</div></>
                      :<div style={{fontSize:12,fontWeight:700,color:"var(--red)"}}>⚠️ Capped</div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{padding:"0 20px 20px"}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--muted)",marginBottom:12}}>Payout Curve</div>
              <div style={{background:"#0F0A05",borderRadius:16,padding:"16px 8px 8px"}}><PayoutCurveChart comp={comp}/></div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:11,color:"var(--muted)",padding:"8px 4px 0"}}>
                {[{c:"#E9C46A",l:"5% base"},{c:"#F4711A",l:"8% standard"},{c:"#2D6A4F",l:"14% accelerator"},{c:"#888",l:"decelerator"}].map((x,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:16,height:3,background:x.c,borderRadius:2}}/><span>{x.l}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* SPIFFs */}
          <div className="scard">
            <div className="scard-hdr"><span style={{fontSize:18}}>⚡</span><span className="scard-ttl">Active SPIFFs & Incentives</span><span className="badge badge-o">3 active</span></div>
            {[
              {emoji:"⚡",n:"Fast Start Bonus",d:"Close 50% of quarterly quota within first 30 days",v:"$15,000",u:"urgent"},
              {emoji:"🆕",n:"New Logo SPIFF",d:"Sign a net-new logo customer — per logo, unlimited",v:"$8,000",u:"good"},
              {emoji:"🎪",n:"Customer Summit Bonus",d:"Get 3+ customers to the Annual Summit (Sept 15)",v:"$2,500",u:"warn"},
            ].map((s,i)=>(
              <div className="frow" key={i}>
                <div className="ficon">{s.emoji}</div>
                <div className="fbody">
                  <div className="flabel">{s.n}</div>
                  <div style={{fontSize:16,fontWeight:700}}>{s.v}</div>
                  <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{s.d}</div>
                </div>
                <div style={{fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:100,background:s.u==="urgent"?"var(--red-light)":s.u==="warn"?"var(--gold-light)":"var(--green-light)",color:s.u==="urgent"?"var(--red)":s.u==="warn"?"#7A5C00":"var(--green)"}}>
                  {s.u==="urgent"?"⏰ Expires soon":s.u==="warn"?"⚠️ Deadline":"✅ Active"}
                </div>
              </div>
            ))}
          </div>

          <div style={{background:"var(--green-light)",border:"1.5px solid var(--green)",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:24}}>✅</span>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:"var(--green)"}}>Does this look right?</div>
              <div style={{fontSize:13,color:"var(--green)",opacity:0.8}}>Tap any field to edit. When ready, continue to see your real take-home numbers.</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYCHECK ══════════════════════════════════════════════════ */}
      {screen==="paycheck"&&(
        <div className="screen">
          <div className="slabel">Step 3 of 5</div>
          <h2 className="stitle">What Do You Actually Take Home?</h2>
          <p className="ssub">Based on your state, age, and profile, here's what we're assuming. Your 401(k) and health premium come out <strong>pre-tax</strong> — so they lower your taxable income.</p>
          <div className="tax-box">
            <div style={{fontSize:16,fontWeight:700,color:"var(--blue)",marginBottom:14}}>🧮 Here's What We're Assuming</div>
            <div className="info-box" style={{marginBottom:14}}>Based on your income and {userState||"your state"}, we pre-filled your tax rates. Income tax is applied <strong>after</strong> pre-tax 401(k) + health. Tap "override" to adjust.</div>
            {[
              {k:"fed",  l:"Federal Income Tax",        src:`${fedBracket.label} · on income after pre-tax`, rate:effFed,   noOvr:false},
              {k:"state",l:`${userState||"State"} Tax`, src:stateTax===0?"No state income tax":`Standard ${userState} rate`, rate:effState, noOvr:false},
              {k:"fica", l:"Social Security & Medicare",src:"Fixed rate on gross — 401k doesn't reduce it",  rate:fica,     noOvr:true},
              {k:"k401", l:`401(k) at ${k401Pct}% (pre-tax)`, src:`Limit ${fmt(k401Limit)} for age ${userAge}`, rate:k401Pct,  noOvr:true},
            ].map(t=>(
              <div className="tax-row" key={t.k}>
                <div><div style={{fontSize:14}}>{t.l}</div><div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{t.src}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:16,fontWeight:700,color:"var(--blue)"}}>{t.rate}%</div>
                  {!t.noOvr&&<span style={{fontSize:12,color:"var(--carrot)",cursor:"pointer",textDecoration:"underline",fontWeight:600}} onClick={()=>{const v=prompt(`Override ${t.l}:`,t.rate);if(v!==null&&!isNaN(+v))setTaxOverrides(x=>({...x,[t.k]:+v}));}}>override</span>}
                </div>
              </div>
            ))}
            <div style={{marginTop:14,padding:"12px 16px",background:"white",borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--muted)"}}>Effective Take-Home Rate at 100%</div>
                <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>+ {fmt(healthAnnual+otherAnnual)}/yr flat deductions</div>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700}}>~{100-effRate(grossAt100)}%</div>
            </div>
          </div>
          {k401Pct>0&&(
            <div style={{background:"var(--green-light)",border:"1.5px solid var(--green)",borderRadius:16,padding:18,marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:28,flexShrink:0}}>🏦</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--green)",marginBottom:3}}>
                  {willMax?"🎉 You'll max your 401k this year!":k401Mo?`You'll max your 401k around ${k401Mo}`:"Increase your 401k % to max it out"}
                </div>
                <div style={{fontSize:13,color:"var(--green)",opacity:0.85}}>
                  At {k401Pct}% you contribute ~{fmt(annualK401)}/yr · your 2025 limit is {fmt(k401Limit)} ({k401LimitNote(userAge)})
                  {!willMax&&` · Increase to ~${Math.ceil(k401Limit/grossAt100*100)}% to max it out`}
                </div>
              </div>
            </div>
          )}
          {/* Take-home at a glance */}
          <div className="dgrid">
            {[{p:floorPct,l:"Floor",c:"var(--gold)"},{p:stretchPct,l:"Stretch",c:"var(--green)"}].map(x=>(
              <div className="dcard" key={x.l} style={{borderColor:x.c}}>
                <div className="dcard-lbl">{x.l} — {x.p}% of plan</div>
                <div className="dcard-val" style={{color:x.c}}>{fmt(calcNet(calcGross(x.p)))}</div>
                <div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>{fmt(calcGross(x.p))} gross take-home</div>
              </div>
            ))}
          </div>
          <div className="info-box">💡 Take-home uses proper pre-tax math: income tax applies to your gross minus 401(k) and health premium. FICA still applies to the full gross.</div>
        </div>
      )}

      {/* ══ MY CARROTS — THREE TABS ══════════════════════════════════ */}
      {screen==="carrots"&&(
        <div className="screen">
          <div className="slabel">Step 4 of 5</div>
          <h2 className="stitle">Your Carrots</h2>
          <p className="ssub">Three tiers of reward, all funded by the money you earn above quota. Make them real — give each a name, a price, and a picture.</p>

          <div className="subtabs">
            {[
              {k:"big",   l:"Big",    s:"The dream · max 2"},
              {k:"medium",l:"Medium", s:"Periodic rewards"},
              {k:"mini",  l:"Mini",   s:"Per-metric treats"},
            ].map(t=>(
              <button key={t.k} className={`subtab ${carrotTab===t.k?"on":""}`} onClick={()=>setCarrotTab(t.k)}>
                <span className="subtab-ico">🥕</span>
                <span className="subtab-lbl">{t.l}</span>
                <span className="subtab-sub">{t.s}</span>
              </button>
            ))}
          </div>

          {/* BIG */}
          {carrotTab==="big"&&(<>
            <div className="info-box">🎯 <strong>Big Carrots</strong> are funded entirely by carrot money — the {carrotCut}% of take-home you earn <strong>above 100% of plan</strong>. We'll show how far past quota you need to go to pay for each one.</div>
            {bigCarrots.map((c,idx)=>{
              const need = pctToFund(+c.cost||0);
              return (
                <div className="tcard" key={c.id}>
                  <div className="tcard-body">
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <span className="tchip" style={{background:"var(--green-light)",color:"var(--green)"}}>🥕 Big Carrot {idx+1}</span>
                      {bigCarrots.length>1&&<button className="mc-del" style={{marginLeft:"auto"}} onClick={()=>setBigCarrots(p=>p.filter(x=>x.id!==c.id))}>×</button>}
                    </div>
                    <CarrotImageBox reward={c} onImageChange={img=>setBigCarrots(p=>p.map(x=>x.id===c.id?{...x,image:img}:x))}/>
                    <div className="igroup">
                      <label className="ilabel">What is it?</label>
                      <input className="inp" placeholder="e.g. Family trip to Italy" value={c.label} onChange={e=>setBigCarrots(p=>p.map(x=>x.id===c.id?{...x,label:e.target.value}:x))}/>
                    </div>
                    <div className="igroup" style={{marginBottom:0}}>
                      <label className="ilabel">Cost</label>
                      <input className="inp" type="number" value={c.cost} onChange={e=>setBigCarrots(p=>p.map(x=>x.id===c.id?{...x,cost:+e.target.value}:x))}/>
                    </div>
                    <div style={{marginTop:14,padding:"14px 16px",background:"var(--cream)",border:"1px solid var(--border)",borderRadius:14}}>
                      {need
                        ? <div style={{fontSize:13,color:"var(--ink)",lineHeight:1.5}}>To fund <strong>{fmt(c.cost)}</strong> from carrot money, you'd need to hit <span style={{color:"var(--carrot)",fontWeight:700}}>{need}% of plan</span> — that's {need-100}% past quota.</div>
                        : <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.5}}>Even at 300% of plan, carrot money wouldn't fully cover this yet — make it a multi-year carrot, or trim the cost a touch.</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="addrow" disabled={bigCarrots.length>=2} onClick={()=>bigCarrots.length<2&&setBigCarrots(p=>[...p,{id:Date.now(),label:"",what:"",cost:5000,image:null}])}>
              ＋ Add a Big Carrot {bigCarrots.length>=2&&"· max 2"}
            </button>
          </>)}

          {/* MEDIUM */}
          {carrotTab==="medium"&&(<>
            <div className="info-box">🥕 <strong>Medium Carrots</strong> are recurring rewards you give yourself on a schedule — every month, quarter, or twice a year.</div>
            {medCarrots.map(c=>(
              <div className="tcard" key={c.id}>
                <div className="tcard-body">
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <span className="tchip" style={{background:"var(--carrot-light)",color:"var(--carrot-dark)"}}>🥕 Medium Carrot</span>
                    <button className="mc-del" style={{marginLeft:"auto"}} onClick={()=>setMedCarrots(p=>p.filter(x=>x.id!==c.id))}>×</button>
                  </div>
                  <CarrotImageBox compact reward={c} onImageChange={img=>setMedCarrots(p=>p.map(x=>x.id===c.id?{...x,image:img}:x))}/>
                  <div className="igroup">
                    <label className="ilabel">What is it?</label>
                    <input className="inp" placeholder="e.g. Weekend getaway" value={c.label} onChange={e=>setMedCarrots(p=>p.map(x=>x.id===c.id?{...x,label:e.target.value}:x))}/>
                  </div>
                  <div className="irow" style={{marginBottom:0}}>
                    <div className="igroup" style={{marginBottom:0}}>
                      <label className="ilabel">Cost</label>
                      <input className="inp" type="number" value={c.cost} onChange={e=>setMedCarrots(p=>p.map(x=>x.id===c.id?{...x,cost:+e.target.value}:x))}/>
                    </div>
                    <div className="igroup" style={{marginBottom:0}}>
                      <label className="ilabel">How often</label>
                      <select className="inp" value={c.period} onChange={e=>setMedCarrots(p=>p.map(x=>x.id===c.id?{...x,period:e.target.value}:x))}>
                        {["Monthly","Quarterly","Bi-annual"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button className="addrow" onClick={()=>setMedCarrots(p=>[...p,{id:Date.now(),label:"",what:"",cost:500,period:"Quarterly",image:null}])}>＋ Add a Medium Carrot</button>
          </>)}

          {/* MINI */}
          {carrotTab==="mini"&&(<>
            <div className="info-box">🥕 <strong>Mini Carrots</strong> are small treats you earn every time you hit the <strong>Stretch goal</strong> on one of your metrics. Set one per metric — here's how they line up.</div>
            {metrics.length===0
              ? <div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)"}}>
                  <div style={{fontSize:40,marginBottom:10}}>🎯</div>
                  <p style={{fontSize:14,marginBottom:16}}>No metrics yet. Add metrics in your Playbook, then give each one a mini-carrot treat.</p>
                  <button className="btn btn-s btn-sm" onClick={()=>go("playbook")}>Go to Playbook →</button>
                </div>
              : metrics.map(m=>(
                  <div className="mini-treat" key={m.id}>
                    <span style={{fontSize:22}}>{m.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700}}>{m.label}</div>
                      <div style={{fontSize:13,color:"var(--muted)"}}>Hit Stretch ({m.stretch} {m.freq.toLowerCase()}) to earn</div>
                    </div>
                    <input className="treat-input" style={{maxWidth:200}} placeholder="Mini-carrot treat…" value={m.treat||""} onChange={e=>updMetric(m.id,{treat:e.target.value})}/>
                  </div>
                ))}
          </>)}
        </div>
      )}

      {/* ══ PERSONAL PLAYBOOK — ONE SCROLLING PAGE ═══════════════════ */}
      {screen==="playbook"&&(
        <div className="screen">
          <div className="slabel">Step 5 of 5</div>
          <h2 className="stitle">Your Personal Playbook</h2>
          <p className="ssub">Set the target that excites you, then build the daily game plan to get there.</p>

          {/* TARGET */}
          <div className="target-display">
            <div className="target-pct">{stretchPct}%</div>
            <div className="target-th">{fmt(calcNet(calcGross(stretchPct)))}</div>
            <div className="target-sub">estimated take-home at {stretchPct}% of plan</div>
          </div>
          <input type="range" className="slider" min="50" max="300" step="5" value={stretchPct} onChange={e=>setStretchPct(+e.target.value)} style={{marginBottom:8}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:14}}>
            <span>50%</span><span>100%</span><span>200%</span><span>300%</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {[75,100,125,150,200,250,300].map(p=>(
              <button key={p} className={`qbtn ${stretchPct===p?"on":""}`} onClick={()=>setStretchPct(p)}>{p}%</button>
            ))}
          </div>

          {/* TAKE-HOME BREAKDOWN */}
          <div className="dual-card" style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
              <span style={{color:"var(--muted)",fontSize:14}}>🏦 Base take-home</span>
              <span style={{fontWeight:700}}>{fmt(netBase)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
              <span style={{color:"var(--muted)",fontSize:14}}>📈 Commission take-home</span>
              <span style={{fontWeight:700}}>{fmt(Math.max(0,calcNet(calcGross(stretchPct))-netBase))}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
              <span style={{color:"var(--carrot)",fontSize:14,fontWeight:600}}>🥕 Carrot money (above 100% only)</span>
              <span style={{fontWeight:700,color:"var(--carrot)"}}>{fmt(carrotMoneyAtPct(stretchPct))}</span>
            </div>
            <div style={{marginTop:12,paddingTop:14,borderTop:"1px solid var(--border)"}}>
              <label className="ilabel">Carrot money = <strong>{carrotCut}%</strong> of take-home above quota</label>
              <input type="range" className="slider" min="5" max="60" step="5" value={carrotCut} onChange={e=>setCarrotCut(+e.target.value)}/>
            </div>
          </div>

          {/* METRICS */}
          <div className="sec-hdr">🎯 Your Metrics</div>
          <p className="sec-sub">For each activity set a <strong style={{color:"var(--blue)"}}>Floor</strong> (the minimum you won't miss) and a <strong style={{color:"var(--green)"}}>Stretch</strong> (what unlocks a mini-carrot). Tap a suggestion to add it.</p>
          <div style={{marginBottom:16}}>
            {SUGGESTED_METRICS.filter(s=>!metrics.find(m=>m.label===s.label)).map(s=>(
              <span className="sug-pill" key={s.label} onClick={()=>addMetric(s.emoji,s.label,s.freq,s.defaultTarget)}>{s.emoji} {s.label} +</span>
            ))}
          </div>
          {metrics.map(m=>(
            <div className="mc" key={m.id}>
              <div className="mc-hdr">
                <span className="mc-emoji">{m.emoji}</span>
                <span className="mc-name">{m.label}</span>
                <select className="fsel" style={{width:"auto"}} value={m.freq} onChange={e=>updMetric(m.id,{freq:e.target.value})}>
                  {["Daily","Weekly","Monthly"].map(o=><option key={o}>{o}</option>)}
                </select>
                <button className="mc-del" onClick={()=>setMetrics(p=>p.filter(x=>x.id!==m.id))}>×</button>
              </div>
              <div className="dual-grid">
                <div className="fbox floor">
                  <div className="fbox-lbl" style={{color:"var(--blue)"}}>🛟 Floor — minimum</div>
                  <div className="num-row">
                    <button className="num-btn" onClick={()=>updMetric(m.id,{floor:Math.max(0,(+m.floor||0)-1)})}>−</button>
                    <span className="num-val">{m.floor}</span>
                    <button className="num-btn" onClick={()=>updMetric(m.id,{floor:(+m.floor||0)+1})}>＋</button>
                  </div>
                </div>
                <div className="fbox stretch">
                  <div className="fbox-lbl" style={{color:"var(--green)"}}>🚀 Stretch — unlock reward</div>
                  <div className="num-row">
                    <button className="num-btn" onClick={()=>updMetric(m.id,{stretch:Math.max(0,(+m.stretch||0)-1)})}>−</button>
                    <span className="num-val">{m.stretch}</span>
                    <button className="num-btn" onClick={()=>updMetric(m.id,{stretch:(+m.stretch||0)+1})}>＋</button>
                  </div>
                </div>
              </div>
              {/* reminder — OFF by default, collapsed behind a toggle */}
              <div onClick={()=>updMetric(m.id,{reminderOn:!m.reminderOn})}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"1.5px solid var(--border)",borderRadius:10,cursor:"pointer",background:m.reminderOn?"var(--carrot-light)":"white",marginBottom:m.reminderOn?12:10}}>
                <span style={{fontSize:15}}>🔔</span>
                <span style={{flex:1,fontSize:13,fontWeight:600,color:m.reminderOn?"var(--carrot-dark)":"var(--muted)"}}>Add a reminder for this metric?</span>
                <span style={{width:40,height:22,borderRadius:100,background:m.reminderOn?"var(--carrot)":"var(--border)",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                  <span style={{position:"absolute",top:2,left:m.reminderOn?20:2,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                </span>
              </div>
              {m.reminderOn&&(<>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <div className="clabel">Reminder time</div>
                    <input className="fsel" value={m.remTime} onChange={e=>updMetric(m.id,{remTime:e.target.value})}/>
                  </div>
                  <div>
                    <div className="clabel">{m.freq==="Daily"?"Repeats":"Day"}</div>
                    <select className="fsel" value={m.remDay} onChange={e=>updMetric(m.id,{remDay:e.target.value})}>
                      {(m.freq==="Daily"?["Daily","Weekdays"]:["Mon","Tue","Wed","Thu","Fri"]).map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <div className="clabel">Remind me via</div>
                  <div className="vbtns">
                    {[{k:"email",l:"📧 Email"},{k:"text",l:"💬 Text"}].map(v=>(
                      <button key={v.k} className={`vbtn ${m.remVehicle===v.k?"on":""}`} onClick={()=>updMetric(m.id,{remVehicle:v.k})}>{v.l}</button>
                    ))}
                  </div>
                </div>
                {m.remVehicle==="text"&&(
                  <div className="igroup" style={{marginBottom:10}}>
                    <label className="ilabel">📱 Your mobile number (for texts)</label>
                    <input className="inp" type="tel" placeholder="(555) 123-4567" value={userPhone} onChange={e=>setUserPhone(e.target.value)}/>
                  </div>
                )}
              </>)}
              <div>
                <div className="clabel">🥕 Mini-carrot for hitting Stretch</div>
                <input className="treat-input" placeholder="e.g. Fancy coffee, leave early Friday…" value={m.treat||""} onChange={e=>updMetric(m.id,{treat:e.target.value})}/>
              </div>
            </div>
          ))}

          {/* TRACKING */}
          <div className="divider-line"/>
          <div className="sec-hdr">📊 How You'll Track</div>
          <p className="sec-sub">Tell us how your numbers get in, and we'll keep your dashboard current.</p>
          {[
            {k:"manual",icon:"✍️",t:"Manual entry",d:"Punch in your numbers yourself — fastest to start."},
            {k:"csv",   icon:"📄",t:"CSV upload",   d:"Drop a weekly export from your CRM or spreadsheet."},
            {k:"crm",   icon:"🔗",t:"Connect CRM",  d:"Paste a report URL and we'll pull the numbers."},
          ].map(o=>(
            <div className={`topt ${trackingMethod===o.k?"sel":""}`} key={o.k} onClick={()=>setTrackingMethod(o.k)}>
              <span style={{fontSize:24}}>{o.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700}}>{o.t}</div>
                <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{o.d}</div>
                {trackingMethod===o.k&&<span className="topt-badge">Selected</span>}
              </div>
            </div>
          ))}
          {trackingMethod==="crm"&&(<>
            <div className="igroup" style={{marginTop:14}}>
              <label className="ilabel">CRM report URL</label>
              <input className="inp" placeholder="https://yourcrm.com/reports/…" value={crmUrl} onChange={e=>setCrmUrl(e.target.value)}/>
            </div>
            <div className="scard">
              <div className="scard-hdr"><span style={{fontSize:16}}>🧭</span><span className="scard-ttl">CRM Field Guide</span></div>
              <div style={{padding:"14px 18px"}}>
                {[
                  {f:"Activity Date",r:true},
                  {f:"Activity Type (call / email / meeting)",r:true},
                  {f:"Owner = you",r:true},
                  {f:"Opportunity Stage",r:false},
                  {f:"Amount",r:false},
                ].map(x=>(
                  <div className="crm-field" key={x.f}>
                    <span style={{flex:1}}>{x.f}</span>
                    <span className="crm-req" style={x.r?{}:{background:"var(--border)",color:"var(--muted)"}}>{x.r?"Required":"Optional"}</span>
                  </div>
                ))}
              </div>
            </div>
          </>)}
          <div className="igroup" style={{marginTop:14}}>
            <label className="ilabel">How often should we refresh / remind you to update?</label>
            <div className="vbtns">
              {["Daily","Weekly","Bi-weekly"].map(o=>(
                <button key={o} className={`vbtn ${updateFreq===o.toLowerCase()?"on":""}`} onClick={()=>setUpdateFreq(o.toLowerCase())}>{o}</button>
              ))}
            </div>
          </div>

          {/* WEEKLY SUMMARY */}
          <div className="divider-line"/>
          <div className="sec-hdr">📬 Weekly Summary</div>
          <p className="sec-sub">A short recap of your week — progress toward Floor, Stretch, and your carrots.</p>
          <div className="irow">
            <div className="igroup">
              <label className="ilabel">Day</label>
              <select className="inp" value={weeklySummaryDay} onChange={e=>setWeeklySummaryDay(e.target.value)}>
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="igroup">
              <label className="ilabel">Time</label>
              <input className="inp" value={weeklySummaryTime} onChange={e=>setWeeklySummaryTime(e.target.value)}/>
            </div>
          </div>

          <button className="btn btn-p btn-full" style={{marginTop:18}} onClick={()=>go("celebrate")}>Lock In My Playbook 🥕</button>
        </div>
      )}

      {/* ══ CELEBRATE ════════════════════════════════════════════════ */}
      {screen==="celebrate"&&(
        <div className="screen">
          <div className="cel">
            <div className="cel-icon">🥕</div>
            <div className="cel-title">You're all set, {userName||"friend"}!</div>
            <p style={{fontSize:16,color:"var(--muted)",maxWidth:440,margin:"0 auto 28px",lineHeight:1.6}}>
              Your plan is decoded, your carrots are set, and your playbook is live. Now go earn it — one Stretch goal at a time.
            </p>
            <div className="dgrid" style={{maxWidth:440,margin:"0 auto 28px"}}>
              <div className="dcard">
                <div className="dcard-lbl">Your Stretch</div>
                <div className="dcard-val" style={{color:"var(--green)"}}>{stretchPct}%</div>
              </div>
              <div className="dcard">
                <div className="dcard-lbl">Carrot money at Stretch</div>
                <div className="dcard-val" style={{color:"var(--carrot)"}}>{fmt(carrotMoneyAtPct(stretchPct))}</div>
              </div>
            </div>
            <button className="btn btn-p btn-full" style={{maxWidth:440}} onClick={()=>{setActiveTab("home");go("app");}}>Enter My Dashboard →</button>
          </div>
        </div>
      )}

      {/* ══ POST-SETUP APP — BOTTOM TAB BAR ══════════════════════════ */}
      {inApp&&(
        <div>
          {/* persistent carrot-money bar */}
          {(()=>{
            const {current,out} = carrotFunding();
            const target = current ? bigCarrots.find(c=>c.id===current) : bigCarrots[0];
            const f = target ? out[target.id] : null;
            const pctF = f&&f.cost ? Math.min(100,f.applied/f.cost*100) : 0;
            return (
              <div className="carrotbar"><div className="carrotbar-inner">
                <div className="cb-top">
                  <span style={{fontSize:18}}>🥕</span>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Carrot money</span>
                  <span className="cb-amt" style={{marginLeft:"auto"}}>{fmt(carrotMoney)}</span>
                </div>
                <div className="cb-track"><div className="cb-fill" style={{width:`${pctF}%`}}/></div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:6}}>
                  {target?`${Math.round(pctF)}% toward ${target.label||"your big carrot"} · ${fmt(f.cost)}`:"Set a Big Carrot to start funding"}
                </div>
              </div></div>
            );
          })()}

          <div className="app-screen">

            {/* HOME */}
            {activeTab==="home"&&(<>
              <div className="dash-hero">
                <div style={{fontSize:13,fontWeight:600,opacity:0.85,marginBottom:6}}>Welcome back, {userName||"friend"} 👋</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:4}}>{fmt(carrotMoney)} carrot money</div>
                <div style={{fontSize:14,opacity:0.9}}>Targeting {stretchPct}% of plan · {fmt(calcNet(calcGross(stretchPct)))} take-home</div>
              </div>

              <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:12}}>Today's Metrics</div>
              {metrics.length===0
                ? <div className="dcard" style={{textAlign:"center",color:"var(--muted)"}}>No metrics yet — add some in My Plan.</div>
                : metrics.map(m=>{
                    const cnt=weeklyEntries[m.id]||0; const st=metricStatus(cnt,m);
                    return (
                      <div className="mp-card" key={m.id}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                          <span style={{fontSize:20}}>{m.emoji}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:16,fontWeight:700}}>{m.label}</div>
                            <div style={{fontSize:13,color:"var(--muted)"}}>{cnt} logged · Floor {m.floor} · Stretch {m.stretch}</div>
                          </div>
                          <span className={`mp-status ${st.bg}`}>{st.label}</span>
                        </div>
                        <div className="mc-gold-bar"><div className="mc-gold-fill" style={{width:`${Math.min(100,cnt/(m.stretch||1)*100)}%`}}/></div>
                      </div>
                    );
                  })}

              <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",margin:"22px 0 12px"}}>Big Carrot Progress</div>
              {bigCarrots.map(c=>{
                const f=carrotFunding().out[c.id]||{applied:0,cost:+c.cost||0,done:false};
                const pctF=f.cost?Math.min(100,f.applied/f.cost*100):0;
                return (
                  <div className={`tcard ${f.done?"funded":""}`} key={c.id}>
                    {c.image&&<img src={c.image} alt="" style={{width:"100%",height:120,objectFit:"cover",display:"block"}}/>}
                    <div className="tcard-body">
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:16,fontWeight:700}}>🥕 {c.label||"Big Carrot"}</span>
                        <span style={{fontWeight:700,color:f.done?"var(--green)":"var(--carrot)"}}>{Math.round(pctF)}%</span>
                      </div>
                      <div className="cb-track" style={{background:"var(--border)"}}><div className="cb-fill" style={{width:`${pctF}%`}}/></div>
                      <div style={{fontSize:13,color:"var(--muted)",marginTop:6}}>{fmt(f.applied)} of {fmt(f.cost)} funded</div>
                    </div>
                  </div>
                );
              })}
            </>)}

            {/* UPDATE */}
            {activeTab==="update"&&(<>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6}}>Update Your Numbers</h2>
              <p style={{fontSize:15,color:"var(--muted)",marginBottom:18}}>
                {trackingMethod==="crm"?"Pull the latest from your CRM, or punch in manually below."
                  :trackingMethod==="csv"?"Drop your latest export, or punch in manually below."
                  :"Log what you got done."}
              </p>

              {trackingMethod==="crm"&&(
                <div className="scard"><div style={{padding:"18px 20px"}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>🔗 Connected CRM</div>
                  <a className="crm-url-btn" href={crmUrl||"#"} target="_blank" rel="noreferrer">Open report ↗</a>
                  <div style={{fontSize:13,color:"var(--muted)",marginTop:10,wordBreak:"break-all"}}>{crmUrl||"No report URL set — add one in My Plan."}</div>
                </div></div>
              )}
              {trackingMethod==="csv"&&(
                <label style={{display:"block"}}>
                  <input type="file" accept=".csv" style={{display:"none"}} onChange={()=>setCsvDone(true)}/>
                  <div className={`uzone ${csvDone?"has":""}`}>
                    <div style={{fontSize:32,marginBottom:8}}>{csvDone?"✅":"📄"}</div>
                    <div style={{fontSize:15,fontWeight:600}}>{csvDone?"Import complete — numbers updated":"Drop your CSV export here"}</div>
                    <div style={{fontSize:13,color:"var(--muted)"}}>Click to browse</div>
                  </div>
                </label>
              )}

              <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",margin:"6px 0 12px"}}>Manual Entry</div>
              {metrics.length===0
                ? <div className="dcard" style={{textAlign:"center",color:"var(--muted)"}}>Add metrics in My Plan first.</div>
                : metrics.map(m=>{
                    const cnt=weeklyEntries[m.id]||0; const st=metricStatus(cnt,m);
                    return (
                      <div className="mp-card" key={m.id}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                          <span style={{fontSize:20}}>{m.emoji}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:16,fontWeight:700}}>{m.label}</div>
                            <div style={{fontSize:13,color:"var(--muted)"}}>Floor {m.floor} · Stretch {m.stretch} · {m.freq}</div>
                          </div>
                          <span className={`mp-status ${st.bg}`}>{st.label}</span>
                        </div>
                        <div className="num-row">
                          <button className="num-btn" onClick={()=>logEntry(m,cnt-1)}>−</button>
                          <input className="fsel" style={{width:70,textAlign:"center",fontWeight:700,fontSize:16,borderColor:st.color}} value={cnt} onChange={e=>logEntry(m,e.target.value)}/>
                          <button className="num-btn" onClick={()=>logEntry(m,cnt+1)}>＋</button>
                          <div style={{flex:1}}/>
                          {m.treat&&st.key==="stretch"&&<span style={{fontSize:12,color:"var(--green)",fontWeight:700}}>🥕 {m.treat}</span>}
                        </div>
                        <div className={`coach-msg ${st.cm}`}>
                          {st.key==="stretch"?`Stretch crushed — enjoy your mini-carrot${m.treat?`: ${m.treat}`:""}!`
                            :st.key==="floor"?`Floor cleared. ${Math.max(0,m.stretch-cnt)} more to hit Stretch.`
                            :`${Math.max(0,m.floor-cnt)} to go to clear your Floor.`}
                        </div>
                      </div>
                    );
                  })}

              <div className="dcard" style={{marginTop:16}}>
                <div className="dcard-lbl">This Week</div>
                <div style={{display:"flex",gap:28,marginTop:10}}>
                  <div>
                    <div style={{fontSize:13,color:"var(--muted)"}}>Stretch goals hit</div>
                    <div className="dcard-val" style={{color:"var(--green)"}}>{metrics.filter(m=>(weeklyEntries[m.id]||0)>=m.stretch).length}/{metrics.length||0}</div>
                  </div>
                  <div>
                    <div style={{fontSize:13,color:"var(--muted)"}}>Floors cleared</div>
                    <div className="dcard-val" style={{color:"var(--blue)"}}>{metrics.filter(m=>(weeklyEntries[m.id]||0)>=m.floor).length}/{metrics.length||0}</div>
                  </div>
                </div>
              </div>
            </>)}

            {/* CARROTS */}
            {activeTab==="carrots"&&(<>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6}}>Your Carrots</h2>
              <p style={{fontSize:15,color:"var(--muted)",marginBottom:18}}>Everything you're working toward, funded by money earned above quota.</p>

              <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--green)",marginBottom:10}}>🥕 Big — The Dream</div>
              {bigCarrots.map(c=>{
                const f=carrotFunding().out[c.id]||{applied:0,cost:+c.cost||0,done:false};
                const pctF=f.cost?Math.min(100,f.applied/f.cost*100):0;
                return (
                  <div className={`tcard ${f.done?"funded":""}`} key={c.id}>
                    {c.image&&<img src={c.image} alt="" style={{width:"100%",height:130,objectFit:"cover",display:"block"}}/>}
                    <div className="tcard-body">
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:16,fontWeight:700}}>{c.label||"Big Carrot"}</span>
                        <span style={{fontWeight:700,color:"var(--carrot)"}}>{fmt(c.cost)}</span>
                      </div>
                      {c.what&&<div style={{fontSize:13,color:"var(--muted)",marginBottom:10}}>{c.what}</div>}
                      <div className="cb-track" style={{background:"var(--border)"}}><div className="cb-fill" style={{width:`${pctF}%`}}/></div>
                      <div style={{fontSize:13,color:"var(--muted)",marginTop:6}}>{f.done?"🎉 Fully funded!":`${fmt(f.applied)} funded · ${Math.round(pctF)}%`}</div>
                    </div>
                  </div>
                );
              })}

              <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--carrot-dark)",margin:"20px 0 10px"}}>🥕 Medium — Periodic</div>
              {medCarrots.map(c=>(
                <div className="tcard" key={c.id}><div className="tcard-body" style={{display:"flex",alignItems:"center",gap:14}}>
                  {c.image
                    ?<img src={c.image} alt="" style={{width:54,height:54,borderRadius:12,objectFit:"cover",flexShrink:0}}/>
                    :<div style={{width:54,height:54,borderRadius:12,background:"var(--carrot-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🥕</div>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:16,fontWeight:700}}>{c.label||"Medium Carrot"}</div>
                    <div style={{fontSize:13,color:"var(--muted)"}}>{c.what}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:700}}>{fmt(c.cost)}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{c.period}</div>
                  </div>
                </div></div>
              ))}

              <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#7A5C00",margin:"20px 0 10px"}}>🥕 Mini — Per-Metric Treats</div>
              {metrics.filter(m=>m.treat).length===0
                ? <div className="dcard" style={{textAlign:"center",color:"var(--muted)",fontSize:13}}>Set mini-carrot treats on your metrics in My Plan.</div>
                : metrics.filter(m=>m.treat).map(m=>{
                    const cnt=weeklyEntries[m.id]||0; const hit=cnt>=m.stretch;
                    return (
                      <div className="mini-treat" key={m.id} style={hit?{borderColor:"var(--green)",background:"var(--green-light)"}:{}}>
                        <span style={{fontSize:20}}>{m.emoji}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:700}}>{m.treat}</div>
                          <div style={{fontSize:13,color:"var(--muted)"}}>Hit {m.stretch} {m.label.toLowerCase()} to earn</div>
                        </div>
                        <span className={`mp-status ${hit?"st-ex":"st-met"}`}>{hit?"🎉 Earned":`${cnt}/${m.stretch}`}</span>
                      </div>
                    );
                  })}
            </>)}

            {/* MY PLAN */}
            {activeTab==="plan"&&(<>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6}}>My Plan</h2>
              <p style={{fontSize:15,color:"var(--muted)",marginBottom:18}}>Your comp at a glance.</p>

              <div className="dash-hero" style={{background:"linear-gradient(135deg,#1A1208,#2D1A0A)"}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",opacity:0.5,marginBottom:6}}>On-Target Earnings</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900}}>{fmt(ote)}</div>
                <div style={{fontSize:13,opacity:0.7,marginTop:4}}>{fmt(comp.base)} base · {fmt(atQuotaComm)} commission at 100%</div>
              </div>

              <div className="dcard" style={{marginBottom:14}}>
                <div className="dcard-lbl">Take-Home Breakdown · at {stretchPct}%</div>
                {[
                  {l:"Gross earnings",v:calcGross(stretchPct),c:"var(--ink)"},
                  {l:"Net take-home",v:calcNet(calcGross(stretchPct)),c:"var(--green)"},
                  {l:"Carrot money (above 100%)",v:carrotMoneyAtPct(stretchPct),c:"var(--carrot)"},
                ].map((x,i)=>(
                  <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<2?"1px solid var(--border)":"none"}}>
                    <span style={{fontSize:14,color:"var(--muted)"}}>{x.l}</span>
                    <span style={{fontWeight:700,color:x.c}}>{fmt(x.v)}</span>
                  </div>
                ))}
              </div>

              <div className="dcard">
                <div className="dcard-lbl">Commission Tiers</div>
                {[
                  {r:"0–75%",   rate:"5%",         c:"var(--gold)"},
                  {r:"75–100%", rate:"8%",         c:"var(--carrot)"},
                  {r:"100–150%",rate:"14% accel",  c:"var(--green)"},
                  {r:"150%+",   rate:"8% decel",   c:"var(--muted)"},
                ].map((t,i)=>(
                  <div key={t.r} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?"1px solid var(--border)":"none"}}>
                    <div style={{width:10,height:10,borderRadius:3,background:t.c,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:14}}>{t.r} of quota</span>
                    <span style={{fontWeight:700,color:t.c}}>{t.rate}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-s btn-full" style={{marginTop:16}} onClick={()=>go("summary")}>View full plan details →</button>
            </>)}

            {/* SETTINGS */}
            {activeTab==="settings"&&(<>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6}}>Settings</h2>
              <p style={{fontSize:15,color:"var(--muted)",marginBottom:18}}>Manage your profile, goals, and reminders.</p>

              {[
                {icon:"👤",t:"Profile",        d:`${userName||"—"} · ${userState||"—"} · ${userEmail||"—"}`, act:()=>go("signup")},
                {icon:"🎯",t:"Goals & Metrics",d:`${metrics.length} metric${metrics.length===1?"":"s"} · Stretch ${stretchPct}%`, act:()=>go("playbook")},
                {icon:"🥕",t:"Carrots",        d:`${bigCarrots.length} big · ${medCarrots.length} medium · ${metrics.filter(m=>m.treat).length} mini`, act:()=>{setCarrotTab("big");go("carrots");}},
                {icon:"🔔",t:"Notifications",  d:`Weekly summary ${weeklySummaryDay} ${weeklySummaryTime}`, act:()=>go("playbook")},
              ].map(s=>(
                <div className="frow" style={{background:"white",border:"1.5px solid var(--border)",borderRadius:16,marginBottom:10,cursor:"pointer"}} key={s.t} onClick={s.act}>
                  <div className="ficon" style={{fontSize:22}}>{s.icon}</div>
                  <div className="fbody"><div style={{fontSize:16,fontWeight:700}}>{s.t}</div><div style={{fontSize:13,color:"var(--muted)"}}>{s.d}</div></div>
                  <button className="ebtn">Edit</button>
                </div>
              ))}

              <div className="scard" style={{marginTop:8}}>
                <div className="scard-hdr"><span style={{fontSize:18}}>📤</span><span className="scard-ttl">Share With Your Manager</span></div>
                <div style={{padding:"16px 20px"}}>
                  <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.5}}>Send a clean snapshot of your Floor, Stretch, and progress — you choose what's shared.</p>
                  {[
                    {l:"Metric progress (Floor / Stretch)",on:true},
                    {l:"Stretch goals hit this week",on:true},
                    {l:"Take-home & carrot money",on:false},
                  ].map(x=>(
                    <div className="crm-field" key={x.l}>
                      <span style={{flex:1}}>{x.l}</span>
                      <span className="crm-req" style={x.on?{background:"var(--green-light)",color:"var(--green)"}:{background:"var(--border)",color:"var(--muted)"}}>{x.on?"Shared":"Private"}</span>
                    </div>
                  ))}
                  <button className="btn btn-p btn-sm" style={{marginTop:14}}>Send Snapshot to Manager</button>
                </div>
              </div>

              <button className="btn btn-g btn-full" style={{marginTop:16,color:"var(--muted)"}} onClick={()=>go("landing")}>Log out</button>
            </>)}

          </div>

          {/* mini-carrot toast */}
          {treatMsg&&(
            <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:"var(--green)",color:"white",padding:"12px 20px",borderRadius:100,fontSize:14,fontWeight:600,boxShadow:"0 8px 28px rgba(0,0,0,0.25)",animation:"fadeUp 0.3s ease",maxWidth:"90%",textAlign:"center"}}>{treatMsg}</div>
          )}

          {/* BOTTOM TAB BAR */}
          <div className="tabbar">
            {[
              {k:"home",    ico:"🏠",l:"Home"},
              {k:"update",  ico:"✍️",l:"Update"},
              {k:"carrots", ico:"🥕",l:"Carrots"},
              {k:"plan",    ico:"📋",l:"My Plan"},
              {k:"settings",ico:"⚙️",l:"Settings"},
            ].map(t=>(
              <button key={t.k} className={`tab ${activeTab===t.k?"on":""}`} onClick={()=>{setActiveTab(t.k);window.scrollTo(0,0);}}>
                <span className="tab-ico">{t.ico}</span>
                <span className="tab-lbl">{t.l}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
