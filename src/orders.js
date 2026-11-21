import { db, getUser, changeBalance, getSetting, getOverride, AppError } from './db.js';
import * as d24 from './d24.js';
import { sellPrice, effectiveMarkup } from './pricing.js';
import { send, notifyAdmins, esc, fmt, userLabel } from './telegram.js';
import { env } from './config.js';
import crypto from 'node:crypto';

export const STATUS_UZ = {
  new: 'Yuborilmoqda',
  paid: 'To‘landi',
  sending: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  failed: 'Bajarilmadi',
  refunded: 'Pul qaytarildi',
  unknown: 'Tekshirilmoqda',
};

export const webhookSecret = () =>
  crypto.createHash('sha256').update('d24-webhook:' + env.BOT_TOKEN).digest('hex').slice(0, 32);

export function priceProducts(slug, products) {
  const o = getOverride(slug);
  const m = effectiveMarkup(getSetting('markup'), o?.markup);
  return products.map((p) => ({ ...p, price: sellPrice(p.price_uzs, m) }));
}

const getOrder = (id) => db.prepare('select * from orders where id=?').get(id);

export async function placeOrder(userId, { slug, product_id, player_id, server_id, request_key, max_price }) {
  if(request_key!==undefined && (typeof request_key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(request_key)))throw new AppError('So‘rovni yangilang va qayta urinib ko‘ring','bad_request');
  if(max_price!==undefined && (!Number.isFinite(max_price)||max_price<=0))throw new AppError('Narxni yangilang','bad_price');
  if(request_key){const old=db.prepare('select * from orders where user_id=? and request_key=?').get(userId,request_key);if(old)return old;}
  if (getSetting('shop_open') !== '1') throw new AppError('Do‘kon vaqtincha yopiq', 'closed', 503);
  const user = getUser(userId);
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 'no_user', 404);
  if (user.banned) throw new AppError('Hisobingiz bloklangan', 'banned', 403);
  const ov = getOverride(slug);
  if (ov?.hidden) throw new AppError('Bu o‘yin hozircha sotuvda yo‘q', 'hidden', 404);

  player_id = String(player_id || '').trim().replace(/^@/, '');
  server_id = server_id ? String(server_id).trim() : null;
  if (!player_id || player_id.length > 64) throw new AppError('O‘yinchi ID ni kiriting', 'bad_player');

  const { game } = await d24.game(slug);
  if (!game.available) throw new AppError('Bu o‘yin hozircha yetkazilmaydi', 'unavailable', 503);
  if (game.needs_server_id && !server_id) throw new AppError('Server (Zone) ID ni kiriting', 'need_server');

  const prod = await d24.product(slug, product_id); // eng yangi narx
  const [priced] = priceProducts(slug, [prod]);
  const price = priced.price;

  if(max_price!==undefined && price>max_price)throw new AppError('Paket narxi o‘zgardi. Paketni qayta tanlang; mablag‘ yechilmadi.','price_changed',409);
  const result = db.transaction(() => {
    if(request_key){const old=db.prepare('select id from orders where user_id=? and request_key=?').get(userId,request_key);if(old)return {id:old.id,created:false};}
    const info = db
      .prepare(
        `insert into orders(user_id,game_slug,game_name,game_image,product_id,product_name,player_id,server_id,price,cost,status,request_key)
         values(?,?,?,?,?,?,?,?,?,?, 'new',?)`,
      )
      .run(userId, slug, game.name, game.image_url, prod.id, prod.name, player_id, server_id, price, prod.price_uzs, request_key || null);
    changeBalance(userId, -price, 'order', 'O' + info.lastInsertRowid, `${game.name} — ${prod.name}`);
    return {id:info.lastInsertRowid,created:true};
  })();
  const orderId=result.id;
  if(!result.created)return getOrder(orderId);
  await submitToD24(orderId);
  const order = getOrder(orderId);
  notifyAdmins(
    `<b>Yangi buyurtma #${order.id}</b>\n${userLabel(user)}\nO‘yin: ${esc(order.game_name)} — ${esc(order.product_name)}\nO‘yinchi ID: <code>${esc(order.player_id)}</code>${order.server_id ? ' / ' + esc(order.server_id) : ''}\nSumma: ${fmt(order.price)} (tannarx ${fmt(order.cost)})\nHolat: ${STATUS_UZ[order.status] || order.status}${order.error ? '\nIzoh: ' + esc(order.error) : ''}`,
  );
  return order;
}

async function submitToD24(orderId) {
  const o = getOrder(orderId);
  const body = {
    product_id: o.product_id,
    player_id: o.player_id,
    client_ref: 'DN-' + o.id,
    ...(o.server_id ? { server_id: o.server_id } : {}),
    ...(env.PUBLIC_URL.startsWith('https://')
      ? { webhook_url: `${env.PUBLIC_URL}/d24/webhook/${webhookSecret()}` }
      : {}),
  };
  try {
    const d = await d24.createOrder(o.game_slug, body);
    const r = d.order || d;
    db.prepare("update orders set d24_order_id=?, status=?, error=null, updated_at=datetime('now') where id=?").run(
      r.order_id,
      r.status || 'paid',
      o.id,
    );
    await applyStatus(o.id, r);
  } catch (e) {
    // Javob kelmadi yoki noma'lum server xatosi — buyurtma yaratilganmi aniq emas
    if (e.network || (e.status >= 500 && !e.code)) {
      // Javob aniq emas — client_ref bilan qayta urinamiz (idempotent)
      db.prepare("update orders set status='unknown', error=?, updated_at=datetime('now') where id=?").run(e.message, o.id);
      return;
    }
    console.warn('[order] Donat24 rad etdi', o.id, e.code, e.message);
    const userMsg =
      e.code === 'insufficient_balance' ? 'Texnik sabab: yetkazib beruvchi balansi yetarli emas' : e.message;
    await refund(o.id, userMsg);
    if (e.code === 'insufficient_balance')
      notifyAdmins('<b>Donat24 balansi yetarli emas.</b> Buyurtmalar bajarilmayapti — Donat24 hisobini to‘ldiring.');
  }
}

async function refund(orderId, reason) {
  const did = db.transaction(() => {
    const o = getOrder(orderId);
    if (!o || o.refunded) return null;
    db.prepare("update orders set status='refunded', refunded=1, error=?, updated_at=datetime('now') where id=?").run(
      reason || null,
      orderId,
    );
    changeBalance(o.user_id, o.price, 'refund', 'O' + o.id, 'Buyurtma qaytarildi');
    return o;
  })();
  if (did)
    await send(
      did.user_id,
      `<b>Buyurtma #${did.id} bajarilmadi</b>\n${esc(did.game_name)} — ${esc(did.product_name)}\n${fmt(did.price)} balansingizga qaytarildi.${reason ? '\nSabab: ' + esc(reason) : ''}`,
    );
}

// Donat24 dan kelgan holatni qo'llash
export async function applyStatus(orderId, remote) {
  const o = getOrder(orderId);
  if (!o || !remote) return;
  const st = remote.status;
  if (st === 'refunded' || st === 'failed') return refund(o.id, remote.error || 'Yetkazib bo‘lmadi');
  if (st === 'delivered' && o.status !== 'delivered') {
    db.prepare("update orders set status='delivered', error=null, updated_at=datetime('now') where id=?").run(o.id);
    await send(
      o.user_id,
      `<b>Buyurtma #${o.id} yetkazildi</b>\nO‘yin: ${esc(o.game_name)} — ${esc(o.product_name)}\nO‘yinchi ID: <code>${esc(o.player_id)}</code>\nO‘yin hisobingizni tekshirishingiz mumkin. Xaridingiz uchun rahmat.`,
    );
    return;
  }
  if (st && st !== o.status && !['delivered', 'refunded'].includes(o.status)) {
    db.prepare("update orders set status=?, updated_at=datetime('now') where id=?").run(st, o.id);
  }
}

export async function refreshOrder(orderId) {
  const o = getOrder(orderId);
  if (!o) return;
  if (o.status === 'unknown' && !o.d24_order_id) {
    const ageMin = (Date.now() - new Date(o.created_at.replace(' ', 'T') + 'Z').getTime()) / 60000;
    if (ageMin > 20) return refund(o.id, 'Yetkazib beruvchi javob bermadi');
    return submitToD24(o.id);
  }
  if (!o.d24_order_id) return;
  try {
    await applyStatus(o.id, await d24.orderStatus(o.d24_order_id));
  } catch (e) {
    console.warn('[order] holat olinmadi', o.id, e.message);
  }
}

export async function handleWebhook(body) {
  const id = body?.order_id || body?.order?.order_id;
  if (!id) return;
  const o = db.prepare('select * from orders where d24_order_id=?').get(String(id));
  if (!o) return;
  // Webhook tanasiga ishonmaymiz — holatni Donat24 dan qayta so'raymiz
  await refreshOrder(o.id);
}

let polling = false;
export function startPoller() {
  setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      const rows = db
        .prepare(
          "select id from orders where status in ('new','paid','sending','unknown') and created_at > datetime('now','-3 days') order by id limit 40",
        )
        .all();
      for (const r of rows) {
        // bitta buyurtma osilib qolsa ham kuzatuv to'xtab qolmasin
        await Promise.race([refreshOrder(r.id), new Promise((ok) => setTimeout(ok, 60000))]).catch((e) =>
          console.warn('[poller]', r.id, e.message),
        );
      }
    } catch (e) {
      console.warn('[poller]', e.message);
    } finally {
      polling = false;
    }
  }, 45000);
}
