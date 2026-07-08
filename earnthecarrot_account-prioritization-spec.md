# Earn The Carrot — Account Prioritization Spec (v1)

Captured from the design session. This is the account layer of a lite CRM. It comes
after the deal-list screen (which produces the deals it takes to hit the number) and
before per-account deal strategy (the next build). The through-line: comp plan tells
the rep WHY the work matters, the deal list tells them WHAT deals it takes, account
prioritization tells them WHERE to point those deals.

## Core philosophy (the heart of it)

The rep derives their own numbers from their own stretch goal, then commits to a pace
they choose. This is the opposite of "management says make 50 cold calls." Same math
might land on the same 50, but the rep chose it, it traces to a goal they set, and
they agreed. That agreement is the product. Coach helps the rep keep a promise they
made themselves, never polices it. Partnership posture, never compliance-tracking.

## The data model (foundation for a lite CRM)

- **Accounts persist as real, first-class records** in the same bitemporal,
  append-only fact layer as the comp data. A fact from the CSV is imported, a score
  the rep assigns is rep-created, a research result Coach pulls later is
  system-learned. All timestamped, sourced, appendable, never overwritten. Coach
  always reads current state. This is what makes the future weekly-research loop work.
- **Designed to accept, but NOT building in v1:** contacts (hang off accounts, carry
  a title), opportunities (hang off accounts, link to the deal list), business drivers
  (a loaded library, mapped driver-to-account and driver-to-contact-title so Coach can
  coach outreach and timing). Schema accommodates these; v1 builds none of them.
- **Customer status per account** (current customer / new prospect, extensible to
  more states). Load-bearing: links the account to deal type (customer -> Expansion/
  Renewal, prospect -> New Logo) and shapes scoring (an existing relationship is table
  stakes on a customer, worth points on a prospect). A real field, not freetext.
- **A row is whatever the rep uploaded.** Division-level granularity is handled by the
  rep listing divisions as separate rows (e.g. "Acme (Mfg) - customer", "Acme (Retail)
  - prospect"). Add a NULLABLE parent-account field to the schema now, unused in v1, so
  the future parent-child hierarchy has its hook with no migration. Coach can gently
  nudge the rep during the interview to split large accounts into divisions where it
  matters (a coaching prompt, not a data requirement).

## Metrics are data, not schema (and portable)

- **Metrics are rep-defined.** Not fixed columns. Each account holds a set of metric
  entries. A metric entry = { metric name, info (the context/data), score out of 10,
  weight }. The set of metrics is itself something the rep defined.
- **Pick metrics from your own uploaded columns, plus add new ones.** In the interview,
  Coach shows the column headers already in the rep's file and lets them choose which
  to use as metrics, then add new ones. Low friction: they organize what they brought
  rather than invent from a blank slate.
- **Imported columns auto-fill the info side; the rep supplies the score.** Picking
  "Annual Revenue" as a metric shows $2.4B (fact from the file) as the info, and the
  rep gives it a fit score (9/10). New rep-created metrics have a blank info field the
  rep fills. Less typing, the file does the work.
- **Column cap:** hard max 25 metrics, ~10 recommended. Coach nudges toward ~10 ("most
  reps find 8 to 12 is enough to make a confident call"), allows up to 25, discourages
  more. The cap protects the rep from noise.
- **Metric = portable object.** Store each metric definition as a self-contained,
  copyable object, not tangled into one rep's rows. This one choice makes three futures
  cheap: (1) rep-defined columns now, (2) Coach suggests common metrics once there's a
  corpus of reps, (3) team sharing of metric sets once the org layer exists. Build (1)
  now; (2) and (3) are banked and need population / org structure to be useful.

## Weighting

- Each metric carries a weight. Account score = weighted average of its metric scores,
  landing on a clean number out of 10. The rep never sees the arithmetic, they see e.g.
  7.4/10.
- **v1: high / medium / low weight per metric** (maps to 3/2/1 behind the scenes). The
  rep says "exec relationship is high, ERP is low"; the math handles it. Clearest for
  the QBR conversation ("I weight exec relationship high").
- **Banked:** left-to-right column position AS the weight (leftmost matters most,
  decays right). Elegant (weighting for free from ordering) but less explicit. Start
  with high/med/low.

## The screen: one screen, two modes

- **Familiar grammar: a spreadsheet.** Accounts are rows, metrics are columns, scroll
  right to see more metrics. It's what they exported from their CRM.
- **Frozen left column.** The account name (and running score) stays pinned on the left
  while metrics scroll under the cursor, so the rep always knows whose row they're in.
  This is the difference between a usable wide table and a headache. Build from the
  start.
- **Table shows SCORES (compact, scannable); info is a click away.** One column per
  metric in the table (the score), not two. Clicking a cell opens the info field to
  read/edit the context behind that score (auto-filled from the file for imported
  metrics). Keeps the table readable and the whole scoring shape visible at a glance.
- **Every column sorts, alphabetically and by score, like Excel.**
- **Select mode -> Work mode (one screen, two states):**
  - Select mode: all uploaded accounts shown, prioritized by ICP fit (matches float to
    top), with imported data visible. The rep triages and picks. Not deep-scoring 2,000
    rows here, just selecting.
  - Lock-in: ask the rep how many to start with (don't hardcode; ~25 as a reference
    point, rep chooses). The rep locks a first group (ICP matches plus any others they
    pick).
  - Work mode: the locked group is the deep, editable scoring set worked over time.
- The funnel is what makes scoring survivable: never deep-score the full list. All
  accounts (triage/select) -> locked group (rep-sized, ~25) -> deep scoring -> weighted
  rank -> QBR.

## ICP (Ideal Customer Profile)

- Coach captures the ICP by type OR talk (e.g. "accounts over $2B revenue, 1,000+
  salespeople, high tech"). Used for the first-pass sort (ICP matches float to top).
- Accounts outside the ICP that the rep wants are still selectable; the rep's own list
  comes first. ICP orders, it doesn't gate.

## Close rate -> backward math -> commitment

- Coach asks the rep's close rate (ideally per deal size, since bigs and smalls close
  at different rates). This is the bridge from the deal list to the account count:
  stretch number -> deals to close (from the deal list) -> close rate -> deals to work
  -> accounts needed -> account strategies per period. Every number defensible, every
  one lands in the QBR.
- **Commitment step (first-class, not a footnote).** After scoring/ranking, the
  backward math shows accounts-needed and a suggested pace. The rep sets the pace THEY
  commit to (strategies per hour/day/week). Coach reflects the timeline consequence
  honestly: a slower pace shows a later "you'll be covered by X" and whether that lands
  in time given cycle lengths (the same already-late gut-check from the deal list, for
  prospecting effort). The rep owns the pace; Coach commits to helping, never policing.

## The Coach interview (order)

1. Read the uploaded file.
2. Ask ICP (type or talk).
3. Show the file's column headers; rep picks which become metrics, adds new ones.
4. Ask the rep to weight the metrics (high/med/low).
5. Ask close rate (per size if possible).
6. (Nudge: split large accounts into divisions where relevant.)

## The payoff (why it all matters)

The QBR: the rep stands in front of their manager and says "here are the metrics I
track every account on, here's how they score, that's why these are my key accounts,
and here's the pace I committed to to hit my number." A defensible methodology, not a
gut call. Also the org-sale track: shared metric sets let a VP standardize how a whole
team prioritizes, which is a management dream and a reason a leader pays.

## v1 scope (what we build now)

Import accounts (CSV/Excel) into a persisted, append-only accounts layer designed to
later accept contacts/opportunities/drivers, with customer-status and a nullable
parent-account field. Coach interview (ICP, metrics-from-columns-plus-new, weights,
close rate). One screen, select mode (all accounts, ICP-sorted, lock a rep-sized
group) into work mode (deep scoring on the locked group). Wide table, frozen account
column, scores in-cell with info on click, Excel-style sort, up to 25 metrics (~10
recommended), high/med/low weighting, weighted rank. Close-rate backward math to
accounts-needed and a rep commitment step. Everything editable and persisted. Feeds
the QBR.

## Banked (foundationed-for, not built in v1)

Contacts. Opportunities (linked to the deal list). Business drivers + driver-to-title-
to-timing outreach coaching. Parent-child account hierarchy with roll-ups. Coach
suggesting metrics from a cross-rep corpus. Team sharing of metric sets (org layer).
Trip clustering from HQ addresses. Weekly research loop appending facts per account.
A "Coach's score" flavor for the 0-10 scoring.
