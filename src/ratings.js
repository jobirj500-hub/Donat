// Buyurtma bahosi: mijoz yetkazilgan buyurtmasini bir marta 1–5 yulduz bilan baholaydi.
import { db, AppError } from './db.js';

db.exec(`
create table if not exists order_ratings(
  order_id integer primary key,
  user_id integer not null,
  stars integer not null check (stars between 1 and 5),
  created_at text not null default (datetime('now'))
);
create index if not exists idx_ratings_user on order_ratings(user_id);
`);

const RATE_WINDOW_DAYS = 14;

// Bosh sahifada so'raladigan buyurtma: eng oxirgi, yetkazilgan, hali baholanmagan
export function pendingRating(userId) {
  return db.prepare(
    `select o.id, o.product_name, o.game_name, o.game_image from orders o
     left join order_ratings r on r.order_id = o.id
     where o.user_id = ? and o.status = 'delivered' and r.order_id is null
       and o.created_at >= datetime('now', ?)
     order by o.id desc limit 1`,
  ).get(Number(userId), `-${RATE_WINDOW_DAYS} days`) || null;
}

export function rateOrder(userId, orderId, stars) {
  const n = Number(stars);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new AppError('Baho 1 dan 5 gacha bo‘lishi kerak', 'bad_stars');
  const o = db.prepare('select id, user_id, status from orders where id = ?').get(Number(orderId));
  if (!o || o.user_id !== Number(userId)) throw new AppError('Buyurtma topilmadi', 'no_order', 404);
  if (o.status !== 'delivered') throw new AppError('Faqat yetkazilgan buyurtmani baholash mumkin', 'not_delivered');
  const r = db.prepare('insert or ignore into order_ratings(order_id, user_id, stars) values(?,?,?)').run(o.id, o.user_id, n);
  if (!r.changes) throw new AppError('Bu buyurtma allaqachon baholangan', 'already_rated', 409);
  return { order_id: o.id, stars: n };
}

export const ratingOf = (orderId) => db.prepare('select stars from order_ratings where order_id = ?').get(Number(orderId))?.stars ?? null;
