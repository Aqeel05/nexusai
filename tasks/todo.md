# nexus.ai — Work Plan

## Task 1 — Feature audit & bug fixes
- [x] Static integrity audit of data layer (108 tools / 12 cats — clean, no broken refs)
- [ ] **Fix mobile-nav bug**: at ≤880px all nav links except "Submit Tool" are hidden with no
      replacement. Add an accessible hamburger toggle in `renderNav` (app.js) + styles in
      `shared.css` so Categories/Directory/Stacks/Compare/New stay reachable on phones.
- [ ] Runtime smoke test: serve locally, confirm every page returns 200 and renders without
      console errors; click-through key flows (search, category filters, compare form,
      tool detail, submit validation).
- [ ] Fix any additional issues surfaced during the pass.

## Task 2 — "Nexus" themed animated background
- [ ] Add a single fixed full-viewport `<canvas>` behind all content (pointer-events:none,
      z-index below UI), injected site-wide from `app.js` so one change covers every page.
- [ ] Draw a living **nexus network**: drifting nodes joined by thin links that fade with
      distance, a faint accent-colored convergence glow — a literal "nexus" of connections.
- [ ] Performance: DPR-aware, node count scales with viewport, pauses when tab hidden,
      gentle cursor parallax. Respect `prefers-reduced-motion` (render a static frame).
- [ ] Keep text readable: low opacity + vignette so it never competes with content.

## Task 3 — Auto-update routine (copy-paste for Claude Code)
- [ ] Create `routines/auto-update.md`: ready-to-paste Name + Instructions + recommended
      trigger (weekly Schedule) + repo/branch. Instructions tell Claude Code to research new
      AI launches & ranking shifts, edit `tools.js` (add fully-formed tool objects, adjust
      tiers/rankings, prepend `NEW_UPDATES`, keep every category ≥5), run the integrity
      check, then **commit & push directly to a branch** (per user choice).
- [ ] Surface the same text in chat for easy copy-paste.

## Verify & ship
- [x] Re-run integrity check; render-test every page; commit on `claude/lucid-mayer-wx2xvo`; push.
- [x] Record review notes here + capture any lessons.

---

## Review (done)

**Task 1 — audit & bug fix**
- Data layer audited clean (108 tools / 12 cats, no broken refs, no missing fields).
- Fixed the mobile-nav bug: added an accessible hamburger toggle (app.js `renderNav`) +
  a slide-down panel (shared.css). Below 880px all links are reachable again.
- Verified with jsdom: all 9 page types render with **zero runtime errors**; nav toggle,
  category tier filter (10→3 on "frontier"), and the compare form all fire correctly.

**Task 2 — Nexus background**
- Added a fixed full-viewport `<canvas class="nexus-bg">` injected site-wide from app.js
  (`initNexusBackground`). Draws a drifting network of nodes + distance-faded links that
  brighten toward a central "nexus" focus, with gentle cursor attraction.
- Performance-capped (DPR≤2, node count scales with viewport, pauses on hidden tab).
  Respects `prefers-reduced-motion` (single static frame). Sits at z-index 0, behind the
  grain (z-1) and content (z-2); masked + 0.55 opacity so text stays crisp.
- Verified draw loop runs without errors (stubbed 2D context: ~70 links + 47 nodes/frame).

**Task 3 — auto-update routine**
- Added `routines/auto-update.md`: copy-paste Name + Instructions + weekly Schedule trigger,
  pushing directly to `claude/auto-update` (per request).
- Added `scripts/check-data.js` — reusable dataset validator the routine runs before
  pushing (and humans can run anytime). Prints "✓ Data OK" or fails non-zero.

**Also:** vendored github.com/obra/superpowers into `skills/superpowers/` (de-gitted).
