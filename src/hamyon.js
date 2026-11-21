// HamyonAPI — HUMO/UZCARD kartaga tushgan to'lovni avtomatik aniqlash
// Hujjat: https://hamyon-api.uz/#api
import { db, getUser, getSetting, AppError } from './db.js';
import { env } from './config.js';
import { send, fmt, userLabel } from './telegram.js';
import { decideTopup } from './topups.js';
import { verifyHamyonSign, isAmountBusyError, freeAmount, topupIdFromOrder } from './hamyon-util.js';

export const hamyonConfigured = () => !!(env.HAMYON_SHOP_ID && env.HAMYON_SHOP_KEY);
export const autoPayEnabled = () => hamyonConfigured() && getSetting('auto_pay') === '1';

async function call(method, p, params) {
  const qs = new URLSearchParams(params).toString();
  const opts = { method, signal: AbortSignal.timeout(15000) };
  let url = env.HAMYON_BASE + p;
  if (method === 'GET') url += '?' + qs;
  else {
    opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    opts.body = qs;
  }
  let r;
  try {
    r = await fetch(url, opts);
  } catch (e) {
    console.warn('[hamyon] ulanish xatosi', p, e.message);
    throw new AppError('To‘lov tizimiga ulanib bo‘lmadi, birozdan so‘ng urinib ko‘ring', 'hamyon_down', 502);
  }
  let j = {};
  try { j = await r.json(); } catch {}
  if (!r.ok || j.error) {
    const err = new AppError(j.error || `To‘lov tizimi xatosi (${r.status})`, 'hamyon', 400);
    err.hamyon = true;
    throw err;
  }
  return j;
}

const byId = (id) => db.prepare('select * from topups where id=?').get(id);
const openAuto = (userId) =>
  db.prepare("select * from topups where user_id=? and method='auto'and status='pending'order by id desc limit 1").get(userId);
const nowSec = () => Math.floor(Date.now() / 1000);

export const publicTopup = (t) =>
  t && { id: t.id, amount: t.amount, status: t.status, method: t.method, card: t.card || '', expire_at: t.expire_at || null, created_at: t.created_at };

export async function createAutoTopup(userId, rawAmount) {
  if (!autoPayEnabled()) throw new AppError('Avto to‘lov hozir o‘chirilgan', 'auto_off');
  const user = getUser(userId);
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 'no_user', 404);
  if (user.banned) throw new AppError('Hisobingiz bloklangan', 'banned', 403);
  const min = Number(getSetting('min_topup')) || 0;
  const max = Number(getSetting('max_topup')) || 100000000;
  const amount = Math.round(Number(rawAmount));
  if (!Number.isFinite(amount) || amount < min) throw new AppError(`Eng kam summa: ${fmt(min)}`, 'bad_amount');
  if (amount > max) throw new AppError(`Eng ko‘p summa: ${fmt(max)}`, 'bad_amount');

  // Ochiq to'lov bo'lsa — o'shani davom ettiramiz (yoki muddati o'tganini yopamiz)
  let open = openAuto(userId);
  if (open && open.payment_id && open.expire_at > nowSec()) return open;
  if (open) {
    await reconcile(open);
    open = byId(open.id);
    if (open.status === 'pending') {
      // Holatni bilib bo'lmadi — o'zimiz yopamiz (kech kelgan "paid" baribir qabul qilinadi)
      db.prepare("update topups set status='rejected', admin_note='hamyon:stale', decided_at=datetime('now') where id=? and status='pending'").run(open.id);
    }
  }

  const busy = new Set(db.prepare("select amount from topups where method='auto'and status='pending'").all().map((r) => r.amount));
  let amt = freeAmount(amount, busy);
  if (amt === null) throw new AppError('Hozir to‘lovlar ko‘p, birozdan so‘ng urinib ko‘ring', 'busy');
  const id = db.prepare("insert into topups(user_id,amount,method) values(?,?,'auto')").run(userId, amt).lastInsertRowid;

  for (let attempt = 0; ; attempt++) {
    try {
      const r = await call('POST', '/payment/create', {
        shop_id: env.HAMYON_SHOP_ID,
        shop_key: env.HAMYON_SHOP_KEY,
        amount: amt,
        order_id: 'T' + id,
      });
      const expire = Number(r.expire_at) || nowSec() + (Number(r.expires_in) || 300);
      db.prepare('update topups set amount=?, payment_id=?, card=?, expire_at=? where id=?').run(amt, String(r.payment_id), String(r.card || ''), expire, id);
      return byId(id);
    } catch (e) {
      if (e.hamyon && isAmountBusyError(e.message) && attempt < 8) {
        busy.add(amt);
        amt = freeAmount(amt + 1, busy);
        if (amt !== null) {
          db.prepare('update topups set amount=? where id=?').run(amt, id);
          continue;
        }
      }
      db.prepare('delete from topups where id=?').run(id);
      throw e;
    }
  }
}

async function markPaid(t, paymentId) {
  if (!t.payment_id && paymentId) db.prepare('update topups set payment_id=? where id=?').run(String(paymentId), t.id);
  // Pul tushgan — oldin muddati tugagan deb yopilgan bo'lsa ham qabul qilamiz
  if (t.status === 'rejected') db.prepare("update topups set status='pending'where id=? and status='rejected'and method='auto'").run(t.id);
  const res = await decideTopup(t.id, true, 'hamyon');
  if (!res.already) {
    const u = getUser(t.user_id);
    for (const admin of env.ADMIN_IDS)
      await send(admin, `<b>Avto to‘lov #${t.id}</b>\n${userLabel(u || { id: t.user_id })}\nSumma: <b>+${fmt(res.t.amount)}</b>`);
  }
  return res;
}

async function markCancelled(t, reason) {
  const ch = db
    .prepare("update topups set status='rejected', admin_note=?, decided_at=datetime('now') where id=? and status='pending'")
    .run('hamyon:' + String(reason || 'cancel').slice(0, 40), t.id);
  if (ch.changes)
    await send(t.user_id, `<b>To‘lov #${t.id} muddati tugadi.</b>\nAgar pul o‘tkazgan bo‘lsangiz, yordam bo‘limiga yozing.`);
}

// Callback kelmagan bo'lsa — holatni o'zimiz so'raymiz
async function reconcile(t) {
  if (t.method !== 'auto' || t.status !== 'pending' || !t.payment_id) return;
  try {
    const s = await call('GET', '/payment/status', { payment_id: t.payment_id });
    if (s.status === 'paid') await markPaid(t, t.payment_id);
    else if (s.status === 'cancel') await markCancelled(t, 'timeout');
  } catch (e) {
    console.warn('[hamyon] holatni tekshirib bo‘lmadi', t.id, e.message);
  }
}

function findTopup(f) {
  const id = topupIdFromOrder(f.order_id);
  if (id) return byId(id);
  return f.payment_id ? db.prepare('select * from topups where payment_id=?').get(String(f.payment_id)) : null;
}

// prepare_url va complete_url ga keladigan POST
export async function handleHamyonCallback(f) {
  if (!verifyHamyonSign(f, env.HAMYON_SHOP_ID, env.HAMYON_SHOP_KEY)) return 403;
  const status = String(f.status || '');
  if (status === 'prepare') return 200; // faqat xabar — balans bu bosqichda to'ldirilmaydi
  const t = findTopup(f);
  if (!t || t.method !== 'auto') {
    console.warn('[hamyon] to‘lov topilmadi', f.order_id, f.payment_id);
    return 200;
  }
  if (t.payment_id && String(f.payment_id) !== t.payment_id) {
    console.warn('[hamyon] payment_id mos emas', t.id, f.payment_id);
    return 200;
  }
  if (status === 'paid') await markPaid(t, f.payment_id);
  else if (status === 'cancel') await markCancelled(t, f.reason);
  return 200;
}

export async function autoTopupStatus(userId, id) {
  let t = db.prepare('select * from topups where id=? and user_id=?').get(id, userId);
  if (!t) throw new AppError('To‘lov topilmadi', 'not_found', 404);
  if (t.method === 'auto' && t.status === 'pending' && t.expire_at && nowSec() > t.expire_at + 20) {
    await reconcile(t);
    t = byId(id);
  }
  return t;
}

export async function cancelAutoTopup(userId, id) {
  const t = db.prepare("select * from topups where id=? and user_id=? and method='auto'").get(id, userId);
  if (!t) throw new AppError('To‘lov topilmadi', 'not_found', 404);
  if (t.status !== 'pending') return t;
  db.prepare("update topups set status='rejected', admin_note='hamyon:user_cancel', decided_at=datetime('now') where id=? and status='pending'").run(id);
  if (t.payment_id)
    await call('POST', '/payment/cancel', { payment_id: t.payment_id, shop_key: env.HAMYON_SHOP_KEY }).catch((e) =>
      console.warn('[hamyon] bekor qilib bo‘lmadi', id, e.message),
    );
  return byId(id);
}

export const activeAutoTopup = (userId) => openAuto(userId) || null;

// Callback yetib bormagan eski to'lovlarni har 2 daqiqada tekshiramiz
export function startHamyonSweeper() {
  if (!hamyonConfigured()) return;
  const tick = async () => {
    const rows = db
      .prepare("select * from topups where method='auto'and status='pending'and expire_at is not null and expire_at < ?")
      .all(nowSec() - 120);
    for (const t of rows) await reconcile(t);
  };
  setInterval(() => tick().catch((e) => console.warn('[hamyon] sweeper', e.message)), 120000).unref?.();
}
