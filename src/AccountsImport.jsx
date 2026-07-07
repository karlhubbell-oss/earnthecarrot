import React, { useEffect, useRef, useState } from "react";

// Account Prioritization, increment 1: the minimal "did the data land" view. Upload a
// CSV or Excel export, then see the imported accounts as a plain read-only table with
// their detected columns. No scoring, no sorting, no ICP, no frozen columns yet. That
// is the next increment. This screen only proves the import and the data layer work.

// Read a file as base64, stripping the data URL prefix. Same approach the app uses to
// hand a file to the server.
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || "");
      const c = r.indexOf(",");
      resolve(c >= 0 ? r.slice(c + 1) : r);
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });

// Non-money grouping for numeric field values. This is a debug view over arbitrary
// columns (revenue, employee counts, years), so we group digits without asserting a
// currency. Real money formatting lands where a column is known to be money.
const group = (n) => (n == null ? "" : Number(n).toLocaleString());

export default function AccountsImport({ authHeaders, onBack }) {
  const [accounts, setAccounts] = useState([]);
  const [columns, setColumns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const loadList = async () => {
    try {
      const headers = (await authHeaders?.()) || {};
      const r = await fetch("/api/list-accounts", { headers });
      const d = await r.json().catch(() => null);
      if (d && d.ok) {
        setAccounts(d.accounts || []);
        setColumns(d.columns || []);
      }
    } catch (e) {
      /* leave the current view; the upload path surfaces its own errors */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setSummary(null);
    try {
      const fileBase64 = await fileToBase64(file);
      const headers = { "Content-Type": "application/json", ...((await authHeaders?.()) || {}) };
      const r = await fetch("/api/import-accounts", {
        method: "POST",
        headers,
        body: JSON.stringify({ fileBase64, filename: file.name }),
      });
      const d = await r.json().catch(() => null);
      if (!d || !d.ok) {
        setError((d && d.error) || "That import did not go through. Give it another try.");
      } else {
        setSummary(d);
        await loadList();
      }
    } catch (err) {
      setError(String(err && err.message ? err.message : err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const card = { background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20 };
  const th = { textAlign: "left", padding: "9px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1.5px solid var(--border)", whiteSpace: "nowrap" };
  const td = { padding: "9px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--ink)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };

  return (
    <div style={{ paddingBottom: 60 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--carrot)", fontWeight: 700, fontSize: 18, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 8 }}>
          ‹ Back
        </button>
      )}

      <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--carrot-dark)", fontWeight: 700 }}>Account Strategies</div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 900, lineHeight: 1.1, margin: "6px 0 0", color: "var(--ink)" }}>Bring in your accounts</h1>
      <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8, lineHeight: 1.5, maxWidth: 720 }}>
        Upload your account list, a CSV or Excel export straight from your CRM. I will read it as it is, messy headers and all,
        and store each account so we can build your prioritization on top of it next. Nothing is scored yet. This is just to
        confirm your accounts landed.
      </p>

      <div style={{ ...card, marginTop: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--carrot)", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15, padding: "11px 18px", borderRadius: 12, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Reading your file" : "Choose a CSV or Excel file"}
          <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls,text/csv" onChange={onFile} disabled={busy} style={{ display: "none" }} />
        </label>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "var(--muted)" }}>
          I detect the account name column on my own and keep every other column as is.
        </span>
      </div>

      {error && (
        <div style={{ ...card, marginTop: 14, borderColor: "#E7B7AE", background: "#FBF1EF", color: "#9A3B2C", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>{error}</div>
      )}

      {summary && (
        <div style={{ ...card, marginTop: 14, background: "#F4FBF5", borderColor: "#BFE3C8" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 800, color: "#1F3D2A" }}>
            Brought in {summary.accountsCreated} {summary.accountsCreated === 1 ? "account" : "accounts"}.
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#2D6A4F", marginTop: 6, lineHeight: 1.55 }}>
            Name column: <b>{summary.nameColumn || "none"}</b>{summary.nameColumnGuessed ? " (my best guess, please check it)" : ""}.<br />
            Columns detected: {(summary.columnsDetected || []).join(", ") || "none"}.<br />
            {(summary.rowsSkipped || []).length > 0 && <>Skipped {summary.rowsSkipped.length} {summary.rowsSkipped.length === 1 ? "row" : "rows"}: {summary.rowsSkipped.map((s) => `row ${s.row} (${s.reason})`).join(", ")}.<br /></>}
            {(summary.warnings || []).length > 0 && <>Flagged {summary.warnings.length}: {summary.warnings.map((w) => `row ${w.row} (${w.reason})`).join(", ")}.</>}
          </div>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
          Your accounts {accounts.length > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>({accounts.length})</span>}
        </div>

        {loading ? (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--muted)" }}>Loading your accounts.</div>
        ) : accounts.length === 0 ? (
          <div style={{ ...card, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--muted)" }}>
            No accounts yet. Upload a file above and they will show up here.
          </div>
        ) : (
          <div style={{ ...card, padding: 0, overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={th}>Account</th>
                  <th style={th}>Status</th>
                  {columns.map((c) => <th key={c} style={th}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...td, fontWeight: 700 }}>{a.name || <span style={{ color: "var(--muted)", fontWeight: 600, fontStyle: "italic" }}>unnamed</span>}</td>
                    <td style={td}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase", color: "var(--muted)", background: "var(--border)", borderRadius: 100, padding: "2px 9px" }}>{a.customer_status}</span>
                    </td>
                    {columns.map((c) => {
                      const f = a.fields && a.fields[c];
                      const val = !f ? "" : f.value_numeric != null ? group(f.value_numeric) : (f.value_text || "");
                      return <td key={c} style={{ ...td, color: val ? "var(--ink)" : "var(--muted)" }}>{val}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
