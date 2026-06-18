#!/usr/bin/env node
/* =====================================================
   nexus.ai — dataset integrity check
   Validates tools.js so a bad edit (a broken slug, a thin
   category, a missing field) fails loudly instead of silently
   breaking a page. Run: `node scripts/check-data.js`
   Exits non-zero on any problem — safe to wire into CI or a routine.
   ===================================================== */
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'tools.js'));
const { TOOLS, CATEGORIES, STACKS, NEW_UPDATES } = global.window.OMNI;

const REQUIRED = ['slug', 'name', 'maker', 'cat', 'tier', 'pricing', 'url', 'blurb', 'summary'];
const TIERS = ['frontier', 'leading', 'specialist', 'open'];
const MIN_PER_CATEGORY = 5;
const slugs = new Set(TOOLS.map(t => t.slug));
const catSlugs = new Set(CATEGORIES.map(c => c.slug));
const problems = [];

// Unique slugs
const seen = {};
TOOLS.forEach(t => { seen[t.slug] = (seen[t.slug] || 0) + 1; });
Object.entries(seen).forEach(([s, n]) => { if (n > 1) problems.push(`duplicate slug "${s}" (${n}×)`); });

// Per-tool field + reference validity
TOOLS.forEach(t => {
  REQUIRED.forEach(f => { if (!t[f]) problems.push(`tool "${t.slug || '?'}" missing required field "${f}"`); });
  if (t.cat && !catSlugs.has(t.cat)) problems.push(`tool "${t.slug}" has unknown category "${t.cat}"`);
  if (t.tier && !TIERS.includes(t.tier)) problems.push(`tool "${t.slug}" has unknown tier "${t.tier}"`);
  (t.alternatives || []).forEach(a => { if (!slugs.has(a)) problems.push(`tool "${t.slug}" → unknown alternative "${a}"`); });
});

// Every category carries its weight
CATEGORIES.forEach(c => {
  const n = TOOLS.filter(t => t.cat === c.slug).length;
  if (n < MIN_PER_CATEGORY) problems.push(`category "${c.slug}" has only ${n} tools (min ${MIN_PER_CATEGORY})`);
});

// Stacks + new feed + home featured all reference real tools
STACKS.forEach(s => s.tools.forEach(x => { if (!slugs.has(x)) problems.push(`stack "${s.slug}" → unknown tool "${x}"`); }));
NEW_UPDATES.forEach(n => {
  if (!slugs.has(n.slug)) problems.push(`new-feed entry → unknown tool "${n.slug}"`);
  if (!/^\d{4}-\d{2}$/.test(n.date || '')) problems.push(`new-feed entry "${n.slug}" has bad date "${n.date}" (want YYYY-MM)`);
});
['claude-code', 'veo', 'suno', 'manus', 'perplexity'].forEach(f => { if (!slugs.has(f)) problems.push(`home featured → unknown tool "${f}"`); });

if (problems.length) {
  console.error(`\n✗ ${problems.length} data problem(s):`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`✓ Data OK — ${TOOLS.length} tools, ${CATEGORIES.length} categories, ${STACKS.length} stacks, ${NEW_UPDATES.length} updates. No broken references.`);
