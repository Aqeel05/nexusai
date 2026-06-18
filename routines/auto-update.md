# Routine — Auto-update the nexus.ai directory

A ready-to-paste **Routine** for Claude Code (Routines → New routine) that keeps the
directory current: when a genuinely new AI tool ships, or when an existing tool's
standing changes (tier up/down, new pricing, a category-defining update), it edits the
dataset and pushes the change.

Everything the site renders comes from a single file — **`tools.js`** (`TOOLS`,
`CATEGORIES`, `STACKS`, `NEW_UPDATES`). The routine only ever edits data, never markup.

---

## How to set it up (matches the New-routine form)

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **Name**       | `nexus.ai — auto directory update`                                       |
| **Repository** | `aqeel05/nexusai`                                                        |
| **Trigger**    | **Schedule** → weekly (e.g. `0 14 * * 1`, Mondays 14:00 UTC)             |
| **Model**      | Claude Opus (best judgement for editorial calls)                         |
| **Connectors** | None required. Web access is enough; keep GitHub on for the push.        |

Then paste the block below into **Instructions**.

---

## Instructions (copy–paste verbatim)

```text
You maintain nexus.ai, a curated editorial directory of AI tools. The entire site
renders from data in tools.js — TOOLS, CATEGORIES, STACKS, and NEW_UPDATES. You edit
data only; never touch HTML/CSS/JS markup.

GOAL
Keep the directory current. Each run, find what has genuinely changed in the AI tool
landscape since the last update and reflect it in tools.js. Quality over quantity —
this is a hand-curated, no-pay-to-rank directory. If nothing meaningful changed, make
no changes and stop.

STEP 1 — RESEARCH
Use web search to find, since roughly the last run:
  • Newly launched AI tools that are production-ready and category-defining.
  • Major updates to listed tools (new flagship model/version, big capability jump).
  • Ranking shifts — a tool that has clearly overtaken or fallen behind peers.
Check the most recent NEW_UPDATES date in tools.js to gauge the window. Prefer primary
sources (the maker's site, release notes, credible benchmarks). Ignore press-release
hype and anything not actually shipping.

STEP 2 — DECIDE (be conservative)
Only act on verified, substantive changes. Add a tool only if it's clearly worth a
practitioner's attention and at least as strong as the weakest existing entry in its
category. When in doubt, leave it out.

STEP 3 — EDIT tools.js
For a NEW tool — append a complete object to TOOLS with EVERY field, matching the exact
shape and editorial voice of existing entries:
  slug (kebab-case, unique), name, maker, cat (one of the 12 category slugs),
  tier ('frontier' | 'leading' | 'specialist' | 'open'),
  pricing, url, blurb (one-line verdict, no hype),
  summary (2–4 sentences), strengths[] (3–5), weaknesses[] (2–3),
  bestFor, alternatives[] (2–3 existing slugs in the same space).
Place it in the correct category section.

For a RANKING / STATUS change to an existing tool — update its tier and, as needed, its
blurb, summary, pricing, strengths/weaknesses. Keep alternatives[] pointing at real
slugs.

For EITHER — prepend one entry to NEW_UPDATES (newest first):
  { slug:'<existing-tool-slug>', headline:'<one crisp sentence>', date:'YYYY-MM',
    kind:'new' | 'major-update' | 'milestone' }
Keep NEW_UPDATES to ~12 entries; drop the oldest if it grows past that.

Voice: terse, opinionated, honest about weaknesses. No marketing language, no emoji in
copy, no "revolutionary". Match the surrounding entries exactly.

STEP 4 — VERIFY (must pass before pushing)
Run:  node scripts/check-data.js
It validates: unique slugs, all required fields present, valid category + tier, every
referenced slug resolves (alternatives, stacks, new feed, home featured), every category
still has >= 5 tools, and well-formed dates. Fix anything it flags and re-run until it
prints "✓ Data OK". Do not push if it fails.

STEP 5 — SHIP
If (and only if) you made changes:
  git checkout -B claude/auto-update
  git add tools.js
  git commit -m "data: <short summary of what changed>"
  git push -u origin claude/auto-update     (retry with backoff on network errors)
Push directly to the claude/auto-update branch. Do not open a pull request.
In your final message, summarize exactly what you added/changed and cite your sources.
If nothing changed, say so and push nothing.
```

---

## Notes

- **Why a branch, not main:** changes land on `claude/auto-update` so they're reviewable
  in the branch's history before anyone merges to `main`. Adjust the branch name in the
  Instructions if you prefer.
- **The safety net is `scripts/check-data.js`.** It's the same check used when the site
  was last audited; it makes a bad automated edit fail loudly instead of shipping a
  broken page. Run it yourself any time after editing `tools.js`.
- **Want a PR instead of a direct push?** Replace STEP 5's push with: open a pull request
  from `claude/auto-update` into `main`.
