import zlib from "node:zlib";

// Account import parsing. Pure, dependency-free (Node zlib only, for the xlsx zip),
// so the same functions run in the serverless endpoint and in tests. Turns a messy
// CSV or Excel export into a clean list of accounts plus their columns as append-only
// field facts. It imports what it can and reports what it skipped; it never throws on
// a weird file, it degrades.

// ── delimited text (CSV / TSV) ─────────────────────────────────────────────
// RFC4180-ish: quoted fields may hold the delimiter, newlines, and "" escapes.
// Delimiter auto-detected from the first line (comma vs tab vs semicolon).
export function parseDelimited(text) {
  let s = String(text == null ? "" : text);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1); // strip BOM
  const firstLine = s.slice(0, s.indexOf("\n") >= 0 ? s.indexOf("\n") : s.length);
  const counts = { ",": (firstLine.match(/,/g) || []).length, "\t": (firstLine.match(/\t/g) || []).length, ";": (firstLine.match(/;/g) || []).length };
  const delimiter = counts["\t"] > counts[","] && counts["\t"] >= counts[";"] ? "\t" : counts[";"] > counts[","] ? ";" : ",";

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const n = s.length;
  for (let i = 0; i < n; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\r") { /* ignore, handled by \n */ }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

// ── xlsx (a zip of xml) via Node zlib, no external library ──────────────────
const XML_ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
function decodeXml(s) {
  return String(s == null ? "" : s).replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => XML_ENT[m]);
}

// Read a zip central directory and return { name -> Buffer } for the entries we ask
// for. Handles stored (method 0) and deflate (method 8), the only two xlsx uses.
function unzipEntries(buf, wanted) {
  const out = {};
  // End of central directory record: signature 0x06054b50, scanned from the tail.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a valid xlsx (no zip end-of-directory record)");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16); // central directory offset
  for (let e = 0; e < count && p + 46 <= buf.length; e++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!wanted(name)) continue;
    // Local header: name/extra lengths can differ from the central copy, so re-read.
    if (buf.readUInt32LE(localOff) !== 0x04034b50) continue;
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    out[name] = method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
  }
  return out;
}

// Column ref letters ("AB12") -> zero-based column index.
function colIndex(ref) {
  const m = /^([A-Z]+)/.exec(ref || "");
  if (!m) return 0;
  let n = 0;
  for (const c of m[1]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

export function parseXlsxBuffer(buf) {
  const files = unzipEntries(buf, (name) => name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  // shared strings table
  const shared = [];
  if (files["xl/sharedStrings.xml"]) {
    const xml = files["xl/sharedStrings.xml"].toString("utf8");
    for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) || []) {
      const parts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
      shared.push(parts.map((t) => decodeXml(t.replace(/<t[^>]*>/, "").replace(/<\/t>/, ""))).join(""));
    }
  }
  // first worksheet by name order
  const sheetName = Object.keys(files).filter((k) => k.startsWith("xl/worksheets/")).sort()[0];
  if (!sheetName) throw new Error("xlsx has no worksheet");
  const sheet = files[sheetName].toString("utf8");
  const rows = [];
  for (const rowXml of sheet.match(/<row[^>]*>[\s\S]*?<\/row>/g) || []) {
    const cells = [];
    for (const cm of rowXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = (/r="([A-Z]+\d+)"/.exec(cm) || [])[1] || "";
      const type = (/t="([^"]+)"/.exec(cm) || [])[1] || "";
      let val = "";
      if (type === "inlineStr") {
        val = decodeXml((/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(cm) || [])[1] || "");
      } else {
        const v = (/<v>([\s\S]*?)<\/v>/.exec(cm) || [])[1];
        if (v != null) val = type === "s" ? (shared[Number(v)] || "") : decodeXml(v);
      }
      const idx = colIndex(ref);
      cells[idx] = val;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] == null) cells[i] = "";
    rows.push(cells);
  }
  return rows;
}

// ── numeric detection ───────────────────────────────────────────────────────
// A cell is numeric only when it is money/count-shaped: optional $, thousands
// commas, one decimal, optional (parenthesized) negative. Percentages, phone
// numbers, ids with dashes, and anything with letters stay as text, so nothing
// meaningful is silently coerced.
export function parseNumber(raw) {
  if (raw == null) return null;
  let t = String(raw).trim();
  if (!t) return null;
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1).trim(); }
  t = t.replace(/^[$£€]\s?/, "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const num = Number(t);
  if (!Number.isFinite(num)) return null;
  return neg ? -num : num;
}

// ── name-column detection ───────────────────────────────────────────────────
const NAME_HEADERS = ["account name", "account", "company name", "company", "customer name", "customer", "organization", "organisation", "org", "name"];
function detectNameColumn(headers, dataRows) {
  const lower = headers.map((h) => String(h || "").trim().toLowerCase());
  for (const want of NAME_HEADERS) {
    const idx = lower.indexOf(want);
    if (idx >= 0) return { index: idx, guessed: false };
  }
  // Fall back to the first column that is mostly non-numeric text, and flag it.
  let best = -1, bestScore = -1;
  for (let c = 0; c < headers.length; c++) {
    let textCount = 0, total = 0;
    for (const r of dataRows) {
      const cell = (r[c] || "").trim();
      if (!cell) continue;
      total++;
      if (parseNumber(cell) == null) textCount++;
    }
    const score = total ? textCount / total : 0;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return { index: best < 0 ? 0 : best, guessed: true };
}

// ── the assembler ───────────────────────────────────────────────────────────
// rows2d: array of rows (arrays of cells), first non-empty row is the header.
// Returns accounts (name + append-only field facts), the detected columns, and a
// full accounting of what was skipped or flagged, so the caller can report it.
export function buildImport(rows2d) {
  const isBlankRow = (r) => !r || r.every((c) => String(c == null ? "" : c).trim() === "");
  // header = first non-blank row
  let headerIdx = rows2d.findIndex((r) => !isBlankRow(r));
  if (headerIdx < 0) return { accounts: [], columns: [], nameColumn: null, nameColumnGuessed: false, skipped: [{ row: 0, reason: "file has no rows" }], warnings: [] };

  const rawHeaders = rows2d[headerIdx].map((h) => String(h == null ? "" : h).trim());
  // Give blank headers a stable label so their data is still captured as a column.
  const headers = rawHeaders.map((h, i) => (h ? h : `Column ${i + 1}`));
  const dataRows = rows2d.slice(headerIdx + 1);

  const { index: nameIdx, guessed } = detectNameColumn(headers, dataRows.filter((r) => !isBlankRow(r)));

  const accounts = [];
  const skipped = [];
  const warnings = [];
  const columnsSeen = new Set();

  dataRows.forEach((r, i) => {
    const sheetRow = headerIdx + 1 + i + 1; // 1-based row number in the original file
    if (isBlankRow(r)) { skipped.push({ row: sheetRow, reason: "blank row" }); return; }

    const name = String(r[nameIdx] == null ? "" : r[nameIdx]).trim();
    const fields = [];
    for (let c = 0; c < headers.length; c++) {
      const cell = String(r[c] == null ? "" : r[c]).trim();
      if (!cell) continue; // append-only: do not store empty facts
      columnsSeen.add(headers[c]);
      const num = parseNumber(cell);
      if (num != null) fields.push({ field_name: headers[c], value_text: null, value_numeric: num });
      else fields.push({ field_name: headers[c], value_text: cell, value_numeric: null });
    }

    if (!name) warnings.push({ row: sheetRow, reason: "no account name found, imported without a name" });
    accounts.push({ name: name || null, fields });
  });

  // Report columns in file order, not just seen order.
  const columns = headers.filter((h) => columnsSeen.has(h));
  return { accounts, columns, nameColumn: headers[nameIdx], nameColumnGuessed: guessed, skipped, warnings };
}

// Entry point for the endpoint: bytes + a filename/type hint -> buildImport result.
export function parseAccountFile(buffer, filename) {
  const isZip = buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  const looksXlsx = isZip || /\.xlsx?$/i.test(String(filename || ""));
  const rows2d = looksXlsx ? parseXlsxBuffer(buffer) : parseDelimited(buffer.toString("utf8"));
  return buildImport(rows2d);
}
