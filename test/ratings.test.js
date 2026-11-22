import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'donat-rate-'));
process.env.D24_API_KEY = 'test-key';

const { db } = await import('../src/db.js');
const { rateOrder, pendingRating, ratingOf } = await import('../src/ratings.js');

db.prepare('insert into users(id,first_name) values(?,?)').run(1, 'Ali');
db.prepare('insert into users(id,first_name) values(?,?)').run(2, 'Vali');
const order = (userId, status) => db.prepare(
  "insert into orders(user_id,game_slug,product_id,product_name,player_id,price,status) values(?,?,?,?,?,?,?)",
).run(userId, 'pubg', 1, '60 UC', '123', 12000, status).lastInsertRowid;

test('the newest delivered unrated order is offered for rating', () => {
  order(1, 'delivered');
  const last = order(1, 'delivered');
  order(1, 'refunded');
  assert.equal(pendingRating(1).id, last);
});

test('stars must be a whole number from 1 to 5', () => {
  const id = order(1, 'delivered');
  for (const bad of [0, 6, 2.5, 'x']) assert.throws(() => rateOrder(1, id, bad), /1 dan 5 gacha/);
  assert.equal(rateOrder(1, id, 5).stars, 5);
  assert.equal(ratingOf(id), 5);
});

test('an order can be rated only once', () => {
  const id = order(1, 'delivered');
  rateOrder(1, id, 4);
  assert.throws(() => rateOrder(1, id, 1), /allaqachon/);
  assert.equal(ratingOf(id), 4);
});

test('only the owner can rate, and only a delivered order', () => {
  const other = order(2, 'delivered');
  assert.throws(() => rateOrder(1, other, 5), /topilmadi/);
  const refunded = order(1, 'refunded');
  assert.throws(() => rateOrder(1, refunded, 5), /yetkazilgan/);
});

test('a rated order is no longer offered', () => {
  db.prepare('delete from orders').run();
  const id = order(1, 'delivered');
  rateOrder(1, id, 3);
  assert.equal(pendingRating(1), null);
});
