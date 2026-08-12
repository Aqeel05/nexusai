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
  this dependency-free static site. Better still: install jsdom and write the harness in the
  scratchpad dir, never in the repo — then there is nothing to clean up and nothing to forget.

## Running the jsdom harness (hard-won details)

- **Serve the files over HTTP; don't hand jsdom a fake URL.** Relative `<script src>` resolves
  against the page URL, so a made-up origin makes every external script 404 and you get a
  misleading `ReferenceError: OMNI is not defined`. Run a tiny static server on localhost and
  point jsdom at it. Set `NO_PROXY='*'` or the agent proxy intercepts localhost.
- **Wait for the `load` event, not a bare `setTimeout`.** A fixed timer races the script fetch
  and produces flaky "rendered empty" failures on random pages — one page failed on one run and
  passed on the next with identical data. Listen for `load`, then a short grace for
  `DOMContentLoaded` handlers.
- **Ignore jsdom's canvas complaint.** `HTMLCanvasElement.getContext() ... without installing
  the canvas npm package` is an environment gap, not a page bug — the Nexus background canvas is
  decorative. Filter it out or every page "fails".
- **The tool page reads `?slug=`, not `?t=`.** Guessing the param silently renders the default
  (`claude`) and the harness happily passes while testing nothing. Check `param()` in `app.js`.
- **Assert on content, not just non-empty mounts.** A populated mount proves the renderer ran,
  not that *your* entry is on the page. Grep the rendered `textContent` for the new tool's name.
- **The homepage directory only lists `chatbots`** (category tabs swap the rest). A new tool in
  another category legitimately won't appear in `index.html` body text — that's not a failure.
