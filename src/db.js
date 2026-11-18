import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env, DEFAULT_SETTINGS } from './config.js';

fs.mkdirSync(env.DATA_DIR, { recursive: true });
export const db = new Database(path.join(env.DATA_DIR, 'shop.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
create table if not exists users(
  id integer primary key,
  username text,
  first_name text,
  last_name text,
  balance integer not null default 0,
  banned integer not null default 0,
  ref_by integer,
  created_at text not null default (datetime('now')),
  last_seen text
);
create table if not exists settings(key text primary key, value text);
create table if not exists tx(
  id integer primary key autoincrement,
  user_id integer not null,
  amount integer not null,
  type text not null,
  ref text,
  note text,
  created_at text not null default (datetime('now'))
);
create table if not exists topups(
  id integer primary key autoincrement,
  user_id integer not null,
  amount integer not null,
  status text not null default 'pending',
  admin_note text,
  created_at text not null default (datetime('now')),
  decided_at text
);
create table if not exists orders(
  id integer primary key autoincrement,
  user_id integer not null,
  game_slug text not null,
  game_name text,
  game_image text,
  product_id integer not null,
  product_name text,
  player_id text not null,
  server_id text,
  price integer not null,
  cost real,
  d24_order_id text,
  status text not null default 'new',
  error text,
  refunded integer not null default 0,
  created_at text not null default (datetime('now')),
  updated_at text
);
create table if not exists game_overrides(
  slug text primary key,
  hidden integer not null default 0,
  popular integer not null default 0,
  markup real,
  sort integer not null default 0
);
create table if not exists promos(
  code text primary key,
  amount integer not null,
  uses_left integer not null default 1,
  note text,
  created_at text not null default (datetime('now'))
);
create table if not exists promo_uses(
  code text not null,
  user_id integer not null,
  created_at text not null default (datetime('now')),
  primary key(code, user_id)
);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_tx_user on tx(user_id);
create index if not exists idx_topups_status on topups(status);
`);

export function getSetting(key) {
  const r = db.prepare('select value from settings where key=?').get(key);
  return r ? r.value : DEFAULT_SETTINGS[key] ?? '';
}
export function allSettings() {
  const o = { ...DEFAULT_SETTINGS };
  for (const r of db.prepare('select key,value from settings').all()) o[r.key] = r.value;
  return o;
}
export function setSetting(key, value) {
  db.prepare(
    'insert into settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value',
  ).run(key, String(value ?? ''));
}

export const getUser = (id) => db.prepare('select * from users where id=?').get(Number(id));

export function upsertUser(u, refBy = null) {
  const existing = getUser(u.id);
  if (existing) {
    db.prepare(
      "update users set username=?, first_name=?, last_name=?, last_seen=datetime('now') where id=?",
    ).run(u.username || null, u.first_name || '', u.last_name || '', u.id);
  } else {
    db.prepare(
      "insert into users(id,username,first_name,last_name,ref_by,last_seen) values(?,?,?,?,?,datetime('now'))",
    ).run(u.id, u.username || null, u.first_name || '', u.last_name || '', refBy && refBy !== u.id ? refBy : null);
  }
  return { user: getUser(u.id), isNew: !existing };
}

export class AppError extends Error {
  constructor(message, code = 'error', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Balansni o'zgartirish — har doim tranzaksiya yozuvi bilan
export const changeBalance = db.transaction((userId, amount, type, ref = null, note = null) => {
  const u = getUser(userId);
  if (!u) throw new AppError('Foydalanuvchi topilmadi', 'no_user', 404);
  const amt = Math.trunc(Number(amount));
  if (!Number.isFinite(amt) || amt === 0) throw new AppError('Summa noto‘g‘ri', 'bad_amount');
  if (u.balance + amt < 0) throw new AppError('Balansda mablag‘ yetarli emas', 'no_balance', 402);
  db.prepare('update users set balance=balance+? where id=?').run(amt, userId);
  db.prepare('insert into tx(user_id,amount,type,ref,note) values(?,?,?,?,?)').run(userId, amt, type, ref, note);
  return u.balance + amt;
});

export const getOverride = (slug) => db.prepare('select * from game_overrides where slug=?').get(slug);
export const allOverrides = () => {
  const m = {};
  for (const r of db.prepare('select * from game_overrides').all()) m[r.slug] = r;
  return m;
};
