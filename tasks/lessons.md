# Lessons

Patterns to carry forward on this project.

- **Verify rendering, not just syntax.** The site is client-rendered from `tools.js` via
  `app.js`. `node --check` only catches parse errors. Use a jsdom harness that loads the
  pages with real external scripts (`resources:'usable'`) to catch runtime errors and
  confirm `[data-omni-*]` mounts actually populate. Don't inline both scripts into one
  `<script>` — that creates false "already declared" errors; load them as separate files
  like the browser does.

- **Run `node scripts/check-data.js` after any `tools.js` edit.** It's the source of truth
  for dataset integrity (slugs, refs, ≥5 per category, fields).

- **User preferences captured this session:**
  - Background should tie to the *meaning* of "Nexus" — a web of connections — not a
    generic effect.
  - Automated updates push **directly to a branch** (`claude/auto-update`), not a PR.

- **Clean up tooling artifacts.** jsdom was installed only to test; `node_modules`,
  `package.json`, `package-lock.json` were removed before committing so they don't pollute
  this dependency-free static site.

- **Always confirm the branch before committing.** A merge-to-`main` block that didn't end
  by checking out the feature branch left HEAD on `main`; the next two commits landed on
  `main` directly instead of `claude/lucid-mayer-wx2xvo`. Nothing was lost (main had the
  work), but the feature branch drifted behind. Rule: run `git branch --show-current`
  before any commit, and explicitly `git checkout <feature-branch>` as the LAST step of any
  merge-to-main sequence.
