import { searchGames, searchProducts } from './search.js?v=2';
const tg = window.Telegram?.WebApp;
try { tg?.ready(); tg?.expand(); } catch {}
// ---------- theme (default: light, like PayerPin) ----------
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const c = t === 'dark' ? '#0b0e1a' : '#eef0f6';
  try { tg?.setHeaderColor?.(c); tg?.setBackgroundColor?.(c); tg?.setBottomBarColor?.(c); } catch {}
}
let theme = (() => { try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; } })();
applyTheme(theme);
function toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('theme', theme); } catch {} applyTheme(theme); }

// ---------- icons (line style) ----------
const svg = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  home: svg('<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M12 17.2s-3-1.8-3-3.9a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2.1-3 3.9-3 3.9z"/>'),
  games: svg('<path d="M7 8h10a4 4 0 0 1 4 4v1.5a3.5 3.5 0 0 1-6.3 2.1L14 14.7h-4l-.7.9A3.5 3.5 0 0 1 3 13.5V12a4 4 0 0 1 4-4z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="15.5" cy="11.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="13.5" r=".6" fill="currentColor"/>'),
  wallet: svg('<path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3"/><path d="M20 12v-3a1 1 0 0 0-1-1H6a2 2 0 0 1 0-4h11v4"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  user: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.2a6.5 6.5 0 0 1 11 0"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  money: svg('<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6.5 9.5v5M17.5 9.5v5"/><path d="M5 4.5h14" opacity=".5"/>'),
  ticket: svg('<path d="M4 6h16v3.5a2.5 2.5 0 0 0 0 5V18H4v-3.5a2.5 2.5 0 0 0 0-5z"/><path d="M9 9.5h6M9 12h6M9 14.5h4"/>'),
  headset: svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/><path d="M18.5 19a3 3 0 0 1-3 2.5H13"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 2),
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/></svg>',
};


const $view = document.getElementById('view');
const $nav = document.getElementById('nav');
const $sheet = document.getElementById('sheet-root');
const state = { me: null, games: null };

// ---------- helpers ----------
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/[\s,]/g, ' ');
const som = (n) => `${num(n)} so‘m`;
const date = (s) => { const d = new Date(String(s).replace(' ', 'T') + 'Z'); return isNaN(d) ? '' : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const haptic = (t = 'light') => { try { tg?.HapticFeedback?.impactOccurred(t); } catch {} };
function toast(msg, kind = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast show ${kind}`;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = 'toast'), 2600);
  if (kind === 'bad') try { tg?.HapticFeedback?.notificationOccurred('error'); } catch {}
  if (kind === 'ok') try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {}
}
async function api(path, opts = {}) {
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Init-Data': tg?.initData || '' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok || j.ok === false) throw Object.assign(new Error(j.error || 'Xatolik yuz berdi'), { code: j.code });
  return j;
}
const go = (hash) => { location.hash = hash; };
const STATUS = { new: 'Yuborilmoqda', paid: 'To‘landi', sending: 'Yetkazilmoqda', delivered: 'Yetkazildi', failed: 'Bajarilmadi', refunded: 'Qaytarildi', unknown: 'Tekshirilmoqda', pending: 'Tekshirilmoqda', approved: 'Tasdiqlandi', rejected: 'Rad etildi' };
const TX = { topup: 'Balans to‘ldirildi', order: 'Xarid', refund: 'Qaytarildi', promo: 'Promokod', admin: 'Admin', ref: 'Taklif bonusi' };
const openLink = (url) => { if (!url) return toast('Havola hali sozlanmagan'); if (/^https:\/\/t\.me\//.test(url) && tg?.openTelegramLink) tg.openTelegramLink(url); else if (tg?.openLink) tg.openLink(url); else window.open(url, '_blank'); };
const img = (src, alt = '') => src ? `<img src="${h(src)}" alt="${h(alt)}" loading="lazy" onerror="this.style.display='none'">` : '';
const spinner = () => '<div class="spin"></div>';

// ---------- nav ----------
function renderNav(active) {
  const items = [['#/', I.home, 'Asosiy'], ['#/games', I.games, 'O‘yinlar'], ['#/topup', I.wallet, 'To‘ldirish'], ['#/orders', I.clock, 'Buyurtmalar'], ['#/profile', I.user, 'Profil']];
  if (state.me?.isAdmin) items.push(['#/admin', I.gear, 'Admin']);
  $nav.innerHTML = items.map(([href, i, t]) => `<a href="${href}" class="${active === href ? 'on' : ''}">${i}${t}</a>`).join('');
}

// ---------- sheet ----------
function sheet(html) {
  $sheet.innerHTML = `<div class="overlay"></div><div class="sheet"><div class="grab"></div>${html}</div>`;
  $sheet.querySelector('.overlay').onclick = closeSheet;
  return $sheet.querySelector('.sheet');
}
const closeSheet = () => { $sheet.innerHTML = ''; };

// ---------- shared blocks ----------
function balanceCard() {
  return `<div class="card balance"><div class="ic">${I.money}</div><div class="grow"><div class="label">Balans</div><div class="sum">${num(state.me.user.balance)}<span>so‘m</span></div></div><a class="btn btn-primary" href="#/topup">＋ To‘ldirish</a></div>`;
}
function gameTile(g) {
  return `<a class="g" href="#/game/${encodeURIComponent(g.slug)}"><div class="cv">${img(g.image_url, g.name)}<span class="hot"><b>★</b> ${g.rating == null || g.rating >= 5 ? 5 : Number(g.rating).toFixed(1)}</span></div><span>${h(g.name)}</span></a>`;
}
const skelGrid = (n = 8) => `<div class="grid">${Array.from({ length: n }, () => '<div class="g"><div class="cv skel"></div><span class="skel" style="height:12px;border-radius:6px"></span></div>').join('')}</div>`;
function searchBox(id, ph) {
  return `<label class="search">${I.search}<input id="${id}" placeholder="${h(ph)}" autocomplete="off" enterkeyhint="search"><button type="button" class="sx" data-clear="${id}" hidden>✕</button></label>`;
}
function bindSearch(id, onChange, delay = 120) {
  const inp = document.getElementById(id); const x = document.querySelector(`[data-clear="${id}"]`);
  let t; const fire = () => { x.hidden = !inp.value; clearTimeout(t); t = setTimeout(() => onChange(inp.value.trim()), delay); };
  inp.oninput = fire;
  inp.onkeydown = (e) => { if (e.key === 'Enter') inp.blur(); };
  x.onclick = (e) => { e.preventDefault(); inp.value = ''; fire(); inp.focus(); };
  x.hidden = !inp.value;
}
const gamesGrid = (list) => list.length ? `<div class="grid">${list.map(gameTile).join('')}</div>` : '<div class="empty"><div class="ei"><img src="/search.webp" alt=""></div><b>Topilmadi</b>Boshqacha yozib ko‘ring: masalan «pubg», «ff», «mlbb»</div>';
async function loadGames() { if (!state.games) state.games = (await api('/games')).games; return state.games; }
async function refreshMe() { state.me = await api('/me'); return state.me; }

// ---------- pages ----------
const pages = {};

function rateCard() {
  const list = state.me.toRate || [];
  const el = document.getElementById('rate');
  if (!el) return;
  if (!list.length) { el.innerHTML = ''; return; }
  const o = list[0];
  el.innerHTML = `<div class="card rate"><div class="th">${img(o.game_image) || '🎮'}</div><div class="grow" style="min-width:0"><div class="label">Buyurtmangizni baholang</div><div class="t">${h(o.product_name || o.game_name)}<small>1/${list.length}</small></div></div><div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button data-r="${n}" aria-label="${n} yulduz">${I.star}</button>`).join('')}</div></div>`;
  const btns = el.querySelectorAll('[data-r]');
  btns.forEach((b) => {
    b.onclick = async () => {
      const n = Number(b.dataset.r); haptic();
      btns.forEach((x) => x.classList.toggle('on', Number(x.dataset.r) <= n));
      try { const r = await api(`/orders/${o.id}/rate`, { method: 'POST', body: { rating: n } }); state.me.toRate = r.toRate; state.games = null; toast('Rahmat! Bahoingiz qabul qilindi', 'ok'); setTimeout(rateCard, 500); }
      catch (e) { toast(e.message, 'bad'); }
    };
  });
}

function slider(settings) {
  const slides = [
    `<div class="slide s1"><span class="orb"></span><h2>${h(settings.banner_title || 'Balansni to‘ldir, qulay narx')}</h2>${settings.banner_subtitle ? `<p>${h(settings.banner_subtitle)}</p>` : ''}<a class="btn" href="#/topup">To‘ldirish</a></div>`,
    `<div class="slide s2"><span class="orb"></span><img src="/logo.jpg" alt=""><h2>PUBG UC, Free Fire olmos va boshqalar</h2><a class="btn" href="#/games">O‘yinlarni ko‘rish</a></div>`,
    `<div class="slide s3"><span class="orb"></span><h2>Telegram Stars va Premium</h2><p>Tez va xavfsiz yetkazib beramiz</p><a class="btn" href="#/game/telegram-stars">Sotib olish</a></div>`,
  ];
  return `<div class="slider"><div class="slides" id="slides">${slides.join('')}</div><div class="dots" id="dots">${slides.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div></div>`;
}
function bindSlider() {
  const box = document.getElementById('slides'); const dots = document.querySelectorAll('#dots i');
  if (!box) return;
  let idx = 0;
  const mark = () => { idx = Math.round(box.scrollLeft / box.clientWidth); dots.forEach((d, i) => d.classList.toggle('on', i === idx)); };
  box.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
  clearInterval(bindSlider._t);
  bindSlider._t = setInterval(() => {
    if (!document.body.contains(box)) return clearInterval(bindSlider._t);
    box.scrollTo({ left: ((idx + 1) % dots.length) * box.clientWidth, behavior: 'smooth' });
  }, 4500);
}

pages.home = async () => {
  const { user, settings } = state.me;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'do‘st';
  $view.innerHTML = `
    <div class="hello"><div class="avatar">${state.me.user.photo_url ? img(state.me.user.photo_url) : h(name[0]?.toUpperCase())}</div><div class="grow"><small>Salom 👋</small><b>${h(name)}</b></div><button class="rbtn" id="theme" aria-label="Mavzuni almashtirish">${theme === 'dark' ? I.moon : I.sun}</button></div>
    ${balanceCard()}
    <div class="row2"><a class="tile" href="#/profile">${I.ticket}Promokodlar</a><button class="tile" id="help">${I.headset}Yordam</button></div>
    ${settings.shop_open ? '' : '<div class="card mt badt">⚠️ Do‘kon vaqtincha yopiq. Tez orada qaytamiz!</div>'}
    ${slider(settings)}
    <div id="rate"></div>
    <div class="sec"><h3>Ommabop o‘yinlar</h3><a href="#/games">Barchasi</a></div>
    <div class="hrow" id="pop">${Array.from({ length: 5 }, () => '<div class="g"><div class="cv skel"></div><span class="skel" style="height:12px;border-radius:6px"></span></div>').join('')}</div>
    ${searchBox('hq', 'O‘yinni qidiring: pubg, ff, mlbb, stars…')}
    <div id="all"></div>
    <a class="card mt" href="#/top" style="display:flex;align-items:center;gap:14px"><img src="/trophy.webp" alt="" style="width:44px;height:44px;border-radius:12px"><div class="grow"><b>Eng yaxshi donorlar</b><div class="hint" style="margin:2px 0 0">Eng yaxshi 100 talik</div></div><span style="color:var(--muted)">›</span></a>`;
  document.getElementById('help').onclick = () => openLink(settings.support_url);
  document.getElementById('theme').onclick = (e) => { haptic(); toggleTheme(); e.currentTarget.innerHTML = theme === 'dark' ? I.moon : I.sun; };
  bindSlider();
  rateCard();
  const games = await loadGames();
  const popular = games.filter((g) => g.popular);
  document.getElementById('pop').innerHTML = (popular.length ? popular : games.slice(0, 10)).map(gameTile).join('');
  const all = document.getElementById('all');
  const draw = (q) => {
    all.innerHTML = q ? gamesGrid(searchGames(games, q).slice(0, 40)) : `<a class="btn btn-ghost btn-block mt" href="#/games">🎮 Barcha ${games.length} ta o‘yinni ko‘rish</a>`;
  };
  draw('');
  bindSearch('hq', draw);
};

pages.games = async () => {
  $view.innerHTML = `<div class="page-title">Barcha o‘yinlar</div>
    ${searchBox('q', 'O‘yin yoki xizmat: pubg, ff, mlbb, stars…')}
    <div class="chips" id="gs" style="margin-top:0"><button class="chip on" data-s="">⭐ Ommabop</button><button class="chip" data-s="az">A–Z</button><button class="chip" data-s="tg">✈️ Telegram</button></div>
    <div class="hint" id="cnt" style="margin:4px 0 10px"></div>
    <div id="list">${skelGrid(16)}</div>`;
  const games = await loadGames();
  const list = document.getElementById('list'); const cnt = document.getElementById('cnt');
  let sort = ''; let q = sessionStorage.getItem('gq') || '';
  const draw = () => {
    let f = searchGames(games, q);
    if (!q && sort === 'az') f = [...f].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'tg') f = f.filter((g) => /telegram/i.test(g.name + g.slug));
    cnt.textContent = q ? `«${q}» bo‘yicha ${f.length} ta topildi` : `${f.length} ta o‘yin va xizmat`;
    list.innerHTML = gamesGrid(f);
  };
  document.getElementById('q').value = q;
  draw();
  bindSearch('q', (v) => { q = v; sessionStorage.setItem('gq', v); draw(); });
  document.querySelectorAll('#gs .chip').forEach((c) => (c.onclick = () => { sort = c.dataset.s; document.querySelectorAll('#gs .chip').forEach((x) => x.classList.toggle('on', x === c)); draw(); }));
};

pages.game = async (slug) => {
  $view.innerHTML = spinner();
  const { game, products } = await api('/games/' + encodeURIComponent(slug));
  // Paketlarni turlarga ajratish (UC, Prime, ...)
  const groupOf = (n) => { const m = n.match(/^[\d\s.,]+\s*([^\d(]+)/); return (m ? m[1] : n.split(/[\s(]/)[0]).trim().slice(0, 18) || 'Boshqa'; };
  const groups = [...new Set(products.map((p) => groupOf(p.name)))];
  let group = groups.length > 1 && groups.length <= 8 ? null : 'all';
  let selected = null;
  $view.innerHTML = `
    <div class="hero">${img(game.image_url, game.name)}<button class="back" onclick="history.back()">‹</button><h1>${h(game.name)}</h1></div>
    ${groups.length > 1 && groups.length <= 8 ? `<div class="chips" id="chips"><button class="chip on" data-g="">Barchasi</button>${groups.map((g) => `<button class="chip" data-g="${h(g)}">${h(g)}</button>`).join('')}</div>` : ''}
    <div class="sec" style="margin-top:14px"><h3>Paketni tanlang</h3></div>
    ${products.length > 10 ? searchBox('pq', 'Paketni qidiring: 60, 660 uc…') : ''}
    <div class="pk-grid" id="pk"></div>
    ${products.length ? '' : '<div class="empty"><div class="ei"><img src="/box.webp" alt=""></div><b>Paketlar yo‘q</b>Bu o‘yin uchun hozircha paket mavjud emas</div>'}`;
  const pk = document.getElementById('pk');
  let pq = '';
  const draw = () => {
    const list = searchProducts(group && group !== 'all' ? products.filter((p) => groupOf(p.name) === group) : products, pq);
    if (!list.length) { pk.innerHTML = '<div class="hint center" style="grid-column:1/-1">Bunday paket topilmadi</div>'; return; }
    pk.innerHTML = list.map((p) => `<button class="pk" data-id="${p.id}"><div class="pi">${p.image_url ? img(p.image_url) : game.image_url ? img(game.image_url) : '💎'}</div><div class="grow"><div class="pn">${h(p.name)}</div><div class="pp">${num(p.price)} <small>so‘m</small></div></div></button>`).join('');
    pk.querySelectorAll('.pk').forEach((b) => (b.onclick = () => { haptic(); selected = products.find((p) => p.id === Number(b.dataset.id)); pk.querySelectorAll('.pk').forEach((x) => x.classList.toggle('on', x === b)); buySheet(game, selected); }));
  };
  draw();
  if (document.getElementById('pq')) bindSearch('pq', (v) => { pq = v; draw(); });
  document.getElementById('chips')?.querySelectorAll('.chip').forEach((c) => (c.onclick = () => { document.querySelectorAll('#chips .chip').forEach((x) => x.classList.toggle('on', x === c)); group = c.dataset.g || 'all'; draw(); }));
  try { tg?.BackButton?.show(); } catch {}
};

function buySheet(game, p) {
  const isTg = game.id_type === 'telegram_username';
  const s = sheet(`
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:6px"><div class="li"><div class="th">${p.image_url ? img(p.image_url) : img(game.image_url)}</div></div><div><h3>${h(p.name)}</h3><div class="hint" style="margin:0">${h(game.name)}</div></div></div>
    <label class="field"><span>${isTg ? 'Telegram username' : 'O‘yinchi ID'}</span>
      <div class="inline"><input class="inp" id="pid" placeholder="${isTg ? '@username' : 'Masalan: 5123456789'}" ${isTg ? '' : 'inputmode="numeric"'} autocomplete="off"><button class="btn btn-ghost btn-sm" id="chk">Tekshirish</button></div></label>
    ${game.needs_server_id ? '<label class="field"><span>Server (Zone) ID</span><input class="inp" id="sid" inputmode="numeric" placeholder="Masalan: 1234"></label>' : ''}
    <div class="hint" id="vres">ID ni diqqat bilan kiriting — noto‘g‘ri ID ga yuborilgan buyurtma qaytarilmaydi.</div>
    <div class="card mt"><div class="sumrow"><span>Narx</span><b>${som(p.price)}</b></div><div class="sumrow"><span>Balansingiz</span><b>${som(state.me.user.balance)}</b></div></div>
    <button class="btn btn-primary btn-block mt" id="buy">Sotib olish — ${som(p.price)}</button>`);
  const pid = s.querySelector('#pid'); const sid = s.querySelector('#sid'); const vres = s.querySelector('#vres');
  setTimeout(() => pid.focus(), 250);
  s.querySelector('#chk').onclick = async (e) => {
    const b = e.currentTarget; if (!pid.value.trim()) return toast('ID ni kiriting', 'bad');
    b.disabled = true; vres.textContent = 'Tekshirilmoqda…';
    try {
      const r = await api(`/games/${encodeURIComponent(game.slug)}/validate`, { method: 'POST', body: { player_id: pid.value.trim(), server_id: sid?.value.trim() } });
      if (!r.supported) vres.innerHTML = 'ℹ️ Bu o‘yin uchun ID oldindan tekshirilmaydi. Diqqat bilan kiriting.';
      else if (r.valid) vres.innerHTML = `<span class="okt">✅ Topildi${r.name ? ': <b>' + h(r.name) + '</b>' : ''}</span>`;
      else vres.innerHTML = `<span class="badt">❌ ${h(r.error || 'ID topilmadi')}</span>`;
    } catch (err) { vres.innerHTML = `<span class="badt">${h(err.message)}</span>`; }
    b.disabled = false;
  };
  s.querySelector('#buy').onclick = async (e) => {
    const b = e.currentTarget;
    if (!pid.value.trim()) return toast('ID ni kiriting', 'bad');
    if (game.needs_server_id && !sid.value.trim()) return toast('Server ID ni kiriting', 'bad');
    if (state.me.user.balance < p.price) { toast('Balans yetarli emas', 'bad'); closeSheet(); return go('#/topup'); }
    b.disabled = true; b.textContent = 'Yuborilmoqda…';
    try {
      const r = await api('/orders', { method: 'POST', body: { slug: game.slug, product_id: p.id, player_id: pid.value.trim(), server_id: sid?.value.trim() } });
      state.me.user.balance = r.balance;
      closeSheet();
      if (r.order.status === 'refunded') toast('Buyurtma bajarilmadi, pul qaytarildi', 'bad');
      else toast('✅ Buyurtma qabul qilindi!', 'ok');
      go('#/orders');
    } catch (err) { toast(err.message, 'bad'); b.disabled = false; b.textContent = `Sotib olish — ${som(p.price)}`; }
  };
}

pages.topup = async () => {
  const { settings, user } = state.me;
  let receipt = null;
  $view.innerHTML = `<div class="page-title">Balansni to‘ldirish</div>
    <div class="card balance"><div class="grow"><div class="label">Balans</div><div class="sum">${num(user.balance)}<span>so‘m</span></div></div></div>
    <div class="sec"><h3>1. Kartaga o‘tkazing</h3></div>
    ${settings.cards?.length ? settings.cards.map((c) => `<div class="paycard" style="margin-bottom:10px"><div class="label">${h(c.bank || 'Karta raqami')}</div><div class="num">${h(c.number)}</div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="hint" style="margin:0">${h(c.holder)}</span><button class="btn btn-ghost btn-sm" data-copy="${h(c.number)}">📋 Nusxa</button></div></div>`).join('') + (settings.cards.length > 1 ? '<div class="hint" style="margin-top:-2px">Istalgan bittasiga o‘tkazing.</div>' : '') : '<div class="card hint">Karta raqami hali sozlanmagan. Admin bilan bog‘laning.</div>'}
    <div class="sec"><h3>2. Summa va chek</h3></div>
    <div class="card">
      <label class="field" style="margin-top:0"><span>O‘tkazgan summangiz (so‘m)</span><input class="inp" id="amt" inputmode="numeric" placeholder="Eng kam: ${num(settings.min_topup)}"></label>
      <label class="field"><span>To‘lov cheki (skrinshot)</span><label class="drop" id="drop"><input type="file" id="file" accept="image/*" hidden><span style="font-size:28px">📎</span><span>Rasm tanlash uchun bosing</span></label></label>
      <button class="btn btn-primary btn-block mt" id="send">Yuborish</button>
      <div class="hint">Admin chekni tekshirib, balansingizni to‘ldiradi. Odatda 5–30 daqiqa.</div>
    </div>
    <div class="sec"><h3>So‘rovlarim</h3></div><div class="card list" id="mine">${spinner()}</div>`;
  document.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText(b.dataset.copy.replace(/\s/g, '')); toast('Nusxalandi', 'ok'); }));
  const amt = document.getElementById('amt');
  amt.oninput = () => { const v = amt.value.replace(/\D/g, ''); amt.value = v ? num(v) : ''; };
  document.getElementById('file').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    receipt = await compress(f);
    document.getElementById('drop').innerHTML = `<img src="${receipt}"><span>Boshqa rasm tanlash</span><input type="file" id="file2" accept="image/*" hidden>`;
    document.getElementById('drop').onclick = () => document.getElementById('file').click();
  };
  document.getElementById('send').onclick = async (e) => {
    const b = e.currentTarget; const amount = Number(amt.value.replace(/\D/g, ''));
    if (!amount || amount < settings.min_topup) return toast(`Eng kam summa: ${som(settings.min_topup)}`, 'bad');
    if (!receipt) return toast('Chek rasmini yuklang', 'bad');
    b.disabled = true; b.textContent = 'Yuborilmoqda…';
    try { await api('/topups', { method: 'POST', body: { amount, receipt } }); toast('✅ So‘rov yuborildi! Tekshirilmoqda', 'ok'); pages.topup(); }
    catch (err) { toast(err.message, 'bad'); b.disabled = false; b.textContent = 'Yuborish'; }
  };
  const { topups } = await api('/orders');
  document.getElementById('mine').innerHTML = topups.length ? topups.map((t) => `<div class="li"><div class="th">💳</div><div class="grow"><div class="t">#${t.id} · ${som(t.amount)}</div><div class="s">${date(t.created_at)}</div></div><span class="badge ${t.status}">${STATUS[t.status]}</span></div>`).join('') : '<div class="hint center" style="margin:0">Hali so‘rov yo‘q</div>';
};

function compress(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const max = 1600; const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.85)); }; im.onerror = rej; im.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

pages.orders = async () => {
  let tab = 'orders';
  $view.innerHTML = `<div class="page-title">Buyurtmalar</div><div class="seg"><button class="on" data-t="orders">Buyurtmalar</button><button data-t="tx">Tranzaksiyalar</button></div><div id="ol">${spinner()}</div>`;
  const data = await api('/orders');
  const ol = document.getElementById('ol');
  const draw = () => {
    if (tab === 'orders') {
      ol.innerHTML = data.orders.length ? `<div class="card list">${data.orders.map((o) => `<div class="li"><div class="th">${img(o.game_image) || '🎮'}</div><div class="grow"><div class="t">${h(o.product_name)}</div><div class="s">${h(o.game_name)} · ID ${h(o.player_id)} · #${o.id}</div><div class="s">${date(o.created_at)}${o.error && o.status === 'refunded' ? ' · ' + h(o.error) : ''}</div></div><div style="text-align:right"><div class="amt">${num(o.price)}</div><span class="badge ${o.status}">${STATUS[o.status] || o.status}</span></div></div>`).join('')}</div>` : '<div class="empty"><div class="ei"><img src="/bag.webp" alt=""></div><b>Buyurtmalar yo‘q</b>Birinchi buyurtma shu yerda ko‘rinadi</div>';
    } else {
      ol.innerHTML = data.tx.length ? `<div class="card list">${data.tx.map((t) => `<div class="li"><div class="th">${t.amount > 0 ? '⬇️' : '⬆️'}</div><div class="grow"><div class="t">${TX[t.type] || t.type}</div><div class="s">${h(t.note || '')} · ${date(t.created_at)}</div></div><div class="amt ${t.amount > 0 ? 'plus' : ''}">${t.amount > 0 ? '+' : ''}${num(t.amount)}</div></div>`).join('')}</div>` : '<div class="empty"><div class="ei"><img src="/money.webp" alt=""></div><b>Tranzaksiyalar yo‘q</b></div>';
    }
  };
  draw();
  document.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { tab = b.dataset.t; document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
};

pages.profile = async () => {
  const { user, settings, stats } = state.me;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Foydalanuvchi';
  const bot = tg?.initDataUnsafe?.receiver?.username;
  const faq = [
    ['To‘lov qildim, lekin balansimga tushmadi', 'Chek yuborganingizdan so‘ng admin uni tekshiradi. Odatda 5–30 daqiqa ichida balansingiz to‘ldiriladi. Kechiksa, Yordam bo‘limiga yozing.'],
    ['Buyurtmam o‘yinga tushmadi. Qancha kutaman?', 'Ko‘pincha 1–5 daqiqa. Ba’zi o‘yinlarda biroz ko‘proq vaqt ketishi mumkin. Bajarilmasa pul avtomatik balansingizga qaytadi.'],
    ['O‘yin ID sini xato kiritsam nima bo‘ladi?', 'Noto‘g‘ri ID ga yetkazilgan buyurtma qaytarilmaydi. Shuning uchun «Tekshirish» tugmasidan foydalaning.'],
    ['Balansdagi pulni naqd qilib olsam bo‘ladimi?', 'Balans faqat xizmatlarni sotib olish uchun ishlatiladi.'],
  ];
  $view.innerHTML = `
    <div class="card profile"><div class="avatar">${user.photo_url ? img(user.photo_url) : h(name[0]?.toUpperCase())}</div><h2>${h(name)}</h2><div class="pill">${user.username ? '@' + h(user.username) : ''} <span>ID: <code>${user.id}</code></span></div>
      <div class="card balance mt" style="text-align:left"><div class="grow"><div class="label">Balans</div><div class="sum">${num(user.balance)}<span>so‘m</span></div></div><a class="btn btn-primary" href="#/topup">＋ To‘ldirish</a></div></div>
    <div class="card"><b>🎟️ Promokodlar</b><div class="inline mt"><input class="inp" id="promo" placeholder="PROMOKODNI KIRITING" style="text-transform:uppercase"><button class="btn btn-primary" id="act">Faollashtirish</button></div></div>
    <div class="row2">
      <button class="card" id="ref" style="text-align:left;margin:0"><div style="font-size:24px">🤝</div><b style="display:block;margin-top:8px">Do‘st taklif qiling</b><div class="hint" style="margin-top:4px">${settings.ref_bonus ? `Har biri uchun ${som(settings.ref_bonus)}` : 'Havolani ulashing'} · ${stats.refs} ta</div></button>
      <a class="card" href="#/top" style="margin:0"><div style="font-size:24px">🏆</div><b style="display:block;margin-top:8px">Eng yaxshi donorlar</b><div class="hint" style="margin-top:4px">Eng yaxshi 100 talik</div></a>
    </div>
    <div class="card mt list"><button class="li" id="sup" style="width:100%"><div class="th">🎧</div><div class="grow t" style="text-align:left">Yordam markazi</div><span>›</span></button>${settings.channel_url ? '<button class="li" id="chn" style="width:100%"><div class="th">📢</div><div class="grow t" style="text-align:left">Bizning kanal</div><span>›</span></button>' : ''}</div>
    <div class="sec"><h3>Tez-tez beriladigan savollar</h3></div>
    <div class="card list">${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
    <div class="hint center mt">${h(settings.shop_name)} · Donat24 hamkori</div>`;
  document.getElementById('sup').onclick = () => openLink(settings.support_url);
  document.getElementById('chn')?.addEventListener('click', () => openLink(settings.channel_url));
  document.getElementById('ref').onclick = () => {
    if (!bot) return toast('Bot orqali oching');
    const link = `https://t.me/${bot}?start=ref${user.id}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('O‘yinlarga arzon va tez donat!')}`);
    else { navigator.clipboard?.writeText(link); toast('Havola nusxalandi', 'ok'); }
  };
  document.getElementById('act').onclick = async (e) => {
    const code = document.getElementById('promo').value.trim(); if (!code) return toast('Promokodni kiriting', 'bad');
    e.currentTarget.disabled = true;
    try { const r = await api('/promo', { method: 'POST', body: { code } }); state.me.user.balance = r.balance; toast(`🎉 +${som(r.amount)}`, 'ok'); pages.profile(); }
    catch (err) { toast(err.message, 'bad'); e.currentTarget.disabled = false; }
  };
};

pages.top = async () => {
  $view.innerHTML = `<div class="page-title"><button class="back" onclick="history.back()">‹</button>Eng yaxshi donorlar</div><div id="tl">${spinner()}</div>`;
  const { top } = await api('/top');
  document.getElementById('tl').innerHTML = top.length ? `<div class="card list">${top.map((t, i) => `<div class="li"><div class="th">${['🥇', '🥈', '🥉'][i] || i + 1}</div><div class="grow t">${h(t.name)}</div><div class="amt">${num(t.total)}</div></div>`).join('')}</div>` : '<div class="empty"><div class="ei"><img src="/trophy.webp" alt=""></div><b>Hali ro‘yxat bo‘sh</b>Birinchi bo‘ling!</div>';
};

// ---------- ADMIN ----------
const ADMIN_TABS = [['stats', '📊 Statistika'], ['topups', '🧾 To‘lovlar'], ['orders', '🛒 Buyurtmalar'], ['users', '👥 Foydalanuvchilar'], ['games', '💰 Narxlar va o‘yinlar'], ['message', '✉️ Xabar'], ['cards', '💳 Kartalar'], ['promos', '🎟️ Promokod'], ['admins', '👮 Adminlar'], ['settings', '⚙️ Sozlamalar']];
pages.admin = async (tab = 'stats') => {
  if (!state.me.isAdmin) return go('#/');
  $view.innerHTML = `<div class="page-title">Admin panel</div><div class="seg">${ADMIN_TABS.map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-k="${k}">${t}</button>`).join('')}</div><div id="ap">${spinner()}</div>`;
  document.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => go('#/admin/' + b.dataset.k)));
  document.querySelector('.seg button.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  await (admin[tab] || admin.stats)(document.getElementById('ap'));
};
const admin = {};
admin.stats = async (el) => {
  const s = await api('/admin/stats');
  const st = (l, v) => `<div class="stat"><div class="label">${l}</div><b>${v}</b></div>`;
  el.innerHTML = `
    <div class="card paycard" style="margin-bottom:12px"><div class="label">Donat24 balansingiz</div><div class="num">${s.d24.error ? '<span class="badt" style="font-size:15px">' + h(s.d24.error) + '</span>' : som(s.d24.balance)}</div><div class="hint" style="margin:0">Buyurtmalar shu balansdan to‘lanadi.</div><button class="btn btn-block mt" id="d24top">💳 Donat24 balansini to‘ldirish</button></div>
    <div class="stats">${st('Foydalanuvchilar', num(s.users))}${st('Bugun yangi', num(s.usersToday))}${st('Kutilayotgan to‘lov', num(s.pendingTopups))}${st('Mijoz balanslari', som(s.balances))}${st('Buyurtmalar', `${num(s.ordersDelivered)} / ${num(s.ordersTotal)}`)}${st('Savdo (bugun)', som(s.revenueToday))}${st('Jami savdo', som(s.revenue))}${st('Foyda', som(s.profit))}${st('Tasdiqlangan to‘lovlar', som(s.topupsApproved))}</div>`;
  el.querySelector('#d24top').onclick = () => { sheet(`<b>💳 Donat24 balansini to‘ldirish</b><div class="hint" style="margin:8px 0 12px">Donat24 to‘ldirishni API orqali bermaydi — to‘lov ularning saytida qilinadi. Kerakli summani o‘tkazing, balans shu yerda avtomatik yangilanadi.</div><button class="btn btn-block" id="d24go">🌐 donat24.uz/balans ni ochish</button><button class="btn btn-ghost btn-block mt" id="d24sup">💬 Donat24 yordam (Telegram)</button>`); const b = $sheet; b.querySelector('#d24go').onclick = () => openLink('https://donat24.uz/balans'); b.querySelector('#d24sup').onclick = () => openLink('https://t.me/RoxiySupport'); };
};
admin.topups = async (el, status = 'pending') => {
  const { topups } = await api('/admin/topups?status=' + status);
  el.innerHTML = `<div class="chips" style="margin-top:0">${[['pending', 'Kutilmoqda'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan']].map(([k, t]) => `<button class="chip ${k === status ? 'on' : ''}" data-s="${k}">${t}</button>`).join('')}</div>
    ${topups.length ? `<div class="card list">${topups.map((t) => `<div class="li" style="flex-wrap:wrap"><div class="grow"><div class="t">#${t.id} · ${som(t.amount)}</div><div class="s">${h(t.first_name || '')} ${t.username ? '@' + h(t.username) : ''} · ${t.user_id} · ${date(t.created_at)}</div></div>${t.status === 'pending' ? `<div style="display:flex;gap:6px"><button class="btn btn-sm" data-r="${t.id}">🧾</button><button class="btn btn-ok btn-sm" data-ok="${t.id}" data-a="${t.amount}">✅</button><button class="btn btn-bad btn-sm" data-no="${t.id}">❌</button></div>` : `<span class="badge ${t.status}">${STATUS[t.status]}</span>`}</div>`).join('')}</div><div class="hint">🧾 — chek rasmini ko‘rish. Cheklar botga ham keladi (agar botda START bosgan bo‘lsangiz).</div>` : '<div class="empty"><div class="ei"><img src="/card.webp" alt=""></div><b>So‘rovlar yo‘q</b></div>'}`;
  el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => admin.topups(el, b.dataset.s)));
  el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = async () => {
    try {
      const r = await fetch(`/api/admin/topups/${b.dataset.r}/receipt`, { headers: { 'X-Init-Data': tg?.initData || '' } });
      if (!r.ok) throw new Error('Chek topilmadi');
      const url = URL.createObjectURL(await r.blob());
      sheet(`<b>🧾 Chek #${b.dataset.r}</b><img src="${url}" style="width:100%;border-radius:12px;margin-top:10px">`);
    } catch (e) { toast(e.message, 'bad'); }
  }));
  el.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = async () => {
    const v = prompt('Tasdiqlanadigan summa (so‘m):', b.dataset.a); if (!v) return;
    try { await api(`/admin/topups/${b.dataset.ok}/approve`, { method: 'POST', body: { amount: Number(v.replace(/\D/g, '')) } }); toast('Tasdiqlandi', 'ok'); admin.topups(el, status); } catch (e) { toast(e.message, 'bad'); }
  }));
  el.querySelectorAll('[data-no]').forEach((b) => (b.onclick = async () => {
    if (!confirm('Rad etilsinmi?')) return;
    try { await api(`/admin/topups/${b.dataset.no}/reject`, { method: 'POST' }); toast('Rad etildi'); admin.topups(el, status); } catch (e) { toast(e.message, 'bad'); }
  }));
};
admin.orders = async (el) => {
  const { orders } = await api('/admin/orders');
  el.innerHTML = orders.length ? `<div class="card list">${orders.map((o) => `<div class="li"><div class="th">${img(o.game_image) || '🎮'}</div><div class="grow"><div class="t">#${o.id} ${h(o.product_name)}</div><div class="s">${h(o.game_name)} · ID ${h(o.player_id)}${o.server_id ? '/' + h(o.server_id) : ''}</div><div class="s">${h(o.first_name || '')} ${o.username ? '@' + h(o.username) : ''} · ${date(o.created_at)}${o.d24_order_id ? ' · ' + h(o.d24_order_id) : ''}</div>${o.error ? `<div class="s badt">${h(o.error)}</div>` : ''}</div><div style="text-align:right"><div class="amt">${num(o.price)}</div><div class="s">tan: ${num(o.cost)}</div><button class="badge ${o.status}" data-r="${o.id}">${STATUS[o.status] || o.status} ⟳</button></div></div>`).join('')}</div>` : '<div class="empty"><div class="ei"><img src="/cart.webp" alt=""></div><b>Buyurtmalar yo‘q</b></div>';
  el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = async () => { try { await api(`/admin/orders/${b.dataset.r}/refresh`, { method: 'POST' }); toast('Yangilandi'); admin.orders(el); } catch (e) { toast(e.message, 'bad'); } }));
};
admin.users = async (el, q = '') => {
  el.innerHTML = `${searchBox('uq', 'ID, @username yoki ism')}<div id="ul">${spinner()}</div>`;
  const ul = el.querySelector('#ul');
  let users = [];
  const load = async (v) => {
    q = v;
    try { users = (await api('/admin/users?q=' + encodeURIComponent(v))).users; } catch (e) { return toast(e.message, 'bad'); }
    if (v !== q) return;
    ul.innerHTML = users.length ? `<div class="card list">${users.map((u) => `<div class="li"><div class="grow"><div class="t">${h(u.first_name || '')} ${u.username ? '@' + h(u.username) : ''} ${u.banned ? '⛔' : ''}</div><div class="s"><code>${u.id}</code> · ${date(u.created_at)}</div></div><div style="text-align:right"><div class="amt">${num(u.balance)}</div><button class="btn btn-ghost btn-sm" data-u="${u.id}">Boshqarish</button></div></div>`).join('')}</div>` : '<div class="empty"><b>Topilmadi</b></div>';
  };
  el.querySelector('#uq').value = q;
  bindSearch('uq', load, 300);
  await load(q);
  ul.onclick = (ev) => {
    const b = ev.target.closest('[data-u]'); if (!b) return;
    const u = users.find((x) => x.id === Number(b.dataset.u));
    const s = sheet(`<h3>${h(u.first_name || 'Foydalanuvchi')} ${u.username ? '@' + h(u.username) : ''}</h3><div class="hint" style="margin:0">ID ${u.id} · Balans ${som(u.balance)}</div>
      <label class="field"><span>Summa (+ qo‘shish, − ayirish)</span><input class="inp" id="ba" inputmode="numeric" placeholder="Masalan: 10000 yoki -5000"></label>
      <label class="field"><span>Izoh</span><input class="inp" id="bn" placeholder="Ixtiyoriy"></label>
      <button class="btn btn-primary btn-block mt" id="bs">Balansni o‘zgartirish</button>
      <button class="btn btn-ghost btn-block mt" id="bm">✉️ Xabar yozish</button>
      <button class="btn ${u.banned ? 'btn-ok' : 'btn-bad'} btn-block mt" id="bb">${u.banned ? 'Blokdan chiqarish' : 'Bloklash'}</button>`);
    s.querySelector('#bs').onclick = async () => { const a = Number(s.querySelector('#ba').value.replace(/[^\d-]/g, '')); if (!a) return toast('Summani kiriting', 'bad'); try { await api(`/admin/users/${u.id}/balance`, { method: 'POST', body: { amount: a, note: s.querySelector('#bn').value } }); toast('Saqlandi', 'ok'); closeSheet(); load(q); } catch (e) { toast(e.message, 'bad'); } };
    s.querySelector('#bb').onclick = async () => { try { await api(`/admin/users/${u.id}/ban`, { method: 'POST', body: { banned: !u.banned } }); closeSheet(); load(q); } catch (e) { toast(e.message, 'bad'); } };
    s.querySelector('#bm').onclick = () => { closeSheet(); sessionStorage.setItem('msgTo', String(u.id)); go('#/admin/message'); };
  };
};
admin.games = async (el) => {
  const [{ games }, pr] = await Promise.all([api('/admin/games'), api('/admin/pricing/all')]);
  el.innerHTML = `
    <div class="card"><b>💰 Hamma o‘yinlar narxi</b>
      <div class="hint" style="margin:4px 0 0">Donat24 narxiga shu foiz qo‘shiladi. Alohida % qo‘yilgan o‘yinlar va qo‘lda narx qo‘yilgan paketlar bundan mustasno.</div>
      <div class="inline mt"><input class="inp" id="gm" inputmode="decimal" value="${pr.markup}" placeholder="10"><span class="btn btn-ghost" style="pointer-events:none">%</span><button class="btn btn-primary" id="gms">Saqlash</button></div>
      <div class="hint" id="gmi">Alohida % li o‘yinlar: <b>${pr.game_markups}</b> · Qo‘lda narxli paketlar: <b>${pr.fixed_prices}</b></div>
      <div class="row2" style="margin-top:8px"><button class="btn btn-ghost btn-sm" id="rgm">O‘yin % larini tozalash</button><button class="btn btn-ghost btn-sm" id="rfp">Qo‘lda narxlarni tozalash</button></div>
    </div>
    ${searchBox('gq', 'O‘yinni qidiring: pubg, ff, mlbb…')}
    <div class="hint" style="margin:-4px 0 12px">O‘yinni bosing — har bir paket narxini o‘zgartirasiz. ★ — bosh sahifada yuqorida. 👁️ — ko‘rinishi. % — shu o‘yin ustamasi (bo‘sh = umumiy).</div>
    <div class="card list" id="gl"></div>
    <button class="btn btn-ghost btn-block mt" id="cc">🔄 Katalogni yangilash</button>`;
  const gl = el.querySelector('#gl');
  let q = '';
  const draw = () => {
    const list = searchGames(games, q).slice(0, 150);
    gl.innerHTML = list.length ? list.map((g) => `<div class="li" data-slug="${h(g.slug)}"><div class="th" data-act="open">${img(g.image_url)}</div><div class="grow" data-act="open" style="min-width:0"><div class="t">${h(g.name)}</div><div class="s">${g.available ? '' : '⚠️ API orqali yo‘q · '}${g.hidden ? '🚫 yashirin · ' : ''}${g.markup !== null && g.markup !== undefined ? `<b style="color:var(--gold)">${g.markup}%</b>` : `umumiy ${pr.markup}%`} · narxlar ›</div></div>
      <button class="btn btn-ghost btn-sm" data-act="pop" style="color:${g.popular ? 'var(--gold)' : 'var(--muted)'}">★</button>
      <button class="btn btn-ghost btn-sm" data-act="hide">${g.hidden ? '🚫' : '👁️'}</button>
      <input class="inp" data-act="mk" style="width:58px;padding:8px" inputmode="decimal" placeholder="%" value="${g.markup ?? ''}"></div>`).join('') : '<div class="hint center" style="margin:0">Topilmadi</div>';
  };
  draw();
  bindSearch('gq', (v) => { q = v; draw(); });
  const refreshInfo = (r) => { pr.markup = r.markup; pr.game_markups = r.game_markups; pr.fixed_prices = r.fixed_prices; el.querySelector('#gmi').innerHTML = `Alohida % li o‘yinlar: <b>${r.game_markups}</b> · Qo‘lda narxli paketlar: <b>${r.fixed_prices}</b>`; state.games = null; };
  el.querySelector('#gms').onclick = async () => { try { refreshInfo(await api('/admin/pricing/all', { method: 'POST', body: { markup: el.querySelector('#gm').value.trim() } })); toast(`✅ Hamma o‘yinlarga ${pr.markup}% ustama`, 'ok'); draw(); } catch (e) { toast(e.message, 'bad'); } };
  el.querySelector('#rgm').onclick = async () => { if (!confirm('Hamma o‘yinlarning alohida % lari o‘chirilsinmi? Hammasiga umumiy % ishlaydi.')) return; try { refreshInfo(await api('/admin/pricing/all', { method: 'POST', body: { reset_game_markups: true } })); games.forEach((g) => (g.markup = null)); draw(); toast('Tozalandi', 'ok'); } catch (e) { toast(e.message, 'bad'); } };
  el.querySelector('#rfp').onclick = async () => { if (!confirm('Hamma qo‘lda qo‘yilgan paket narxlari o‘chirilsinmi?')) return; try { refreshInfo(await api('/admin/pricing/all', { method: 'POST', body: { reset_fixed_prices: true } })); toast('Tozalandi', 'ok'); } catch (e) { toast(e.message, 'bad'); } };
  gl.onclick = async (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT') return;
    const slug = b.closest('[data-slug]').dataset.slug; const g = games.find((x) => x.slug === slug);
    if (b.dataset.act === 'open') return priceSheet(g, pr, () => { draw(); api('/admin/pricing/all').then(refreshInfo).catch(() => {}); });
    const body = b.dataset.act === 'pop' ? { popular: !g.popular } : { hidden: !g.hidden };
    try { const r = await api('/admin/games/' + encodeURIComponent(slug), { method: 'POST', body }); g.popular = !!r.override.popular; g.hidden = !!r.override.hidden; state.games = null; draw(); } catch (err) { toast(err.message, 'bad'); }
  };
  gl.onchange = async (e) => {
    if (e.target.dataset.act !== 'mk') return;
    const slug = e.target.closest('[data-slug]').dataset.slug; const g = games.find((x) => x.slug === slug);
    try { const r = await api('/admin/games/' + encodeURIComponent(slug), { method: 'POST', body: { markup: e.target.value.trim() } }); g.markup = r.override.markup; state.games = null; toast('Ustama saqlandi', 'ok'); draw(); } catch (err) { toast(err.message, 'bad'); }
  };
  el.querySelector('#cc').onclick = async () => { await api('/admin/cache/clear', { method: 'POST' }); state.games = null; toast('Katalog yangilandi', 'ok'); admin.games(el); };
};

// Bitta o'yin paketlari narxi
async function priceSheet(g, pr, onDone) {
  const s = sheet(spinner());
  let d;
  try { d = await api(`/admin/games/${encodeURIComponent(g.slug)}/products`); } catch (e) { closeSheet(); return toast(e.message, 'bad'); }
  const mk = d.game.markup ?? d.global_markup;
  s.innerHTML = `<div class="grab"></div>
    <div style="display:flex;gap:12px;align-items:center"><div class="li" style="padding:0"><div class="th">${img(g.image_url)}</div></div><div class="grow"><h3 style="margin:0">${h(g.name)}</h3><div class="hint" style="margin:2px 0 0">${d.products.length} ta paket · ustama ${mk}%${d.game.markup !== null ? ' (alohida)' : ' (umumiy)'}</div></div></div>
    <div class="hint">Narx katagiga o‘z narxingizni yozing. Bo‘sh qoldirsangiz — avtomatik (tannarx + ${mk}%). <span class="badt">Qizil</span> — tannarxdan arzon (zarar).</div>
    ${d.products.length > 8 ? searchBox('ppq', 'Paketni qidiring') : ''}
    <div class="list" id="pl" style="max-height:52vh;overflow:auto;margin-top:8px"></div>
    <div class="row2" style="margin-top:12px"><button class="btn btn-ghost" id="pclr">Hammasini avtomatik</button><button class="btn btn-primary" id="psave">💾 Saqlash</button></div>`;
  const pl = s.querySelector('#pl'); const changed = new Map();
  const row = (p) => `<div class="li" data-id="${p.id}"><div class="th">${p.image_url ? img(p.image_url) : img(g.image_url)}</div><div class="grow" style="min-width:0"><div class="t" style="white-space:normal">${h(p.name)}</div><div class="s">tannarx ${num(p.cost)} · avto ${num(p.auto_price)}</div></div><input class="inp${p.fixed_price && p.fixed_price < p.cost ? ' loss' : ''}" data-pid="${p.id}" style="width:104px;padding:9px;text-align:right" inputmode="numeric" placeholder="${num(p.auto_price)}" value="${changed.has(p.id) ? h(changed.get(p.id) ?? '') : p.fixed_price ? num(p.fixed_price) : ''}"></div>`;
  let q = '';
  const draw = () => { pl.innerHTML = searchProducts(d.products, q).map(row).join('') || '<div class="hint center">Topilmadi</div>'; };
  draw();
  if (s.querySelector('#ppq')) bindSearch('ppq', (v) => { q = v; draw(); });
  pl.oninput = (e) => {
    const i = e.target; if (!i.dataset.pid) return;
    const v = i.value.replace(/\D/g, ''); i.value = v ? num(v) : '';
    const p = d.products.find((x) => x.id === Number(i.dataset.pid));
    changed.set(p.id, v ? Number(v) : null);
    i.classList.toggle('loss', !!v && Number(v) < p.cost);
  };
  s.querySelector('#pclr').onclick = () => { d.products.forEach((p) => changed.set(p.id, null)); pl.querySelectorAll('[data-pid]').forEach((i) => { i.value = ''; i.classList.remove('loss'); }); };
  s.querySelector('#psave').onclick = async (e) => {
    if (!changed.size) return closeSheet();
    const loss = [...changed].filter(([id, v]) => v && v < d.products.find((p) => p.id === id).cost).length;
    if (loss && !confirm(`${loss} ta paket tannarxdan arzon (zarar). Baribir saqlansinmi?`)) return;
    e.currentTarget.disabled = true;
    try { await api(`/admin/games/${encodeURIComponent(g.slug)}/prices`, { method: 'POST', body: { items: [...changed].map(([product_id, price]) => ({ product_id, price })) } }); toast('✅ Narxlar saqlandi', 'ok'); closeSheet(); onDone?.(); }
    catch (err) { toast(err.message, 'bad'); e.currentTarget.disabled = false; }
  };
}
admin.promos = async (el) => {
  const { promos } = await api('/admin/promos');
  el.innerHTML = `<div class="card"><b>Yangi promokod</b>
      <label class="field"><span>Kod</span><input class="inp" id="pc" placeholder="BONUS2026" style="text-transform:uppercase"></label>
      <div class="row2" style="margin-top:0"><label class="field"><span>Bonus (so‘m)</span><input class="inp" id="pa" inputmode="numeric"></label><label class="field"><span>Necha marta</span><input class="inp" id="pu" inputmode="numeric" value="100"></label></div>
      <button class="btn btn-primary btn-block mt" id="pcs">Saqlash</button></div>
    <div class="card list mt">${promos.length ? promos.map((p) => `<div class="li"><div class="grow"><div class="t">${h(p.code)}</div><div class="s">+${som(p.amount)} · qoldi ${p.uses_left}</div></div><button class="btn btn-ghost btn-sm" data-del="${h(p.code)}">🗑️</button></div>`).join('') : '<div class="hint center" style="margin:0">Promokodlar yo‘q</div>'}</div>`;
  el.querySelector('#pcs').onclick = async () => { try { await api('/admin/promos', { method: 'POST', body: { code: el.querySelector('#pc').value, amount: Number(el.querySelector('#pa').value.replace(/\D/g, '')), uses: Number(el.querySelector('#pu').value) } }); toast('Saqlandi', 'ok'); admin.promos(el); } catch (e) { toast(e.message, 'bad'); } };
  el.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => { if (!confirm('O‘chirilsinmi?')) return; await api('/admin/promos/' + encodeURIComponent(b.dataset.del), { method: 'DELETE' }); admin.promos(el); }));
};
admin.settings = async (el) => {
  const { settings: s } = await api('/admin/settings');
  const f = (k, label, ph = '', type = 'text') => `<label class="field"><span>${label}</span>${type === 'area' ? `<textarea class="inp" data-k="${k}" placeholder="${h(ph)}">${h(s[k])}</textarea>` : `<input class="inp" data-k="${k}" value="${h(s[k])}" placeholder="${h(ph)}" ${type === 'num' ? 'inputmode="decimal"' : ''}>`}</label>`;
  el.innerHTML = `
    <div class="card"><b>💰 Narx</b>${f('markup', 'Umumiy ustama (%) — Donat24 narxiga qo‘shiladi', '10', 'num')}${f('min_topup', 'Eng kam to‘ldirish (so‘m)', '5000', 'num')}${f('max_topup', 'Eng ko‘p to‘ldirish (so‘m)', '10000000', 'num')}${f('ref_bonus', 'Do‘st taklifi bonusi (so‘m, 0 = o‘chiq)', '0', 'num')}</div>
    <a class="card" href="#/admin/cards" style="display:flex;align-items:center;gap:12px"><span style="font-size:22px">💳</span><div class="grow"><b>To‘lov kartalari</b><div class="hint" style="margin:2px 0 0">Kartalar bo‘limida qo‘shiladi</div></div><span>›</span></a>
    <div class="card"><b>🔗 Havolalar</b>${f('channel_url', 'Kanal havolasi', 'https://t.me/kanalingiz')}${f('support_url', 'Yordam (admin) havolasi', 'https://t.me/username')}</div>
    <div class="card"><b>🎨 Ko‘rinish</b>${f('shop_name', 'Do‘kon nomi', 'Donat')}${f('banner_title', 'Banner sarlavhasi')}${f('banner_subtitle', 'Banner matni')}${f('welcome_text', '/start xabari ({name} — ism)', '', 'area')}
      <label class="field"><span>/start rasmi</span><label class="drop" id="wdrop"><input type="file" id="wfile" accept="image/*" hidden>${/^https?:/.test(s.welcome_photo) ? `<img src="${h(s.welcome_photo)}">` : '<img src="/logo.jpg">'}<span>Rasmni almashtirish uchun bosing</span></label></label>
      ${s.welcome_photo ? '<button class="btn btn-ghost btn-sm" id="wreset">Standart rasmga qaytarish</button>' : ''}</div>
    <div class="card" style="display:flex;align-items:center;gap:12px"><div class="grow"><b>Do‘kon ochiq</b><div class="hint" style="margin:2px 0 0">O‘chirsangiz, yangi buyurtma qabul qilinmaydi</div></div><label class="switch"><input type="checkbox" id="open" ${s.shop_open === '1' ? 'checked' : ''}><i></i></label></div>
    <button class="btn btn-primary btn-block mt" id="save">💾 Saqlash</button>`;
  el.querySelector('#wfile').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const photo = await compress(f); await api('/admin/welcome-photo', { method: 'POST', body: { photo } }); toast('✅ /start rasmi yangilandi', 'ok'); admin.settings(el); } catch (err) { toast(err.message, 'bad'); }
  };
  el.querySelector('#wreset')?.addEventListener('click', async () => { await api('/admin/welcome-photo', { method: 'POST', body: {} }); toast('Standart rasm', 'ok'); admin.settings(el); });
  el.querySelector('#save').onclick = async (e) => {
    const body = { shop_open: el.querySelector('#open').checked ? '1' : '0' };
    el.querySelectorAll('[data-k]').forEach((i) => (body[i.dataset.k] = i.value.trim()));
    e.currentTarget.disabled = true;
    try { await api('/admin/settings', { method: 'POST', body }); await refreshMe(); state.games = null; toast('✅ Saqlandi', 'ok'); } catch (err) { toast(err.message, 'bad'); }
    e.currentTarget.disabled = false;
  };
};
admin.message = async (el) => {
  const pre = sessionStorage.getItem('msgTo') || ''; sessionStorage.removeItem('msgTo');
  let mode = pre ? 'one' : 'all'; let photo = null;
  const info = await api('/admin/broadcast');
  el.innerHTML = `<div class="seg" id="mm"><button data-m="all">📣 Hammaga</button><button data-m="one">👤 Bitta odamga</button></div>
    <div class="card">
      <div id="tob"><label class="field" style="margin-top:0"><span>Kimga (Telegram ID yoki @username)</span><input class="inp" id="mto" value="${h(pre)}" placeholder="Masalan: 8787603995 yoki @username" autocomplete="off"></label><div class="hint" id="mwho"></div></div>
      <div class="hint" id="allh" style="margin-top:0">Botga START bosgan <b>${num(info.users)}</b> ta foydalanuvchiga yuboriladi.</div>
      <label class="field"><span>Xabar matni</span><textarea class="inp" id="bt" rows="5" placeholder="Yangi aksiya! PUBG UC 10% arzon…"></textarea></label>
      <label class="field"><span>Rasm (ixtiyoriy)</span><label class="drop" id="mdrop"><input type="file" id="mfile" accept="image/*" hidden><span style="font-size:26px">🖼️</span><span>Rasm tanlash</span></label></label>
      <div class="row2" style="margin-top:0"><label class="field"><span>Tugma matni</span><input class="inp" id="btt" placeholder="Do‘konni ochish"></label><label class="field"><span>Tugma havolasi</span><input class="inp" id="btu" placeholder="https://t.me/..."></label></div>
      <button class="btn btn-primary btn-block mt" id="bsend">Yuborish</button>
      <div class="hint" id="bst"></div>
    </div>`;
  const setMode = (m) => { mode = m; el.querySelectorAll('#mm button').forEach((b) => b.classList.toggle('on', b.dataset.m === m)); el.querySelector('#tob').hidden = m !== 'one'; el.querySelector('#allh').hidden = m !== 'all'; };
  el.querySelectorAll('#mm button').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
  setMode(mode);
  const who = async () => {
    const v = el.querySelector('#mto').value.trim(); const w = el.querySelector('#mwho');
    if (!v) return (w.textContent = '');
    try { const { user: u } = await api('/admin/users/find?q=' + encodeURIComponent(v)); w.innerHTML = !u ? '<span class="badt">Topilmadi — bu odam botga hali kirmagan</span>' : u.unknown ? '⚠️ Bu ID botda yo‘q — START bosmagan bo‘lsa xabar yetmaydi' : `<span class="okt">✅ ${h(u.first_name || '')} ${u.username ? '@' + h(u.username) : ''} · balans ${som(u.balance)}</span>`; } catch {}
  };
  let wt; el.querySelector('#mto').oninput = () => { clearTimeout(wt); wt = setTimeout(who, 350); };
  if (pre) who();
  el.querySelector('#mfile').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; photo = await compress(f); el.querySelector('#mdrop').innerHTML = `<img src="${photo}"><span>Boshqa rasm</span>`; el.querySelector('#mdrop').onclick = () => el.querySelector('#mfile').click(); };
  const st = el.querySelector('#bst');
  const poll = async () => {
    const { state: b } = await api('/admin/broadcast');
    if (!b.started_at) return;
    st.innerHTML = b.running ? `⏳ Yuborilmoqda: ${b.done}/${b.total} (yetdi: ${b.ok})` : `✅ Oxirgi xabar: ${b.ok}/${b.total} kishiga yetdi`;
    if (b.running && document.body.contains(st)) setTimeout(poll, 1500);
  };
  poll();
  el.querySelector('#bsend').onclick = async (e) => {
    const body = { text: el.querySelector('#bt').value.trim(), photo, button_text: el.querySelector('#btt').value.trim(), button_url: el.querySelector('#btu').value.trim() };
    if (!body.text && !photo) return toast('Matn yoki rasm kiriting', 'bad');
    const btn = e.currentTarget;
    if (mode === 'one') {
      body.to = el.querySelector('#mto').value.trim(); if (!body.to) return toast('Kimga yuborishni kiriting', 'bad');
      btn.disabled = true;
      try { await api('/admin/message', { method: 'POST', body }); toast('✅ Xabar yetkazildi', 'ok'); el.querySelector('#bt').value = ''; }
      catch (err) { toast(err.message, 'bad'); }
      btn.disabled = false; return;
    }
    if (!confirm(`${num(info.users)} kishiga yuborilsinmi?`)) return;
    btn.disabled = true;
    try { await api('/admin/broadcast', { method: 'POST', body }); toast('Yuborish boshlandi', 'ok'); poll(); } catch (err) { toast(err.message, 'bad'); }
    btn.disabled = false;
  };
};

admin.cards = async (el) => {
  const { cards } = await api('/admin/cards');
  el.innerHTML = `${cards.length ? cards.map((c) => `<div class="paycard" style="margin-bottom:10px;${c.active ? '' : 'opacity:.5'}"><div class="label">${h(c.bank || 'Karta')}${c.active ? '' : ' · o‘chirilgan'}</div><div class="num">${h(c.number)}</div><div class="hint" style="margin:0 0 10px">${h(c.holder || '')}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">✏️ Tahrirlash</button><button class="btn btn-ghost btn-sm" data-tog="${c.id}">${c.active ? '⏸ O‘chirish' : '▶️ Yoqish'}</button><button class="btn btn-bad btn-sm" data-del="${c.id}">🗑️</button></div></div>`).join('') : '<div class="empty"><div class="ei"><img src="/card.webp" alt=""></div><b>Kartalar yo‘q</b>Mijozlar pul o‘tkazishi uchun karta qo‘shing</div>'}
    <button class="btn btn-primary btn-block mt" id="cadd">＋ Karta qo‘shish</button>
    <div class="hint">Yoqilgan kartalarning hammasi «To‘ldirish» sahifasida ko‘rinadi.</div>`;
  const form = (c = {}) => {
    const s = sheet(`<h3>${c.id ? 'Kartani tahrirlash' : 'Yangi karta'}</h3>
      <label class="field"><span>Karta raqami</span><input class="inp" id="cn" inputmode="numeric" value="${h(c.number || '')}" placeholder="8600 0000 0000 0000"></label>
      <label class="field"><span>Karta egasi</span><input class="inp" id="ch" value="${h(c.holder || '')}" placeholder="ISM FAMILIYA"></label>
      <label class="field"><span>Karta turi / bank</span><input class="inp" id="cb" value="${h(c.bank || '')}" placeholder="Humo · Uzcard · Visa"></label>
      <button class="btn btn-primary btn-block mt" id="csave">💾 Saqlash</button>`);
    const cn = s.querySelector('#cn');
    cn.oninput = () => { cn.value = cn.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '); };
    s.querySelector('#csave').onclick = async () => {
      try { await api('/admin/cards', { method: 'POST', body: { id: c.id, number: cn.value, holder: s.querySelector('#ch').value, bank: s.querySelector('#cb').value } }); closeSheet(); toast('✅ Saqlandi', 'ok'); await refreshMe(); admin.cards(el); } catch (e) { toast(e.message, 'bad'); }
    };
  };
  el.querySelector('#cadd').onclick = () => form();
  el.onclick = async (e) => {
    const b = e.target.closest('[data-edit],[data-tog],[data-del]'); if (!b) return;
    try {
      if (b.dataset.edit) return form(cards.find((c) => c.id === Number(b.dataset.edit)));
      if (b.dataset.tog) await api(`/admin/cards/${b.dataset.tog}/toggle`, { method: 'POST' });
      if (b.dataset.del) { if (!confirm('Karta o‘chirilsinmi?')) return; await api(`/admin/cards/${b.dataset.del}`, { method: 'DELETE' }); }
      await refreshMe(); admin.cards(el);
    } catch (err) { toast(err.message, 'bad'); }
  };
};

admin.admins = async (el) => {
  const d = await api('/admin/admins');
  const draw = (admins) => {
    el.innerHTML = `<div class="card list">${admins.map((a) => `<div class="li"><div class="th">${a.owner ? '👑' : '👮'}</div><div class="grow"><div class="t">${h(a.first_name || 'Admin')} ${a.username ? '@' + h(a.username) : ''}${a.id === d.me ? ' (siz)' : ''}</div><div class="s"><code>${a.id}</code> · ${a.owner ? 'asosiy admin' : 'admin'}${a.started ? '' : ' · ⚠️ botga hali kirmagan'}</div></div>${!a.owner && d.canEdit ? `<button class="btn btn-bad btn-sm" data-rm="${a.id}">🗑️</button>` : ''}</div>`).join('')}</div>
      ${d.canEdit ? `<div class="card mt"><b>Yangi admin qo‘shish</b><div class="inline mt"><input class="inp" id="aid" inputmode="numeric" placeholder="Telegram ID"><button class="btn btn-primary" id="aadd">Qo‘shish</button></div><div class="hint">ID ni @userinfobot orqali bilish mumkin. Admin botga /start bossin — shunda /admin buyrug‘i chiqadi.</div></div>` : '<div class="hint">Adminlarni faqat asosiy admin qo‘sha oladi.</div>'}`;
    el.querySelector('#aadd')?.addEventListener('click', async () => { try { const r = await api('/admin/admins', { method: 'POST', body: { id: el.querySelector('#aid').value.trim() } }); toast('✅ Admin qo‘shildi', 'ok'); draw(r.admins); } catch (e) { toast(e.message, 'bad'); } });
    el.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = async () => { if (!confirm('Admin o‘chirilsinmi?')) return; try { const r = await api('/admin/admins/' + b.dataset.rm, { method: 'DELETE' }); draw(r.admins); } catch (e) { toast(e.message, 'bad'); } }));
  };
  draw(d.admins);
};

// ---------- router ----------
async function route() {
  closeSheet();
  const hash = location.hash || '#/';
  const [, page = '', arg = ''] = hash.match(/^#\/([^/]*)\/?(.*)$/) || [];
  try { page === 'game' ? tg?.BackButton?.show() : tg?.BackButton?.hide(); } catch {}
  const navKey = page === 'game' ? '#/games' : page === 'top' ? '#/profile' : '#/' + page;
  renderNav(navKey);
  window.scrollTo(0, 0);
  try {
    if (page === 'game') await pages.game(decodeURIComponent(arg));
    else if (page === 'admin') await pages.admin(arg || 'stats');
    else await (pages[page] || pages.home)();
  } catch (e) {
    $view.innerHTML = `<div class="empty"><div class="ei"><img src="/warn.webp" alt=""></div><b>Yuklab bo‘lmadi</b>${h(e.message)}<div class="mt"><button class="btn btn-primary" onclick="location.reload()">Qayta urinish</button></div></div>`;
  }
}
try { tg?.BackButton?.onClick(() => history.back()); } catch {}

(async function boot() {
  $view.innerHTML = spinner();
  try { await refreshMe(); }
  catch (e) {
    $nav.innerHTML = '';
    $view.innerHTML = `<div class="empty" style="padding-top:90px"><img src="/logo.jpg" style="width:120px;border-radius:28px;margin:0 auto 20px"><b>${e.code === 'auth' ? 'Telegram orqali oching' : 'Xatolik'}</b>${h(e.message)}</div>`;
    return;
  }
  if (state.me.user.banned) { $view.innerHTML = '<div class="empty"><div class="ei"><img src="/ban.webp" alt=""></div><b>Hisobingiz bloklangan</b></div>'; return; }
  window.addEventListener('hashchange', route);
  route();
})();
