import {
  initializeApp, getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, getDoc, setDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, limit, writeBatch, arrayUnion,
} from "../vendor/firebase.js";
import { firebaseConfig } from "./config.js";
import { CATS, CAT, PLACES, UNITS, DEFAULT_STORES, QUICK, STAPLES, norm, guess, unitPrice, foodSVG } from "./foods.js";

const VERSION = "1.0.0";
const DAY = 864e5;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ls = {
  get(k, d) { try { const v = localStorage.getItem("refri:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("refri:" + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("refri:" + k); } catch {} },
};
const fmt = (n) => { n = Number(n) || 0; return Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString(); };
const mxn = (n) => "$" + Math.round(n || 0).toLocaleString("es-MX");
const stepOf = (u) => (["kg", "l"].includes(u) ? 0.5 : ["g", "ml"].includes(u) ? 100 : 1);
const ago = (ts) => {
  if (!ts) return "";
  const m = Math.round((Date.now() - ts) / 6e4);
  if (m < 1) return "ahora"; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24); if (d === 1) return "ayer";
  if (d < 7) return new Date(ts).toLocaleDateString("es-MX", { weekday: "long" });
  return new Date(ts).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

/* ---------- iconos ---------- */
const I = {
  fridge: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
};
const ic = (n, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const AV = [["#F2C94C", "#3A2E05"], ["#9CC9E8", "#0E2E46"], ["#E7A79A", "#47160C"], ["#B7D99A", "#1E3A0E"], ["#D3B8EE", "#2E1748"], ["#F4B67A", "#4A2408"]];

/* ---------- estado ---------- */
const S = {
  stage: "boot", user: null, profile: null, home: null,
  items: [], shop: [], log: [], pending: false, fromCache: true,
  view: "refri", place: "Todo", status: null, q: "", listStore: null, detail: null, added: {},
};
const prefs = Object.assign({ theme: "system", accent: "hierba", size: "normal" }, ls.get("prefs", {}));
let app, auth, db, unsubs = [];

/* ---------- arranque ---------- */
function readConfig() {
  if (firebaseConfig.apiKey) return firebaseConfig;
  const c = ls.get("cfg", null);
  return c && c.apiKey ? c : null;
}
const cfg = readConfig();
if (!cfg) { S.stage = "setup"; render(); }
else {
  app = initializeApp(cfg);
  auth = getAuth(app);
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  getRedirectResult(auth).catch((e) => authError(e));
  onAuthStateChanged(auth, (u) => {
    S.user = u; stopData();
    if (!u) { S.stage = "login"; render(); return; }
    S.stage = "loading"; render();
    unsubs.push(onSnapshot(doc(db, "users", u.uid), (snap) => {
      S.profile = snap.exists() ? snap.data() : null;
      if (S.profile?.hid) startHome(S.profile.hid);
      else if (!snap.metadata.fromCache || !navigator.onLine) { stopHome(); S.stage = "onboard"; render(); }
    }, (e) => { console.error(e); toast("No se pudo leer tu perfil"); }));
  });
}
let homeSubs = [], homeId = null;
function stopHome() { homeSubs.forEach((u) => u()); homeSubs = []; homeId = null; }
function stopData() { unsubs.forEach((u) => u()); unsubs = []; stopHome(); S.home = null; S.items = []; S.shop = []; S.log = []; }
function startHome(hid) {
  if (homeId === hid) return;
  stopHome(); homeId = hid;
  const base = ["households", hid];
  homeSubs.push(onSnapshot(doc(db, ...base), (snap) => {
    if (!snap.exists()) return;
    S.home = { id: hid, ...snap.data() };
    if (S.stage !== "app") { S.stage = "app"; render(); } else refresh();
  }, (e) => { console.error(e); if (e.code === "permission-denied") { toast("Ya no perteneces a ese hogar"); S.stage = "onboard"; render(); } }));
  const sub = (name, q, key) => homeSubs.push(onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
    S[key] = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    S.pending = snap.metadata.hasPendingWrites; S.fromCache = snap.metadata.fromCache;
    if (S.stage === "app") refresh();
  }, (e) => console.error(name, e)));
  sub("items", collection(db, ...base, "items"), "items");
  sub("shop", collection(db, ...base, "shop"), "shop");
  sub("log", query(collection(db, ...base, "log"), orderBy("at", "desc"), limit(800)), "log");
}
const col = (name) => collection(db, "households", homeId, name);
const ref = (name, id) => doc(db, "households", homeId, name, id);
const newId = (name) => doc(col(name)).id;
const fail = (e) => { console.error(e); toast(e?.code === "permission-denied" ? "No tienes permiso para ese cambio" : "No se pudo guardar"); };
const save = (name, id, data) => setDoc(ref(name, id), data, { merge: true }).catch(fail);
const remove = (name, id) => deleteDoc(ref(name, id)).catch(fail);
const me = () => S.user?.uid;

/* ---------- preferencias ---------- */
function applyPrefs() {
  const r = document.documentElement;
  if (prefs.theme === "system") delete r.dataset.theme; else r.dataset.theme = prefs.theme;
  r.dataset.accent = prefs.accent; r.dataset.size = prefs.size;
  ls.set("prefs", prefs);
}
applyPrefs();

/* ---------- utilidades de datos ---------- */
const stores = () => (S.home?.stores?.length ? S.home.stores : DEFAULT_STORES);
const nameOf = (uid) => (uid === me() ? "Tú" : S.home?.names?.[uid] || "Alguien");
const avOf = (uid) => {
  const ids = S.home?.members || [];
  const i = Math.max(0, ids.indexOf(uid)) % AV.length;
  const n = (S.home?.names?.[uid] || "?").trim();
  return `<span class="av" style="background:${AV[i][0]};color:${AV[i][1]}">${esc(n.slice(0, 2))}</span>`;
};
function rateFor(name) {
  const n = norm(name), since = Date.now() - 30 * DAY;
  const ev = S.log.filter((l) => l.n === n && l.at > since && l.d < 0);
  if (ev.length < 2) return 0;
  const used = ev.reduce((a, l) => a - l.d, 0);
  const span = Math.max(7, (Date.now() - Math.min(...ev.map((l) => l.at))) / DAY);
  return used / span;
}
function daysTo(d) { if (!d) return null; return Math.ceil((new Date(d + "T23:59:59") - Date.now()) / DAY); }
function status(it) {
  const q = Number(it.qty) || 0, min = Number(it.min) || 0, r = rateFor(it.name), exp = daysTo(it.exp);
  const left = r > 0 && q > 0 ? q / r : null;
  return { q, min, r, exp, left, out: q <= 0, low: q > 0 && q <= min, soon: left != null && left <= 2 && q > min, expSoon: exp != null && exp <= 3 && q > 0 };
}
function tagFor(it, s = status(it)) {
  if (s.out) return ["bad", "Se acabó"];
  if (s.exp != null && s.exp < 0 && s.q > 0) return ["bad", "Caducó"];
  if (s.expSoon) return ["info", s.exp === 0 ? "Caduca hoy" : s.exp === 1 ? "Caduca mañana" : `Caduca en ${s.exp} d`];
  if (s.low) return ["warn", "Queda poco"];
  if (s.soon) return ["warn", `≈ ${Math.max(1, Math.round(s.left))} día${Math.round(s.left) > 1 ? "s" : ""}`];
  if (s.left != null) return ["ok", s.left >= 14 ? `≈ ${Math.round(s.left / 7)} sem` : `≈ ${Math.round(s.left)} días`];
  return ["ok", "Bien"];
}
const listed = (name) => S.shop.some((s) => !s.done && norm(s.name) === norm(name));

/* ---------- acciones ---------- */
const qtyTimers = {};
function changeQty(id, dir) {
  const it = S.items.find((x) => x.id === id); if (!it) return;
  const old = Number(it.qty) || 0;
  const nq = Math.max(0, Math.round((old + dir * stepOf(it.unit)) * 100) / 100);
  if (nq === old) return;
  it.qty = nq; it.at = Date.now(); it.by = me();
  refresh();
  const t = (qtyTimers[id] ??= { d: 0, h: 0 });
  t.d += nq - old; clearTimeout(t.h);
  t.h = setTimeout(() => {
    const d = Math.round(t.d * 100) / 100; delete qtyTimers[id];
    save("items", id, { qty: it.qty, at: it.at, by: me() });
    logMove(it.name, d);
    if (it.qty <= 0 && !listed(it.name)) toast(`Se acabó ${it.name}`, "A la lista", () => toList(it));
  }, 650);
}
function logMove(name, d) {
  if (!d) return;
  const id = newId("log");
  save("log", id, { n: norm(name), d, at: Date.now(), by: me() });
}
function upsertItem(d) {
  const ex = S.items.find((i) => norm(i.name) === norm(d.name));
  if (ex) {
    const nq = (Number(ex.qty) || 0) + (Number(d.qty) || 0);
    save("items", ex.id, { qty: nq, at: Date.now(), by: me() }); logMove(ex.name, nq - (Number(ex.qty) || 0));
    return ex.id;
  }
  const g = guess(d.name), id = newId("items");
  const item = {
    name: d.name.trim(), cat: d.cat || g.cat, unit: d.unit || g.unit, qty: Number(d.qty) || 0,
    min: d.min != null ? Number(d.min) : Math.max(stepOf(d.unit || g.unit), 1), place: d.place || g.place,
    store: d.store || g.store || stores()[0], exp: d.exp || "", note: d.note || "", price: d.price ? Number(d.price) : null,
    at: Date.now(), by: me(),
  };
  save("items", id, item); logMove(item.name, item.qty);
  return id;
}
function toList(it, qty) {
  const s = status(it);
  const need = qty ?? Math.max(stepOf(it.unit), Math.ceil(Math.max(s.min * 2, s.r * 7 + s.min) - s.q));
  addShop({ name: it.name, cat: it.cat, unit: it.unit, store: it.store, qty: need });
  toast(`${it.name} va a la lista`);
}
function addShop(d) {
  const ex = S.shop.find((s) => !s.done && norm(s.name) === norm(d.name));
  if (ex) { save("shop", ex.id, { qty: d.qty || ex.qty, store: d.store || ex.store }); return; }
  const g = guess(d.name), k = S.items.find((i) => norm(i.name) === norm(d.name));
  const id = newId("shop");
  save("shop", id, {
    name: d.name.trim(), cat: d.cat || k?.cat || g.cat, unit: d.unit || k?.unit || g.unit, qty: Number(d.qty) || 0,
    store: d.store || k?.store || g.store || stores()[0], done: false, at: Date.now(), by: me(),
  });
}
function parseQuick(text) {
  // "1 kg de limón", "3 jitomates", "leche"
  const m = text.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|pza|pzas|piezas?|paquetes?|bolsas?|latas?|cajas?|manojos?)?\s*(?:de\s+)?(.+)$/i);
  if (!m) return { name: text.trim() };
  let unit = (m[2] || "").toLowerCase();
  unit = unit.startsWith("pz") || unit.startsWith("pie") ? "pza" : unit.replace(/s$/, "");
  return { qty: parseFloat(m[1].replace(",", ".")), unit: unit || undefined, name: m[3].trim().replace(/^\w/, (c) => c.toUpperCase()) };
}

/* ---------- plan de compra (sin IA de pago) ---------- */
function plan() {
  const out = [];
  for (const it of S.items) {
    const s = status(it);
    const needed = s.out || s.low || s.soon || s.expSoon || (s.left != null && s.left <= 7);
    if (!needed) continue;
    const step = stepOf(it.unit);
    const target = Math.max(s.min * 2, s.r * 7 + s.min, step);
    let need = Math.ceil((target - s.q) / step) * step;
    if (s.expSoon && !s.out && !s.low) need = Math.max(need, 0);
    const pr = s.out ? "Urgente" : s.low || s.soon ? "Pronto" : "Planea";
    const why = s.out ? "Se acabó" : s.low ? `Quedan ${fmt(s.q)} ${it.unit}` : s.soon ? `Alcanza ≈ ${Math.max(1, Math.round(s.left))} día(s)` : s.expSoon ? `El de ahora caduca ${s.exp <= 0 ? "hoy" : s.exp === 1 ? "mañana" : "en " + s.exp + " días"}` : `Alcanza ≈ ${Math.round(s.left)} días`;
    if (need <= 0 && !s.expSoon) continue;
    const up = unitPrice(it);
    out.push({ it, need: Math.max(need, step), pr, why, price: up != null ? up * Math.max(need, step) : null, rank: s.out ? 0 : s.low || s.soon ? 1 : 2 });
  }
  return out.sort((a, b) => a.rank - b.rank || a.it.name.localeCompare(b.it.name, "es"));
}
function trend() {
  const now = Date.now(), a = {}, b = {};
  for (const l of S.log) {
    if (l.d >= 0) continue;
    if (l.at > now - 7 * DAY) a[l.n] = (a[l.n] || 0) - l.d;
    else if (l.at > now - 14 * DAY) b[l.n] = (b[l.n] || 0) - l.d;
  }
  return Object.keys(a).filter((k) => b[k] && a[k] > b[k] * 1.25).map((k) => S.items.find((i) => norm(i.name) === k)?.name).filter(Boolean).slice(0, 2);
}

/* ---------- render ---------- */
function render() {
  const el = $("#app");
  if (S.stage === "boot" || S.stage === "loading") { el.innerHTML = `<div class="boot"><div class="boot-logo"></div></div>`; return; }
  if (S.stage === "setup") return renderSetup(el);
  if (S.stage === "login") return renderLogin(el);
  if (S.stage === "onboard") return renderOnboard(el);
  mountView();
}
function refresh() {
  if (S.stage !== "app") return;
  if (S.view === "refri") updRefri();
  else if (S.view === "lista") updLista();
  else if (S.view === "ideas") updIdeas();
  else if (S.view === "ajustes") updAjustes();
  else if (S.view === "detail") updDetail();
  updNav();
}
function go(view, extra) {
  S.view = view; if (view === "detail") S.detail = extra;
  mountView(); window.scrollTo(0, 0);
}
function mountView() {
  const el = $("#app");
  const v = S.view;
  const nav = v === "detail" ? "" : navHTML();
  if (v === "refri") el.innerHTML = refriHTML() + nav;
  if (v === "lista") el.innerHTML = listaHTML() + nav;
  if (v === "ideas") el.innerHTML = `<main class="screen" id="ideas"></main>` + nav;
  if (v === "ajustes") el.innerHTML = ajustesHTML() + nav;
  if (v === "detail") el.innerHTML = `<main class="detail" id="detail"></main>`;
  refresh();
}
function navHTML() {
  const b = (v, icn, label) => `<button data-go="${v}" ${S.view === v ? 'aria-current="page"' : ""}>${ic(icn)}${label}${v === "lista" ? '<span class="badge" id="shopBadge" hidden></span>' : v === "ideas" ? '<span class="badge" id="ideaBadge" hidden></span>' : ""}</button>`;
  return `<div class="fade-bottom"></div><nav class="nav" aria-label="Secciones">${b("refri", "fridge", "Refri")}${b("lista", "cart", "Lista")}<button class="fab" data-act="add" aria-label="Agregar alimento">${ic("plus")}</button>${b("ideas", "spark", "Ideas")}${b("ajustes", "gear", "Ajustes")}</nav>`;
}
function updNav() {
  const sb = $("#shopBadge"), ib = $("#ideaBadge");
  const n = S.shop.filter((s) => !s.done).length;
  if (sb) { sb.hidden = !n; sb.textContent = n; }
  const k = S.items.filter((i) => { const s = status(i); return s.out || s.low || s.expSoon; }).length;
  if (ib) { ib.hidden = !k; ib.textContent = k; }
}
function syncHTML() {
  const off = !navigator.onLine;
  const txt = off ? (S.pending ? "Sin señal · guardado aquí" : "Sin señal") : S.pending ? "Guardando…" : "Sincronizado";
  return `<span class="sync ${off ? "off" : ""}"><i></i>${txt}</span>`;
}

/* ----- Refri ----- */
function refriHTML() {
  let today = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }); today = today[0].toUpperCase() + today.slice(1);
  return `<main class="screen">
    <div class="top">
      <div><div class="sub">${esc(today)}</div><h1 id="homeName"></h1></div>
      <div class="who"><div class="avatars" id="avatars"></div><span id="sync"></span></div>
    </div>
    <div class="search">
      <label>${ic("search")}<span class="sr">Buscar alimento</span><input id="q" type="search" placeholder="¿Queda jitomate?" autocomplete="off" value="${esc(S.q)}"></label>
    </div>
    <div class="stats" id="stats"></div>
    <div class="chips" id="places"></div>
    <div id="shelves" style="display:flex;flex-direction:column;gap:10px"></div>
  </main>`;
}
function updRefri() {
  $("#homeName").textContent = S.home?.name || "Nuestro refri";
  $("#avatars").innerHTML = (S.home?.members || []).slice(0, 5).map(avOf).join("");
  $("#sync").innerHTML = syncHTML();
  let out = 0, low = 0, exp = 0;
  S.items.forEach((i) => { const s = status(i); if (s.out) out++; else if (s.low || s.soon) low++; if (s.expSoon) exp++; });
  const st = (k, n, l) => `<button class="stat ${k === "out" ? "bad" : k === "low" ? "warn" : "info"}" data-status="${k}" aria-pressed="${S.status === k}"><b>${n}</b><span>${l}</span></button>`;
  $("#stats").innerHTML = st("out", out, "Se acabó") + st("low", low, "Queda poco") + st("exp", exp, "Caduca pronto");
  const counts = {}; S.items.forEach((i) => (counts[i.place || "Refri"] = (counts[i.place || "Refri"] || 0) + 1));
  $("#places").innerHTML = ["Todo", ...PLACES].map((p) => `<button class="chip" data-place="${p}" aria-pressed="${S.place === p}">${p}${p !== "Todo" && counts[p] ? ` <small>${counts[p]}</small>` : ""}</button>`).join("");

  const box = $("#shelves");
  if (!S.items.length) {
    box.innerHTML = `<div class="empty"><h1 style="font-size:1.4rem">Tu refri está vacío</h1><p>Toca lo que tengan en casa para agregarlo. Toda la familia lo verá al instante.</p>
      <div class="qgrid">${QUICK.map((n) => `<button class="qbtn" data-quick="${esc(n)}">${foodSVG(n, guess(n).cat, 44)}${esc(n)}</button>`).join("")}</div></div>`;
    return;
  }
  const q = norm(S.q);
  let list = S.items.filter((i) => (S.place === "Todo" || (i.place || "Refri") === S.place) && (!q || norm(i.name).includes(q)));
  if (S.status) list = list.filter((i) => { const s = status(i); return S.status === "out" ? s.out : S.status === "low" ? !s.out && (s.low || s.soon) : s.expSoon; });
  if (!list.length) {
    box.innerHTML = `<div class="empty"><p>No hay nada que coincida.</p>${q ? `<button class="btn soft" data-newname="${esc(S.q)}">${ic("plus")} Agregar “${esc(S.q)}”</button>` : ""}</div>`;
    return;
  }
  const by = {}; list.forEach((i) => (by[i.cat || "otros"] ??= []).push(i));
  box.innerHTML = CATS.filter((c) => by[c.id]).map((c) => {
    const rows = by[c.id].sort((a, b) => { const sa = status(a), sb = status(b); return sb.out - sa.out || (sb.low || sb.soon) - (sa.low || sa.soon) || a.name.localeCompare(b.name, "es"); });
    return `<section class="shelf"><div class="shelf-head"><h2 class="cap">${esc(c.name)}</h2><span class="sub">${rows.length}</span></div>
      <div class="shelf-row">${rows.map(tileHTML).join("")}</div><div class="shelf-glass"></div></section>`;
  }).join("");
}
function tileHTML(it) {
  const [k, t] = tagFor(it);
  return `<button class="tile" data-open="${esc(it.id)}">${foodSVG(it.name, it.cat, 56)}<span class="nm">${esc(it.name)}</span><span class="qt">${fmt(it.qty)} ${esc(it.unit || "pza")}</span><span class="tag ${k}">${esc(t)}</span></button>`;
}

/* ----- Detalle ----- */
function updDetail() {
  const it = S.items.find((i) => i.id === S.detail);
  const el = $("#detail");
  if (!it) { el.innerHTML = `<div class="screen"><button class="iconbtn" data-go="refri" aria-label="Volver">${ic("back")}</button><p class="muted">Este alimento ya no existe.</p></div>`; return; }
  const s = status(it), [tk, tt] = tagFor(it, s);
  const days = []; const n = norm(it.name);
  for (let i = 6; i >= 0; i--) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - i);
    const end = +start + DAY;
    days.push(S.log.filter((l) => l.n === n && l.d < 0 && l.at >= +start && l.at < end).reduce((a, l) => a - l.d, 0));
  }
  const mx = Math.max(...days, 1);
  const dn = ["D", "L", "M", "M", "J", "V", "S"];
  const labels = days.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return dn[d.getDay()]; }).join(" ");
  const left = s.out ? "Ya no hay" : s.left != null ? (s.left < 1 ? "Menos de 1 día" : `Alcanza ≈ ${Math.round(s.left)} día${Math.round(s.left) > 1 ? "s" : ""}`) : "Aún aprendiendo";
  const rateTxt = s.r > 0 ? `Usan ~${fmt(s.r)} ${it.unit} al día. ` : "Con unos días de uso calculo cuánto les dura. ";
  const up = unitPrice(it);
  const moves = S.log.filter((l) => l.n === n).slice(0, 5);
  el.innerHTML = `<div class="hero">
      <div class="bar"><button class="iconbtn sm glass" data-go="refri" aria-label="Volver al refri">${ic("back")}</button><button class="iconbtn sm glass" data-edit="${esc(it.id)}" aria-label="Editar">${ic("edit")}</button></div>
      <h1>${esc(it.name)}</h1><span class="sub">${esc(CAT[it.cat]?.name || "Otros")} · ${esc(it.place || "Refri")}</span>
      <div class="plate">${foodSVG(it.name, it.cat, 128)}</div>
      <div class="stepper"><button data-qty="-1" aria-label="Quitar">−</button><output aria-live="polite">${fmt(it.qty)} <small>${esc(it.unit)}</small></output><button class="plus" data-qty="1" aria-label="Sumar">+</button></div>
    </div>
    <div class="screen" style="padding-top:18px;padding-bottom:calc(110px + var(--safe-b))">
      <div class="card usage">
        <div style="flex:1;display:flex;flex-direction:column;gap:2px;min-width:0"><span class="tag ${tk}" style="align-self:flex-start">${esc(tt)}</span>
          <b style="font-family:var(--f-display);font-size:1.4rem">${esc(left)}</b>
          <span class="sub">${esc(rateTxt)}Avisa al llegar a ${fmt(it.min)}.</span></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div class="bars" role="img" aria-label="Consumo de los últimos 7 días">${days.map((d, i) => `<i class="${i === 6 ? "today" : ""}" style="height:${8 + Math.round((d / mx) * 44)}px"></i>`).join("")}</div><span class="cap" style="font-size:.62rem">${labels}</span></div>
      </div>
      <div class="grid2">
        <button class="info" data-edit="${esc(it.id)}"><span>Se compra en</span><b>${esc(it.store || "—")}</b></button>
        <button class="info" data-edit="${esc(it.id)}"><span>Precio aprox.</span><b>${up != null ? mxn(up) + " / " + esc(it.unit) : "Agregar"}</b></button>
        <button class="info" data-edit="${esc(it.id)}"><span>Caduca</span><b>${it.exp ? new Date(it.exp + "T12:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "Sin fecha"}</b></button>
        <div class="info"><span>Lo movió</span><b>${esc(nameOf(it.by))} · ${esc(ago(it.at))}</b></div>
      </div>
      ${it.note ? `<p class="note">📝 ${esc(it.note)}</p>` : ""}
      <h2 class="cap">Movimientos</h2>
      <div class="moves">${moves.length ? moves.map((l) => `<div class="move">${avOf(l.by)}<span class="t"><b>${esc(nameOf(l.by))}</b> ${l.d < 0 ? "usó" : "agregó"} ${fmt(Math.abs(l.d))} ${esc(it.unit)}</span><time>${esc(ago(l.at))}</time></div>`).join("") : `<p class="note">Aún no hay movimientos.</p>`}</div>
    </div>
    <div style="position:fixed;left:0;right:0;bottom:calc(16px + var(--safe-b));display:flex;justify-content:center;z-index:5"><div style="width:min(520px,calc(100% - 40px))">
      ${listed(it.name) ? `<button class="btn big dark" data-go="lista">Ya está en la lista · ver<span class="dot">${ic("check")}</span></button>` : `<button class="btn big dark" data-tolist="${esc(it.id)}">Agregar a la lista<span class="dot">${ic("plus")}</span></button>`}
    </div></div>`;
}

/* ----- Lista ----- */
function listaHTML() {
  return `<main class="screen" style="padding-bottom:calc(200px + var(--safe-b))">
    <div class="top" style="align-items:center"><h1>Lista de compras</h1><button class="btn dark" data-act="pdf" style="min-height:44px">${ic("doc")}PDF</button></div>
    <span class="sub" id="listSum" style="margin-top:-10px"></span>
    <form class="addbar" id="shopForm"><label class="sr" for="shopIn">Agregar a la lista</label>
      <input id="shopIn" placeholder="Ej. 1 kg de limón" autocomplete="off" enterkeyhint="done" list="known">
      <button class="go" aria-label="Agregar">${ic("plus")}</button></form>
    <datalist id="known"></datalist>
    <div class="chips" id="storeTabs" role="tablist" aria-label="Tiendas"></div>
    <div id="lgroups" style="display:flex;flex-direction:column;gap:14px"></div>
    <button class="btn soft" data-act="missing">${ic("spark")} Agregar lo que falta en el refri</button>
  </main>
  <div class="listfoot"><div><div class="totalline" id="listFoot"></div><button class="btn big dark" data-act="tofridge">Pasar comprados al refri<span class="dot">${ic("fridge")}</span></button></div></div>`;
}
function storeOf(s) { const st = stores(); return st.includes(s.store) ? s.store : s.store || st[0]; }
function updLista() {
  const st = stores();
  const order = [...st, ...new Set(S.shop.map(storeOf).filter((x) => !st.includes(x)))];
  if (!S.listStore || !order.includes(S.listStore)) S.listStore = order.find((x) => S.shop.some((s) => storeOf(s) === x && !s.done)) || order[0];
  const total = S.shop.reduce((a, s) => a + (estPrice(s) || 0), 0);
  const pend = S.shop.filter((s) => !s.done).length;
  $("#listSum").innerHTML = `${pend} pendiente${pend === 1 ? "" : "s"} · gasto aprox. <b style="color:var(--ink)">${mxn(total)} MXN</b>`;
  $("#known").innerHTML = [...new Set([...S.items.map((i) => i.name), ...QUICK])].map((n) => `<option value="${esc(n)}">`).join("");
  $("#storeTabs").innerHTML = order.map((x) => { const n = S.shop.filter((s) => storeOf(s) === x && !s.done).length; return `<button class="chip" role="tab" aria-selected="${x === S.listStore}" data-store="${esc(x)}">${esc(x)} <small>${n}</small></button>`; }).join("");
  const rows = S.shop.filter((s) => storeOf(s) === S.listStore);
  const box = $("#lgroups");
  if (!rows.length) box.innerHTML = `<div class="empty"><p>Nada pendiente en <b>${esc(S.listStore)}</b>. Escribe arriba lo que falta, o toca <b>Agregar lo que falta</b>.</p></div>`;
  else {
    const by = {}; rows.forEach((r) => (by[r.cat || "otros"] ??= []).push(r));
    box.innerHTML = CATS.filter((c) => by[c.id]).map((c) => `<div class="lgroup"><h2 class="cap">${esc(c.name)}</h2><div class="lcard">${by[c.id].sort((a, b) => a.done - b.done || a.name.localeCompare(b.name, "es")).map((r) => {
      const p = estPrice(r);
      return `<div class="litem ${r.done ? "done" : ""}">
        <button class="check" role="checkbox" aria-checked="${!!r.done}" data-toggle="${esc(r.id)}" aria-label="Comprado: ${esc(r.name)}"><span>${ic("check")}</span></button>
        ${foodSVG(r.name, r.cat, 34)}
        <button class="txt" data-editshop="${esc(r.id)}" style="border:0;background:none;text-align:left;padding:0"><b>${esc(r.name)}${r.qty ? ` · ${fmt(r.qty)} ${esc(r.unit || "")}` : ""}</b><span>${esc(nameOf(r.by))} · ${esc(ago(r.at))}</span></button>
        ${p ? `<span class="pr">≈ ${mxn(p)}</span>` : ""}
        <button class="x" data-rmshop="${esc(r.id)}" aria-label="Quitar ${esc(r.name)}">${ic("x")}</button></div>`;
    }).join("")}</div></div>`).join("");
  }
  const sub = rows.reduce((a, s) => a + (estPrice(s) || 0), 0), done = rows.filter((r) => r.done).length;
  $("#listFoot").innerHTML = `<span>${esc(S.listStore)} · ${done} de ${rows.length} en el carrito</span><b>≈ ${mxn(sub)}</b>`;
}
function estPrice(s) { const up = unitPrice(s); return up != null && s.qty ? up * s.qty : null; }

/* ----- Ideas ----- */
function updIdeas() {
  const p = plan(), tr = trend();
  const urg = p.filter((x) => x.pr === "Urgente").length;
  const total = p.reduce((a, x) => a + (x.price || 0), 0);
  const pending = p.filter((x) => !listed(x.it.name));
  const missing = STAPLES.filter((n) => !S.items.some((i) => norm(i.name) === norm(n)) && !listed(n));
  let msg;
  if (!S.items.length) msg = "Agrega lo que hay en tu refri y aquí te diré qué comprar y cuánto gastarías.";
  else if (!p.length) msg = "Todo bien por ahora. Nada se acaba esta semana. 👌";
  else msg = `${tr.length ? `Esta semana usaron más ${tr.join(" y ").toLowerCase()} de lo normal. ` : ""}${urg ? `${urg} cosa${urg > 1 ? "s" : ""} ya se acabó. ` : ""}Con ${p.length} producto${p.length > 1 ? "s" : ""} cubren aprox. una semana.`;
  $("#ideas").innerHTML = `<div class="top" style="align-items:center"><h1>¿Qué comprar<br>esta semana?</h1></div>
    <div class="aicard"><div class="cap">${ic("spark")}Recomendado para tu familia</div><p>${esc(msg)}</p>
      ${p.length ? `<div class="row" style="justify-content:space-between;align-items:flex-end;flex-wrap:wrap"><div style="display:flex;flex-direction:column"><span class="lbl">Gasto estimado</span><span class="amt">≈ ${mxn(total)} MXN</span></div>
      <button class="btn" data-act="addplan" ${pending.length ? "" : "disabled"}>${pending.length ? `Agregar ${pending.length} a la lista` : "Todo en la lista"}<span class="dot">${ic(pending.length ? "plus" : "check")}</span></button></div>` : ""}
    </div>
    ${p.length ? `<h2 class="cap">Recomendaciones</h2><div style="display:flex;flex-direction:column;gap:8px">${p.map((x) => {
      const inL = listed(x.it.name);
      const cls = x.pr === "Urgente" ? "bad" : x.pr === "Pronto" ? "warn" : "info";
      return `<div class="sug"><div class="pic">${foodSVG(x.it.name, x.it.cat, 40)}</div><div class="txt"><div class="row" style="gap:6px"><b>${esc(x.it.name)}</b><span class="tag ${cls}">${x.pr}</span></div><span>${esc(x.why)}</span><em>${fmt(x.need)} ${esc(x.it.unit)} · ${esc(x.it.store || stores()[0])}${x.price ? ` · ≈ ${mxn(x.price)}` : ""}</em></div>
        <button class="add" aria-pressed="${inL}" data-plan="${esc(x.it.id)}" data-need="${x.need}" aria-label="${inL ? "Ya está en la lista" : "Agregar " + esc(x.it.name)}">${ic(inL ? "check" : "plus")}</button></div>`;
    }).join("")}</div>` : ""}
    ${missing.length ? `<h2 class="cap">Básicos que no tienen registrados</h2><div class="chips">${missing.map((n) => `<button class="chip" data-staple="${esc(n)}">${ic("plus")} ${esc(n)}</button>`).join("")}</div>` : ""}
    <p class="note">Cantidades y precios son aproximados. Se calculan con lo que hay en el refri y lo que la familia usó las últimas semanas. Puedes poner el precio real de cada alimento al editarlo.</p>`;
}

/* ----- Ajustes ----- */
function ajustesHTML() {
  const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-pref="${k}" data-v="${v}" aria-pressed="${prefs[k] === v}">${l}</button>`).join("")}</div>`;
  const acc = [["hierba", "#3D7A2C"], ["jitomate", "#B93A27"], ["mandarina", "#A85A0C"], ["mora", "#6A4C9E"], ["mar", "#23698C"]];
  return `<main class="screen"><h1>Ajustes</h1>
    <section class="set"><h2>Tu hogar</h2>
      <div class="fl"><label for="homeIn">Nombre</label><div class="row"><input class="field" id="homeIn" maxlength="40" value="${esc(S.home?.name || "")}"><button class="btn soft" data-act="homename">Guardar</button></div></div>
      <div class="fl"><span class="lbl">Código para unirse</span><div class="row" style="justify-content:space-between"><span class="code" id="code"></span><button class="btn soft" data-act="copycode">${ic("copy")} Copiar</button></div>
        <p class="note">Tu familia instala la app, entra con su cuenta y escribe este código.</p></div>
      <div class="fl"><span class="lbl">Integrantes</span><div id="members" style="display:flex;flex-direction:column;gap:8px"></div></div>
    </section>
    <section class="set"><h2>Dónde compran</h2><div class="storechips" id="storeChips"></div>
      <form class="row" id="storeForm"><label class="sr" for="storeIn">Nueva tienda</label><input class="field" id="storeIn" placeholder="Ej. Soriana, tianguis" maxlength="30"><button class="btn soft">Añadir</button></form></section>
    <section class="set"><h2>Apariencia</h2>
      <div class="fl"><span class="lbl">Tema</span>${seg("theme", [["system", "Automático"], ["light", "Claro"], ["dark", "Oscuro"]])}</div>
      <div class="fl"><span class="lbl">Color</span><div class="swatches">${acc.map(([k, c]) => `<button class="sw" data-pref="accent" data-v="${k}" aria-pressed="${prefs.accent === k}" aria-label="Color ${k}" style="background:${c}"></button>`).join("")}</div></div>
      <div class="fl"><span class="lbl">Tamaño de letra</span>${seg("size", [["normal", "Normal"], ["grande", "Grande"]])}</div>
    </section>
    <section class="set"><h2>Tu cuenta</h2><p class="note">${esc(S.user?.email || "")}</p>
      <div class="row wrap"><button class="btn" data-act="signout">Cerrar sesión</button><button class="btn danger" data-act="leave">Salir de este hogar</button></div>
      <div id="leaveConfirm" class="confirm" hidden>¿Salir del hogar? Dejarás de ver el refri.<button class="btn danger" data-act="leaveyes" style="min-height:40px">Sí, salir</button><button class="btn" data-act="leaveno" style="min-height:40px">No</button></div>
      <p class="note">Refri Familiar ${VERSION} · funciona sin internet y se sincroniza al volver la señal.</p></section>
  </main>`;
}
function updAjustes() {
  $("#code").textContent = S.home?.code || "—";
  $("#members").innerHTML = (S.home?.members || []).map((u) => `<div class="member">${avOf(u)}${esc(S.home?.names?.[u] || "Integrante")}${u === me() ? ' <span class="sub">(tú)</span>' : ""}</div>`).join("");
  $("#storeChips").innerHTML = stores().map((s) => `<span>${esc(s)}<button data-rmstore="${esc(s)}" aria-label="Quitar ${esc(s)}">${ic("x")}</button></span>`).join("");
  if (document.activeElement !== $("#homeIn")) $("#homeIn").value = S.home?.name || "";
}

/* ---------- hojas (sheets) ---------- */
function openSheet(html, onMount) {
  const root = $("#sheet-root");
  root.innerHTML = `<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#scrim").addEventListener("click", (e) => { if (e.target.id === "scrim") closeSheet(); });
  onMount?.(root);
}
function closeSheet() { $("#sheet-root").innerHTML = ""; }
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#scrim")) closeSheet(); });

function itemSheet(id, prefill = "") {
  const it = id ? S.items.find((i) => i.id === id) : null;
  const st = { name: it?.name || prefill, qty: it ? Number(it.qty) : 1, unit: it?.unit || guess(prefill).unit, place: it?.place || guess(prefill).place };
  const opt = (arr, v) => arr.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? "selected" : ""}>${esc(l)}</option>`).join("");
  const g = guess(st.name);
  openSheet(`<div class="grip"></div>
    <div class="head"><h1>${it ? "Editar alimento" : "Agregar al refri"}</h1><button class="iconbtn sm" data-close aria-label="Cerrar">${ic("x")}</button></div>
    ${it ? "" : `<div class="fl"><span class="lbl">Lo más frecuente</span><div class="qgrid" id="qgrid">${QUICK.slice(0, 8).map((n) => `<button type="button" class="qbtn" data-pick="${esc(n)}" aria-pressed="${norm(n) === norm(st.name)}">${foodSVG(n, guess(n).cat, 40)}${esc(n)}</button>`).join("")}</div></div>`}
    <form id="itemForm" style="display:flex;flex-direction:column;gap:14px">
      <div class="fl"><label for="fName">${it ? "Nombre" : "O escribe otro"}</label><input class="field" id="fName" required value="${esc(st.name)}" placeholder="Ej. Chiles serranos" autocomplete="off"></div>
      <div class="row" style="justify-content:space-between">
        <div class="mini-step"><button type="button" data-st="-1" aria-label="Menos">−</button><label class="sr" for="fQty">Cantidad</label><input id="fQty" inputmode="decimal" value="${fmt(st.qty)}"><button type="button" class="plus" data-st="1" aria-label="Más">+</button></div>
        <div class="fl" style="flex:1"><label class="sr" for="fUnit">Unidad</label><select class="field" id="fUnit">${opt(UNITS.map((u) => [u, u]), st.unit)}</select></div>
      </div>
      <div class="fl"><span class="lbl">¿Dónde lo guardas?</span><div class="chips" id="fPlace" style="flex-wrap:wrap;margin:0;padding:0">${PLACES.map((p) => `<button type="button" class="chip" data-place="${p}" aria-pressed="${p === st.place}">${p}</button>`).join("")}</div></div>
      <div class="grid2">
        <div class="fl"><label for="fMin">Avísame si quedan</label><input class="field" id="fMin" inputmode="decimal" value="${fmt(it?.min ?? stepOf(st.unit))}"></div>
        <div class="fl"><label for="fCat">Categoría</label><select class="field" id="fCat">${opt(CATS.map((c) => [c.id, c.name]), it?.cat || g.cat)}</select></div>
        <div class="fl"><label for="fStore">Se compra en</label><select class="field" id="fStore">${opt(stores().map((s) => [s, s]), it?.store || g.store || stores()[0])}</select></div>
        <div class="fl"><label for="fPrice">Precio por unidad</label><input class="field" id="fPrice" inputmode="decimal" placeholder="${unitPrice({ name: st.name, unit: st.unit }) != null ? "≈ " + mxn(unitPrice({ name: st.name, unit: st.unit })) : "$"}" value="${it?.price ?? ""}"></div>
        <div class="fl"><label for="fExp">Caduca</label><input class="field" id="fExp" type="date" value="${esc(it?.exp || "")}"></div>
        <div class="fl"><label for="fNote">Nota</label><input class="field" id="fNote" maxlength="60" value="${esc(it?.note || "")}" placeholder="Ej. el de marca"></div>
      </div>
      ${it ? `<div id="delBox" class="confirm" hidden>¿Borrar ${esc(it.name)}?<button type="button" class="btn danger" id="delYes" style="min-height:40px">Sí, borrar</button><button type="button" class="btn" id="delNo" style="min-height:40px">No</button></div>` : ""}
      <button class="btn big dark" id="saveBtn"><span id="saveLbl"></span><span class="dot">${ic("check")}</span></button>
      ${it ? `<button type="button" class="btn danger" id="delBtn">Borrar alimento</button>` : ""}
    </form>`, (root) => {
    const f = (s) => root.querySelector(s);
    const lbl = () => { f("#saveLbl").textContent = it ? "Guardar cambios" : `Guardar ${f("#fQty").value || 0} ${f("#fUnit").value}${f("#fName").value ? " de " + f("#fName").value.toLowerCase() : ""}`; };
    const applyGuess = (n) => { const gg = guess(n); f("#fCat").value = gg.cat; f("#fUnit").value = gg.unit; if (gg.store && stores().includes(gg.store)) f("#fStore").value = gg.store; setPlace(gg.place); };
    const setPlace = (p) => { st.place = p; root.querySelectorAll("#fPlace .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.place === p)); };
    root.querySelector("[data-close]").onclick = closeSheet;
    root.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => {
      f("#fName").value = b.dataset.pick; applyGuess(b.dataset.pick);
      root.querySelectorAll("[data-pick]").forEach((x) => x.setAttribute("aria-pressed", x === b)); lbl();
    }));
    f("#fName").oninput = lbl; f("#fUnit").onchange = lbl;
    f("#fName").onchange = () => { if (!it) applyGuess(f("#fName").value); lbl(); };
    root.querySelectorAll("#fPlace .chip").forEach((b) => (b.onclick = () => setPlace(b.dataset.place)));
    root.querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => {
      const v = parseFloat(String(f("#fQty").value).replace(",", ".")) || 0;
      f("#fQty").value = fmt(Math.max(0, v + Number(b.dataset.st) * stepOf(f("#fUnit").value))); lbl();
    }));
    f("#fQty").oninput = lbl;
    if (it) {
      f("#delBtn").onclick = () => (f("#delBox").hidden = false);
      f("#delNo").onclick = () => (f("#delBox").hidden = true);
      f("#delYes").onclick = () => { remove("items", it.id); closeSheet(); if (S.view === "detail") go("refri"); toast(`${it.name} borrado`); };
    }
    f("#itemForm").onsubmit = (e) => {
      e.preventDefault();
      const num = (s) => { const v = parseFloat(String(f(s).value).replace(",", ".")); return isNaN(v) ? null : v; };
      const d = { name: f("#fName").value.trim(), qty: num("#fQty") ?? 0, unit: f("#fUnit").value, place: st.place, min: num("#fMin") ?? 0,
        cat: f("#fCat").value, store: f("#fStore").value, price: num("#fPrice"), exp: f("#fExp").value, note: f("#fNote").value.trim() };
      if (!d.name) return;
      if (it) {
        const diff = d.qty - (Number(it.qty) || 0);
        save("items", it.id, { ...d, at: Date.now(), by: me() }); logMove(d.name, diff); toast("Guardado");
      } else { upsertItem(d); toast(`${d.name} agregado`); }
      closeSheet();
    };
    lbl();
    if (!it && !prefill) setTimeout(() => f("#fName").focus(), 280);
  });
}
function shopSheet(id) {
  const r = S.shop.find((s) => s.id === id); if (!r) return;
  const opt = (arr, v) => arr.map((k) => `<option ${k === v ? "selected" : ""}>${esc(k)}</option>`).join("");
  openSheet(`<div class="grip"></div><div class="head"><h1>${esc(r.name)}</h1><button class="iconbtn sm" data-close aria-label="Cerrar">${ic("x")}</button></div>
    <form id="shf" style="display:flex;flex-direction:column;gap:14px"><div class="grid2">
      <div class="fl"><label for="sQty">Cantidad</label><input class="field" id="sQty" inputmode="decimal" value="${fmt(r.qty)}"></div>
      <div class="fl"><label for="sUnit">Unidad</label><select class="field" id="sUnit">${opt(UNITS, r.unit)}</select></div>
      <div class="fl" style="grid-column:1/-1"><label for="sStore">Dónde comprarlo</label><select class="field" id="sStore">${opt(stores(), storeOf(r))}</select></div></div>
      <button class="btn big dark">Guardar<span class="dot">${ic("check")}</span></button></form>`, (root) => {
    root.querySelector("[data-close]").onclick = closeSheet;
    root.querySelector("#shf").onsubmit = (e) => {
      e.preventDefault();
      save("shop", r.id, { qty: parseFloat(root.querySelector("#sQty").value.replace(",", ".")) || 0, unit: root.querySelector("#sUnit").value, store: root.querySelector("#sStore").value });
      closeSheet();
    };
  });
}

/* ---------- PDF ---------- */
async function exportPDF() {
  const items = S.shop.filter((s) => !s.done);
  if (!items.length) return toast("La lista no tiene pendientes");
  if (!window.jspdf) return toast("El PDF aún está cargando, intenta de nuevo");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "letter" });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--acc-l").trim() || "#3D7A2C";
  let y = 22;
  const total = items.reduce((a, s) => a + (estPrice(s) || 0), 0);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.text("Lista de compras", 18, y);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(100); y += 7;
  pdf.text(`${S.home?.name || "Nuestro refri"} · ${new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${items.length} productos · gasto aprox. ${mxn(total)} MXN`, 18, y);
  pdf.setTextColor(0); y += 6;
  const st = stores(), groups = {};
  items.forEach((s) => (groups[storeOf(s)] ??= []).push(s));
  const order = [...st, ...Object.keys(groups).filter((k) => !st.includes(k))].filter((k) => groups[k]);
  const need = (h) => { if (y + h > H - 16) { pdf.addPage(); y = 20; } };
  for (const store of order) {
    need(22); y += 6;
    pdf.setFillColor(accent); pdf.roundedRect(18, y - 5, W - 36, 9, 2, 2, "F");
    pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(12.5); pdf.text(store.toUpperCase(), 22, y + 1.4);
    const sub = groups[store].reduce((a, s) => a + (estPrice(s) || 0), 0);
    pdf.setFontSize(9.5); pdf.text(`${groups[store].length} · aprox. ${mxn(sub)}`, W - 22, y + 1.4, { align: "right" }); pdf.setTextColor(0); y += 10;
    const by = {}; groups[store].forEach((r) => (by[r.cat || "otros"] ??= []).push(r));
    for (const c of CATS.filter((c) => by[c.id])) {
      need(14); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8.5); pdf.setTextColor(110); pdf.text(c.name.toUpperCase(), 20, y); pdf.setTextColor(0); y += 5.5;
      for (const r of by[c.id].sort((a, b) => a.name.localeCompare(b.name, "es"))) {
        need(8); pdf.setDrawColor(150); pdf.rect(21, y - 3.6, 4, 4);
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11.5); pdf.text(r.name, 29, y);
        const q = r.qty ? `${fmt(r.qty)} ${r.unit || ""}` : "";
        pdf.setFont("helvetica", "bold"); if (q) pdf.text(q, W - 46, y, { align: "right" });
        const p = estPrice(r); pdf.setFont("helvetica", "normal"); pdf.setTextColor(110); if (p) pdf.text(`${mxn(p)}`, W - 20, y, { align: "right" }); pdf.setTextColor(0);
        y += 7;
      }
      y += 2;
    }
  }
  const d = new Date(), name = `lista-compras-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.pdf`;
  const blob = pdf.output("blob");
  try {
    const file = new File([blob], name, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Lista de compras" }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  pdf.save(name);
  toast("PDF descargado 📄");
}

/* ---------- eventos ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, [data-go]"); if (!t) return;
  const d = t.dataset;
  if (d.go) return go(d.go);
  if (d.open) return go("detail", d.open);
  if (d.edit) return itemSheet(d.edit);
  if (d.qty) return changeQty(S.detail, Number(d.qty));
  if (d.status) { S.status = S.status === d.status ? null : d.status; return updRefri(); }
  if (d.place && t.closest("#places")) { S.place = d.place; return updRefri(); }
  if (d.quick) { upsertItem({ name: d.quick, qty: guess(d.quick).unit === "pza" ? 3 : 1 }); return toast(`${d.quick} agregado`); }
  if (d.newname) return itemSheet(null, d.newname);
  if (d.tolist) { const it = S.items.find((i) => i.id === d.tolist); if (it) toList(it); return; }
  if (d.store) { S.listStore = d.store; return updLista(); }
  if (d.toggle) { const r = S.shop.find((s) => s.id === d.toggle); if (r) save("shop", r.id, { done: !r.done, doneAt: Date.now() }); return; }
  if (d.rmshop) { const r = S.shop.find((s) => s.id === d.rmshop); remove("shop", d.rmshop); if (r) { const { id, ...rest } = r; toast(`${r.name} quitado`, "Deshacer", () => save("shop", id, rest)); } return; }
  if (d.editshop) return shopSheet(d.editshop);
  if (d.plan) {
    const it = S.items.find((i) => i.id === d.plan); if (!it) return;
    if (listed(it.name)) { const r = S.shop.find((s) => !s.done && norm(s.name) === norm(it.name)); if (r) remove("shop", r.id); }
    else toList(it, Number(d.need));
    return;
  }
  if (d.staple) { addShop({ name: d.staple, qty: guess(d.staple).unit === "pza" ? 6 : 1 }); return toast(`${d.staple} va a la lista`); }
  if (d.pref) { prefs[d.pref] = d.v; applyPrefs(); document.querySelectorAll(`[data-pref="${d.pref}"]`).forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === d.v)); return; }
  if (d.rmstore) {
    if (stores().length <= 1) return toast("Deja al menos una tienda");
    return updateDoc(doc(db, "households", homeId), { stores: stores().filter((s) => s !== d.rmstore) }).catch(fail);
  }
  switch (d.act) {
    case "add": return itemSheet(null);
    case "pdf": return exportPDF();
    case "missing": {
      const p = plan().filter((x) => x.pr !== "Planea" && !listed(x.it.name));
      if (!p.length) return toast("No falta nada por ahora 👌");
      p.forEach((x) => addShop({ name: x.it.name, cat: x.it.cat, unit: x.it.unit, store: x.it.store, qty: x.need }));
      return toast(`${p.length} producto${p.length > 1 ? "s" : ""} a la lista`);
    }
    case "addplan": {
      const p = plan().filter((x) => !listed(x.it.name));
      p.forEach((x) => addShop({ name: x.it.name, cat: x.it.cat, unit: x.it.unit, store: x.it.store, qty: x.need }));
      return toast(`${p.length} producto${p.length > 1 ? "s" : ""} a la lista 🛒`);
    }
    case "tofridge": {
      const done = S.shop.filter((s) => s.done);
      if (!done.length) return toast("Palomea primero lo que ya compraste");
      const b = writeBatch(db);
      for (const s of done) {
        const ex = S.items.find((i) => norm(i.name) === norm(s.name));
        const add = Number(s.qty) || 1;
        if (ex) b.set(ref("items", ex.id), { qty: (Number(ex.qty) || 0) + add, at: Date.now(), by: me() }, { merge: true });
        else {
          const g = guess(s.name);
          b.set(ref("items", newId("items")), { name: s.name, cat: s.cat || g.cat, unit: s.unit || g.unit, qty: add, min: stepOf(s.unit || g.unit), place: g.place, store: s.store || g.store || stores()[0], exp: "", note: "", price: null, at: Date.now(), by: me() });
        }
        b.set(ref("log", newId("log")), { n: norm(s.name), d: add, at: Date.now(), by: me() });
        b.delete(ref("shop", s.id));
      }
      b.commit().catch(fail);
      return toast(`${done.length} producto${done.length > 1 ? "s" : ""} al refri 🧊`);
    }
    case "homename": { const v = $("#homeIn").value.trim(); if (v) updateDoc(doc(db, "households", homeId), { name: v }).then(() => toast("Nombre guardado")).catch(fail); return; }
    case "copycode": {
      const c = S.home?.code || "", text = `Únete a nuestro refri en Refri Familiar: ${location.origin + location.pathname} · código ${c}`;
      if (navigator.share) return navigator.share({ title: "Refri Familiar", text }).catch(() => {});
      return navigator.clipboard?.writeText(c).then(() => toast("Código copiado")).catch(() => toast(`Código: ${c}`));
    }
    case "signout": return signOut(auth);
    case "leave": $("#leaveConfirm").hidden = false; return;
    case "leaveno": $("#leaveConfirm").hidden = true; return;
    case "leaveyes": return leaveHome();
  }
});
document.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; updRefri(); } });
document.addEventListener("submit", (e) => {
  if (e.target.id === "shopForm") {
    e.preventDefault();
    const inp = $("#shopIn"); const v = inp.value.trim(); if (!v) return;
    const p = parseQuick(v); const g = guess(p.name);
    addShop({ name: p.name, qty: p.qty || (g.unit === "pza" ? 1 : 1), unit: p.unit || g.unit, store: S.listStore && g.store == null ? S.listStore : undefined });
    inp.value = ""; toast(`${p.name} en la lista`);
  }
  if (e.target.id === "storeForm") {
    e.preventDefault();
    const v = $("#storeIn").value.trim(); if (!v) return;
    if (stores().some((s) => norm(s) === norm(v))) return toast("Esa tienda ya está");
    updateDoc(doc(db, "households", homeId), { stores: [...stores(), v] }).catch(fail); $("#storeIn").value = "";
  }
});
addEventListener("online", refresh); addEventListener("offline", refresh);
setInterval(() => { if (S.stage === "app" && S.view === "refri") updRefri(); }, 60000);

async function leaveHome() {
  const uid = me(), h = S.home; if (!h) return;
  try {
    const names = { ...(h.names || {}) }; delete names[uid];
    await updateDoc(doc(db, "households", h.id), { members: h.members.filter((m) => m !== uid), names });
    await setDoc(doc(db, "users", uid), { hid: null }, { merge: true });
    toast("Saliste del hogar");
  } catch (e) { fail(e); }
}

/* ---------- pantallas de inicio ---------- */
function renderSetup(el) {
  el.innerHTML = `<main class="screen auth"><div class="logo">${ic("fridge", "ic").replace('class="ic"', 'class="ic" style="width:44px;height:44px;color:#fff"')}</div>
    <h1>Falta conectar la base de datos</h1>
    <p class="lead">Pega aquí la configuración web de tu proyecto de Firebase (<b>firebaseConfig</b>). Lo ideal es ponerla en <b>js/config.js</b> del repositorio para que toda la familia la tenga.</p>
    <div class="fl"><label for="cfgIn">firebaseConfig</label><textarea class="field" id="cfgIn" placeholder='{ apiKey: "...", authDomain: "...", projectId: "...", appId: "..." }'></textarea></div>
    <p class="err" id="cfgErr" hidden></p>
    <button class="btn big dark" id="cfgSave">Guardar y continuar<span class="dot">${ic("check")}</span></button></main>`;
  $("#cfgSave").onclick = () => {
    const txt = $("#cfgIn").value, o = {};
    for (const k of ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]) {
      const m = txt.match(new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`)); if (m) o[k] = m[1];
    }
    if (!o.apiKey || !o.projectId) { $("#cfgErr").hidden = false; $("#cfgErr").textContent = "No encontré apiKey y projectId. Copia todo el bloque firebaseConfig."; return; }
    ls.set("cfg", o); location.reload();
  };
}
function renderLogin(el, mode = "in") {
  el.innerHTML = `<main class="screen auth">
    <div class="logo">${ic("fridge").replace('class="ic"', 'class="ic" style="width:44px;height:44px;color:var(--on-accent)"')}</div>
    <div><h1>Refri Familiar</h1><p class="lead">Lo que hay en el refri, la lista del súper y qué comprar. Todo compartido con tu familia.</p></div>
    <button class="btn big dark" id="gBtn">Entrar con Google<span class="dot">${ic("check")}</span></button>
    <div class="divider">o con tu correo</div>
    <form id="emailForm" style="display:flex;flex-direction:column;gap:10px">
      ${mode === "up" ? `<div class="fl"><label for="eName">Tu nombre</label><input class="field" id="eName" autocomplete="given-name" required></div>` : ""}
      <div class="fl"><label for="eMail">Correo</label><input class="field" id="eMail" type="email" autocomplete="email" required></div>
      <div class="fl"><label for="ePass">Contraseña</label><input class="field" id="ePass" type="password" minlength="6" autocomplete="${mode === "up" ? "new-password" : "current-password"}" required></div>
      <p class="err" id="authErr" hidden></p>
      <button class="btn accent">${mode === "up" ? "Crear cuenta" : "Entrar"}</button>
    </form>
    <div class="row wrap" style="justify-content:space-between">
      <button class="btn ghost" id="modeBtn">${mode === "up" ? "Ya tengo cuenta" : "Crear cuenta nueva"}</button>
      ${mode === "in" ? `<button class="btn ghost" id="resetBtn">Olvidé mi contraseña</button>` : ""}
    </div></main>`;
  $("#gBtn").onclick = async () => {
    const p = new GoogleAuthProvider();
    try { await signInWithPopup(auth, p); }
    catch (e) {
      if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code)) { try { await signInWithRedirect(auth, p); } catch (e2) { authError(e2); } }
      else authError(e);
    }
  };
  $("#modeBtn").onclick = () => renderLogin(el, mode === "up" ? "in" : "up");
  $("#resetBtn") && ($("#resetBtn").onclick = async () => {
    const m = $("#eMail").value.trim(); if (!m) return authError({ code: "need-email" });
    try { await sendPasswordResetEmail(auth, m); toast("Te mandé un correo para cambiarla"); } catch (e) { authError(e); }
  });
  $("#emailForm").onsubmit = async (e) => {
    e.preventDefault();
    const m = $("#eMail").value.trim(), pw = $("#ePass").value;
    try {
      if (mode === "up") { const c = await createUserWithEmailAndPassword(auth, m, pw); await updateProfile(c.user, { displayName: $("#eName").value.trim() }); }
      else await signInWithEmailAndPassword(auth, m, pw);
    } catch (er) { authError(er); }
  };
}
function authError(e) {
  if (!e) return;
  const map = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.", "auth/wrong-password": "Contraseña incorrecta.", "auth/user-not-found": "No hay cuenta con ese correo.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Toca “Ya tengo cuenta”.", "auth/weak-password": "La contraseña necesita al menos 6 caracteres.",
    "auth/unauthorized-domain": "Este sitio no está autorizado en Firebase. Agrégalo en Authentication → Configuración → Dominios autorizados.",
    "auth/network-request-failed": "Sin conexión. Para entrar la primera vez necesitas internet.", "auth/popup-closed-by-user": "Cerraste la ventana de Google.",
    "auth/operation-not-allowed": "Activa este método de inicio de sesión en Firebase → Authentication.", "need-email": "Escribe tu correo primero.",
  };
  const msg = map[e.code] || "No se pudo entrar. Intenta de nuevo.";
  const el = $("#authErr"); if (el) { el.hidden = false; el.textContent = msg; } else toast(msg);
}
function renderOnboard(el) {
  const name = S.user?.displayName?.split(" ")[0] || (S.user?.email || "").split("@")[0];
  el.innerHTML = `<main class="screen auth">
    <div><h1>¡Hola${name ? ", " + esc(name) : ""}! 👋</h1><p class="lead">Crea el refri de tu casa, o únete al de tu familia con su código.</p></div>
    <div class="fl"><label for="oName">¿Cómo te llamas?</label><input class="field" id="oName" value="${esc(name)}" maxlength="20" autocomplete="given-name"></div>
    <section class="set"><h2>Unirme a mi familia</h2><div class="fl"><label for="oCode">Código de 6 letras</label><input class="field" id="oCode" maxlength="6" autocapitalize="characters" autocomplete="off" style="letter-spacing:.2em;text-transform:uppercase"></div>
      <button class="btn dark" id="joinBtn">Unirme</button></section>
    <div class="divider">o</div>
    <section class="set"><h2>Crear un hogar nuevo</h2><div class="fl"><label for="oHome">Nombre del hogar</label><input class="field" id="oHome" value="Nuestro refri" maxlength="40"></div>
      <button class="btn accent" id="createBtn">Crear hogar</button></section>
    <p class="err" id="obErr" hidden></p>
    <button class="btn ghost" id="outBtn">Cerrar sesión</button></main>`;
  const err = (m) => { $("#obErr").hidden = false; $("#obErr").textContent = m; };
  $("#outBtn").onclick = () => signOut(auth);
  $("#createBtn").onclick = async () => {
    const uid = me(), nm = $("#oName").value.trim() || "Yo";
    const hid = doc(collection(db, "households")).id;
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => abc[b % abc.length]).join("");
    const b = writeBatch(db);
    b.set(doc(db, "households", hid), { name: $("#oHome").value.trim() || "Nuestro refri", code, members: [uid], names: { [uid]: nm }, stores: DEFAULT_STORES, createdAt: Date.now() });
    b.set(doc(db, "codes", code), { hid });
    b.set(doc(db, "users", uid), { hid, name: nm });
    $("#createBtn").disabled = true;
    try { await b.commit(); } catch (e) { console.error(e); err("No se pudo crear. Revisa tu conexión y las reglas de Firestore."); $("#createBtn").disabled = false; }
  };
  $("#joinBtn").onclick = async () => {
    const code = $("#oCode").value.trim().toUpperCase(), uid = me(), nm = $("#oName").value.trim() || "Yo";
    if (code.length !== 6) return err("El código tiene 6 letras o números.");
    $("#joinBtn").disabled = true;
    try {
      const c = await getDoc(doc(db, "codes", code));
      if (!c.exists()) { $("#joinBtn").disabled = false; return err("Ese código no existe. Revísalo con tu familia."); }
      const hid = c.data().hid;
      await updateDoc(doc(db, "households", hid), { members: arrayUnion(uid), [`names.${uid}`]: nm });
      await setDoc(doc(db, "users", uid), { hid, name: nm });
    } catch (e) { console.error(e); $("#joinBtn").disabled = false; err(e.code === "permission-denied" ? "Ese hogar ya está lleno o el código no es válido." : "No se pudo unir. Revisa tu conexión."); }
  };
}

/* ---------- toast + actualizaciones ---------- */
let toastT;
function toast(msg, action, fn) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ""}`;
  t.hidden = false;
  if (action) t.querySelector("button").onclick = () => { t.hidden = true; fn(); };
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), action ? 5000 : 2600);
}
if ("serviceWorker" in navigator) {
  addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");
      const ask = (w) => toast("Hay una versión nueva de la app", "Actualizar", () => w.postMessage("skip"));
      if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) ask(w); });
      });
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch (e) { console.warn("SW", e); }
  });
}
