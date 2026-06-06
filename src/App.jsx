import { useState, useEffect } from "react";

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
  font-family:'DM Sans',sans-serif;
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
  font-size:11px;font-weight:700;letter-spacing:2px;
  text-transform:uppercase;color:var(--carrot);margin-bottom:14px;
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
.problem-inner{max-width:760px;margin:0 auto;}
.prob-label{
  font-size:11px;font-weight:700;letter-spacing:2px;
  text-transform:uppercase;color:var(--carrot);margin-bottom:14px;
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

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .lnav{padding:14px 20px;}
  .nav-links{display:none;}
  .hero-title{font-size:38px;}
  .hero-sub{font-size:19px;}
  .sec-title{font-size:30px;}
  .prob-title{font-size:32px;}
  .carrot-grid{grid-template-columns:repeat(2,1fr);}
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

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [scrolled, setScrolled] = useState(false);

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
            <button className="nav-link">How It Works</button>
            <button className="nav-link">Pricing</button>
            <button className="nav-link">Meet Coach</button>
          </div>
          <button className="nav-cta" onClick={() => setScreen("onboarding")}>
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
            We turn your compensation plan into a personalized AI playbook that helps you exceed quota and earn the rewards that matter most to you.
          </p>
          <button className="hero-cta" onClick={() => setScreen("onboarding")}>
            Build My Personal Playbook →
          </button>
          <div className="hero-hint">
            <div>Upload your compensation plan.</div>
            <div>Define your carrots. Get your personal plan in minutes.</div>
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

        {/* THE SALES REP PROBLEM */}
        <section className="problem-section">
          <div className="problem-inner">
            <div className="prob-label">The Problem</div>
            <h2 className="prob-title">The Sales Rep Problem</h2>
            <div className="prob-lines">
              <p className="prob-line">Every year your company hands you a compensation plan.</p>
              <p className="prob-line bold">You spend twenty minutes reading it.</p>
              <p className="prob-line">You attend the kickoff meeting.</p>
              <p className="prob-line">You complain about it with your peers.</p>
              <p className="prob-line bold">Then you go right back to doing what you did last year.</p>
            </div>
            <div className="prob-callout">
              <p className="prob-callout-line">Most reps never fully understand how they get paid.</p>
              <p className="prob-callout-line">Most reps never build a real strategy around their compensation plan.</p>
              <p className="prob-callout-line">Most reps never connect their income goals to the things they actually want.</p>
            </div>
            <div className="prob-bottom">
              <p className="prob-bottom-bold">That is why so many reps miss quota.</p>
              <p className="prob-bottom-muted">Not because they are lazy. Because they are operating without a clear personal plan.</p>
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
          .coach-role-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:24px;}
          .coach-role-emoji{font-size:24px;margin-bottom:10px;}
          .coach-role-title{font-size:16px;font-weight:700;color:white;margin-bottom:6px;}
          .coach-role-desc{font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;}
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

          /* ── RESPONSIVE PART 2 ── */
          @media(max-width:768px){
            .coach-role-grid,.coach-q-grid,.diff-cols,.ladder-grid{grid-template-columns:1fr;}
            .coach-bottom-row{gap:20px;}
          }
          @media(max-width:480px){
            .coach-section,.diff-section,.compare-section,.ladder-section{padding:64px 20px;}
          }
        `}</style>

        {/* MEET COACH */}
        <section className="coach-section">
          <div className="coach-inner">
            <div className="sec-label">Your AI Sales Coach</div>
            <h2 className="sec-title" style={{ color: "white", marginBottom: 20 }}>Meet Coach 🥕</h2>
            <p className="coach-quote">"What do I need to do today to earn the income I want this year?"</p>
            <p className="coach-coachsub">Coach helps you answer that question every single day.</p>
            <div className="coach-role-grid">
              {[
                { emoji: "📊", title: "Compensation Analyst", desc: "Understands every clause, tier, accelerator, and clawback in your plan" },
                { emoji: "🗺️", title: "Sales Strategist", desc: "Builds realistic plans based on your territory, pipeline, and conversion rates" },
                { emoji: "💪", title: "Personal Trainer", desc: "Keeps you accountable to daily activities and focused on what drives results" },
                { emoji: "🏆", title: "Great Sales Leader", desc: "Encourages you when motivation fades and reminds you what you are working toward" },
              ].map((r, i) => (
                <div key={i} className="coach-role-card">
                  <div className="coach-role-emoji">{r.emoji}</div>
                  <div className="coach-role-title">{r.title}</div>
                  <div className="coach-role-desc">{r.desc}</div>
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

        {/* FROM COMPENSATION PLAN TO PERSONAL PLAYBOOK */}
        <section className="steps-section">
          <div className="steps-inner">
            <div className="sec-label">Getting Started</div>
            <h2 className="sec-title">From Compensation Plan to Personal Playbook in Minutes</h2>
            <div className="steps-grid">
              {[
                {
                  num: "01",
                  title: "Upload your compensation plan",
                  desc: "Coach reads every line — tiers, accelerators, clawbacks, and all the fine print. Most reps understand their plan better after 5 minutes with Coach than after a full year.",
                },
                {
                  num: "02",
                  title: "Tell Coach about your territory",
                  desc: "Share your deals, goals, current pipeline, and conversion rates. Coach uses this to build a plan that is realistic for your specific situation.",
                },
                {
                  num: "03",
                  title: "Define your carrots",
                  desc: "What are you actually working toward? The family vacation. The new car. The boat. These become your personal motivation throughout the year.",
                },
                {
                  num: "04",
                  title: "Receive your personalized playbook",
                  desc: "Coach immediately shows you how you get paid, which deals matter most, how many opportunities you need, and what to focus on every single day.",
                  checklist: ["How you get paid", "Your realistic earning potential", "Which deals matter most", "What activities drive results"],
                },
              ].map((step, i) => (
                <div key={i} className="step-card">
                  <div className="step-num">Step {step.num}</div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                  {step.checklist && (
                    <div className="step-checklist">
                      {step.checklist.map((item, j) => (
                        <div key={j} className="step-check-item">
                          <span className="step-check-icon">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="steps-note">Most reps are fully set up in less than 5 minutes.</p>
            <div style={{ textAlign: "center" }}>
              <button className="steps-cta-btn" onClick={() => setScreen("onboarding")}>
                Build My Personal Playbook →
              </button>
            </div>
          </div>
        </section>

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

        {/* PRICING */}
        <section className="pricing-section">
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
                  emoji: "⏱️",
                  title: "Time Saved",
                  desc: "We instantly break down your full compensation plan in plain English, highlight what really matters, and show you exactly where to focus to make more money. No more guessing or waiting for the team call.",
                },
                {
                  emoji: "🎯",
                  title: "Better Motivation",
                  desc: "Instead of generic manager targets, Earn The Carrot works with you to understand the plan and build realistic actions that actually help you reach your target and stretch goals.",
                },
                {
                  emoji: "💰",
                  title: "Increased Earnings",
                  desc: "Industry studies show that less than half of sales reps hit quota in any given year. At some companies that number is even lower. Reps who use a clear personalized plan close 1 to 2 extra deals per year on average.",
                },
              ].map((card, i) => (
                <div key={i} className="roi-card">
                  <div className="roi-card-emoji">{card.emoji}</div>
                  <div className="roi-card-title">{card.title}</div>
                  <div className="roi-card-desc">{card.desc}</div>
                </div>
              ))}
            </div>
            <div className="roi-box">
              If Coach helps you close just one additional deal this year, the investment pays for itself many times over. For the price of one good client lunch per month, you get a complete personal operating system for sales success.
            </div>
          </div>
        </section>

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
            <button className="closing-cta" onClick={() => setScreen("onboarding")}>
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

  return (
    <>
      <style>{S}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--dark)",
        }}
      >
        <button
          onClick={() => setScreen("landing")}
          style={{
            color: "white",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Back to home
        </button>
      </div>
    </>
  );
}

const MANAGER_EMAIL_BODY = `Hi [Manager Name],

I found a sales productivity tool called Earn The Carrot that I believe will help me perform at a higher level this year.

The platform analyzes my compensation plan, helps me understand my earning potential, builds a personalized action plan, and keeps me focused on the activities that drive results.

The annual cost is $99 and qualifies as a sales productivity and performance tool. If approved, I will submit the expense through our normal reimbursement process. The invoice clearly describes the tool as an AI powered sales planning and productivity solution.

Thank you,
[Your Name]`;

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
