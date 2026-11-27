// DealHound views: turns deal data into HTML for the card grid and the
// detail page. Every number shown is computed here from price and was, so
// the discount on screen always matches the two prices in data.js.

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function money(n) {
  return `$${Number(n).toLocaleString("en-US", {
    minimumFractionDigits: Number(n) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function discountPct(d) {
  return Math.round((1 - d.price / d.was) * 100);
}

export function savings(d) {
  return d.was - d.price;
}

// Honest verdict from the discount alone. No "new low" claim anywhere:
// no source we read called any of these an all-time low.
export function verdictFor(d) {
  const pct = discountPct(d);
  if (pct >= 50) return { label: "Strong deal", cls: "strong", note: `${pct}% off list price — a steep cut, worth grabbing while it lasts.` };
  if (pct >= 35) return { label: "Good deal", cls: "good", note: `${pct}% off list price — a solid saving on a popular item.` };
  return { label: "Routine sale", cls: "routine", note: `${pct}% off list price — a modest cut, the kind this item sees often.` };
}

function initials(title) {
  const words = title.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "?") + (words[1]?.[0] ?? words[0]?.[1] ?? "");
}

function storeClass(store) {
  return store.toLowerCase().replace(/[^a-z]/g, "");
}

export function dealCard(d) {
  const pct = discountPct(d);
  const v = verdictFor(d);
  return `<article class="card">
  <div class="thumb thumb-${storeClass(d.store)}" aria-hidden="true">${escapeHtml(initials(d.title))}</div>
  <div class="card-body">
    <div class="card-top">
      <span class="store store-${storeClass(d.store)}">${escapeHtml(d.store)}</span>
      <span class="cat">${escapeHtml(d.category)}</span>
    </div>
    <h3 class="card-title"><a href="#/deal/${encodeURIComponent(d.id)}">${escapeHtml(d.title)}</a></h3>
    <p class="prices"><span class="sale">${money(d.price)}</span> <s class="was">${money(d.was)}</s> <span class="off">−${pct}%</span></p>
    <p class="save">You save ${money(savings(d))}</p>
    <p><span class="verdict verdict-${v.cls}">${v.label}</span></p>
    <p class="checked">Checked 27 Nov 2026 · ${escapeHtml(d.source)}</p>
    <p class="card-actions">
      <a class="btn" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">View at ${escapeHtml(d.store)} ↗</a>
      <a class="details-link" href="#/deal/${encodeURIComponent(d.id)}">Details →</a>
    </p>
  </div>
</article>`;
}

export function dealCards(deals) {
  if (deals.length === 0) {
    return `<p class="empty">No deals match those filters. Try clearing the search or lowering the minimum discount.</p>`;
  }
  return deals.map(dealCard).join("\n");
}

// Other listings of the same product at a different store.
export function sameProduct(d, all) {
  return all.filter(
    (x) => x.id !== d.id && x.title === d.title,
  );
}

export function dealDetail(d, all) {
  const pct = discountPct(d);
  const v = verdictFor(d);
  const others = sameProduct(d, all);
  const compare = others.length
    ? `<section class="compare">
  <h2>Same product, another store</h2>
  ${others
    .map(
      (o) => `<p class="compare-row"><strong>${escapeHtml(o.store)}</strong> — ${money(o.price)} <s>${money(o.was)}</s> (${discountPct(o)}% off)
      <a href="#/deal/${encodeURIComponent(o.id)}">See this listing →</a></p>`,
    )
    .join("\n")}
  <p class="compare-note">Same price at both stores right now — pick the store whose shipping or returns suit you.</p>
</section>`
    : "";
  return `<p><a class="back" href="#/">← All 25 deals</a></p>
<article class="detail">
  <div class="thumb thumb-${storeClass(d.store)} thumb-big" aria-hidden="true">${escapeHtml(initials(d.title))}</div>
  <div>
    <div class="card-top">
      <span class="store store-${storeClass(d.store)}">${escapeHtml(d.store)}</span>
      <span class="cat">${escapeHtml(d.category)}</span>
      <span class="verdict verdict-${v.cls}">${v.label}</span>
    </div>
    <h1>${escapeHtml(d.title)}</h1>
    <p class="prices prices-big"><span class="sale">${money(d.price)}</span> <s class="was">${money(d.was)}</s> <span class="off">−${pct}%</span></p>
    <p class="save">You save ${money(savings(d))} off the ${money(d.was)} list price.</p>
    <p class="verdict-note">${v.note}</p>
    <dl class="facts">
      <div><dt>Store</dt><dd>${escapeHtml(d.store)}</dd></div>
      <div><dt>Category</dt><dd>${escapeHtml(d.category)}</dd></div>
      <div><dt>Sale price</dt><dd>${money(d.price)}</dd></div>
      <div><dt>Usual price</dt><dd>${money(d.was)}</dd></div>
      <div><dt>Discount</dt><dd>${pct}% off (${money(savings(d))} saved)</dd></div>
      <div><dt>Price checked</dt><dd>27 November 2026 (UTC)</dd></div>
      <div><dt>Where checked</dt><dd>${escapeHtml(d.source)}</dd></div>
    </dl>
    <p><a class="btn btn-big" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">View at ${escapeHtml(d.store)} ↗</a></p>
    <p class="fine">Prices change fast on Black Friday — confirm the price on the store page before you buy.</p>
  </div>
</article>
${compare}`;
}

export function notFound() {
  return `<h1>Deal not found</h1>
<p>There is no deal at this address. <a href="#/">See all 25 deals</a>.</p>`;
}
