# Task — Add Omnigent + refresh the directory with the latest AI tools

**Branch:** `claude/ai-tools-collection-8dv3w2` → merge to `main`

Everything the site renders comes from `tools.js`. Data-only edits; no markup changes.
Last curated `NEW_UPDATES` date was `2026-04`, so the research window is roughly
**April → August 2026**.

---

## Plan

### 1. Research (web, primary sources preferred)
- [x] Omnigent — what it is, maker, license, maturity
- [x] Coding agents shipped since April 2026
- [x] Video models shipped since April 2026
- [x] Image models shipped since April 2026
- [x] Open-weight LLMs shipped since April 2026
- [x] Agent / infra platforms shipped since April 2026
- [x] Verify candidates that turned out to be **dead ends** (see below)

### 2. Additions to `TOOLS` (12)

| slug | name | maker | cat | tier |
| --- | --- | --- | --- | --- |
| `omnigent` | Omnigent | Databricks | agents | open |
| `browser-use` | Browser Use | Browser Use | agents | open |
| `kiro` | Kiro | AWS | coding | leading |
| `seedance` | Seedance 2.5 | ByteDance | video | frontier |
| `ltx` | LTX-2 | Lightricks | video | open |
| `nano-banana` | Nano Banana Pro | Google DeepMind | image | frontier |
| `gpt-image` | GPT Image 2 | OpenAI | image | frontier |
| `glm` | GLM-5.2 | Z.ai | chatbots | open |
| `minimax` | MiniMax M3 | MiniMax | chatbots | open |
| `composio` | Composio | Composio | infra | specialist |
| `langfuse` | Langfuse | Langfuse | infra | open |
| `elevenlabs-music` | *(already listed — no-op)* | — | — | — |

### 3. Updates to existing entries
- [x] `sora` — Sora 2 was deprecated 2026-04-26 and shuts down 2026-09-24. Demote
      `leading` → `specialist`, rewrite blurb/summary/weaknesses, point users at
      the successor path. Leaving this stale would be the worst kind of error for
      a directory that claims to be current.
- [x] `kimi` — Moonshot shipped K3 (open weights, 1M context). Refresh version text.

### 4. Add to `NEW_UPDATES` feed
Newest-first, `YYYY-MM`, every slug must resolve.

### 5. Verify
- [x] `node scripts/check-data.js` passes
- [x] jsdom render harness — load real pages with external scripts, confirm
      `[data-omni-*]` mounts populate and no runtime errors (per `tasks/lessons.md`)
- [x] Remove jsdom artifacts (`node_modules`, `package*.json`) before committing

### 6. Ship
- [x] Commit + push to `claude/ai-tools-collection-8dv3w2`
- [x] Merge to `main`
- [ ] Report the live URL

---

## Rejected candidates (researched, deliberately not added)

- **ChatGPT Atlas** — OpenAI is retiring it; the standalone browser stops working
  2026-08-09 and its agentic browsing folds into the ChatGPT desktop app. Adding a
  product that shut down three days ago would be an own goal.
- **AWS Q Developer** — new signups closed 2026-05-15, superseded by Kiro. Added
  Kiro instead.
- **Snowflake Cortex AI Gateway / TrueFoundry / Obot** — real, but enterprise
  gateway plumbing rather than something a practitioner picks up. Composio covers
  this slot with far broader adoption.
- **MCP gateway long tail** — fast-consolidating market, too early to call winners.

---

## Review

**What changed:** `tools.js` only — 12 new tool entries (107 → 119 tools), 2 corrected
entries, 6 new feed items (10 → 16). No HTML, CSS, or JS markup touched, so there is
no rendering risk beyond the data layer.

**Editorial calls worth flagging:**
- Omnigent is genuinely *alpha* and its Windows support is degraded. The entry says
  so in `weaknesses` rather than quietly overselling it — the directory's whole
  value is that it doesn't do that.
- Both new image models are tiered `frontier`, which now makes four frontier
  entries in that category. That reflects reality — GPT Image 2 and Nano Banana Pro
  genuinely trade the top spot between prompt adherence and editing — but it is
  worth revisiting if the category starts to look top-heavy.
- `seedance` is listed at 2.5 (the current shipping version) rather than 2.0, and
  the entry notes the access story is awkward outside China.

**Verification:** dataset check passes at 119 tools with no broken references, and the
jsdom harness renders all 18 pages (home, six categories, six tool details, compare,
stacks, new, submit, about) with populated mounts and a clean console. A second pass
asserted the new copy is actually on the page, not merely that the mount was non-empty.
