const tg = window.Telegram?.WebApp;
try { tg?.ready(); tg?.expand(); tg?.setHeaderColor?.('#080b17'); tg?.setBackgroundColor?.('#080b17'); } catch {}

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
  const items = [['#/', '🏠', 'Asosiy'], ['#/games', '🎮', 'O‘yinlar'], ['#/topup', '💳', 'To‘ldirish'], ['#/orders', '🕒', 'Buyurtmalar'], ['#/profile', '👤', 'Profil']];
  if (state.me?.isAdmin) items.push(['#/admin', '⚙️', 'Admin']);
  $nav.innerHTML = items.map(([href, i, t]) => `<a href="${href}" class="${active === href ? 'on' : ''}"><span class="ni">${i}</span>${t}</a>`).join('');
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
  return `<div class="card balance"><div class="ic">💰</div><div class="grow"><div class="label">Balans</div><div class="sum">${num(state.me.user.balance)}<span>so‘m</span></div></div><a class="btn btn-primary" href="#/topup">＋ To‘ldirish</a></div>`;
}
function gameTile(g) {
  return `<a class="g" href="#/game/${encodeURIComponent(g.slug)}"><div class="cv">${img(g.image_url, g.name)}${g.popular ? '<span class="hot">★ Top</span>' : ''}</div><span>${h(g.name)}</span></a>`;
}
const skelGrid = (n = 8) => `<div class="grid">${Array.from({ length: n }, () => '<div class="g"><div class="cv skel"></div><span class="skel" style="height:12px;border-radius:6px"></span></div>').join('')}</div>`;
async function loadGames() { if (!state.games) state.games = (await api('/games')).games; return state.games; }
async function refreshMe() { state.me = await api('/me'); return state.me; }

// ---------- pages ----------
const pages = {};

pages.home = async () => {
  const { user, settings } = state.me;
  const name = user.first_name || user.username || 'do‘st';
  $view.innerHTML = `
    <div class="hello"><div class="avatar">${state.me.user.photo_url ? img(state.me.user.photo_url) : h(name[0]?.toUpperCase())}</div><div><small>Salom 👋</small><b>${h(name)}</b></div></div>
    ${balanceCard()}
    <div class="row2"><a class="tile" href="#/profile"><span class="e">🎟️</span>Promokodlar</a><button class="tile" id="help"><span class="e">🎧</span>Yordam</button></div>
    ${settings.shop_open ? '' : '<div class="card mt badt">⚠️ Do‘kon vaqtincha yopiq. Tez orada qaytamiz!</div>'}
    <div class="banner"><h2>${h(settings.banner_title)}</h2><p>${h(settings.banner_subtitle)}</p><img src="/logo.jpg" alt=""></div>
    <div class="sec"><h3>Ommabop o‘yinlar</h3><a href="#/games">Barchasi</a></div>
    <div id="pop">${skelGrid(8)}</div>
    <a class="card mt" href="#/top" style="display:flex;align-items:center;gap:14px"><span style="font-size:28px">🏆</span><div class="grow"><b>Eng yaxshi donorlar</b><div class="hint" style="margin:2px 0 0">Eng yaxshi 100 talik</div></div><span style="color:var(--muted)">›</span></a>`;
  document.getElementById('help').onclick = () => openLink(settings.support_url);
  const games = await loadGames();
  document.getElementById('pop').innerHTML = `<div class="grid">${games.slice(0, 16).map(gameTile).join('')}</div>`;
};

pages.games = async () => {
  $view.innerHTML = `<div class="page-title">Barcha o‘yinlar</div>
    <label class="search"><span>🔍</span><input id="q" placeholder="O‘yin yoki xizmatni qidiring" autocomplete="off"></label>
    <div id="list">${skelGrid(16)}</div>`;
  const games = await loadGames();
  const list = document.getElementById('list');
  const draw = (q = '') => {
    const f = games.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()) || g.slug.includes(q.toLowerCase()));
    list.innerHTML = f.length ? `<div class="grid">${f.map(gameTile).join('')}</div>` : '<div class="empty"><div class="ei">🔎</div><b>Topilmadi</b>Boshqa nom bilan qidirib ko‘ring</div>';
  };
  draw();
  document.getElementById('q').oninput = (e) => draw(e.target.value.trim());
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
    <div class="pk-grid" id="pk"></div>
    ${products.length ? '' : '<div class="empty"><div class="ei">📦</div><b>Paketlar yo‘q</b>Bu o‘yin uchun hozircha paket mavjud emas</div>'}`;
  const pk = document.getElementById('pk');
  const draw = () => {
    const list = group && group !== 'all' ? products.filter((p) => groupOf(p.name) === group) : products;
    pk.innerHTML = list.map((p) => `<button class="pk" data-id="${p.id}"><div class="pi">${p.image_url ? img(p.image_url) : game.image_url ? img(game.image_url) : '💎'}</div><div class="grow"><div class="pn">${h(p.name)}</div><div class="pp">${num(p.price)} <small>so‘m</small></div></div></button>`).join('');
    pk.querySelectorAll('.pk').forEach((b) => (b.onclick = () => { haptic(); selected = products.find((p) => p.id === Number(b.dataset.id)); pk.querySelectorAll('.pk').forEach((x) => x.classList.toggle('on', x === b)); buySheet(game, selected); }));
  };
  draw();
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
  const auto = !!settings.auto_pay;
  $view.innerHTML = `<div class="page-title">Balansni to‘ldirish</div>
    <div class="card balance"><div class="grow"><div class="label">Balans</div><div class="sum">${num(user.balance)}<span>so‘m</span></div></div></div>
    ${auto ? `<div id="autobox">${spinner()}</div>${settings.card_number ? '<button class="btn btn-ghost btn-block mt" id="showman">🧾 Chek orqali to‘ldirish</button>' : ''}<div id="manual" hidden></div>` : '<div id="manual"></div>'}
    <div class="sec"><h3>So‘rovlarim</h3></div><div class="card list" id="mine">${spinner()}</div>`;
  if (auto) {
    renderAuto(document.getElementById('autobox'));
    document.getElementById('showman')?.addEventListener('click', (e) => { e.currentTarget.remove(); const m = document.getElementById('manual'); m.hidden = false; renderManual(m); });
  } else renderManual(document.getElementById('manual'));
  const { topups } = await api('/orders');
  document.getElementById('mine').innerHTML = topups.length ? topups.map((t) => `<div class="li"><div class="th">${t.method === 'auto' ? '⚡' : '💳'}</div><div class="grow"><div class="t">#${t.id} · ${som(t.amount)}</div><div class="s">${date(t.created_at)}</div></div><span class="badge ${t.status}">${t.method === 'auto' && t.status === 'pending' ? 'Kutilmoqda' : t.method === 'auto' && t.status === 'rejected' ? 'Bekor qilindi' : STATUS[t.status]}</span></div>`).join('') : '<div class="hint center" style="margin:0">Hali so‘rov yo‘q</div>';
};

// ⚡ Avto to'lov (HamyonAPI): summa -> karta -> 5–30 soniyada avtomatik tasdiq
let autoTimer = null;
async function renderAuto(box) {
  clearInterval(autoTimer);
  const { settings } = state.me;
  let active = null;
  try { active = (await api('/topups/auto/active')).topup; } catch {}
  if (active?.card) return renderAutoPay(box, active);
  const quick = [10000, 20000, 50000, 100000].filter((v) => v >= settings.min_topup && v <= settings.max_topup);
  box.innerHTML = `<div class="sec"><h3>⚡ Avto to‘lov</h3></div>
    <div class="card">
      <label class="field" style="margin-top:0"><span>Summa (so‘m)</span><input class="inp" id="aamt" inputmode="numeric" placeholder="Eng kam: ${num(settings.min_topup)}"></label>
      ${quick.length ? `<div class="chips">${quick.map((v) => `<button class="chip" data-v="${v}">${num(v)}</button>`).join('')}</div>` : ''}
      <button class="btn btn-primary btn-block mt" id="acreate">To‘lov yaratish</button>
      <div class="hint">HUMO yoki UZCARD kartadan o‘tkazasiz — balans 5–30 soniyada o‘zi to‘ldiriladi. Chek kerak emas.</div>
    </div>`;
  const amt = box.querySelector('#aamt');
  amt.oninput = () => { const v = amt.value.replace(/\D/g, ''); amt.value = v ? num(v) : ''; box.querySelectorAll('.chip').forEach((c) => c.classList.remove('on')); };
  box.querySelectorAll('.chip').forEach((c) => (c.onclick = () => { amt.value = num(c.dataset.v); box.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c)); }));
  box.querySelector('#acreate').onclick = async (e) => {
    const b = e.currentTarget; const amount = Number(amt.value.replace(/\D/g, ''));
    if (!amount || amount < settings.min_topup) return toast(`Eng kam summa: ${som(settings.min_topup)}`, 'bad');
    if (amount > settings.max_topup) return toast(`Eng ko‘p summa: ${som(settings.max_topup)}`, 'bad');
    b.disabled = true; b.textContent = 'Yaratilmoqda…';
    try { const { topup } = await api('/topups/auto', { method: 'POST', body: { amount } }); renderAutoPay(box, topup, amount); }
    catch (err) { toast(err.message, 'bad'); b.disabled = false; b.textContent = 'To‘lov yaratish'; }
  };
}

function renderAutoPay(box, t, asked = null) {
  clearInterval(autoTimer);
  const card = String(t.card || '');
  box.innerHTML = `<div class="sec"><h3>⚡ To‘lov #${t.id}</h3></div>
    <div class="paycard autopay" id="ap-${t.id}">
      <div class="label">Shu kartaga o‘tkazing</div>
      <div class="ap-row"><div class="num">${h(card)}</div><button class="btn btn-ghost btn-sm" data-copy="${h(card.replace(/\s/g, ''))}">📋</button></div>
      <div class="label mt">Aynan shu summani o‘tkazing</div>
      <div class="ap-row"><div class="num ap-amt">${num(t.amount)} <span>so‘m</span></div><button class="btn btn-ghost btn-sm" data-copy="${t.amount}">📋</button></div>
      ${asked && asked !== t.amount ? `<div class="hint">Summa ${num(t.amount - asked)} so‘mga o‘zgartirildi — to‘lovingizni aniq topish uchun. Ortiqcha so‘m ham balansga tushadi.</div>` : ''}
      <div class="hint">⚠️ Summa so‘migacha bir xil bo‘lishi shart, aks holda to‘lov topilmaydi.</div>
      <div class="ap-status"><span class="ap-dot"></span><b id="apst">To‘lov kutilmoqda…</b><span class="grow"></span><span class="ap-timer" id="aptm">--:--</span></div>
      <button class="btn btn-ghost btn-block mt" id="apcancel">Bekor qilish</button>
    </div>`;
  box.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText(b.dataset.copy); toast('Nusxalandi', 'ok'); }));
  const tm = box.querySelector('#aptm');
  const tick = () => { const left = Math.max(0, (t.expire_at || 0) - Math.floor(Date.now() / 1000)); tm.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; if (!left) box.querySelector('#apst').textContent = 'Tekshirilmoqda…'; };
  tick();
  const finish = async (ok) => {
    clearInterval(autoTimer);
    if (ok) {
      try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {}
      box.innerHTML = `<div class="card center ap-done"><div style="font-size:44px">✅</div><b>Balans to‘ldirildi!</b><div class="hint">+${som(t.amount)}</div></div>`;
      await refreshMe(); setTimeout(() => { if (location.hash === '#/topup') pages.topup(); }, 1800);
    } else {
      box.innerHTML = `<div class="card center ap-done"><div style="font-size:44px">⌛</div><b>To‘lov yakunlanmadi</b><div class="hint">Muddati tugadi yoki bekor qilindi. Pul o‘tkazgan bo‘lsangiz, yordam bo‘limiga yozing.</div><button class="btn btn-primary btn-block mt" id="apagain">Qayta urinish</button></div>`;
      box.querySelector('#apagain').onclick = () => renderAuto(box);
    }
  };
  let n = 0;
  autoTimer = setInterval(async () => {
    if (!document.getElementById('ap-' + t.id)) return clearInterval(autoTimer);
    tick();
    if (++n % 4) return; // har 4 soniyada holat
    try {
      const r = await api(`/topups/${t.id}/status`);
      if (r.topup.status === 'approved') { t.amount = r.topup.amount; finish(true); }
      else if (r.topup.status === 'rejected') finish(false);
    } catch {}
  }, 1000);
  box.querySelector('#apcancel').onclick = async (e) => {
    if (!confirm('To‘lov bekor qilinsinmi? Pul o‘tkazgan bo‘lsangiz, bekor qilmang.')) return;
    e.currentTarget.disabled = true;
    try { const r = await api(`/topups/${t.id}/cancel`, { method: 'POST' }); if (r.topup.status === 'approved') finish(true); else { clearInterval(autoTimer); renderAuto(box); } }
    catch (err) { toast(err.message, 'bad'); e.currentTarget.disabled = false; }
  };
}

// 🧾 Karta + chek (admin qo'lda tasdiqlaydi)
function renderManual(box) {
  const { settings } = state.me;
  let receipt = null;
  box.innerHTML = `<div class="sec"><h3>1. Kartaga o‘tkazing</h3></div>
    ${settings.card_number ? `<div class="paycard"><div class="label">${h(settings.card_bank || 'Karta raqami')}</div><div class="num">${h(settings.card_number)}</div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="hint" style="margin:0">${h(settings.card_holder)}</span><button class="btn btn-ghost btn-sm" id="copy">📋 Nusxa</button></div></div>` : '<div class="card hint">Karta raqami hali sozlanmagan. Admin bilan bog‘laning.</div>'}
    <div class="sec"><h3>2. Summa va chek</h3></div>
    <div class="card">
      <label class="field" style="margin-top:0"><span>O‘tkazgan summangiz (so‘m)</span><input class="inp" id="amt" inputmode="numeric" placeholder="Eng kam: ${num(settings.min_topup)}"></label>
      <label class="field"><span>To‘lov cheki (skrinshot)</span><label class="drop" id="drop"><input type="file" id="file" accept="image/*" hidden><span style="font-size:28px">📎</span><span>Rasm tanlash uchun bosing</span></label></label>
      <button class="btn btn-primary btn-block mt" id="send">Yuborish</button>
      <div class="hint">Admin chekni tekshirib, balansingizni to‘ldiradi. Odatda 5–30 daqiqa.</div>
    </div>`;
  document.getElementById('copy')?.addEventListener('click', () => { navigator.clipboard?.writeText(settings.card_number.replace(/\s/g, '')); toast('Nusxalandi', 'ok'); });
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
}

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
      ol.innerHTML = data.orders.length ? `<div class="card list">${data.orders.map((o) => `<div class="li"><div class="th">${img(o.game_image) || '🎮'}</div><div class="grow"><div class="t">${h(o.product_name)}</div><div class="s">${h(o.game_name)} · ID ${h(o.player_id)} · #${o.id}</div><div class="s">${date(o.created_at)}${o.error && o.status === 'refunded' ? ' · ' + h(o.error) : ''}</div></div><div style="text-align:right"><div class="amt">${num(o.price)}</div><span class="badge ${o.status}">${STATUS[o.status] || o.status}</span></div></div>`).join('')}</div>` : '<div class="empty"><div class="ei">🛍️</div><b>Buyurtmalar yo‘q</b>Birinchi buyurtma shu yerda ko‘rinadi</div>';
    } else {
      ol.innerHTML = data.tx.length ? `<div class="card list">${data.tx.map((t) => `<div class="li"><div class="th">${t.amount > 0 ? '⬇️' : '⬆️'}</div><div class="grow"><div class="t">${TX[t.type] || t.type}</div><div class="s">${h(t.note || '')} · ${date(t.created_at)}</div></div><div class="amt ${t.amount > 0 ? 'plus' : ''}">${t.amount > 0 ? '+' : ''}${num(t.amount)}</div></div>`).join('')}</div>` : '<div class="empty"><div class="ei">💸</div><b>Tranzaksiyalar yo‘q</b></div>';
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
  document.getElementById('tl').innerHTML = top.length ? `<div class="card list">${top.map((t, i) => `<div class="li"><div class="th">${['🥇', '🥈', '🥉'][i] || i + 1}</div><div class="grow t">${h(t.name)}</div><div class="amt">${num(t.total)}</div></div>`).join('')}</div>` : '<div class="empty"><div class="ei">🏆</div><b>Hali ro‘yxat bo‘sh</b>Birinchi bo‘ling!</div>';
};

// ---------- ADMIN ----------
const ADMIN_TABS = [['stats', '📊 Statistika'], ['topups', '💳 To‘lovlar'], ['orders', '🛒 Buyurtmalar'], ['users', '👥 Foydalanuvchilar'], ['games', '🎮 O‘yinlar'], ['promos', '🎟️ Promokod'], ['settings', '⚙️ Sozlamalar'], ['broadcast', '📣 Xabar']];
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
    <div class="card paycard" style="margin-bottom:12px"><div class="label">Donat24 balansingiz</div><div class="num">${s.d24.error ? '<span class="badt" style="font-size:15px">' + h(s.d24.error) + '</span>' : som(s.d24.balance)}</div><div class="hint" style="margin:0">Buyurtmalar shu balansdan to‘lanadi. Kam bo‘lsa donat24.uz da to‘ldiring.</div></div>
    <div class="stats">${st('Foydalanuvchilar', num(s.users))}${st('Bugun yangi', num(s.usersToday))}${st('Kutilayotgan to‘lov', num(s.pendingTopups))}${st('Mijoz balanslari', som(s.balances))}${st('Buyurtmalar', `${num(s.ordersDelivered)} / ${num(s.ordersTotal)}`)}${st('Savdo (bugun)', som(s.revenueToday))}${st('Jami savdo', som(s.revenue))}${st('Foyda', som(s.profit))}${st('Tasdiqlangan to‘lovlar', som(s.topupsApproved))}</div>`;
};
admin.topups = async (el, status = 'pending') => {
  const { topups } = await api('/admin/topups?status=' + status);
  el.innerHTML = `<div class="chips" style="margin-top:0">${[['pending', 'Kutilmoqda'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan']].map(([k, t]) => `<button class="chip ${k === status ? 'on' : ''}" data-s="${k}">${t}</button>`).join('')}</div>
    ${topups.length ? `<div class="card list">${topups.map((t) => `<div class="li" style="flex-wrap:wrap"><div class="grow"><div class="t">${t.method === 'auto' ? '⚡ ' : ''}#${t.id} · ${som(t.amount)}</div><div class="s">${h(t.first_name || '')} ${t.username ? '@' + h(t.username) : ''} · ${t.user_id} · ${date(t.created_at)}</div></div>${t.status === 'pending' ? `<div style="display:flex;gap:6px">${t.method === 'auto' ? '' : `<button class="btn btn-sm" data-r="${t.id}">🧾</button>`}<button class="btn btn-ok btn-sm" data-ok="${t.id}" data-a="${t.amount}">✅</button><button class="btn btn-bad btn-sm" data-no="${t.id}">❌</button></div>` : `<span class="badge ${t.status}">${STATUS[t.status]}</span>`}</div>`).join('')}</div><div class="hint">🧾 — chek rasmini ko‘rish. ⚡ — avto to‘lov (pul tushishi bilan o‘zi tasdiqlanadi). Cheklar botga ham keladi (agar botda START bosgan bo‘lsangiz).</div>` : '<div class="empty"><div class="ei">💳</div><b>So‘rovlar yo‘q</b></div>'}`;
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
  el.innerHTML = orders.length ? `<div class="card list">${orders.map((o) => `<div class="li"><div class="th">${img(o.game_image) || '🎮'}</div><div class="grow"><div class="t">#${o.id} ${h(o.product_name)}</div><div class="s">${h(o.game_name)} · ID ${h(o.player_id)}${o.server_id ? '/' + h(o.server_id) : ''}</div><div class="s">${h(o.first_name || '')} ${o.username ? '@' + h(o.username) : ''} · ${date(o.created_at)}${o.d24_order_id ? ' · ' + h(o.d24_order_id) : ''}</div>${o.error ? `<div class="s badt">${h(o.error)}</div>` : ''}</div><div style="text-align:right"><div class="amt">${num(o.price)}</div><div class="s">tan: ${num(o.cost)}</div><button class="badge ${o.status}" data-r="${o.id}">${STATUS[o.status] || o.status} ⟳</button></div></div>`).join('')}</div>` : '<div class="empty"><div class="ei">🛒</div><b>Buyurtmalar yo‘q</b></div>';
  el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = async () => { try { await api(`/admin/orders/${b.dataset.r}/refresh`, { method: 'POST' }); toast('Yangilandi'); admin.orders(el); } catch (e) { toast(e.message, 'bad'); } }));
};
admin.users = async (el, q = '') => {
  const { users } = await api('/admin/users?q=' + encodeURIComponent(q));
  el.innerHTML = `<label class="search"><span>🔍</span><input id="uq" value="${h(q)}" placeholder="ID, username yoki ism"></label>
    ${users.length ? `<div class="card list">${users.map((u) => `<div class="li"><div class="grow"><div class="t">${h(u.first_name || '')} ${u.username ? '@' + h(u.username) : ''} ${u.banned ? '⛔' : ''}</div><div class="s"><code>${u.id}</code> · ${date(u.created_at)}</div></div><div style="text-align:right"><div class="amt">${num(u.balance)}</div><button class="btn btn-ghost btn-sm" data-u="${u.id}">Boshqarish</button></div></div>`).join('')}</div>` : '<div class="empty"><b>Topilmadi</b></div>'}`;
  const uq = el.querySelector('#uq');
  uq.onkeydown = (e) => { if (e.key === 'Enter') admin.users(el, uq.value.trim()); };
  el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = () => {
    const u = users.find((x) => x.id === Number(b.dataset.u));
    const s = sheet(`<h3>${h(u.first_name || 'Foydalanuvchi')}</h3><div class="hint" style="margin:0">ID ${u.id} · Balans ${som(u.balance)}</div>
      <label class="field"><span>Summa (+ qo‘shish, − ayirish)</span><input class="inp" id="ba" inputmode="numeric" placeholder="Masalan: 10000 yoki -5000"></label>
      <label class="field"><span>Izoh</span><input class="inp" id="bn" placeholder="Ixtiyoriy"></label>
      <button class="btn btn-primary btn-block mt" id="bs">Balansni o‘zgartirish</button>
      <button class="btn ${u.banned ? 'btn-ok' : 'btn-bad'} btn-block mt" id="bb">${u.banned ? 'Blokdan chiqarish' : 'Bloklash'}</button>`);
    s.querySelector('#bs').onclick = async () => { const a = Number(s.querySelector('#ba').value.replace(/[^\d-]/g, '')); if (!a) return toast('Summani kiriting', 'bad'); try { await api(`/admin/users/${u.id}/balance`, { method: 'POST', body: { amount: a, note: s.querySelector('#bn').value } }); toast('Saqlandi', 'ok'); closeSheet(); admin.users(el, q); } catch (e) { toast(e.message, 'bad'); } };
    s.querySelector('#bb').onclick = async () => { try { await api(`/admin/users/${u.id}/ban`, { method: 'POST', body: { banned: !u.banned } }); closeSheet(); admin.users(el, q); } catch (e) { toast(e.message, 'bad'); } };
  }));
};
admin.games = async (el) => {
  const { games } = await api('/admin/games');
  el.innerHTML = `<label class="search"><span>🔍</span><input id="gq" placeholder="O‘yinni qidiring"></label><div class="hint" style="margin:-4px 0 12px">★ — bosh sahifada yuqorida. Ko‘z — ko‘rinishi. % — shu o‘yin uchun alohida ustama (bo‘sh = umumiy).</div><div class="card list" id="gl"></div>
    <button class="btn btn-ghost btn-block mt" id="cc">🔄 Katalogni yangilash</button>`;
  const gl = el.querySelector('#gl');
  const draw = (q = '') => {
    gl.innerHTML = games.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())).slice(0, 120).map((g) => `<div class="li" data-slug="${h(g.slug)}"><div class="th">${img(g.image_url)}</div><div class="grow"><div class="t">${h(g.name)}</div><div class="s">${g.available ? '' : '⚠️ API orqali yo‘q · '}${h(g.slug)}</div></div>
      <button class="btn btn-ghost btn-sm" data-act="pop" style="color:${g.popular ? 'var(--gold)' : 'var(--muted)'}">★</button>
      <button class="btn btn-ghost btn-sm" data-act="hide">${g.hidden ? '🚫' : '👁️'}</button>
      <input class="inp" data-act="mk" style="width:62px;padding:8px" inputmode="decimal" placeholder="%" value="${g.markup ?? ''}"></div>`).join('');
  };
  draw();
  el.querySelector('#gq').oninput = (e) => draw(e.target.value.trim());
  gl.onclick = async (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT') return;
    const slug = b.closest('[data-slug]').dataset.slug; const g = games.find((x) => x.slug === slug);
    const body = b.dataset.act === 'pop' ? { popular: !g.popular } : { hidden: !g.hidden };
    try { const r = await api('/admin/games/' + encodeURIComponent(slug), { method: 'POST', body }); g.popular = !!r.override.popular; g.hidden = !!r.override.hidden; state.games = null; draw(el.querySelector('#gq').value.trim()); } catch (err) { toast(err.message, 'bad'); }
  };
  gl.onchange = async (e) => {
    if (e.target.dataset.act !== 'mk') return;
    const slug = e.target.closest('[data-slug]').dataset.slug; const g = games.find((x) => x.slug === slug);
    try { const r = await api('/admin/games/' + encodeURIComponent(slug), { method: 'POST', body: { markup: e.target.value.trim() } }); g.markup = r.override.markup; toast('Ustama saqlandi', 'ok'); } catch (err) { toast(err.message, 'bad'); }
  };
  el.querySelector('#cc').onclick = async () => { await api('/admin/cache/clear', { method: 'POST' }); state.games = null; toast('Katalog yangilandi', 'ok'); admin.games(el); };
};
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
  const { settings: s, hamyon: hy } = await api('/admin/settings');
  const f = (k, label, ph = '', type = 'text') => `<label class="field"><span>${label}</span>${type === 'area' ? `<textarea class="inp" data-k="${k}" placeholder="${h(ph)}">${h(s[k])}</textarea>` : `<input class="inp" data-k="${k}" value="${h(s[k])}" placeholder="${h(ph)}" ${type === 'num' ? 'inputmode="decimal"' : ''}>`}</label>`;
  el.innerHTML = `
    <div class="card"><b>💰 Narx</b>${f('markup', 'Umumiy ustama (%) — Donat24 narxiga qo‘shiladi', '10', 'num')}${f('min_topup', 'Eng kam to‘ldirish (so‘m)', '5000', 'num')}${f('max_topup', 'Eng ko‘p to‘ldirish (so‘m)', '10000000', 'num')}${f('ref_bonus', 'Do‘st taklifi bonusi (so‘m, 0 = o‘chiq)', '0', 'num')}</div>
    <div class="card"><div style="display:flex;align-items:center;gap:12px"><div class="grow"><b>⚡ Avto to‘lov (HamyonAPI)</b><div class="hint" style="margin:2px 0 0">${hy?.configured ? '✅ Kalitlar ulangan' : '⚠️ Railway’da HAMYON_SHOP_ID va HAMYON_SHOP_KEY qo‘shilmagan'}</div></div><label class="switch"><input type="checkbox" id="autopay" ${s.auto_pay === '1' ? 'checked' : ''}><i></i></label></div>
      ${hy?.complete_url ? `<div class="hint">@HamyonAPIBot do‘kon sozlamalariga kiriting:<br>prepare_url: <code>${h(hy.prepare_url)}</code><br>complete_url: <code>${h(hy.complete_url)}</code></div>` : ''}</div>
    <div class="card"><b>💳 To‘lov kartasi (chek usuli)</b>${f('card_number', 'Karta raqami', '8600 0000 0000 0000')}${f('card_holder', 'Karta egasi', 'ISM FAMILIYA')}${f('card_bank', 'Karta turi / bank', 'Humo · Uzcard')}</div>
    <div class="card"><b>🔗 Havolalar</b>${f('channel_url', 'Kanal havolasi', 'https://t.me/kanalingiz')}${f('support_url', 'Yordam (admin) havolasi', 'https://t.me/username')}</div>
    <div class="card"><b>🎨 Ko‘rinish</b>${f('shop_name', 'Do‘kon nomi', 'Donat')}${f('banner_title', 'Banner sarlavhasi')}${f('banner_subtitle', 'Banner matni')}${f('welcome_text', '/start xabari ({name} — ism)', '', 'area')}
      <div class="hint">/start rasmini almashtirish: botga rasm yuboring va izohiga <code>/setphoto</code> yozing.</div></div>
    <div class="card" style="display:flex;align-items:center;gap:12px"><div class="grow"><b>Do‘kon ochiq</b><div class="hint" style="margin:2px 0 0">O‘chirsangiz, yangi buyurtma qabul qilinmaydi</div></div><label class="switch"><input type="checkbox" id="open" ${s.shop_open === '1' ? 'checked' : ''}><i></i></label></div>
    <button class="btn btn-primary btn-block mt" id="save">💾 Saqlash</button>`;
  el.querySelector('#save').onclick = async (e) => {
    const body = { shop_open: el.querySelector('#open').checked ? '1' : '0', auto_pay: el.querySelector('#autopay').checked ? '1' : '0' };
    el.querySelectorAll('[data-k]').forEach((i) => (body[i.dataset.k] = i.value.trim()));
    e.currentTarget.disabled = true;
    try { await api('/admin/settings', { method: 'POST', body }); await refreshMe(); state.games = null; toast('✅ Saqlandi', 'ok'); } catch (err) { toast(err.message, 'bad'); }
    e.currentTarget.disabled = false;
  };
};
admin.broadcast = async (el) => {
  el.innerHTML = `<div class="card"><b>📣 Barcha foydalanuvchilarga xabar</b><label class="field"><span>Matn</span><textarea class="inp" id="bt" placeholder="Yangi aksiya!..."></textarea></label><button class="btn btn-primary btn-block mt" id="bsend">Yuborish</button><div class="hint">Natija botga keladi.</div></div>`;
  el.querySelector('#bsend').onclick = async (e) => { const text = el.querySelector('#bt').value.trim(); if (!text) return toast('Matn kiriting', 'bad'); if (!confirm('Hammaga yuborilsinmi?')) return; e.currentTarget.disabled = true; try { await api('/admin/broadcast', { method: 'POST', body: { text } }); toast('Yuborish boshlandi', 'ok'); } catch (err) { toast(err.message, 'bad'); e.currentTarget.disabled = false; } };
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
    $view.innerHTML = `<div class="empty"><div class="ei">⚠️</div><b>Yuklab bo‘lmadi</b>${h(e.message)}<div class="mt"><button class="btn btn-primary" onclick="location.reload()">Qayta urinish</button></div></div>`;
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
  if (state.me.user.banned) { $view.innerHTML = '<div class="empty"><div class="ei">⛔</div><b>Hisobingiz bloklangan</b></div>'; return; }
  window.addEventListener('hashchange', route);
  route();
})();
