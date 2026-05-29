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

function getFedBracket(income) {
  if (income <= 11925)  return { rate:10, label:"10% bracket" };
  if (income <= 48475)  return { rate:12, label:"12% bracket" };
  if (income <= 103350) return { rate:22, label:"22% bracket" };
  if (income <= 197300) return { rate:24, label:"24% bracket" };
  if (income <= 250525) return { rate:32, label:"32% bracket" };
  if (income <= 626350) return { rate:35, label:"35% bracket" };
  return { rate:37, label:"37% bracket" };
}

const K401_LIMIT = 23500;
function get401kMaxMonth(salary, pct) {
  if (!pct || !salary) return null;
  const monthly = salary * pct / 100 / 12;
  const toMax = K401_LIMIT / monthly;
  if (toMax >= 12) return null;
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Math.floor(toMax)];
}

const SUGGESTED_METRICS = [
  {emoji:"📞", label:"Cold calls",         freq:"Daily",  defaultTarget:10},
  {emoji:"📧", label:"Prospecting emails",  freq:"Daily",  defaultTarget:20},
  {emoji:"🤝", label:"Discovery meetings",  freq:"Weekly", defaultTarget:5},
  {emoji:"🎯", label:"Demos / presentations",freq:"Weekly",defaultTarget:3},
  {emoji:"📋", label:"Pipeline reviews",    freq:"Weekly", defaultTarget:1},
  {emoji:"🆕", label:"New logo outreach",   freq:"Daily",  defaultTarget:5},
  {emoji:"📈", label:"Deals advanced",      freq:"Weekly", defaultTarget:4},
  {emoji:"✍️", label:"Proposals sent",      freq:"Weekly", defaultTarget:2},
];

const MILESTONES = [
  {pct:75,  label:"On Track",          color:"#E9C46A", dot:"#E9C46A",
   tiers:[{range:"0–75% of quota", rate:5, highlight:false}],
   tierNote:"Base rate only — push to 100% to unlock 8%"},
  {pct:100, label:"Quota",             color:"#F4711A", dot:"#F4711A",
   tiers:[{range:"0–75%",rate:5,highlight:false},{range:"75–100%",rate:8,highlight:true}],
   tierNote:"Hit quota — the accelerator unlocks above this line"},
  {pct:125, label:"Accelerator",       color:"#E76F51", dot:"#E76F51",
   tiers:[{range:"0–75%",rate:5,highlight:false},{range:"75–100%",rate:8,highlight:false},{range:"100–125% Accelerator",rate:14,highlight:true}],
   tierNote:"Accelerator at 14% — every dollar above quota earns more"},
  {pct:150, label:"President's Club",  color:"#2D6A4F", dot:"#2D6A4F",
   tiers:[{range:"0–75%",rate:5,highlight:false},{range:"75–100%",rate:8,highlight:false},{range:"100–150% Accelerator",rate:14,highlight:true}],
   tierNote:"Maximum accelerator — 14% on everything above quota"},
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
    else if (att<=1.5)  comm=quota*0.75*0.05+quota*0.25*rate+quota*(att-1)*rate*accelerator;
    else                comm=quota*0.75*0.05+quota*0.25*rate+quota*0.5*rate*accelerator+quota*(att-1.5)*rate;
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
function CarrotImageBox({reward, onImageChange}) {
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
      <div style={{border:`2px ${reward.image?"solid":"dashed"} ${reward.image?"var(--carrot-light)":"var(--border)"}`,borderRadius:16,minHeight:150,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,background:"var(--cream)",overflow:"hidden"}}>
        {reward.image
          ?<img src={reward.image} alt="" style={{width:"100%",height:190,objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>
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
          <input style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,fontSize:15,fontFamily:"'DM Sans',sans-serif",color:"var(--ink)"}} placeholder="Paste image URL..." value={urlVal} onChange={e=>setUrlVal(e.target.value)}/>
          <button onClick={()=>{if(urlVal.trim()){onImageChange(urlVal.trim());setMode(null);setUrlVal("");}}} style={{background:"var(--carrot)",color:"white",border:"none",borderRadius:100,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Add</button>
          <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13}}>Cancel</button>
        </div>
      )}
      {mode==="ai"&&!aiLoading&&(
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <input style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,fontSize:15,fontFamily:"'DM Sans',sans-serif",color:"var(--ink)"}} placeholder={`e.g. "Family vacation in Hawaii"`} value={aiVal} onChange={e=>setAiVal(e.target.value)}/>
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
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);}
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
.nbtn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
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
.inp{width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:15px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);transition:border-color 0.2s;}
.inp:focus{outline:none;border-color:var(--carrot);}
.ilabel{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px;display:block;}
.ihint{font-size:12px;color:var(--muted);margin-top:4px;}
.igroup{margin-bottom:18px;}
.irow{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
select.inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A6A55' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:100px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.btn-p{background:var(--carrot);color:white;}
.btn-p:hover{background:var(--carrot-dark);transform:translateY(-1px);box-shadow:0 8px 24px rgba(244,113,26,0.3);}
.btn-p:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-s{background:white;color:var(--ink);border:1.5px solid var(--border);}
.btn-s:hover{border-color:var(--carrot);color:var(--carrot);}
.btn-g{background:transparent;color:var(--muted);}
.btn-sm{padding:8px 16px;font-size:13px;}
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
.scard-ttl{font-size:15px;font-weight:700;flex:1;}
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
.ebtn{flex-shrink:0;background:none;border:1.5px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:var(--muted);}
.ebtn:hover{border-color:var(--carrot);color:var(--carrot);}
.iedit{display:flex;gap:8px;margin-top:8px;align-items:center;}
.ieinp{padding:8px 12px;border:1.5px solid var(--carrot);border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;width:160px;color:var(--ink);background:white;}
.ieinp:focus{outline:none;}
.sbtn{background:var(--carrot);color:white;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;}
.cbtn{background:none;color:var(--muted);border:none;font-size:13px;cursor:pointer;padding:8px;}

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

/* GOALS WIZARD */
.wiz-tabs{display:flex;background:white;border:1.5px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:24px;}
.wiz-tab{flex:1;padding:12px 8px;text-align:center;font-size:12px;font-weight:600;color:var(--muted);border-right:1px solid var(--border);}
.wiz-tab:last-child{border-right:none;}
.wiz-tab.active{background:var(--carrot);color:white;}
.wiz-tab.done{background:var(--green-light);color:var(--green);}
.wiz-tab-num{font-size:16px;margin-bottom:2px;}
.target-display{background:linear-gradient(135deg,#1A1208,#2D1A0A);border-radius:20px;padding:28px;text-align:center;margin-bottom:20px;}
.target-pct{font-family:'Playfair Display',serif;font-size:60px;font-weight:900;color:var(--carrot);line-height:1;}
.target-th{font-size:24px;font-weight:700;color:white;margin-top:10px;}
.target-sub{font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;}
.milestone-btn{padding:12px 10px;borderRadius:14px;text-align:center;cursor:pointer;border-radius:14px;transition:all 0.2s;border:1.5px solid var(--border);background:white;}
.milestone-btn.sel{background:var(--carrot);border-color:var(--carrot);}
.slider{width:100%;accent-color:var(--carrot);cursor:pointer;}

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
.fsel{width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);}
.fsel:focus{outline:none;border-color:var(--carrot);}
.vbtns{display:flex;gap:6px;}
.vbtn{flex:1;padding:7px 6px;border-radius:8px;border:1.5px solid var(--border);background:white;font-size:12px;font-weight:600;cursor:pointer;text-align:center;transition:all 0.15s;}
.vbtn.on{border-color:var(--carrot);background:var(--carrot-light);color:var(--carrot-dark);}
.sug-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border:1.5px solid var(--border);border-radius:100px;cursor:pointer;font-size:13px;font-weight:500;background:white;transition:all 0.15s;margin:0 6px 8px 0;}
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
.cg2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px;}
.cc{background:white;border:1.5px solid var(--border);border-radius:16px;overflow:hidden;}
.cc-nopic{height:90px;background:var(--carrot-light);display:flex;align-items:center;justify-content:center;font-size:32px;}
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
`;

// ── MAIN APP ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Profile
  const [userName, setUserName]     = useState("");
  const [userEmail, setUserEmail]   = useState("");
  const [userState, setUserState]   = useState("");
  const [k401Pct, setK401Pct]       = useState(6);
  const [healthMo, setHealthMo]     = useState(200);
  const [otherMo, setOtherMo]       = useState(0);

  // Upload
  const [files, setFiles] = useState([]);

  // Comp
  const [comp, setComp] = useState({base:150000, quota:1875000, commissionRate:8, accelerator:1.75});
  const [editField, setEditField]   = useState(null);
  const [editVal, setEditVal]       = useState("");
  const [taxOverrides, setTaxOverrides] = useState({});
  const [expandedM, setExpandedM]   = useState(null);

  // Goals — 2-step wizard
  const [goalsStep, setGoalsStep]   = useState(1);  // 1=target, 2=metrics+tracking+reminders
  const [targetPct, setTargetPct]   = useState(100);
  const [metrics, setMetrics]       = useState([]);
  const [trackingMethod, setTrackingMethod] = useState(null);
  const [crmUrl, setCrmUrl]         = useState("");
  const [updateFreq, setUpdateFreq] = useState("weekly");
  const [weeklySummaryDay, setWeeklySummaryDay] = useState("Friday");
  const [weeklySummaryTime, setWeeklySummaryTime] = useState("8:00 AM");

  // Dashboard
  const [rewards, setRewards]       = useState({});
  const [goals, setGoals]           = useState([]);
  const [checked, setChecked]       = useState({});
  const [weeklyEntries, setWeeklyEntries] = useState({});
  const [showUpdate, setShowUpdate] = useState(false);
  const [csvDone, setCsvDone]       = useState(false);

  const go = s => { setScreen(s); window.scrollTo(0,0); };

  // ── CALC ─────────────────────────────────────────────────────────
  const grossAt100 = useMemo(()=>comp.base+comp.quota*0.75*0.05+comp.quota*0.25*(comp.commissionRate/100),[comp]);
  const fedBracket = useMemo(()=>getFedBracket(grossAt100),[grossAt100]);
  const stateTax   = STATE_TAXES[userState]||0;
  const fica       = 7.65;
  const effFed     = taxOverrides.fed??fedBracket.rate;
  const effState   = taxOverrides.state??stateTax;
  const totalPct   = effFed+effState+fica+k401Pct;
  const flatDed    = (healthMo+otherMo)*12;
  const annualK401 = grossAt100*k401Pct/100;
  const willMax    = annualK401>=K401_LIMIT;
  const k401Mo     = useMemo(()=>get401kMaxMonth(grossAt100,k401Pct),[grossAt100,k401Pct]);

  function calcGross(pct) {
    const {base,quota,commissionRate,accelerator}=comp;
    const r=commissionRate/100; const a=pct/100;
    const c = a<=0.75 ? quota*a*0.05
            : a<=1.0  ? quota*0.75*0.05+quota*(a-0.75)*r
            : a<=1.5  ? quota*0.75*0.05+quota*0.25*r+quota*(a-1)*r*accelerator
                      : quota*0.75*0.05+quota*0.25*r+quota*0.5*r*accelerator+quota*(a-1.5)*r;
    return base+c;
  }
  function calcNet(g){ return g*(1-totalPct/100)-flatDed; }

  function startEdit(f,v){setEditField(f);setEditVal(String(v));}
  function saveEdit(){setComp(c=>({...c,[editField]:parseFloat(editVal)||0}));setEditField(null);}

  function addMetric(emoji,label,freq,target){
    if (metrics.find(m=>m.label===label)) return;
    setMetrics(p=>[...p,{id:Date.now()+Math.random(),emoji,label,target,freq,remTime:"9:00 AM",remDay:freq==="Daily"?"Daily":"Mon",remVehicle:"email"}]);
  }
  function updMetric(id,patch){setMetrics(p=>p.map(m=>m.id===id?{...m,...patch}:m));}

  const doneToday = Object.values(checked).filter(Boolean).length;
  const STEPS     = ["upload","summary","paycheck","milestones","mycorrots","goals","dashboard"];
  const si        = STEPS.indexOf(screen);
  const showNav   = !["landing","signup","privacy","celebrate"].includes(screen);
  const STEP_LBLS = ["Upload","Plan Summary","Paycheck","Milestones","My Carrots","My Goals","Dashboard"];

  // ── OTE calcs for summary ─────────────────────────────────────────
  const atQuotaComm = comp.quota*0.75*0.05+comp.quota*0.25*(comp.commissionRate/100);
  const ote         = comp.base+atQuotaComm;
  const basePct     = Math.round((comp.base/ote)*100);
  const commPct     = 100-basePct;

  return (
    <div style={{minHeight:"100vh"}}>
      <style>{S}</style>

      {/* NAV */}
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
              <button className="nbtn nbtn-next" onClick={()=>go(STEPS[si+1])}>
                {STEP_LBLS[si+1]} →
              </button>
            )}
            {screen==="dashboard"&&<button className="nbtn nbtn-back" onClick={()=>{setGoalsStep(1);go("goals");}}>✏️ Edit Goals</button>}
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
              <span style={{fontSize:14,color:"rgba(255,255,255,0.55)",cursor:"pointer"}}>Privacy</span>
              <button className="lprimary" style={{padding:"10px 22px",fontSize:14}} onClick={()=>go("signup")}>Get Started Free</button>
            </div>
          </nav>
          <div className="lhero">
            <div className="leyebrow">🥕 For Sales People, By Sales People</div>
            <h1 className="ltitle">Stop chasing a <span className="hl">number.</span><br/>Start chasing your <span className="hl">dream.</span></h1>
            <p style={{fontSize:20,color:"rgba(255,255,255,0.65)",lineHeight:1.65,maxWidth:640,margin:"0 auto 14px"}}>
              Too many salespeople grind toward a quota they don't connect with. Earn The Carrot helps you decode your comp plan, see what you actually take home, and build a vivid, personal vision of what you're really working toward.
            </p>
            <p style={{fontSize:16,fontWeight:700,color:"var(--gold)",marginBottom:40}}>"Too much stick out there. We need more carrots." 🥕</p>
            <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:60}}>
              <button className="lprimary" onClick={()=>go("signup")}>Start Earning Your Carrot →</button>
              <button className="lsecondary" onClick={()=>go("upload")}>See a Demo</button>
            </div>
          </div>
          <div className="lfgrid">
            {[
              {icon:"📄",t:"Decode Your Comp Plan",d:"AI reads every line — finding hidden clauses, decelerators, clawbacks, and fine print that affect your real take-home."},
              {icon:"🥕",t:"Visualize Your Carrots",d:"Pick what you're working toward. A boat. A vacation. Your kids' education. Attach a photo to every milestone."},
              {icon:"🎯",t:"Track What Matters",d:"Set personal activity goals. Connect your CRM. Get coached weekly on how you're doing and what to do next."},
              {icon:"💰",t:"Know Your Real Take-Home",d:"We calculate what actually hits your bank after taxes, 401k, and deductions — not the gross number on your offer letter."},
              {icon:"🧠",t:"AI Plan Interpreter",d:"We explain what leadership is trying to get you to do, and where the hidden gotchas are in your plan."},
              {icon:"📱",t:"Nudges That Actually Help",d:"Daily reminders per metric. Weekly summaries. A photo of your dream when you need motivation most."},
            ].map((f,i)=>(
              <div className="lfcard" key={i}>
                <div style={{fontSize:28,marginBottom:12}}>{f.icon}</div>
                <div style={{fontSize:15,fontWeight:700,color:"white",marginBottom:8}}>{f.t}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.55}}>{f.d}</div>
              </div>
            ))}
          </div>
          <div className="pain-section">
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:"white",marginBottom:14,textAlign:"center"}}>The problem with sales motivation today</h2>
            <p style={{fontSize:16,color:"rgba(255,255,255,0.5)",textAlign:"center",marginBottom:32}}>Most tools focus on the company's goals, not yours. That's backwards.</p>
            <div className="pgrid">
              {[
                {icon:"😤",t:"\"Exceed your number\" isn't motivating",d:"Hitting 110% quota doesn't make you want to work harder. It just feels like more pressure."},
                {icon:"📝",t:"Nobody reads their comp plan",d:"Hidden clawbacks and caps are buried in fine print. Most reps find out when their paycheck is smaller than expected."},
                {icon:"🏆",t:"Only one person can be #1",d:"Leaderboards make 99% of your team feel like losers. That kills morale across the board."},
                {icon:"💸",t:"You don't know what you take home",d:"The gap between gross OTE and actual take-home can be 35–40%. Most reps have no idea."},
              ].map((p,i)=>(
                <div className="pcard" key={i}>
                  <div style={{fontSize:22,marginBottom:8}}>{p.icon}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#FCA5A5",marginBottom:6}}>{p.t}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{p.d}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:"var(--gold)",letterSpacing:2,margin:"20px 0"}}>→ EARN THE CARROT FIXES THIS ←</div>
            <div className="sgrid">
              {[
                {icon:"🥕",t:"Chase your dream, not a number",d:"\"I want to take my family to Italy\" is 10x more motivating than hitting 120% of plan."},
                {icon:"🔍",t:"AI reads the fine print for you",d:"We surface every hidden clause, cap, and gotcha so you know exactly how your plan works."},
                {icon:"🎯",t:"Win against yourself, not others",d:"Everyone has their own goals. Everyone can win. Motivation goes up across the team."},
                {icon:"🏦",t:"See your real take-home instantly",d:"Know exactly what hits your bank at 100%, 125%, and 150% — after every deduction."},
              ].map((s,i)=>(
                <div className="scard2" key={i}>
                  <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#86EFAC",marginBottom:6}}>{s.t}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{s.d}</div>
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
                🔒 <span><strong>Your privacy matters.</strong> We only store your first name, email, state, and financial inputs — never your company name, SSN, or documents. Your comp plan is read by AI and immediately deleted.</span>
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
              <div className="igroup">
                <label className="ilabel">State You Live In</label>
                <select className="inp" value={userState} onChange={e=>setUserState(e.target.value)}>
                  <option value="">Select your state...</option>
                  {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div className="ihint">Used to calculate your state tax rate automatically</div>
              </div>
              <div className="sdivider"/>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>Your Deductions</div>
              <div className="igroup">
                <label className="ilabel">401(k) Contribution: <strong>{k401Pct}% of salary</strong></label>
                <input type="range" className="slider" min="0" max="25" step="0.5" value={k401Pct} onChange={e=>setK401Pct(+e.target.value)}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginTop:4}}>
                  <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span>
                </div>
              </div>
              <div className="irow">
                <div className="igroup" style={{marginBottom:0}}>
                  <label className="ilabel">Health Insurance/mo</label>
                  <input className="inp" type="number" value={healthMo} onChange={e=>setHealthMo(+e.target.value)}/>
                  <div className="ihint">Your monthly premium</div>
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
              <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"var(--muted)"}}>
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
                    <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{p.d}</div>
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
          <div className="slabel">Step 1 of 6</div>
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
          <div className="slabel">Step 2 of 6</div>
          <h2 className="stitle">Here's What We Found</h2>
          <p className="ssub">We decoded two things — your numbers and what leadership is really trying to get you to do.</p>

          {/* AI COACH */}
          <div className="coach">
            <div className="coach-hdr">
              <span style={{fontSize:22}}>🧠</span>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"white",marginBottom:2}}>AI Plan Interpretation</div>
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

          {/* FINE PRINT — right after AI coach */}
          <div style={{background:"var(--red-light)",border:"1.5px solid #FECACA",borderRadius:16,padding:"18px 22px",marginBottom:20}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--red)",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>⚠️ Fine Print — Things Most Reps Miss</div>
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

            {/* Dark OTE hero with split bar */}
            <div style={{background:"linear-gradient(135deg,#1A1208,#2D1A0A)",padding:"22px 22px 20px"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:6}}>On-Target Earnings at 100% of Plan</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:"white",lineHeight:1,marginBottom:4}}>{fmt(ote)}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:18}}>total gross · {fmt(calcNet(calcGross(100)))} est. take-home after taxes</div>
              {/* Split bar */}
              <div style={{display:"flex",height:10,borderRadius:5,overflow:"hidden",marginBottom:12}}>
                <div style={{width:`${basePct}%`,background:"#E9C46A"}}/>
                <div style={{width:`${commPct}%`,background:"var(--carrot)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {/* Base */}
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
                {/* Commission */}
                <div style={{background:"rgba(244,113,26,0.15)",border:"1px solid rgba(244,113,26,0.3)",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#FDBA74",marginBottom:4}}>📈 Commission ({commPct}%)</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"white"}}>{fmt(atQuotaComm)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3}}>at 100% of {fmt(comp.quota)} quota</div>
                  <button className="ebtn" style={{marginTop:6,fontSize:11,padding:"3px 10px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",borderRadius:6}} onClick={()=>startEdit("quota",comp.quota)}>✏️ Edit Quota</button>
                </div>
              </div>
            </div>

            {/* Quota row */}
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

            {/* Tiers */}
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

            {/* Payout curve */}
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

          {/* EQUITY */}
          <div className="scard">
            <div className="scard-hdr"><span style={{fontSize:18}}>📈</span><span className="scard-ttl">Equity & Stock Compensation</span><span className="badge badge-g">✓ Found</span></div>
            {[
              {icon:"💎",l:"RSU Grant Value",v:"$200,000",sub:"~2,000 units · 4-yr vest / 1-yr cliff",pg:"Equity addendum"},
              {icon:"⭐",l:"Performance Stock Units (PSUs)",v:"Up to $50,000",sub:"0–200% payout · 3-year performance period",pg:"Equity addendum"},
              {icon:"🏪",l:"ESPP Discount",v:"15% off purchase price",sub:"6-month offering periods · max $25K/yr",pg:"Benefits summary"},
            ].map((f,i)=>(
              <div className="frow" key={i}>
                <div className="ficon">{f.icon}</div>
                <div className="fbody">
                  <div className="flabel">{f.l}</div>
                  <div className="fval" style={{fontSize:16}}>{f.v}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{f.sub}</div>
                  <div className="fsrc">📄 {f.pg}</div>
                </div>
              </div>
            ))}
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
                  <div style={{fontSize:15,fontWeight:700}}>{s.v}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{s.d}</div>
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
              <div style={{fontSize:15,fontWeight:700,color:"var(--green)"}}>Does this look right?</div>
              <div style={{fontSize:13,color:"var(--green)",opacity:0.8}}>Tap any field to edit. When ready, continue to see your real take-home numbers.</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYCHECK ══════════════════════════════════════════════════ */}
      {screen==="paycheck"&&(
        <div className="screen">
          <div className="slabel">Step 3 of 6</div>
          <h2 className="stitle">What Do You Actually Take Home?</h2>
          <p className="ssub">Based on your state and profile, here's what we're assuming for taxes and deductions.</p>
          <div className="tax-box">
            <div style={{fontSize:15,fontWeight:700,color:"var(--blue)",marginBottom:14}}>🧮 Here's What We're Assuming</div>
            <div className="info-box" style={{marginBottom:14}}>Based on your income and {userState||"your state"}, we pre-filled your tax rates. Tap "override" to adjust.</div>
            {[
              {k:"fed",  l:"Federal Income Tax",        src:`${fedBracket.label}`,         rate:effFed,   noOvr:false},
              {k:"state",l:`${userState||"State"} Tax`, src:stateTax===0?"No state income tax":`Standard ${userState} rate`, rate:effState, noOvr:false},
              {k:"fica", l:"Social Security & Medicare",src:"Fixed rate — everyone pays",  rate:fica,     noOvr:true},
              {k:"k401", l:`401(k) at ${k401Pct}%`,    src:"From your profile",            rate:k401Pct,  noOvr:true},
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
                <div style={{fontSize:13,fontWeight:600,color:"var(--muted)"}}>Total Deduction Rate</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>+ {fmt(flatDed)}/yr flat deductions</div>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700}}>~{Math.round(totalPct)}%</div>
            </div>
          </div>
          {k401Pct>0&&(
            <div style={{background:"var(--green-light)",border:"1.5px solid var(--green)",borderRadius:16,padding:18,marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:28,flexShrink:0}}>🏦</div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--green)",marginBottom:3}}>
                  {willMax?"🎉 You'll max your 401k this year!":k401Mo?`You'll max your 401k around ${k401Mo}`:"Increase your 401k % to max it out"}
                </div>
                <div style={{fontSize:13,color:"var(--green)",opacity:0.85}}>
                  At {k401Pct}% you contribute ~{fmt(annualK401)}/yr · 2025 limit is {fmt(K401_LIMIT)}
                  {!willMax&&` · Increase to ${Math.ceil(K401_LIMIT/grossAt100*100)}% to max it out`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ MILESTONES ═══════════════════════════════════════════════ */}
      {screen==="milestones"&&(
        <div className="screen">
          <div className="slabel">Step 4 of 6</div>
          <h2 className="stitle">Your Real Numbers</h2>
          <p className="ssub">What you'd earn — and actually take home — at each performance level. Tap any card for the full breakdown.</p>
          <div style={{position:"relative",paddingLeft:28,marginBottom:24}}>
            <div style={{position:"absolute",left:9,top:20,bottom:20,width:3,background:"linear-gradient(to bottom,#E9C46A,#F4711A,#E76F51,#2D6A4F)",borderRadius:2}}/>
            {MILESTONES.map(m=>{
              const gross=calcGross(m.pct); const net=calcNet(gross); const comm=gross-comp.base;
              const isOpen=expandedM===m.pct; const r=rewards[m.pct]||{};
              return(
                <div style={{position:"relative",marginBottom:14}} key={m.pct}>
                  <div style={{position:"absolute",left:-20,top:24,width:18,height:18,borderRadius:"50%",background:m.dot,border:"3px solid white",zIndex:2,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}/>
                  <div className={`mcard ${m.pct===150?"top":""}`} onClick={()=>setExpandedM(isOpen?null:m.pct)}>
                    <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:18,alignItems:"center",padding:"20px 22px"}}>
                      <div style={{textAlign:"center",minWidth:68}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,color:m.color,lineHeight:1}}>{m.pct}%</div>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--muted)",marginTop:3}}>{m.label}</div>
                        {m.pct===150&&<div style={{fontSize:16,marginTop:3}}>👑</div>}
                      </div>
                      <div>
                        <div style={{fontSize:13,color:"var(--muted)",marginBottom:3}}>Gross: <strong style={{color:"var(--ink)"}}>{fmt(gross)}</strong></div>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--green)",marginBottom:2}}>Est. Take-Home</div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"var(--green)"}}>{fmt(net)}</div>
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{fmtMo(net)} · {isOpen?"▲ hide":"▼ details"}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        {r.image
                          ?<img src={r.image} alt="" style={{width:68,height:52,borderRadius:12,objectFit:"cover",border:"2px solid var(--border)"}} onError={e=>e.target.style.display="none"}/>
                          :<div style={{width:68,height:52,borderRadius:12,background:"var(--carrot-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"2px dashed var(--border)"}}>🥕</div>}
                        <div style={{fontSize:11,color:"var(--muted)",marginTop:3,maxWidth:68,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label||"Set carrot"}</div>
                      </div>
                    </div>
                    {/* Tiers */}
                    <div style={{padding:"0 22px 12px"}}>
                      {m.tiers.map((t,ti)=>(
                        <div key={ti} className={`tier-pill ${t.highlight?"tier-active":"tier-inactive"}`}>
                          <div className="tier-badge">{t.rate}%</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600,color:t.highlight?"var(--ink)":"var(--muted)"}}>{t.range}</div>
                          </div>
                          {t.highlight&&<div style={{fontSize:12,fontWeight:700,color:"var(--carrot)"}}>Active ✓</div>}
                        </div>
                      ))}
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--gold-light)",borderRadius:10,border:"1px solid var(--gold)",marginTop:6}}>
                        <span style={{fontSize:13}}>💡</span>
                        <span style={{fontSize:12,color:"#7A5C00",fontWeight:500}}>{m.tierNote}</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div style={{padding:"0 22px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:5}}>
                        <span>Base: {fmt(comp.base)}</span><span>Commission: +{fmt(comm)}</span>
                      </div>
                      <div style={{height:7,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min((gross/calcGross(150))*100,100)}%`,background:m.color,borderRadius:3}}/>
                      </div>
                    </div>
                    {isOpen&&(
                      <div style={{borderTop:"1px solid var(--border)",padding:"18px 22px",background:"var(--cream)"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                          {[{l:"Base Salary",v:fmt(comp.base),hi:false},{l:"Commission",v:"+"+fmt(comm),hi:false},{l:"Gross Total",v:fmt(gross),hi:true}].map((b,i)=>(
                            <div key={i} style={{background:b.hi?"var(--green-light)":"white",border:`1.5px solid ${b.hi?"var(--green)":"var(--border)"}`,borderRadius:14,padding:"12px 14px"}}>
                              <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:b.hi?"var(--green)":"var(--muted)",marginBottom:4}}>{b.l}</div>
                              <div style={{fontSize:20,fontWeight:700,color:b.hi?"var(--green)":"var(--ink)"}}>{b.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{background:"white",borderRadius:14,padding:"14px 16px",border:"1.5px solid var(--border)"}}>
                          <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Annual Paycheck Breakdown</div>
                          {[
                            {l:"Gross Earnings",v:fmt(gross),green:true},
                            {l:`Federal Tax (~${Math.round(effFed)}%)`,v:`−${fmt(gross*effFed/100)}`,green:false},
                            {l:`${userState||"State"} Tax (~${Math.round(effState)}%)`,v:`−${fmt(gross*effState/100)}`,green:false},
                            {l:"FICA",v:`−${fmt(gross*fica/100)}`,green:false},
                            {l:`401(k) at ${k401Pct}%`,v:`−${fmt(gross*k401Pct/100)}`,green:false},
                            {l:"Health Insurance",v:`−${fmt(healthMo*12)}`,green:false},
                          ].map((row,ri)=>(
                            <div key={ri} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:ri<5?"1px solid var(--border)":"none",fontSize:14}}>
                              <span>{row.l}</span>
                              <span style={{fontWeight:600,color:row.green?"var(--green)":"var(--red)"}}>{row.v}</span>
                            </div>
                          ))}
                          <div style={{display:"flex",justifyContent:"space-between",marginTop:8,borderTop:"2px solid var(--border)",paddingTop:12}}>
                            <span style={{color:"var(--green)",fontWeight:700}}>🏦 Est. Take-Home</span>
                            <span style={{color:"var(--green)",fontSize:18,fontWeight:700}}>{fmt(net)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="info-box">💡 Estimates based on ~{Math.round(totalPct)}% total deductions. Your actual take-home may vary.</div>
        </div>
      )}

      {/* ══ MY CARROTS ═══════════════════════════════════════════════ */}
      {screen==="mycorrots"&&(
        <div className="screen">
          <div className="slabel">Step 5 of 6</div>
          <h2 className="stitle">My Carrots 🥕</h2>
          <p className="ssub">What are you working toward? Add a photo for each milestone — your car, vacation, dream. Make it real and personal.</p>
          {MILESTONES.map(m=>{
            const r=rewards[m.pct]||{};
            return(
              <div key={m.pct} style={{background:"white",border:"1.5px solid var(--border)",borderRadius:22,padding:26,marginBottom:22}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,flexWrap:"wrap"}}>
                  <div style={{background:"var(--carrot)",color:"white",fontSize:13,fontWeight:700,padding:"5px 14px",borderRadius:100}}>{m.pct}% · {m.label}</div>
                  <div style={{display:"flex",gap:18}}>
                    <div><div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--muted)"}}>Take-Home</div><div style={{fontSize:17,fontWeight:700,color:"var(--green)"}}>{fmt(calcNet(calcGross(m.pct)))}/yr</div></div>
                    <div><div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--muted)"}}>Gross</div><div style={{fontSize:17,fontWeight:700}}>{fmt(calcGross(m.pct))}/yr</div></div>
                  </div>
                </div>
                <CarrotImageBox reward={r} onImageChange={img=>setRewards(rv=>({...rv,[m.pct]:{...r,image:img}}))}/>
                <input className="inp" placeholder="What is this? e.g. Family trip to Italy, New car, College fund..."
                  value={r.label||""} onChange={e=>setRewards(rv=>({...rv,[m.pct]:{...r,label:e.target.value}}))}/>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ GOALS — 2-STEP WIZARD ════════════════════════════════════ */}
      {screen==="goals"&&(
        <div className="screen">
          <div className="slabel">Step 6 of 6</div>
          <h2 className="stitle">Your Personal Playbook</h2>
          <p className="ssub">{goalsStep===1?"Set your target — what % of plan do you want to hit this year?":"Now add your metrics, set reminders, and tell us how you'll track your numbers."}</p>

          <div className="wiz-tabs">
            {[{n:"🎯",l:"Your Target"},{n:"📊",l:"Metrics & Tracking"}].map((s,i)=>(
              <div key={i} className={`wiz-tab ${goalsStep===i+1?"active":goalsStep>i+1?"done":""}`}>
                <div className="wiz-tab-num">{goalsStep>i+1?"✓":s.n}</div>
                {s.l}
              </div>
            ))}
          </div>

          {/* ── STEP 1: TARGET ONLY ────────────────────────────────── */}
          {goalsStep===1&&(
            <div>
              <div className="slabel" style={{marginBottom:10}}>{userName||"Hey"}, what % of plan do you want to hit this year?</div>

              <div className="target-display">
                <div className="target-pct">{targetPct}%</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>of {fmt(comp.quota)} annual quota</div>
                <div className="target-th">{fmt(calcNet(calcGross(targetPct)))} take-home</div>
                <div className="target-sub">{fmt(calcGross(targetPct))} gross · after ~{Math.round(totalPct)}% deductions</div>
              </div>

              <input type="range" className="slider" min="50" max="200" step="5"
                value={targetPct} onChange={e=>setTargetPct(+e.target.value)} style={{marginBottom:8}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:20}}>
                <span>50%</span><span>75%</span><span>100%</span><span>125%</span><span>150%</span><span>200%</span>
              </div>

              {/* Quick milestone selector */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
                {[75,100,125,150].map(p=>(
                  <div key={p} onClick={()=>setTargetPct(p)} style={{padding:"12px 10px",borderRadius:14,textAlign:"center",cursor:"pointer",background:targetPct===p?"var(--carrot)":"white",border:`1.5px solid ${targetPct===p?"var(--carrot)":"var(--border)"}`,transition:"all 0.2s"}}>
                    <div style={{fontSize:16,fontWeight:900,color:targetPct===p?"white":"var(--carrot)"}}>{p}%</div>
                    <div style={{fontSize:11,color:targetPct===p?"rgba(255,255,255,0.8)":"var(--muted)",marginTop:2}}>{fmt(calcNet(calcGross(p)))}</div>
                    <div style={{fontSize:10,color:targetPct===p?"rgba(255,255,255,0.6)":"var(--muted)"}}>take-home</div>
                  </div>
                ))}
              </div>

              {targetPct<75&&<div style={{background:"var(--red-light)",border:"1px solid #FECACA",borderRadius:14,padding:"12px 16px",marginBottom:16,fontSize:13,color:"var(--red)"}}>⚠️ Below 75% you earn no commission — just base salary. Consider a higher target.</div>}
              {targetPct>=75&&targetPct<100&&<div className="info-box">💡 Below quota — you'll take home {fmt(calcNet(calcGross(targetPct)))} vs. {fmt(calcNet(calcGross(100)))} at quota.</div>}
              {targetPct>=100&&<div className="info-box">🎯 At <strong>{targetPct}%</strong> you'd take home <strong>{fmt(calcNet(calcGross(targetPct)))}</strong>{targetPct>=125?` — ${fmt(calcNet(calcGross(targetPct))-calcNet(calcGross(100)))} more than hitting quota.`:""}</div>}

              <button className="btn btn-p btn-full" style={{marginTop:8}} onClick={()=>setGoalsStep(2)}>
                Next — Set My Metrics →
              </button>
            </div>
          )}

          {/* ── STEP 2: METRICS + TRACKING + REMINDERS (all one page) */}
          {goalsStep===2&&(
            <div>
              {/* Goal reminder */}
              <div style={{background:"linear-gradient(135deg,#1A1208,#2D1A0A)",borderRadius:18,padding:"18px 20px",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:"#FDBA74",marginBottom:4}}>🎯 Your goal: {targetPct}% of plan → {fmt(calcNet(calcGross(targetPct)))} take-home</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>Add your key activities below. For each one you'll set a target, frequency, and a personal reminder that includes your carrot photo.</div>
              </div>

              {/* ── A: ADD METRICS ── */}
              <div style={{fontSize:14,fontWeight:700,color:"var(--ink)",marginBottom:6}}>📊 What actions will you take to hit {targetPct}%?</div>
              <p style={{fontSize:13,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>
                Pick from the suggestions or add your own. These become the metrics you track. For each one you'll set a target number, how often, and a personal reminder.
              </p>
              <div style={{marginBottom:14,display:"flex",flexWrap:"wrap"}}>
                {SUGGESTED_METRICS.map(g=>(
                  <button key={g.label} className="sug-pill"
                    onClick={()=>addMetric(g.emoji,g.label,g.freq,g.defaultTarget)}>
                    {metrics.find(m=>m.label===g.label)
                      ?<span style={{color:"var(--green)"}}>✓</span>
                      :null} {g.emoji} {g.label}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:10,marginBottom:20}}>
                <input className="inp" placeholder="Add your own e.g. 📋 Pipeline reviews, 🤝 Executive meetings..." id="cm2" style={{flex:1}}/>
                <button className="btn btn-p btn-sm" onClick={()=>{
                  const el=document.getElementById("cm2");
                  if(el.value.trim()){addMetric("✨",el.value.trim(),"Daily",5);el.value="";}
                }}>+ Add</button>
              </div>

              {metrics.length===0&&(
                <div style={{textAlign:"center",padding:28,color:"var(--muted)",fontSize:14,background:"var(--cream)",borderRadius:14,marginBottom:20}}>
                  👆 Add at least one metric above to get started
                </div>
              )}

              {/* ── B: METRIC CARDS — target + frequency + per-metric reminder ── */}
              {metrics.map(m=>(
                <div className="mc" key={m.id}>
                  <div className="mc-hdr">
                    <div className="mc-emoji">{m.emoji}</div>
                    <div className="mc-name">{m.label}</div>
                    <button className="mc-del" onClick={()=>setMetrics(p=>p.filter(x=>x.id!==m.id))}>×</button>
                  </div>

                  {/* Target + Frequency */}
                  <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:14,alignItems:"center",padding:"12px 14px",background:"var(--cream)",borderRadius:12,marginBottom:12}}>
                    <div style={{textAlign:"center"}}>
                      <div className="clabel">Target</div>
                      <div className="num-row">
                        <button className="num-btn" onClick={()=>updMetric(m.id,{target:Math.max(1,m.target-1)})}>−</button>
                        <div className="num-val">{m.target}</div>
                        <button className="num-btn" onClick={()=>updMetric(m.id,{target:m.target+1})}>+</button>
                      </div>
                    </div>
                    <div>
                      <div className="clabel">Frequency</div>
                      <select className="fsel" value={m.freq}
                        onChange={e=>updMetric(m.id,{freq:e.target.value,remDay:e.target.value==="Daily"?"Daily":"Mon"})}>
                        <option>Daily</option><option>Weekly</option><option>Bi-weekly</option><option>Monthly</option>
                      </select>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div className="clabel">Commitment</div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--carrot)"}}>{m.target}/{m.freq==="Daily"?"day":m.freq==="Weekly"?"wk":m.freq==="Bi-weekly"?"2wk":"mo"}</div>
                    </div>
                  </div>

                  {/* Per-metric reminder — exactly as you described */}
                  <div style={{borderTop:"1px solid var(--border)",paddingTop:12}}>
                    <div className="clabel" style={{marginBottom:8}}>🔔 Reminder for this metric</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                      <div>
                        <div className="clabel">Time</div>
                        <select className="fsel" value={m.remTime} onChange={e=>updMetric(m.id,{remTime:e.target.value})}>
                          {["6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="clabel">When</div>
                        <select className="fsel" value={m.remDay} onChange={e=>updMetric(m.id,{remDay:e.target.value})}>
                          {(m.freq==="Daily"?["Daily","Weekdays"]:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]).map(d=><option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="clabel">Via</div>
                        <div className="vbtns">
                          {["email","text"].map(v=>(
                            <button key={v} className={`vbtn ${m.remVehicle===v?"on":""}`}
                              onClick={()=>updMetric(m.id,{remVehicle:v})}>
                              {v==="email"?"📧":"📱"} {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Preview with carrot photo mention */}
                    <div style={{padding:"9px 12px",background:"var(--carrot-light)",borderRadius:10,fontSize:12,color:"var(--carrot-dark)",fontStyle:"italic",lineHeight:1.5}}>
                      📬 {m.remVehicle==="email"?"📧 Email":"📱 Text"} · {m.remDay} at {m.remTime} —
                      {" "}<em>"Hey {userName||"there"}! Time for {m.label.toLowerCase()} — goal is {m.target}/{m.freq==="Daily"?"day":"week"}.{" "}
                      [🥕 Photo of your carrot here] You've got this!"</em>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── C: TRACKING METHOD ── */}
              {metrics.length>0&&(
                <div style={{marginTop:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--ink)",marginBottom:6}}>📁 How will you update your numbers?</div>
                  <p style={{fontSize:13,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>
                    Choose how you'll log your activity. You can change this any time.
                  </p>

                  {[
                    {id:"manual",icon:"✏️",t:"Enter manually",d:"Type your numbers directly in the app. Simple and always available."},
                    {id:"csv",  icon:"📊",t:"Upload a CRM CSV report",d:"Export from Salesforce, HubSpot, or any CRM. Drop the CSV and we auto-match columns to your metrics.",badge:"Recommended"},
                    {id:"crm",  icon:"🔗",t:"Save your CRM report URL",d:"Paste your saved report link once. Your weekly email will include a direct link — one tap to download and upload.",badge:"Most Automated"},
                  ].map(opt=>(
                    <div key={opt.id} className={`topt ${trackingMethod===opt.id?"sel":""}`} onClick={()=>setTrackingMethod(opt.id)}>
                      <div style={{fontSize:26,flexShrink:0,marginTop:2}}>{opt.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{opt.t}</div>
                        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.4}}>{opt.d}</div>
                        {opt.badge&&<div className="topt-badge">{opt.badge}</div>}
                      </div>
                      <div style={{fontSize:20,flexShrink:0}}>{trackingMethod===opt.id?"🟠":"⚪"}</div>
                    </div>
                  ))}

                  {/* CRM field guide */}
                  {(trackingMethod==="csv"||trackingMethod==="crm")&&(
                    <div style={{background:"var(--blue-light)",border:"1.5px solid #BFDBFE",borderRadius:16,padding:"16px 18px",marginTop:4,marginBottom:14}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--blue)",marginBottom:8}}>📋 Build This Report in Your CRM</div>
                      <p style={{fontSize:12,color:"#1E40AF",marginBottom:12,lineHeight:1.5}}>
                        Create a saved report with these fields. <strong>Save it</strong> so you can re-run with one click, export as CSV, and upload here.
                      </p>
                      <div style={{background:"var(--cream)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                        {[
                          {n:"Date",d:"Activity or close date",req:true},
                          {n:"Activity Type",d:"Call, email, meeting, demo, etc.",req:true},
                          {n:"Count / Quantity",d:"Number completed",req:true},
                          {n:"Deal / Opportunity Name",d:"For closed deal tracking",req:false},
                          {n:"Pipeline Stage",d:"Current deal stage",req:false},
                          {n:"ARR / Amount",d:"For quota attainment tracking",req:false},
                          {n:"Rep Name",d:"Useful when sharing with manager",req:false},
                        ].map((f,i)=>(
                          <div className="crm-field" key={i}>
                            <span>📌</span>
                            <div style={{fontWeight:700,color:"var(--ink)",flex:1}}>{f.n}</div>
                            <div style={{color:"var(--muted)",fontSize:12}}>{f.d}</div>
                            {f.req&&<div className="crm-req">Required</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {trackingMethod==="crm"&&(
                    <div className="igroup">
                      <label className="ilabel">Paste Your Saved Report URL</label>
                      <input className="inp" placeholder="https://yourcrm.salesforce.com/reports/..." value={crmUrl} onChange={e=>setCrmUrl(e.target.value)}/>
                      <div className="ihint">📬 We'll include this link in your weekly summary email — one tap to open and download the CSV</div>
                    </div>
                  )}

                  <div className="igroup">
                    <label className="ilabel">How often will you update your numbers?</label>
                    <select className="inp" value={updateFreq} onChange={e=>setUpdateFreq(e.target.value)}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly (recommended)</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* ── D: WEEKLY SUMMARY ── */}
                  <div style={{background:"var(--carrot-light)",border:"1.5px solid var(--carrot)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--carrot-dark)",marginBottom:10}}>📅 Weekly Progress Summary</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                      <div>
                        <label className="ilabel" style={{fontSize:12}}>Send every</label>
                        <select className="inp" style={{fontSize:13,padding:"8px 12px"}} value={weeklySummaryDay} onChange={e=>setWeeklySummaryDay(e.target.value)}>
                          {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d=><option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="ilabel" style={{fontSize:12}}>At</label>
                        <select className="inp" style={{fontSize:13,padding:"8px 12px"}} value={weeklySummaryTime} onChange={e=>setWeeklySummaryTime(e.target.value)}>
                          {["6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM"].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:"var(--carrot-dark)",lineHeight:1.6}}>
                      Your {weeklySummaryDay} {weeklySummaryTime} summary will include:<br/>
                      ✅ What you hit · ⚠️ What you missed · 📈 Coaching on what to do more next week<br/>
                      🥕 A photo of your carrot to keep you motivated
                      {crmUrl&&<span> · 🔗 Direct link to your CRM report so updating takes one minute</span>}
                    </div>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button className="btn btn-g" onClick={()=>setGoalsStep(1)}>← Back</button>
                <button className="btn btn-p" style={{flex:1,justifyContent:"center"}}
                  disabled={metrics.length===0||!trackingMethod}
                  onClick={()=>{setGoals(metrics.map(m=>({...m})));go("celebrate");}}>
                  All Done — Show My Dashboard! 🥕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ CELEBRATE ════════════════════════════════════════════════ */}
      {screen==="celebrate"&&(
        <div style={{minHeight:"100vh",background:"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="cel">
            <div className="cel-icon">🥕</div>
            <div className="cel-title">Your Carrots Are Set!</div>
            <p style={{fontSize:16,color:"var(--muted)",marginBottom:28,maxWidth:400,margin:"0 auto 28px",lineHeight:1.6}}>
              You know what you're earning, what you'll take home, what you're working toward, and what you'll do every day to get there. Now go earn it.
            </p>
            <button className="btn btn-p" style={{fontSize:18,padding:"16px 40px"}} onClick={()=>go("dashboard")}>See My Dashboard →</button>
          </div>
        </div>
      )}

      {/* ══ DASHBOARD ════════════════════════════════════════════════ */}
      {screen==="dashboard"&&(
        <div className="screen">
          <div className="dash-hero">
            <div style={{fontSize:12,fontWeight:600,opacity:0.75,marginBottom:4,letterSpacing:1,textTransform:"uppercase"}}>Welcome back</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:6}}>{userName||"Your"} Carrots 🥕</div>
            <div style={{fontSize:14,opacity:0.82}}>Working toward {fmt(calcNet(calcGross(targetPct)))} take-home · {targetPct}% of plan</div>
          </div>

          <div className="dgrid">
            <div className="dcard">
              <div className="dcard-lbl">Annual Quota</div>
              <div className="dcard-val">{fmt(comp.quota)}</div>
              <div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>Your target</div>
            </div>
            <div className="dcard">
              <div className="dcard-lbl">At {targetPct}% — Take-Home</div>
              <div className="dcard-val" style={{color:"var(--green)"}}>{fmt(calcNet(calcGross(targetPct)))}</div>
              <div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>{fmt(calcGross(targetPct))} gross</div>
            </div>
          </div>

          <div className="slabel" style={{marginBottom:10}}>My Carrots</div>
          <div className="cg2">
            {MILESTONES.map(m=>{
              const r=rewards[m.pct]||{};
              return(
                <div className="cc" key={m.pct}>
                  {r.image?<img src={r.image} alt="" style={{width:"100%",height:90,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div className="cc-nopic">🥕</div>}
                  <div style={{padding:11}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--carrot)",letterSpacing:1,textTransform:"uppercase"}}>{m.pct}% · {m.label}</div>
                    <div style={{fontSize:13,fontWeight:600,marginTop:2}}>{r.label||"Set your carrot"}</div>
                    <div style={{fontSize:12,color:"var(--green)",fontWeight:600,marginTop:2}}>{fmt(calcNet(calcGross(m.pct)))} take-home</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's goals */}
          <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:20,padding:22,marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:10}}>Today's Goals</div>
            {goals.map(g=>(
              <div className="gl-item" key={g.id}>
                <div className={`gchk ${checked[g.id]?"on":""}`} onClick={()=>setChecked(c=>({...c,[g.id]:!c[g.id]}))}>
                  {checked[g.id]&&"✓"}
                </div>
                <div style={{flex:1,fontSize:15,textDecoration:checked[g.id]?"line-through":"none",color:checked[g.id]?"var(--muted)":"var(--ink)"}}>{g.emoji} {g.label}</div>
                <div style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:"var(--carrot-light)",color:"var(--carrot-dark)"}}>{g.freq}</div>
              </div>
            ))}
            {goals.length===0&&<div style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:14}}>No goals set — <span style={{color:"var(--carrot)",cursor:"pointer",fontWeight:600}} onClick={()=>{setGoalsStep(2);go("goals");}}>set them up</span></div>}
            {goals.length>0&&(
              <div style={{marginTop:14,padding:"10px 14px",background:doneToday===goals.length?"var(--green-light)":"var(--carrot-light)",borderRadius:12,fontSize:14,fontWeight:500,textAlign:"center",color:doneToday===goals.length?"var(--green)":"var(--carrot-dark)"}}>
                {doneToday} of {goals.length} done today {doneToday===goals.length?"🎉 All done!":""}
              </div>
            )}
          </div>

          {/* Metrics progress */}
          {goals.length>0&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div className="slabel" style={{marginBottom:0}}>My Metrics This Week</div>
                <button className="btn btn-s btn-sm" onClick={()=>setShowUpdate(!showUpdate)}>
                  📊 {showUpdate?"Hide":"Update Numbers"}
                </button>
              </div>

              {showUpdate&&(
                <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:18,padding:20,marginBottom:16}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Enter This Week's Numbers</div>
                  <div style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>Type what you accomplished, or upload your CRM CSV.</div>
                  {goals.map(m=>{
                    const e=weeklyEntries[m.id]||0;
                    const p=e>0?Math.round((e/m.target)*100):0;
                    return(
                      <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:18}}>{m.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:600}}>{m.label}</div>
                          <div style={{fontSize:12,color:"var(--muted)"}}>Target: {m.target} {m.freq.toLowerCase()}</div>
                        </div>
                        <input style={{width:80,padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:10,fontSize:15,fontWeight:700,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}
                          type="number" min="0" value={weeklyEntries[m.id]||""} placeholder="0"
                          onChange={ev=>setWeeklyEntries(prev=>({...prev,[m.id]:+ev.target.value}))}/>
                        {e>0&&<div style={{width:44,textAlign:"right",fontSize:13,fontWeight:700,color:p>=100?"var(--green)":p>=75?"var(--carrot)":"var(--red)"}}>{p}%</div>}
                      </div>
                    );
                  })}
                  <div style={{marginTop:14,display:"flex",gap:10}}>
                    <label style={{flex:1}}>
                      <input type="file" accept=".csv" style={{display:"none"}} onChange={ev=>{if(ev.target.files[0])setCsvDone(true);}}/>
                      <div style={{border:"2px dashed var(--border)",borderRadius:12,padding:12,textAlign:"center",cursor:"pointer",fontSize:13,color:"var(--muted)"}}>
                        {csvDone?"✅ CSV uploaded — numbers extracted":"📁 Upload CRM CSV instead"}
                      </div>
                    </label>
                    {crmUrl&&<a href={crmUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",background:"var(--blue-light)",color:"var(--blue)",borderRadius:10,fontSize:13,fontWeight:600,textDecoration:"none",border:"1px solid #BFDBFE"}}>🔗 CRM Report</a>}
                    <button className="btn btn-p btn-sm" onClick={()=>setShowUpdate(false)}>Save</button>
                  </div>
                </div>
              )}

              {goals.map((m,mi)=>{
                const entry=weeklyEntries[m.id]||0;
                const pct=entry>0?Math.min(Math.round((entry/m.target)*100),150):0;
                const has=entry>0;
                const status=pct>=110?"exceeded":pct>=90?"met":has?"behind":null;
                const fake=[m.target*0.7,m.target*0.9,m.target*1.1,m.target*0.8,entry||m.target*0.95].map(v=>Math.round(v));
                const maxH=Math.max(...fake,1);
                const msg=status==="exceeded"
                  ?`🎉 Incredible! You hit ${pct}% of your ${m.label.toLowerCase()} goal. Keep this momentum — you're ahead of pace.`
                  :status==="met"
                  ?`✅ Solid week on ${m.label.toLowerCase()}. You're right on track. Push a little harder next week to build a buffer.`
                  :status==="behind"
                  ?`📈 You hit ${pct}% of your ${m.label.toLowerCase()} goal. Aim for ${Math.ceil(m.target*(2-pct/100))} next week to stay on pace.`
                  :null;
                return(
                  <div className="mp-card" key={m.id}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <span style={{fontSize:20}}>{m.emoji}</span>
                      <span style={{flex:1,fontSize:15,fontWeight:700}}>{m.label}</span>
                      {status&&<div className={`mp-status ${status==="exceeded"?"st-ex":status==="met"?"st-met":"st-beh"}`}>
                        {status==="exceeded"?"🎉 Exceeded":status==="met"?"✅ On Track":"📈 Behind"}
                      </div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <div style={{flex:1,height:10,background:"var(--border)",borderRadius:5,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:pct>=100?"var(--green)":pct>=75?"var(--carrot)":"var(--red)",borderRadius:5,transition:"width 0.8s ease"}}/>
                      </div>
                      <div style={{fontSize:14,fontWeight:700,minWidth:44,textAlign:"right",color:pct>=100?"var(--green)":pct>=75?"var(--carrot)":"var(--red)"}}>{has?pct+"%":"—"}</div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--muted)",marginBottom:14}}>
                      <span>{has?entry:"—"} completed</span><span>Target: {m.target} {m.freq.toLowerCase()}</span>
                    </div>
                    <div className="slabel" style={{marginBottom:6}}>5-Week Trend</div>
                    <div style={{display:"flex",gap:4,alignItems:"flex-end",height:48,marginBottom:4}}>
                      {fake.map((v,wi)=>(
                        <div key={wi} style={{flex:1,borderRadius:"3px 3px 0 0",minHeight:4,height:`${Math.round((v/maxH)*44)+4}px`,background:v>=m.target?"var(--green)":v>=m.target*0.75?"var(--carrot)":"var(--red-light)",opacity:0.5+wi*0.12}}/>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:4,fontSize:10,color:"var(--muted)"}}>
                      {["4 wks ago","3 wks ago","2 wks ago","Last wk","This wk"].map((l,i)=>(
                        <div key={i} style={{flex:1,textAlign:"center"}}>{l}</div>
                      ))}
                    </div>
                    {msg&&<div className={`coach-msg ${status==="exceeded"?"cm-ex":status==="met"?"cm-met":"cm-beh"}`}>{msg}</div>}
                    {!has&&<div style={{marginTop:10,fontSize:13,color:"var(--muted)",fontStyle:"italic",textAlign:"center"}}>No data yet — tap "Update Numbers" above to log this week</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* CRM section */}
          <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:20,padding:22}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>📊 Quota Attainment</div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>Upload your CRM report to track where you are vs. plan.</div>
            {crmUrl
              ?<a href={crmUrl} target="_blank" rel="noreferrer" className="btn btn-p btn-sm" style={{marginBottom:10,display:"inline-flex",textDecoration:"none"}}>🔗 Open My CRM Report →</a>
              :<button className="btn btn-s btn-sm" onClick={()=>{setGoalsStep(2);go("goals");}}>+ Add CRM Report URL</button>}
            <div style={{marginTop:12,padding:"12px 16px",background:"var(--cream)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>
              Target: <strong>{targetPct}% of plan</strong> · {fmt(calcNet(calcGross(targetPct)))} take-home · Update {updateFreq}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
