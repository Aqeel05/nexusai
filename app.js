/* =====================================================
   nexus.ai — shared rendering layer
   Every dynamic page (category, tool, compare, search)
   reads from window.OMNI and writes into [data-omni-*] mounts.
   ===================================================== */
(() => {
  if (!window.OMNI) { console.error('tools.js must load before app.js'); return; }
  const { TOOLS, CATEGORIES, TIERS, STACKS, NEW_UPDATES } = window.OMNI;

  /* ---------- helpers ---------- */
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bySlug = (slug) => TOOLS.find(t => t.slug === slug);
  const cat = (slug) => CATEGORIES.find(c => c.slug === slug);
  const param = (k) => new URLSearchParams(location.search).get(k);

  const tierDot = (tier) => `<span class="tier-dot dot-${tier}"></span>`;
  const tierLabel = (tier) => TIERS[tier]?.label || 'Tool';
  const externalIcon = `<svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 3H3v8h8V9"/><path d="M9 3h2v2"/><path d="M11 3 6 8"/></svg>`;
  const arrow = `<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 7h8M8 4l3 3-3 3"/></svg>`;

  const pad = (n, w=3) => String(n).padStart(w, '0');

  const reveal = (root=document) => {
    const els = $$('.reveal-on-scroll', root);
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  };

  /* ---------- list row markup (used by category + search + new) ---------- */
  function rowHTML(t, idx) {
    const c = cat(t.cat);
    return `
      <a href="tool.html?slug=${t.slug}" class="dir-row" data-tier="${t.tier}" data-cat="${t.cat}">
        <div class="dir-num">${pad(idx + 1)}</div>
        <div class="dir-name">
          <div class="dir-name-text">${escape(t.name)}</div>
          <div class="dir-maker">${escape(t.maker)}</div>
        </div>
        <div class="dir-desc">${escape(t.blurb)}</div>
        <div class="dir-tag">${tierDot(t.tier)}${tierLabel(t.tier)}</div>
        <div class="dir-cat-tag">${c ? c.icon + ' ' + escape(c.name) : ''}</div>
        <div class="dir-price">${escape(t.pricing)}</div>
        <div class="dir-arrow">${arrow}</div>
      </a>`;
  }

  function dirHeader({ showCat=false } = {}) {
    return `
      <div class="dir-row dir-head">
        <div>#</div>
        <div>TOOL</div>
        <div class="dir-desc-h">VERDICT</div>
        <div>TIER</div>
        <div class="dir-cat-tag-h">${showCat ? 'CATEGORY' : ''}</div>
        <div class="dir-price-h">PRICING</div>
        <div></div>
      </div>`;
  }

  /* ---------- CATEGORY page ---------- */
  function renderCategory(slug) {
    const c = cat(slug);
    if (!c) return;

    const headMount = $('[data-omni-category-head]');
    if (headMount) {
      headMount.innerHTML = `
        <div class="crumb">
          <a href="index.html">Index</a>
          <span class="sep">/</span>
          <a href="index.html#categories">Categories</a>
          <span class="sep">/</span>
          <span>${escape(c.name)}</span>
        </div>
        <h1 class="page-title"><span class="page-icon">${c.icon}</span> ${escape(c.name).replace(' & ', ' <em>&</em> ')}</h1>
        <p class="page-sub">${escape(c.desc)}</p>
        <div class="legend">
          <span class="legend-item">${tierDot('frontier')}Frontier</span>
          <span class="legend-item">${tierDot('leading')}Leading</span>
          <span class="legend-item">${tierDot('specialist')}Specialist</span>
          <span class="legend-item">${tierDot('open')}Open-source</span>
        </div>`;
    }

    const tabsMount = $('[data-omni-category-tabs]');
    if (tabsMount) {
      tabsMount.innerHTML = CATEGORIES.map(x =>
        `<a href="category-${x.slug}.html" class="cat-tab ${x.slug === slug ? 'is-active' : ''}">${x.icon} ${escape(x.name.replace(' & LLMs',''))}</a>`
      ).join('');
    }

    const tools = TOOLS.filter(t => t.cat === slug);
    const listMount = $('[data-omni-category-list]');
    if (listMount) {
      listMount.innerHTML = `
        <div class="dir-toolbar">
          <div class="dir-stats">
            <span class="stat-num">${tools.length}</span>
            <span class="stat-label">tools in ${escape(c.name)}</span>
          </div>
          <div class="dir-filters" data-filters>
            <button class="chip is-on" data-tier="all">All tiers</button>
            <button class="chip" data-tier="frontier">${tierDot('frontier')} Frontier</button>
            <button class="chip" data-tier="leading">${tierDot('leading')} Leading</button>
            <button class="chip" data-tier="specialist">${tierDot('specialist')} Specialist</button>
            <button class="chip" data-tier="open">${tierDot('open')} Open-source</button>
          </div>
        </div>
        <div class="dir-list">
          ${dirHeader()}
          ${tools.map((t,i) => rowHTML(t, i)).join('')}
        </div>
        <p class="dir-empty" hidden>No tools match that filter yet.</p>`;

      // Filters
      const filterRoot = $('[data-filters]', listMount);
      filterRoot.addEventListener('click', e => {
        const btn = e.target.closest('.chip'); if (!btn) return;
        $$('.chip', filterRoot).forEach(c => c.classList.toggle('is-on', c === btn));
        const want = btn.dataset.tier;
        const rows = $$('.dir-row:not(.dir-head)', listMount);
        let shown = 0;
        rows.forEach(r => {
          const ok = want === 'all' || r.dataset.tier === want;
          r.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        $('.dir-empty', listMount).hidden = shown > 0;
      });
    }

    document.title = `${c.name} — nexus.ai`;
    reveal();
  }

  /* ---------- TOOL detail page ---------- */
  function renderTool() {
    const slug = param('slug') || 'claude';
    const t = bySlug(slug);
    const mount = $('[data-omni-tool]');
    if (!mount) return;

    if (!t) {
      mount.innerHTML = `
        <section class="page-head"><div class="container">
          <div class="crumb"><a href="index.html">Index</a><span class="sep">/</span><span>Not found</span></div>
          <h1 class="page-title">Tool not found.</h1>
          <p class="page-sub">No entry for <code>${escape(slug)}</code>. Try the <a href="index.html#categories">category index</a>.</p>
        </div></section>`;
      return;
    }

    const c = cat(t.cat);
    const alts = (t.alternatives || []).map(s => bySlug(s)).filter(Boolean);
    const strengths = t.strengths || [];
    const weaknesses = t.weaknesses || [];

    document.title = `${t.name} — ${c.name} — nexus.ai`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', `${t.name} by ${t.maker}. ${t.blurb}`);

    mount.innerHTML = `
      <section class="page-head reveal">
        <div class="container">
          <div class="crumb">
            <a href="index.html">Index</a>
            <span class="sep">/</span>
            <a href="category-${c.slug}.html">${c.icon} ${escape(c.name)}</a>
            <span class="sep">/</span>
            <span>${escape(t.name)}</span>
          </div>

          <div class="tool-hero">
            <div>
              <div class="tier-tag">${tierDot(t.tier)}${tierLabel(t.tier).toUpperCase()} · ${escape(c.name).toUpperCase()}</div>
              <h1 class="page-title">${escape(t.name)}</h1>
              <p class="page-sub">${escape(t.blurb)}</p>
              <div class="tool-cta">
                <a class="btn" href="${t.url}" target="_blank" rel="noopener noreferrer">Visit ${escape(t.name)} ${externalIcon}</a>
                <a class="btn btn-ghost" href="compare.html?a=${t.slug}">Compare</a>
              </div>
            </div>
            <aside class="tool-spec">
              <dl>
                <div><dt>Maker</dt><dd>${escape(t.maker)}</dd></div>
                <div><dt>Category</dt><dd><a href="category-${c.slug}.html">${escape(c.name)}</a></dd></div>
                <div><dt>Tier</dt><dd>${tierDot(t.tier)} ${tierLabel(t.tier)}</dd></div>
                <div><dt>Pricing</dt><dd>${escape(t.pricing)}</dd></div>
                <div><dt>Best for</dt><dd>${escape(t.bestFor || '—')}</dd></div>
                <div><dt>Website</dt><dd><a href="${t.url}" target="_blank" rel="noopener">${escape(t.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))} ${externalIcon}</a></dd></div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="tool-grid">
            <article class="tool-body reveal-on-scroll">
              <h2 class="section-sub">The verdict</h2>
              <p class="lede">${escape(t.summary)}</p>

              ${strengths.length ? `
                <h3 class="block-h">What it’s great at</h3>
                <ul class="bullets bullets-good">
                  ${strengths.map(s => `<li>${escape(s)}</li>`).join('')}
                </ul>` : ''}

              ${weaknesses.length ? `
                <h3 class="block-h">Where it falls short</h3>
                <ul class="bullets bullets-bad">
                  ${weaknesses.map(s => `<li>${escape(s)}</li>`).join('')}
                </ul>` : ''}

              <h3 class="block-h">Tier rationale</h3>
              <p class="meta-line"><strong>${tierLabel(t.tier)}.</strong> ${escape(TIERS[t.tier]?.desc || '')}</p>
            </article>

            <aside class="tool-side reveal-on-scroll">
              ${alts.length ? `
                <div class="side-block">
                  <h4>Worth comparing</h4>
                  <div class="alt-list">
                    ${alts.map(a => `
                      <a href="tool.html?slug=${a.slug}" class="alt-row">
                        <div class="alt-name">${escape(a.name)}</div>
                        <div class="alt-blurb">${escape(a.blurb)}</div>
                        <div class="alt-meta">${tierDot(a.tier)} ${tierLabel(a.tier)} · ${escape(a.pricing)}</div>
                      </a>`).join('')}
                  </div>
                </div>` : ''}

              <div class="side-block">
                <h4>Try side-by-side</h4>
                ${alts.slice(0, 2).map(a => `
                  <a class="side-cta" href="compare.html?a=${t.slug}&b=${a.slug}">${escape(t.name)} <span class="vs">vs</span> ${escape(a.name)} ${arrow}</a>
                `).join('')}
              </div>

              <div class="side-block">
                <h4>More in ${escape(c.name)}</h4>
                <a class="side-cta" href="category-${c.slug}.html">Browse the full category ${arrow}</a>
              </div>
            </aside>
          </div>
        </div>
      </section>`;

    reveal();
  }

  /* ---------- COMPARE page ---------- */
  function renderCompare() {
    const mount = $('[data-omni-compare]');
    if (!mount) return;

    const aSlug = param('a') || 'claude';
    const bSlug = param('b') || 'chatgpt';
    const a = bySlug(aSlug) || TOOLS[0];
    const b = bySlug(bSlug) || TOOLS[1];

    const optionsHTML = (selected) => TOOLS
      .slice().sort((x,y) => x.name.localeCompare(y.name))
      .map(t => `<option value="${t.slug}" ${t.slug===selected?'selected':''}>${escape(t.name)} — ${escape(cat(t.cat).name)}</option>`).join('');

    const card = (t, side) => `
      <div class="compare-card">
        <div class="compare-head">
          <div class="tier-tag">${tierDot(t.tier)}${tierLabel(t.tier).toUpperCase()} · ${escape(cat(t.cat).name).toUpperCase()}</div>
          <h2 class="compare-name">${escape(t.name)}</h2>
          <div class="compare-maker">${escape(t.maker)}</div>
          <p class="compare-blurb">${escape(t.blurb)}</p>
          <div class="compare-cta">
            <a class="btn btn-ghost" href="tool.html?slug=${t.slug}">Detail page</a>
            <a class="btn" href="${t.url}" target="_blank" rel="noopener">Visit ${externalIcon}</a>
          </div>
        </div>
        <dl class="compare-spec">
          <div><dt>Maker</dt><dd>${escape(t.maker)}</dd></div>
          <div><dt>Category</dt><dd>${escape(cat(t.cat).name)}</dd></div>
          <div><dt>Tier</dt><dd>${tierLabel(t.tier)}</dd></div>
          <div><dt>Pricing</dt><dd>${escape(t.pricing)}</dd></div>
          <div><dt>Best for</dt><dd>${escape(t.bestFor || '—')}</dd></div>
        </dl>
        <div class="compare-section">
          <h4>Verdict</h4>
          <p>${escape(t.summary)}</p>
        </div>
        ${(t.strengths||[]).length ? `
          <div class="compare-section">
            <h4>Strengths</h4>
            <ul class="bullets bullets-good">${t.strengths.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>
          </div>`:''}
        ${(t.weaknesses||[]).length ? `
          <div class="compare-section">
            <h4>Weaknesses</h4>
            <ul class="bullets bullets-bad">${t.weaknesses.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>
          </div>`:''}
      </div>`;

    // suggested matchups
    const matchups = [
      ['claude','chatgpt'], ['claude','gemini'], ['cursor','copilot'],
      ['suno','udio'], ['midjourney','flux'], ['veo','runway'],
      ['perplexity','chatgpt-search'], ['langchain','langgraph'], ['vapi','bland']
    ];

    mount.innerHTML = `
      <section class="page-head">
        <div class="container">
          <div class="crumb"><a href="index.html">Index</a><span class="sep">/</span><span>Compare</span></div>
          <h1 class="page-title">Compare any two AIs <em>side by side.</em></h1>
          <p class="page-sub">Pick any two of the ${TOOLS.length} tools we cover. Verdicts, strengths, weaknesses, and pricing in one view.</p>

          <form class="compare-form" data-compare-form>
            <label class="cf-label">
              <span>Tool A</span>
              <select name="a">${optionsHTML(a.slug)}</select>
            </label>
            <span class="cf-vs">vs</span>
            <label class="cf-label">
              <span>Tool B</span>
              <select name="b">${optionsHTML(b.slug)}</select>
            </label>
            <button class="btn" type="submit">Compare ${arrow}</button>
          </form>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="compare-grid reveal-on-scroll">
            ${card(a,'a')}
            ${card(b,'b')}
          </div>

          <div class="compare-matchups">
            <h3 class="block-h">Try another matchup</h3>
            <div class="matchup-row">
              ${matchups.map(([x,y]) => {
                const tx = bySlug(x), ty = bySlug(y);
                if (!tx || !ty) return '';
                return `<a class="matchup" href="compare.html?a=${x}&b=${y}">${escape(tx.name)} <span class="vs">vs</span> ${escape(ty.name)}</a>`;
              }).join('')}
            </div>
          </div>
        </div>
      </section>`;

    document.title = `${a.name} vs ${b.name} — nexus.ai Compare`;

    $('[data-compare-form]', mount).addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const aN = fd.get('a'), bN = fd.get('b');
      if (aN === bN) return;
      location.search = `?a=${aN}&b=${bN}`;
    });

    reveal();
  }

  /* ---------- SEARCH (used on index hero + a /search style page) ---------- */
  function searchTools(q) {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return TOOLS.filter(t => {
      const hay = [t.name, t.maker, t.blurb, t.summary, t.bestFor, cat(t.cat).name, t.tier, t.pricing]
        .filter(Boolean).join(' ').toLowerCase();
      return term.split(/\s+/).every(part => hay.includes(part));
    }).slice(0, 12);
  }

  function wireHomeSearch() {
    const input = $('[data-omni-search-input]');
    const results = $('[data-omni-search-results]');
    const pills = $$('[data-omni-search-pill]');
    if (!input || !results) return;

    function render(q) {
      const list = searchTools(q);
      if (!q.trim()) { results.hidden = true; results.innerHTML=''; return; }
      results.hidden = false;
      if (!list.length) {
        results.innerHTML = `<div class="search-empty">No matches for “${escape(q)}”. Try “coding agents”, “open-source video”, or “meeting notes”.</div>`;
        return;
      }
      results.innerHTML = list.map(t => `
        <a class="search-result" href="tool.html?slug=${t.slug}">
          <div class="sr-name">${escape(t.name)}</div>
          <div class="sr-blurb">${escape(t.blurb)}</div>
          <div class="sr-meta">${tierDot(t.tier)} ${tierLabel(t.tier)} · ${escape(cat(t.cat).name)} · ${escape(t.pricing)}</div>
        </a>`).join('');
    }

    input.addEventListener('input', e => render(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = $('.search-result', results);
        if (first) first.click();
      }
    });
    pills.forEach(p => p.addEventListener('click', () => {
      input.value = p.textContent;
      input.focus(); render(p.textContent);
    }));
  }

  /* ---------- HOME page renderers ---------- */
  function renderHomeFeatured() {
    const mount = $('[data-omni-featured]'); if (!mount) return;
    const picks = ['claude-code','veo','suno','manus','perplexity'].map(bySlug).filter(Boolean);
    const big = picks[0];
    mount.innerHTML = `
      <a href="tool.html?slug=${big.slug}" class="featured-card featured-big">
        <div>
          <div class="tier-tag">${tierDot(big.tier)}${tierLabel(big.tier).toUpperCase()} · ${escape(cat(big.cat).name).toUpperCase()} · APR 2026</div>
          <h3>${escape(big.name)}</h3>
          <p>${escape(big.summary)}</p>
        </div>
        <div class="meta"><span>${escape(big.url.replace(/^https?:\/\//,'').toUpperCase())}</span><span class="arrow">${arrow}</span></div>
      </a>
      ${picks.slice(1).map(p => `
        <a href="tool.html?slug=${p.slug}" class="featured-card">
          <div>
            <div class="tier-tag">${tierDot(p.tier)}${tierLabel(p.tier).toUpperCase()} · ${escape(cat(p.cat).name).toUpperCase()}</div>
            <h3>${escape(p.name)}</h3>
            <p>${escape(p.blurb)}</p>
          </div>
          <div class="meta"><span>${escape(p.url.replace(/^https?:\/\//,'').toUpperCase())}</span><span class="arrow">${arrow}</span></div>
        </a>`).join('')}`;
  }

  function renderHomeCategories() {
    const mount = $('[data-omni-categories]'); if (!mount) return;
    mount.innerHTML = CATEGORIES.map(c => {
      const ts = TOOLS.filter(t => t.cat === c.slug);
      const examples = ts.slice(0, 6).map(t => t.name).join(', ');
      return `
        <a href="category-${c.slug}.html" class="cat-card">
          <span class="cat-icon">${c.icon}</span>
          <div class="cat-name">${escape(c.name)}</div>
          <div class="cat-count">${ts.length} TOOLS</div>
          <div class="cat-examples">${escape(examples)}…</div>
        </a>`;
    }).join('');
  }

  function renderHomeDirectory() {
    const mount = $('[data-omni-directory]'); if (!mount) return;
    const list = TOOLS.filter(t => t.cat === 'chatbots');
    mount.innerHTML = `
      ${dirHeader()}
      ${list.map((t,i) => rowHTML(t, i)).join('')}`;
  }

  function renderHomeStacks() {
    const mount = $('[data-omni-stacks-preview]'); if (!mount) return;
    const picks = STACKS.slice(0, 3);
    mount.innerHTML = picks.map(s => `
      <a href="stacks.html#${s.slug}" class="stack-card">
        <div class="stack-label">■ ${s.label}</div>
        <div class="stack-name">${escape(s.name)}</div>
        <p class="stack-desc">${escape(s.desc)}</p>
        <div class="stack-tools">
          ${s.tools.map(slug => {
            const t = bySlug(slug); if (!t) return '';
            return `<span class="stack-tool">${escape(t.name)}</span>`;
          }).join('')}
        </div>
        <div class="stack-cost"><span>MONTHLY</span><span>${escape(s.cost)}</span></div>
      </a>`).join('');
  }

  /* ---------- STACKS full page ---------- */
  function renderStacksPage() {
    const mount = $('[data-omni-stacks]'); if (!mount) return;
    mount.innerHTML = STACKS.map(s => `
      <article id="${s.slug}" class="stack-block reveal-on-scroll">
        <header class="stack-block-head">
          <div class="stack-label">${s.label}</div>
          <h2 class="stack-block-name">${escape(s.name)}</h2>
          <p class="stack-block-desc">${escape(s.desc)}</p>
          <div class="stack-block-cost">EST. MONTHLY · <strong>${escape(s.cost)}</strong></div>
        </header>
        <div class="stack-tool-grid">
          ${s.tools.map(slug => {
            const t = bySlug(slug); if (!t) return '';
            return `
              <a class="stack-tool-card" href="tool.html?slug=${t.slug}">
                <div class="stt-name">${escape(t.name)}</div>
                <div class="stt-blurb">${escape(t.blurb)}</div>
                <div class="stt-meta">${tierDot(t.tier)} ${tierLabel(t.tier)} · ${escape(t.pricing)}</div>
              </a>`;
          }).join('')}
        </div>
      </article>`).join('');
    reveal();
  }

  /* ---------- NEW & UPDATED page ---------- */
  function renderNewPage() {
    const mount = $('[data-omni-new]'); if (!mount) return;
    mount.innerHTML = NEW_UPDATES.map(n => {
      const t = bySlug(n.slug); if (!t) return '';
      const c = cat(t.cat);
      return `
        <a class="new-row reveal-on-scroll" href="tool.html?slug=${t.slug}">
          <div class="new-date">${escape(n.date)}</div>
          <div class="new-kind">${escape(n.kind.replace('-', ' '))}</div>
          <div class="new-body">
            <div class="new-name">${escape(t.name)}</div>
            <div class="new-headline">${escape(n.headline)}</div>
          </div>
          <div class="new-tier">${tierDot(t.tier)} ${escape(c.name)}</div>
          <div class="new-arrow">${arrow}</div>
        </a>`;
    }).join('');
    reveal();
  }

  /* ---------- footer & nav consistency ---------- */
  function renderFooter() {
    const mount = $('[data-omni-footer]'); if (!mount) return;
    mount.innerHTML = `
      <div class="container">
        <h2 class="foot-hero serif">Built for people who want <em>the signal</em>, not the noise.</h2>
        <div class="foot-grid">
          <div class="foot-col">
            <div class="foot-brand serif">nexus.ai</div>
            <div class="foot-tagline">The nexus for all of AI. Curated monthly by humans who actually use the tools. No sponsored rankings, ever.</div>
          </div>
          <div class="foot-col">
            <h5>Discover</h5>
            ${CATEGORIES.slice(0, 6).map(c => `<a href="category-${c.slug}.html">${escape(c.name)}</a>`).join('')}
          </div>
          <div class="foot-col">
            <h5>More categories</h5>
            ${CATEGORIES.slice(6).map(c => `<a href="category-${c.slug}.html">${escape(c.name)}</a>`).join('')}
          </div>
          <div class="foot-col">
            <h5>nexus.ai</h5>
            <a href="stacks.html">Stacks</a>
            <a href="compare.html">Compare</a>
            <a href="new.html">New &amp; Updated</a>
            <a href="about.html">About</a>
            <a href="submit.html">Submit a tool</a>
          </div>
        </div>
        <div class="foot-bottom">
          <span>© nexus.ai 2026 — editorial AI directory</span>
          <span>v1.1 · ${TOOLS.length} tools live</span>
        </div>
      </div>`;
  }

  function renderNav(active) {
    const mount = $('[data-omni-nav]'); if (!mount) return;
    const link = (href, label, key) =>
      `<a href="${href}" class="${active===key?'is-active':''}">${escape(label)}</a>`;
    mount.innerHTML = `
      <a href="index.html" class="logo">
        <span class="logo-dot"></span>
        nexus.ai
      </a>
      <div class="nav-links">
        ${link('index.html#categories','Categories','categories')}
        ${link('category-chatbots.html','Directory','directory')}
        ${link('stacks.html','Stacks','stacks')}
        ${link('compare.html','Compare','compare')}
        ${link('new.html','New','new')}
        <a href="submit.html" class="nav-cta">Submit Tool</a>
      </div>`;
  }

  /* ---------- public entry ---------- */
  window.OMNI.render = {
    nav: renderNav,
    footer: renderFooter,
    category: renderCategory,
    tool: renderTool,
    compare: renderCompare,
    homeFeatured: renderHomeFeatured,
    homeCategories: renderHomeCategories,
    homeDirectory: renderHomeDirectory,
    homeStacks: renderHomeStacks,
    stacks: renderStacksPage,
    newPage: renderNewPage,
    wireHomeSearch,
    reveal,
  };

  // Auto-init nav + footer if their mounts exist
  document.addEventListener('DOMContentLoaded', () => {
    renderNav(document.body.dataset.page);
    renderFooter();
  });

  // Clear text selection when the user clicks outside selectable content.
  // (Browsers don't auto-clear when the mousedown lands on a user-select:none element.)
  const SELECTABLE = 'p, input, textarea, code, pre, .hero-sub, .page-sub, .section-desc, .dir-desc, .tool-blurb, .tool-summary, .foot-tagline, .note-card p, .form-help, a[href^="mailto:"]';
  document.addEventListener('mousedown', (e) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    if (!e.target.closest(SELECTABLE)) sel.removeAllRanges();
  });
})();
