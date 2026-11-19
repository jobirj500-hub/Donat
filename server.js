import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isAdmin, SETTING_KEYS } from './src/config.js';
import { db, upsertUser, getUser, allSettings, setSetting, changeBalance, allOverrides, getOverride, AppError } from './src/db.js';
import * as d24 from './src/d24.js';
import { verifyInitData } from './src/auth.js';
import { placeOrder, priceProducts, refreshOrder, handleWebhook, startPoller, webhookSecret } from './src/orders.js';
import { createTopup, decideTopup } from './src/topups.js';
import { startBot, broadcast, handleUpdate, tgWebhookSecret } from './src/bot.js';
import { send, esc, fmt } from './src/telegram.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '9mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.redirect('/app'));
app.use('/app', express.static(path.join(__dirname, 'public'), { index: 'index.html', maxAge: '5m' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: '1h' }));

// Telegram webhook (bot xabarlari)
app.post('/tg/webhook/:secret', (req, res) => {
  if (req.params.secret !== tgWebhookSecret() || req.get('X-Telegram-Bot-Api-Secret-Token') !== tgWebhookSecret())
    return res.status(404).end();
  res.json({ ok: true });
  if (req.body?.update_id) handleUpdate(req.body);
});

// Donat24 webhook (yakuniy holat)
app.post('/d24/webhook/:secret', async (req, res) => {
  if (req.params.secret !== webhookSecret()) return res.status(404).end();
  res.json({ ok: true });
  handleWebhook(req.body).catch((e) => console.warn('[webhook]', e.message));
});

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    const status = e instanceof AppError ? e.status : e.status && e.status < 500 ? 400 : 500;
    if (status >= 500) console.error('[api]', req.method, req.path, e);
    res.status(status).json({ ok: false, error: e.message || 'Xatolik', code: e.code || 'error' });
  });

// Har bir API so'rovi Telegram initData orqali tasdiqlanadi
function auth(req, res, next) {
  let tgUser = verifyInitData(req.get('X-Init-Data'));
  if (!tgUser && env.DEV_AUTH_USER) tgUser = { id: env.DEV_AUTH_USER, first_name: 'Dev', username: 'dev' };
  if (!tgUser?.id) return res.status(401).json({ ok: false, error: 'Iltimos, ilovani Telegram bot orqali oching', code: 'auth' });
  const { user } = upsertUser(tgUser);
  req.user = user;
  req.tgUser = tgUser;
  req.isAdmin = isAdmin(user.id);
  next();
}
const adminOnly = (req, res, next) =>
  req.isAdmin ? next() : res.status(403).json({ ok: false, error: 'Ruxsat yo‘q', code: 'forbidden' });

const api = express.Router();
api.use(auth);

const publicSettings = () => {
  const s = allSettings();
  return {
    shop_name: s.shop_name,
    min_topup: Number(s.min_topup),
    max_topup: Number(s.max_topup),
    card_number: s.card_number,
    card_holder: s.card_holder,
    card_bank: s.card_bank,
    channel_url: s.channel_url,
    support_url: s.support_url,
    banner_title: s.banner_title,
    banner_subtitle: s.banner_subtitle,
    shop_open: s.shop_open === '1',
    ref_bonus: Number(s.ref_bonus) || 0,
  };
};

api.get('/me', wrap(async (req, res) => {
  const u = req.user;
  res.json({
    ok: true,
    user: { id: u.id, username: u.username, first_name: u.first_name, last_name: u.last_name, balance: u.balance, banned: !!u.banned, photo_url: req.tgUser.photo_url || null },
    isAdmin: req.isAdmin,
    settings: publicSettings(),
    stats: {
      orders: db.prepare('select count(*) c from orders where user_id=?').get(u.id).c,
      refs: db.prepare('select count(*) c from users where ref_by=?').get(u.id).c,
    },
  });
}));

// Admin hali belgilamagan bo'lsa, shular bosh sahifada birinchi turadi
const DEFAULT_POPULAR = ['pubg-mobile-auto', 'free-fire-cis', 'mobile-legends-global', 'telegram-stars', 'telegram-premium', 'honor-of-kings', 'call-of-duty-mobile-activision-in', 'genshin-impact-global', 'delta-force', 'bigo-live', 'mobile-legends-ru', 'pubg-new-state'];

function visibleGames(list, includeHidden = false) {
  const ov = allOverrides();
  return list
    .map((g) => ({ ...g, hidden: !!ov[g.slug]?.hidden, popular: ov[g.slug] ? !!ov[g.slug].popular : DEFAULT_POPULAR.includes(g.slug), sort: ov[g.slug]?.sort || 0, markup: ov[g.slug]?.markup ?? null }))
    .filter((g) => includeHidden || (!g.hidden && g.available))
    .sort((a, b) => (b.popular - a.popular) || (b.sort - a.sort) || (a.popular ? DEFAULT_POPULAR.indexOf(a.slug) - DEFAULT_POPULAR.indexOf(b.slug) : 0));
}

api.get('/games', wrap(async (_req, res) => {
  const games = visibleGames(await d24.games()).map(({ slug, name, image_url, popular, id_type, needs_server_id }) => ({ slug, name, image_url, popular, id_type, needs_server_id }));
  res.json({ ok: true, games });
}));

api.get('/games/:slug', wrap(async (req, res) => {
  const slug = req.params.slug;
  if (getOverride(slug)?.hidden && !req.isAdmin) throw new AppError('O‘yin topilmadi', 'not_found', 404);
  const [{ game, products }, images] = await Promise.all([d24.game(slug), d24.productImages(slug)]);
  const priced = priceProducts(slug, products).map((p) => ({ id: p.id, name: p.name, price: p.price, image_url: images[p.id] || null }));
  res.json({ ok: true, game, products: priced });
}));

api.post('/games/:slug/validate', wrap(async (req, res) => {
  const { player_id, server_id } = req.body || {};
  try {
    const d = await d24.validatePlayer(req.params.slug, String(player_id || '').replace(/^@/, '').trim(), server_id);
    res.json({ ok: true, supported: true, valid: d.valid !== false, name: d.username || d.nickname || d.name || null });
  } catch (e) {
    if (e.status === 422) return res.json({ ok: true, supported: true, valid: false, error: e.message });
    res.json({ ok: true, supported: false, error: e.message });
  }
}));

api.post('/orders', wrap(async (req, res) => {
  const order = await placeOrder(req.user.id, req.body || {});
  res.json({ ok: true, order, balance: getUser(req.user.id).balance });
}));

api.get('/orders', wrap(async (req, res) => {
  const orders = db.prepare('select * from orders where user_id=? order by id desc limit 100').all(req.user.id);
  const tx = db.prepare('select * from tx where user_id=? order by id desc limit 100').all(req.user.id);
  const topups = db.prepare('select id,amount,status,created_at from topups where user_id=? order by id desc limit 30').all(req.user.id);
  res.json({ ok: true, orders, tx, topups });
}));

api.post('/topups', wrap(async (req, res) => {
  const t = await createTopup(req.user.id, req.body?.amount, req.body?.receipt);
  res.json({ ok: true, topup: t });
}));

api.post('/promo', wrap(async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) throw new AppError('Promokodni kiriting');
  const bal = db.transaction(() => {
    const p = db.prepare('select * from promos where code=?').get(code);
    if (!p || p.uses_left <= 0) throw new AppError('Promokod topilmadi yoki tugagan', 'bad_promo', 404);
    if (db.prepare('select 1 from promo_uses where code=? and user_id=?').get(code, req.user.id))
      throw new AppError('Siz bu promokoddan foydalangansiz', 'used');
    db.prepare('update promos set uses_left=uses_left-1 where code=?').run(code);
    db.prepare('insert into promo_uses(code,user_id) values(?,?)').run(code, req.user.id);
    return { balance: changeBalance(req.user.id, p.amount, 'promo', code, 'Promokod'), amount: p.amount };
  })();
  res.json({ ok: true, ...bal });
}));

api.get('/top', wrap(async (_req, res) => {
  const rows = db
    .prepare("select u.first_name, u.username, sum(o.price) total from orders o join users u on u.id=o.user_id where o.status='delivered' group by o.user_id order by total desc limit 100")
    .all();
  res.json({ ok: true, top: rows.map((r) => ({ name: r.first_name || r.username || 'Foydalanuvchi', total: r.total })) });
}));

// ---------- ADMIN ----------
const ad = express.Router();
ad.use(adminOnly);

ad.get('/stats', wrap(async (_req, res) => {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  let d24me = null;
  try { d24me = await d24.me(); } catch (e) { d24me = { error: e.message }; }
  res.json({
    ok: true,
    users: one('select count(*) c from users').c,
    usersToday: one("select count(*) c from users where created_at > datetime('now','-1 day')").c,
    balances: one('select coalesce(sum(balance),0) s from users').s,
    pendingTopups: one("select count(*) c from topups where status='pending'").c,
    ordersTotal: one('select count(*) c from orders').c,
    ordersDelivered: one("select count(*) c from orders where status='delivered'").c,
    revenue: one("select coalesce(sum(price),0) s from orders where status='delivered'").s,
    profit: one("select coalesce(sum(price-cost),0) s from orders where status='delivered'").s,
    revenueToday: one("select coalesce(sum(price),0) s from orders where status='delivered' and created_at > datetime('now','-1 day')").s,
    topupsApproved: one("select coalesce(sum(amount),0) s from topups where status='approved'").s,
    d24: d24me?.error ? { error: d24me.error } : { balance: d24me?.wallet?.balance ?? null, name: d24me?.user?.name },
  });
}));

ad.get('/settings', wrap(async (_req, res) => res.json({ ok: true, settings: allSettings() })));
ad.post('/settings', wrap(async (req, res) => {
  for (const [k, v] of Object.entries(req.body || {})) if (SETTING_KEYS.includes(k)) setSetting(k, String(v ?? '').slice(0, 2000));
  res.json({ ok: true, settings: allSettings() });
}));

ad.get('/topups', wrap(async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  const rows = db.prepare('select t.*, u.first_name, u.username from topups t left join users u on u.id=t.user_id where t.status=? order by t.id desc limit 100').all(status);
  res.json({ ok: true, topups: rows });
}));
ad.post('/topups/:id/:action', wrap(async (req, res) => {
  const approve = req.params.action === 'approve';
  if (!approve && req.params.action !== 'reject') throw new AppError('Noto‘g‘ri amal');
  const r = await decideTopup(Number(req.params.id), approve, req.user.id, req.body?.amount);
  res.json({ ok: true, already: !!r.already });
}));

ad.get('/users', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().replace(/^@/, '');
  const rows = q
    ? db.prepare("select * from users where cast(id as text)=? or username like ? or first_name like ? order by id desc limit 50").all(q, `%${q}%`, `%${q}%`)
    : db.prepare('select * from users order by created_at desc limit 50').all();
  res.json({ ok: true, users: rows });
}));
ad.post('/users/:id/balance', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const amount = Math.round(Number(req.body?.amount));
  const balance = changeBalance(id, amount, 'admin', String(req.user.id), String(req.body?.note || 'Admin tomonidan'));
  if (req.body?.notify !== false)
    await send(id, `${amount > 0 ? '💰 Balansingizga qo‘shildi' : '➖ Balansingizdan yechildi'}: <b>${fmt(Math.abs(amount))}</b>\nJoriy balans: <b>${fmt(balance)}</b>`);
  res.json({ ok: true, balance });
}));
ad.post('/users/:id/ban', wrap(async (req, res) => {
  db.prepare('update users set banned=? where id=?').run(req.body?.banned ? 1 : 0, Number(req.params.id));
  res.json({ ok: true });
}));

ad.get('/orders', wrap(async (req, res) => {
  const st = String(req.query.status || '');
  const rows = st
    ? db.prepare('select o.*, u.first_name, u.username from orders o left join users u on u.id=o.user_id where o.status=? order by o.id desc limit 100').all(st)
    : db.prepare('select o.*, u.first_name, u.username from orders o left join users u on u.id=o.user_id order by o.id desc limit 100').all();
  res.json({ ok: true, orders: rows });
}));
ad.post('/orders/:id/refresh', wrap(async (req, res) => {
  await refreshOrder(Number(req.params.id));
  res.json({ ok: true, order: db.prepare('select * from orders where id=?').get(Number(req.params.id)) });
}));

ad.get('/games', wrap(async (_req, res) => {
  res.json({ ok: true, games: visibleGames(await d24.games(), true) });
}));
ad.post('/games/:slug', wrap(async (req, res) => {
  const slug = req.params.slug;
  const cur = getOverride(slug) || { hidden: 0, popular: 0, markup: null, sort: 0 };
  const b = req.body || {};
  const next = {
    hidden: b.hidden !== undefined ? (b.hidden ? 1 : 0) : cur.hidden,
    popular: b.popular !== undefined ? (b.popular ? 1 : 0) : cur.popular,
    markup: b.markup !== undefined ? (b.markup === '' || b.markup === null ? null : Number(b.markup)) : cur.markup,
    sort: b.sort !== undefined ? Number(b.sort) || 0 : cur.sort,
  };
  db.prepare('insert into game_overrides(slug,hidden,popular,markup,sort) values(@slug,@hidden,@popular,@markup,@sort) on conflict(slug) do update set hidden=@hidden,popular=@popular,markup=@markup,sort=@sort').run({ slug, ...next });
  res.json({ ok: true, override: { slug, ...next } });
}));
ad.post('/cache/clear', wrap(async (_req, res) => { d24.clearCache(); res.json({ ok: true }); }));

ad.get('/promos', wrap(async (_req, res) => res.json({ ok: true, promos: db.prepare('select * from promos order by created_at desc').all() })));
ad.post('/promos', wrap(async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const amount = Math.round(Number(req.body?.amount));
  const uses = Math.max(1, Math.round(Number(req.body?.uses) || 1));
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new AppError('Kod: 3-32 ta lotin harf/raqam');
  if (!(amount > 0)) throw new AppError('Summani kiriting');
  db.prepare('insert into promos(code,amount,uses_left,note) values(?,?,?,?) on conflict(code) do update set amount=excluded.amount, uses_left=excluded.uses_left, note=excluded.note').run(code, amount, uses, String(req.body?.note || ''));
  res.json({ ok: true });
}));
ad.delete('/promos/:code', wrap(async (req, res) => {
  db.prepare('delete from promos where code=?').run(String(req.params.code).toUpperCase());
  res.json({ ok: true });
}));

ad.post('/broadcast', wrap(async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) throw new AppError('Xabar matnini kiriting');
  broadcast(esc(text)).then((r) => send(req.user.id, `📣 Xabar yuborildi: ${r.ok}/${r.total}`));
  res.json({ ok: true });
}));

api.use('/admin', ad);
app.use('/api', api);

app.listen(env.PORT, () => {
  console.log(`[web] :${env.PORT}  PUBLIC_URL=${env.PUBLIC_URL || '(yo‘q)'}`);
  startBot();
  startPoller();
});
