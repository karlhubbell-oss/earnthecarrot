// Turn a rep's imported accounts into a compact, model-ready summary. Coach reads
// this to propose an ICP, a metric set, weights, and a close-rate anchor. Pure and
// deterministic, so the endpoint and the tests build the exact same picture. It does
// the reading and the counting; the model does the judgement.

// Shape raw DB rows (accounts + account_fields) into per-account objects with a
// { field_name -> {value_text, value_numeric} } map. Same grouping the list view uses.
export function shapeAccounts(accountRows, fieldRows) {
  const byId = new Map();
  for (const a of accountRows) byId.set(a.id, { id: a.id, name: a.name, customer_status: a.customer_status, fields: {} });
  const columns = [];
  for (const f of fieldRows) {
    const acct = byId.get(f.account_id);
    if (!acct) continue;
    if (!columns.includes(f.field_name)) columns.push(f.field_name);
    acct.fields[f.field_name] = { value_text: f.value_text, value_numeric: f.value_numeric };
  }
  return { accounts: [...byId.values()], columns };
}

const median = (nums) => {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Summarize one column across a set of accounts: numeric range or top text values.
function summarizeColumn(accounts, col) {
  const nums = [];
  const texts = [];
  for (const a of accounts) {
    const f = a.fields[col];
    if (!f) continue;
    if (f.value_numeric != null) nums.push(Number(f.value_numeric));
    else if (f.value_text != null && String(f.value_text).trim() !== "") texts.push(String(f.value_text).trim());
  }
  const coverage = nums.length + texts.length;
  const isNumeric = nums.length >= texts.length && nums.length > 0;
  if (isNumeric) {
    return { column: col, type: "numeric", coverage, min: Math.min(...nums), max: Math.max(...nums), median: median(nums) };
  }
  const counts = new Map();
  for (const t of texts) counts.set(t, (counts.get(t) || 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value, count]) => ({ value, count }));
  return { column: col, type: "text", coverage, distinct: counts.size, top };
}

// The full picture handed to Coach. Overall counts, per-column shape, and the same
// shape computed over CUSTOMERS only (the strongest ICP signal), plus a small raw
// sample so the model can see real rows, not just aggregates.
export function summarizeAccounts(shaped) {
  const { accounts, columns } = shaped;
  const customers = accounts.filter((a) => a.customer_status === "customer");
  const prospects = accounts.filter((a) => a.customer_status !== "customer");

  const perColumn = columns.map((c) => summarizeColumn(accounts, c));
  const customerProfile = columns.map((c) => summarizeColumn(customers, c)).filter((s) => s.coverage > 0);

  const sample = (arr, n) => arr.slice(0, n).map((a) => {
    const row = { name: a.name, customer_status: a.customer_status };
    for (const c of columns) {
      const f = a.fields[c];
      if (f) row[c] = f.value_numeric != null ? f.value_numeric : f.value_text;
    }
    return row;
  });

  return {
    counts: { total: accounts.length, customers: customers.length, prospects: prospects.length },
    columns,
    per_column: perColumn,
    customer_profile: customerProfile,
    sample_customers: sample(customers, 6),
    sample_prospects: sample(prospects, 4),
  };
}

// A compact read of the rep's deal list (deal_plan v5..v7), used only for the close
// rate step so Coach can anchor per deal size when sizes exist. Best-effort: any shape
// it does not recognize yields null and Coach anchors on an overall rate instead.
export function summarizeDealSizes(dealPlan) {
  if (!dealPlan || typeof dealPlan !== "object") return null;
  const comps = Array.isArray(dealPlan.components) ? dealPlan.components : [];
  const values = [];
  for (const c of comps) {
    const deals = Array.isArray(c.deals) ? c.deals : Array.isArray(c.sizes) ? c.sizes : [];
    for (const d of deals) {
      const v = Number(d.value != null ? d.value : d.size);
      if (Number.isFinite(v) && v > 0) values.push(v);
    }
  }
  if (!values.length) return null;
  values.sort((a, b) => b - a);
  return { deal_count: values.length, values, biggest: values[0], smallest: values[values.length - 1] };
}
