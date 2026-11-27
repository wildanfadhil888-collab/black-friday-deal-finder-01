// DealHound app: hash routing (#/ list, #/deal/<id> detail), live search,
// category / store / minimum-discount filters and sorting. All filtering
// happens here in the DOM on every input change — the controls are real.

import { DEALS } from "./data.js";
import { dealCards, dealDetail, discountPct, notFound } from "./views.js";

const app = document.getElementById("app");
const grid = document.getElementById("grid");
const countEl = document.getElementById("count");
const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("category");
const storeEl = document.getElementById("store");
const minOffEl = document.getElementById("min-off");
const sortEl = document.getElementById("sort");
const clearEl = document.getElementById("clear-filters");
const listView = document.getElementById("list-view");
const heroEl = document.getElementById("hero");

const state = { q: "", category: "all", store: "all", minOff: 0, sort: "discount" };

function fillOptions() {
  const cats = [...new Set(DEALS.map((d) => d.category))].sort();
  const stores = [...new Set(DEALS.map((d) => d.store))].sort();
  for (const c of cats) {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    categoryEl.appendChild(o);
  }
  for (const s of stores) {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    storeEl.appendChild(o);
  }
}

function visibleDeals() {
  const q = state.q.trim().toLowerCase();
  let out = DEALS.filter((d) => {
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    if (state.category !== "all" && d.category !== state.category) return false;
    if (state.store !== "all" && d.store !== state.store) return false;
    if (discountPct(d) < state.minOff) return false;
    return true;
  });
  const by = {
    discount: (a, b) => discountPct(b) - discountPct(a) || a.price - b.price,
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    name: (a, b) => a.title.localeCompare(b.title),
  };
  out = [...out].sort(by[state.sort] || by.discount);
  return out;
}

function renderList() {
  const shown = visibleDeals();
  grid.innerHTML = dealCards(shown);
  countEl.textContent =
    shown.length === DEALS.length
      ? `Showing all ${DEALS.length} deals`
      : `Showing ${shown.length} of ${DEALS.length} deals`;
  document.title = "DealHound — Black Friday Deal Finder";
}

function renderStats() {
  const best = Math.max(...DEALS.map(discountPct));
  const saved = DEALS.reduce((s, d) => s + (d.was - d.price), 0);
  document.getElementById("stat-deals").textContent = String(DEALS.length);
  document.getElementById("stat-stores").textContent = String(new Set(DEALS.map((d) => d.store)).size);
  document.getElementById("stat-best").textContent = `−${best}%`;
  document.getElementById("stat-saved").textContent =
    `$${Math.round(saved).toLocaleString("en-US")}`;
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?#]+)/);
  if (match) {
    const found = DEALS.find((d) => d.id === decodeURIComponent(match[1]));
    listView.hidden = true;
    heroEl.hidden = true;
    app.hidden = false;
    app.innerHTML = found ? dealDetail(found, DEALS) : notFound();
    document.title = found ? `${found.title} | DealHound` : "Not found | DealHound";
  } else {
    app.hidden = true;
    heroEl.hidden = false;
    listView.hidden = false;
    renderList();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function bind() {
  searchEl.addEventListener("input", () => {
    state.q = searchEl.value;
    renderList();
  });
  categoryEl.addEventListener("change", () => {
    state.category = categoryEl.value;
    renderList();
  });
  storeEl.addEventListener("change", () => {
    state.store = storeEl.value;
    renderList();
  });
  minOffEl.addEventListener("change", () => {
    state.minOff = Number(minOffEl.value);
    renderList();
  });
  sortEl.addEventListener("change", () => {
    state.sort = sortEl.value;
    renderList();
  });
  clearEl.addEventListener("click", () => {
    state.q = "";
    state.category = "all";
    state.store = "all";
    state.minOff = 0;
    state.sort = "discount";
    searchEl.value = "";
    categoryEl.value = "all";
    storeEl.value = "all";
    minOffEl.value = "0";
    sortEl.value = "discount";
    renderList();
  });
}

fillOptions();
renderStats();
bind();
window.addEventListener("hashchange", render);
render();
