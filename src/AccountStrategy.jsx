import React, { useEffect, useRef, useState } from "react";

// Account Prioritization, increment 2: the Coach interview. A short stepped flow that
// captures ICP, metrics, weights, and close rate. At every step Coach has already read
// the rep's real accounts and PROPOSES with its reasoning visible; the rep reacts and
// owns the final call. This does NOT build the scoring table, select/work modes, or the
// backward-math screen. It ends when the four answers are captured, persisted, and
// Coach confirms back.

const STEPS = ["icp", "metrics", "weights", "close_rate", "done"];
const STEP_LABELS = ["Sweet spot", "Metrics", "Weights", "Close rate", "Confirm"];
const WEIGHT_VALUE = { high: 3, medium: 2, low: 1 };
const uid = () => "m_" + Math.random().toString(36).slice(2, 10);

export default function AccountStrategy({ authHeaders, onBack }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState({ icp_text: "", metrics: [], close_rate: null });
  const [proposals, setProposals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // editable drafts
  const [icpDraft, setIcpDraft] = useState("");
  const [metricItems, setMetricItems] = useState([]); // {id,name,source,column,coach_reasoning,kept,weight}
  const [customName, setCustomName] = useState("");
  const [closeDraft, setCloseDraft] = useState(null); // {mode, overall, by_size:[{label,rate}]}
  const seededRef = useRef(false);

  const step = STEPS[stepIdx];

  const headersJson = async () => ({ "Content-Type": "application/json", ...((await authHeaders?.()) || {}) });

  // Prefill from a saved strategy on first mount, so the interview is revisitable.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/get-account-strategy", { headers: (await authHeaders?.()) || {} });
        const d = await r.json().catch(() => null);
        if (d && d.ok && d.strategy) {
          const s = d.strategy;
          setState({ icp_text: s.icp_text || "", metrics: s.metrics || [], close_rate: s.close_rate || null });
          if (s.icp_text) setIcpDraft(s.icp_text);
          if (Array.isArray(s.metrics) && s.metrics.length) setMetricItems(s.metrics.map((m) => ({ ...m, kept: true, coach_reasoning: m.coach_reasoning || "", weight: m.weight || "medium" })));
          if (s.close_rate) setCloseDraft(s.close_rate);
        }
      } catch (e) { /* first run, nothing saved */ }
      seededRef.current = true;
    })();
  }, []);

  const askCoach = async (which, st) => {
    const r = await fetch("/api/coach-interview", { method: "POST", headers: await headersJson(), body: JSON.stringify({ step: which, state: st }) });
    const d = await r.json().catch(() => null);
    if (!d || !d.ok) throw new Error((d && d.error) || "Coach could not put together a proposal just now.");
    return d.proposal;
  };

  // Load the proposal for the current step when we first land on it.
  useEffect(() => {
    if (step === "done") return;
    if (proposals[step]) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await askCoach(step, state);
        if (!alive) return;
        setProposals((prev) => ({ ...prev, [step]: p }));
        if (step === "icp" && !icpDraft) setIcpDraft(p.draft_icp || "");
        if (step === "metrics" && metricItems.length === 0) {
          setMetricItems((p.metrics || []).map((m) => ({ id: uid(), name: m.name, source: m.source || "column", column: m.column || null, coach_reasoning: m.reasoning || "", kept: true, weight: "medium" })));
        }
        if (step === "weights") {
          const byName = new Map((p.weights || []).map((w) => [w.name, w]));
          setMetricItems((items) => items.map((it) => (byName.has(it.name) ? { ...it, weight: byName.get(it.name).weight || "medium", coach_weight_reasoning: byName.get(it.name).reasoning || "" } : it)));
        }
        if (step === "close_rate" && !closeDraft) {
          const pr = p.proposed || {};
          setCloseDraft({ mode: pr.mode || "overall", overall: pr.overall != null ? pr.overall : null, by_size: Array.isArray(pr.by_size) ? pr.by_size : [] });
        }
      } catch (e) {
        if (alive) setError(String(e && e.message ? e.message : e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [step, proposals]);

  const chosen = metricItems.filter((m) => m.kept);
  const overCap = chosen.length > 25;

  const addCustom = () => {
    const name = customName.trim();
    if (!name || chosen.length >= 25) return;
    setMetricItems((items) => [...items, { id: uid(), name, source: "custom", column: null, coach_reasoning: "", kept: true, weight: "medium" }]);
    setCustomName("");
  };

  const advance = () => {
    setError("");
    if (step === "icp") {
      const next = { ...state, icp_text: icpDraft.trim() };
      setState(next);
      setProposals((p) => ({ ...p, metrics: undefined, weights: undefined })); // ICP changed, re-propose downstream
      setStepIdx(1);
    } else if (step === "metrics") {
      const metrics = chosen.map((m) => ({ id: m.id, name: m.name, source: m.source, column: m.column, coach_reasoning: m.coach_reasoning, weight: m.weight || "medium" }));
      setState((s) => ({ ...s, metrics }));
      setProposals((p) => ({ ...p, weights: undefined }));
      setStepIdx(2);
    } else if (step === "weights") {
      const metrics = chosen.map((m) => ({ id: m.id, name: m.name, source: m.source, column: m.column, coach_reasoning: m.coach_reasoning, weight: m.weight || "medium", weight_value: WEIGHT_VALUE[m.weight || "medium"] }));
      setState((s) => ({ ...s, metrics }));
      setStepIdx(3);
    } else if (step === "close_rate") {
      finish();
    }
  };

  const back = () => { setError(""); if (stepIdx > 0) setStepIdx((i) => i - 1); };

  const finish = async () => {
    const account_strategy = {
      version: 1,
      icp_text: icpDraft.trim() || state.icp_text,
      close_rate: closeDraft,
      metrics: chosen.map((m) => ({ id: m.id, name: m.name, source: m.source, column: m.column, weight: m.weight || "medium", weight_value: WEIGHT_VALUE[m.weight || "medium"], coach_reasoning: m.coach_reasoning || "" })),
    };
    setState((s) => ({ ...s, ...account_strategy }));
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/save-account-strategy", { method: "POST", headers: await headersJson(), body: JSON.stringify({ account_strategy }) });
      const d = await r.json().catch(() => null);
      if (!d || !d.ok) throw new Error((d && d.error) || "That did not save. Give it another try.");
      setStepIdx(4);
    } catch (e) {
      setError(String(e && e.message ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  // ── styles ──
  const card = { background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20 };
  const coachCard = { background: "#FBF6EF", border: "1px solid #EFE3D2", borderRadius: 14, padding: "16px 18px" };
  const label = { fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--carrot-dark)", fontWeight: 700 };
  const primaryBtn = { background: "var(--carrot)", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15, padding: "11px 22px", borderRadius: 12, border: "none", cursor: "pointer" };
  const ghostBtn = { background: "none", color: "var(--muted)", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--border)", cursor: "pointer" };

  const CoachSays = ({ children }) => (
    <div style={coachCard}>
      <div style={{ ...label, color: "var(--carrot-dark)", marginBottom: 8 }}>Coach</div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, lineHeight: 1.55, color: "var(--ink)" }}>{children}</div>
    </div>
  );

  const Spinner = ({ text }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--carrot-dark)", padding: "24px 4px" }}>
      <span style={{ width: 20, height: 20, border: "2.5px solid var(--carrot-light)", borderTopColor: "var(--carrot)", borderRadius: "50%", display: "inline-block", animation: "ai-spin .7s linear infinite" }} />
      {text}
    </div>
  );

  const p = proposals[step];

  return (
    <div style={{ paddingBottom: 80, maxWidth: 760 }}>
      <style>{`@keyframes ai-spin{to{transform:rotate(360deg)}}`}</style>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 8 }}>‹ Back to accounts</button>
      )}
      <div style={label}>Account Strategies</div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 900, lineHeight: 1.1, margin: "6px 0 14px", color: "var(--ink)" }}>Let us prioritize together</h1>

      {/* progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STEP_LABELS.map((l, i) => (
          <div key={l} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, fontWeight: 700, padding: "5px 11px", borderRadius: 100, background: i === stepIdx ? "var(--carrot)" : i < stepIdx ? "var(--carrot-light)" : "var(--cream)", color: i === stepIdx ? "white" : i < stepIdx ? "var(--carrot-dark)" : "var(--muted)", border: "1px solid " + (i <= stepIdx ? "transparent" : "var(--border)") }}>{l}</div>
        ))}
      </div>

      {error && <div style={{ ...card, borderColor: "#E7B7AE", background: "#FBF1EF", color: "#9A3B2C", fontFamily: "'DM Sans',sans-serif", fontSize: 14, marginBottom: 14 }}>{error}</div>}

      {loading && !p && step !== "done" && <Spinner text="Coach is reading your accounts." />}

      {/* ── STEP 1: ICP ── */}
      {step === "icp" && p && (
        <div style={{ display: "grid", gap: 16 }}>
          <CoachSays>
            <p style={{ margin: "0 0 8px" }}>{p.observation}</p>
            <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>{p.reasoning}</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{p.question}</p>
          </CoachSays>
          <div style={card}>
            <div style={{ ...label, color: "var(--muted)", marginBottom: 8 }}>Your sweet spot (edit freely)</div>
            <textarea value={icpDraft} onChange={(e) => setIcpDraft(e.target.value)} rows={3} style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, lineHeight: 1.5, color: "var(--ink)", resize: "vertical" }} />
          </div>
        </div>
      )}

      {/* ── STEP 2: METRICS ── */}
      {step === "metrics" && p && (
        <div style={{ display: "grid", gap: 16 }}>
          <CoachSays>{p.note}</CoachSays>
          <div style={{ display: "grid", gap: 10 }}>
            {metricItems.map((m) => (
              <div key={m.id} style={{ ...card, padding: "13px 16px", opacity: m.kept ? 1 : 0.55, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <input type="checkbox" checked={m.kept} onChange={(e) => setMetricItems((items) => items.map((x) => (x.id === m.id ? { ...x, kept: e.target.checked } : x)))} style={{ marginTop: 4, width: 18, height: 18, accentColor: "var(--carrot)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{m.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: m.source === "custom" ? "var(--muted)" : "var(--carrot-dark)", background: m.source === "custom" ? "var(--border)" : "var(--carrot-light)", borderRadius: 100, padding: "2px 8px" }}>{m.source === "coach_suggested" ? "Coach idea" : m.source === "custom" ? "Yours" : "From your file"}</span>
                  </div>
                  {m.coach_reasoning && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{m.coach_reasoning}</div>}
                </div>
              </div>
            ))}
          </div>

          {Array.isArray(p.skipped) && p.skipped.length > 0 && (
            <div style={{ ...card, background: "var(--cream)" }}>
              <div style={{ ...label, color: "var(--muted)", marginBottom: 8 }}>I left these out</div>
              {p.skipped.map((s, i) => (
                <div key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 3 }}><b style={{ color: "var(--ink)" }}>{s.column}</b>, {s.reason}</div>
              ))}
            </div>
          )}

          <div style={{ ...card, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="Add your own metric" style={{ flex: 1, minWidth: 180, border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 11px", fontFamily: "'DM Sans',sans-serif", fontSize: 14.5, color: "var(--ink)" }} />
            <button type="button" onClick={addCustom} disabled={!customName.trim() || chosen.length >= 25} style={{ ...ghostBtn, opacity: !customName.trim() || chosen.length >= 25 ? 0.5 : 1 }}>Add</button>
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: overCap ? "#9A3B2C" : "var(--muted)" }}>
            {chosen.length} chosen. Most reps land around 10, and you can go up to 25.{overCap ? " Trim a few to continue." : ""}
          </div>
        </div>
      )}

      {/* ── STEP 3: WEIGHTS ── */}
      {step === "weights" && p && (
        <div style={{ display: "grid", gap: 16 }}>
          <CoachSays>{p.note}</CoachSays>
          <div style={{ display: "grid", gap: 10 }}>
            {chosen.map((m) => (
              <div key={m.id} style={{ ...card, padding: "13px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{m.name}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["high", "medium", "low"].map((w) => (
                      <button key={w} type="button" onClick={() => setMetricItems((items) => items.map((x) => (x.id === m.id ? { ...x, weight: w } : x)))} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 800, textTransform: "capitalize", padding: "6px 13px", borderRadius: 100, border: "1.5px solid " + (m.weight === w ? "transparent" : "var(--border)"), background: m.weight === w ? "var(--carrot)" : "white", color: m.weight === w ? "white" : "var(--muted)", cursor: "pointer" }}>{w}</button>
                    ))}
                  </div>
                </div>
                {m.coach_weight_reasoning && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>{m.coach_weight_reasoning}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 4: CLOSE RATE ── */}
      {step === "close_rate" && p && closeDraft && (
        <div style={{ display: "grid", gap: 16 }}>
          <CoachSays>
            <p style={{ margin: "0 0 8px" }}>{p.anchor}</p>
            <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>{p.reasoning}</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{p.question}</p>
          </CoachSays>
          <div style={card}>
            {closeDraft.mode === "by_size" && Array.isArray(closeDraft.by_size) && closeDraft.by_size.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {closeDraft.by_size.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{b.label}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input type="number" value={b.rate ?? ""} onChange={(e) => setCloseDraft((c) => ({ ...c, by_size: c.by_size.map((x, j) => (j === i ? { ...x, rate: e.target.value === "" ? null : Number(e.target.value) } : x)) }))} style={{ width: 72, border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 11px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", textAlign: "right" }} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: "var(--muted)" }}>percent</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Overall close rate</span>
                <input type="number" value={closeDraft.overall ?? ""} onChange={(e) => setCloseDraft((c) => ({ ...c, mode: "overall", overall: e.target.value === "" ? null : Number(e.target.value) }))} style={{ width: 84, border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 11px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", textAlign: "right" }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: "var(--muted)" }}>percent</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === "done" && (
        <div style={{ display: "grid", gap: 16 }}>
          <CoachSays>
            <p style={{ margin: "0 0 10px" }}>Great. Here is what I have for you, and it is all yours to change whenever you want.</p>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14.5, color: "var(--ink)", lineHeight: 1.6 }}>
              <div><b>Your sweet spot:</b> {state.icp_text}</div>
              <div style={{ marginTop: 8 }}><b>Your metrics ({(state.metrics || []).length}):</b></div>
              <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {(state.metrics || []).map((m) => (<li key={m.id} style={{ marginBottom: 2 }}>{m.name} <span style={{ color: "var(--muted)" }}>({m.weight} weight)</span></li>))}
              </ul>
              <div style={{ marginTop: 8 }}><b>Close rate:</b> {closeDraft && closeDraft.mode === "by_size" && closeDraft.by_size?.length ? closeDraft.by_size.map((b) => `${b.label} ${b.rate} percent`).join(", ") : closeDraft ? `${closeDraft.overall} percent overall` : "not set"}</div>
            </div>
            <p style={{ margin: "12px 0 0", fontWeight: 700 }}>Next we will score your accounts against these, but that is a separate step. You are set for now.</p>
          </CoachSays>
          <div><button style={primaryBtn} onClick={onBack}>Done for now</button></div>
        </div>
      )}

      {/* nav */}
      {step !== "done" && p && !loading && (
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {stepIdx > 0 && <button style={ghostBtn} onClick={back}>Back</button>}
          <button style={{ ...primaryBtn, opacity: (step === "metrics" && (overCap || chosen.length === 0)) || (step === "icp" && !icpDraft.trim()) ? 0.5 : 1 }} disabled={(step === "metrics" && (overCap || chosen.length === 0)) || (step === "icp" && !icpDraft.trim())} onClick={advance}>
            {step === "close_rate" ? "Save my strategy" : "Looks right, next"}
          </button>
        </div>
      )}
    </div>
  );
}
