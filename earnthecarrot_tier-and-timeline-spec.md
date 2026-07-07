# Earn The Carrot — Tier Setup + Planning Timeline Spec

Captured from the design session. This covers the deal-tier setup screen (the
evolution of the old big/medium/small breakdown) and the planning timeline (the
evolution of the quarter planner). It supersedes the fixed three-bucket
assumption in the earlier quarter-planner spec.

## The core shift

The old design assumed three fixed deal sizes (BIG, MEDIUM, SMALL) for every
rep. That broke the moment a real rep said "I only go after big deals." Tiers are
now flexible, and the whole planning side is organized around size and sales
cycle, not around component type.

## Deal tiers (the setup screen)

- **Flexible count.** A rep can have one tier or several. Three is the proposed
  starting point, not a law. The "big deals only" rep collapses to a single tier
  and the exercise reads true to them.
- **Proposed only when grounded.** The system proposes tiers and their numbers
  only when the comp plan actually gives it the information to do so. Otherwise
  the rep starts from blank and fills it in with Coach. Lean by default, no
  invented assumptions.
- **Three inputs per tier**, all of which the rep sees and agrees to:
  1. **Deal size.** Carried as a range the rep will nod at (e.g. $300k to $400k)
     plus a single "typical" number that defaults to the midpoint and is
     draggable. The range is for honesty and low friction on screen. The typical
     number is what the backward math actually runs on, so the deal count stays a
     clean single number and no fuzzy arithmetic leaks into the core "how many
     deals do I need."
  2. **Deal Quantity.** (Renamed from "In your plan.") The count of deals in
     that tier. Coach pre-populates a starting count where it can; the rep
     adjusts.
  3. **Sales cycle length**, in most likely months. Key input. Drives bar length
     on the timeline. Store it now even where it is not yet displayed downstream;
     the QBR generator will want it later.
- **Deal type is a tag, not a lane.** New Logo / Expansion / Renewal are
  attributes a deal carries, not the axis that organizes the plan. A big deal is
  a big deal whether it is a new logo or an expansion; it sits in the big lane
  because of its size and cycle. Type is kept for coaching and the QBR, but it
  does not structure the plan. This is what sidesteps the "an expansion grows out
  of a new logo" tangle.

## Stretch, not just target

Everything measures toward stretch (the default ambition), with target marked as
a milestone. The "what if I close a second big deal" case is already handled: the
rep places the chips that hit quota, then drops another past the line and watches
it climb into the accelerators. Upside is visible with no new mechanism.

## The planning timeline (evolution of the quarter planner)

The snap-a-chip-into-a-quarter version is the MVP. The timeline below is where the
same screen grows to. Build once, let it deepen, do not build twice.

- **Deals are bars, not points.** A bar's length is its sales cycle. The bar has
  to END at the close date, so the START is forced. This is the whole point: a
  12-month deal closing in Q4 has to be in motion now; an 18-month deal closing
  at year end needed to start last year and its bar visibly runs off the left
  edge into the past. That overflow is the honest gut check.
- **Lead with one summary bar per tier**, not thirty individual bars. One
  backward-computed "start by" line per tier (close date minus cycle length). The
  rep absorbs it in two seconds: bigs start now, mediums have until spring, smalls
  can wait. This solves the density problem (thirty stacked bars is a wall) and
  the false-precision problem (the rep does not really know deal four starts in
  March).
- **Drill in on demand.** Tap a tier to expand it into individual placeable bars
  for reps who think deal by deal. Summary first, detail optional. Whether reps at
  this deal size think in individual deals at all is still open; if they mostly
  think in counts and money, the summary bar may be the whole feature and the
  drill-in is a defer.
- **"Already late to start" is a loud, first-class state.** The moment close date
  minus cycle length lands before today, say so loudly. This is the actual
  product. The chart shows the whole shape; this alert delivers the punch.
- **Axis granularity follows the plan.** If the plan tracks monthly, the axis is
  months. Axis length is driven by the longest sales cycle in play, not just the
  comp year, so late deals can run backward past today. Note for layout: monthly
  ticks over an 18-month span is busy; likely tick monthly, label quarterly, or
  allow zoom. Layout problem, not a blocker.

## Above the line vs below the line

- **Above the line (build now).** The planning bars the rep is placing. Fully
  drivable today from tier data. No pipeline needed.
- **Below the line (bank for the CRM module).** Closed and won deals drop below
  the line as reality, fed by CRM or CSV import. This is where named, real, dated
  deals live.
- **No dependency chains above the line, ever.** The New Logo → Expansion chain
  (one client's new logo closes, then the same client expands months later, the
  expansion's start being the new logo's end) is real but belongs below the line,
  where named dated deals actually exist. At planning time the rep is guessing at
  a fiction, so modeling chains above the line builds heavy machinery to schedule
  something the rep does not know yet. Above the line, deals are independent
  instances in a tier.

## Visual system

- **Icon by size, color by type.** Icon carries size (by tier rank, not a
  hardcoded three: biggest tier gets the "big" icon, smallest gets "small", a lone
  tier gets one). Color carries component type. The two signals map one-to-one
  onto the two axes: a rep reads a single chip without labels. Big new logo and
  big renewal share an icon, differ in color; big new logo and small new logo
  share a color, differ in icon. No collision.
- Defined once in a single config map so a different plan's tiers and components
  flow through with no code change. Agent picks sensible icons from the existing
  set (lucide-style) and a legible distinct trio of colors for the dark theme;
  Karl adjusts after seeing it live.

## Coach interaction

- Replace modal popups with a persistent Coach panel that explains in place, in
  Coach's voice, with an "Ask Coach to clarify" affordance on each section. Coach
  co-creates rather than barking popups the rep has to read and dismiss.
- **Banked as polish:** choosing a Coach avatar, and actual spoken voice ("Coach
  will tell you" instead of a screen to read). Voice is its own build with cost
  and latency; do it later.

## Banked (not now)

- **CRM / CSV pipeline module** feeding the below-the-line half: named deals with
  stage, amount, real close dates. Makes the pipeline gap visible against needed
  deals. Separate module.
- **Dependency chaining** (New Logo → Expansion → Renewal on one client, end date
  feeding start date) lives in that below-the-line module, never above the line.
- **QBR use of stored tier data** including sales cycle length, even though it is
  captured but not shown on the planning screen now.
- **Spread-as-coaching:** later, surface the size range as a nudge ("if your bigs
  come in at the low end, that's one more deal"). Nicety, not now.

## Free-deal-list model (supersedes the tier-row model above)

The big/medium/small tier rows are replaced by a free deal list inside each
component. The rep no longer declares size tiers; they list the deals it will take,
and size grouping is DERIVED from the values for the Gantt.

- **Components stay** (New Logo, Expansion, Renewal, etc.), plan-derived and
  dynamic, plus custom. Inside each component, replace the tier rows with a free
  list of deal lines.
- **Each deal line carries:** an editable name/label (defaults to a size word or a
  scaffold example, rep types over it), a deal value (the dollar amount, typed
  directly, no "typical" to inherit), a quantity (N deals around this value, for
  fast batch entry), a sales cycle length in months, and a potential close period.
- **Close period granularity comes from the plan's tracking cadence** for that
  component: month / week / quarter / year. The system derives cadence from the
  plan (or asks once if ingestion doesn't capture it) and offers the right kind of
  period picker per line.
- **Rows are batch entry; deals are individual downstream.** A line of quantity 4
  expands into four individual placeable, nameable bars on the Gantt. The line is a
  compact way to enter a batch; the batch explodes into individual deals for
  placing and naming.
- **Size labels are derived, not entered.** The system groups deals by value
  (clusters become big/medium/small bands) and labels/colors them on the Gantt
  accordingly. The rep declares no tiers.
- **No typical, no override problem.** Every deal's value is typed directly, so the
  tier-typical-vs-per-deal-override ambiguity disappears. Total Revenue and the
  stretch total sum the actual per-line values (value x quantity).
- **First-run scaffold shows example deal lines** (e.g. ABC $1M qty 2 cyc 10mo,
  XYZ $500k qty 4 cyc 6mo, a $100k qty 5 cyc 4mo) in light gray placeholder text.
  CRITICAL, same discipline as the existing scaffold: gray examples do NOT count
  toward the total and do NOT persist until the rep edits them. An untouched
  example line is render-time only, never saved, never summed.
- **The explanatory copy above the components must clearly teach this**: list the
  deals you think it will take, with a value, how many, how long each takes, and
  when you think they close. Short, Coach voice.
- **The timeline half is unchanged** and already operates on individual expanded
  deals; this only changes how those deals are created (a deal list instead of tier
  rows). Placement, backward math, late state, naming, combined view all survive.

## Save behavior and tier/Gantt reconciliation (locked)

- **Editing saves; advancing forward saves.** Every screen flushes on exit.
  Advancing to the planner is a deliberate act of acceptance and always persists
  the tier state, even for a first-run user who never edited a seeded row. The
  only state that stays unsaved (case A / NULL) is a genuine glance-and-leave: no
  edit and no forward-advance.
- **The Gantt reconciles against the tiers on return, never resets.** Tiers are
  the source of truth. Each tier expands into placeable deals on the timeline.
  When a rep edits tiers, goes to the Gantt, then returns and edits tiers again,
  their placements must survive: unchanged deals keep their exact placement, deals
  added by a raised quantity appear unplaced on the bench, deals removed by a
  lowered quantity are pulled back or flagged (never silently deleted). Only the
  delta moves. This is the same append-and-reconcile pattern as the comp data
  layer, not an overwrite.
- **Placeable deals need a stable id.** For reconcile-don't-reset to work, each
  expanded deal must carry a stable identity so the Gantt can tell "same deal I
  placed before" from "new deal." Identity by position breaks on reorder. Build
  the timeline with stable deal ids from day one; this is the hinge the whole
  behavior turns on.

## What is locked from this session

Tiers flexible (1 to many, 3 as default, proposed only when grounded, blank
otherwise). Three inputs per tier: size (range + typical), Deal Quantity, sales
cycle length in months. Type is a tag, not a lane. No dependency chains above the
line. Timeline of bars with summary-bar-per-tier and a loud already-late state.
Above-line now, below-line CRM later. Coach panel replaces popups; avatar and
voice banked. Icon by size, color by type, one config map.
